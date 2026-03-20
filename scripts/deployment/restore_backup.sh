#!/bin/bash
set -e

# Database backup restoration script
# Usage: ./restore_backup.sh <environment> <backup_identifier>
# Example: ./restore_backup.sh prod latest
# Example: ./restore_backup.sh prod 20240120-100000

ENVIRONMENT=${1:-staging}
BACKUP_ID=${2:-latest}
AWS_REGION=${AWS_REGION:-us-east-1}
PROJECT_NAME="fastapi-app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|prod)$ ]]; then
    log_error "Invalid environment. Use 'staging' or 'prod'"
    exit 1
fi

log_warn "====================================================================="
log_warn "  WARNING: You are about to restore database for ${ENVIRONMENT}"
log_warn "  This will REPLACE the current database with the backup"
log_warn "====================================================================="
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    log_info "Restoration cancelled"
    exit 0
fi

log_info "Starting database restoration for ${ENVIRONMENT}..."

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
log_info "AWS Account ID: ${AWS_ACCOUNT_ID}"

# Find the backup to restore
if [ "$BACKUP_ID" = "latest" ]; then
    log_info "Finding latest backup..."
    
    # Try to find latest pre-migration backup first
    SNAPSHOT_ID=$(aws rds describe-db-snapshots \
        --db-instance-identifier ${PROJECT_NAME}-${ENVIRONMENT}-db \
        --query 'reverse(sort_by(DBSnapshots[?contains(DBSnapshotIdentifier, `pre-migration`)], &SnapshotCreateTime))[0].DBSnapshotIdentifier' \
        --output text \
        --region ${AWS_REGION})
    
    if [ "$SNAPSHOT_ID" = "None" ] || [ -z "$SNAPSHOT_ID" ]; then
        # Fallback to any latest snapshot
        SNAPSHOT_ID=$(aws rds describe-db-snapshots \
            --db-instance-identifier ${PROJECT_NAME}-${ENVIRONMENT}-db \
            --query 'reverse(sort_by(DBSnapshots, &SnapshotCreateTime))[0].DBSnapshotIdentifier' \
            --output text \
            --region ${AWS_REGION})
    fi
else
    # Use specific backup ID
    SNAPSHOT_ID="${PROJECT_NAME}-${ENVIRONMENT}-${BACKUP_ID}"
fi

if [ -z "$SNAPSHOT_ID" ] || [ "$SNAPSHOT_ID" = "None" ]; then
    log_error "No backup found for restoration"
    exit 1
fi

log_info "Using backup: ${SNAPSHOT_ID}"

# Get snapshot details
SNAPSHOT_INFO=$(aws rds describe-db-snapshots \
    --db-snapshot-identifier ${SNAPSHOT_ID} \
    --region ${AWS_REGION} \
    --query 'DBSnapshots[0]')

SNAPSHOT_TIME=$(echo $SNAPSHOT_INFO | jq -r '.SnapshotCreateTime')
SNAPSHOT_SIZE=$(echo $SNAPSHOT_INFO | jq -r '.AllocatedStorage')

log_info "Snapshot created: ${SNAPSHOT_TIME}"
log_info "Snapshot size: ${SNAPSHOT_SIZE} GB"

echo ""
log_warn "Final confirmation required:"
read -p "Type 'RESTORE' to proceed with restoration: " -r
echo ""

if [[ ! $REPLY = "RESTORE" ]]; then
    log_info "Restoration cancelled"
    exit 0
fi

# Create a final backup before restoration
log_info "Creating emergency backup of current database..."
EMERGENCY_BACKUP="${PROJECT_NAME}-${ENVIRONMENT}-emergency-$(date +%Y%m%d-%H%M%S)"

aws rds create-db-snapshot \
    --db-instance-identifier ${PROJECT_NAME}-${ENVIRONMENT}-db \
    --db-snapshot-identifier ${EMERGENCY_BACKUP} \
    --region ${AWS_REGION}

log_info "Emergency backup created: ${EMERGENCY_BACKUP}"

# Stop application services
log_info "Stopping application services..."
CLUSTER_NAME="${PROJECT_NAME}-${ENVIRONMENT}-cluster"
SERVICE_NAME="${PROJECT_NAME}-${ENVIRONMENT}-service"

# Scale to 0
aws ecs update-service \
    --cluster ${CLUSTER_NAME} \
    --service ${SERVICE_NAME} \
    --desired-count 0 \
    --region ${AWS_REGION}

log_info "Waiting for services to stop..."
sleep 30

# Restore database
log_info "Restoring database from snapshot..."

# Method 1: Point-in-time restore to new instance
RESTORE_INSTANCE_ID="${PROJECT_NAME}-${ENVIRONMENT}-db-restore-$(date +%Y%m%d-%H%M%S)"

aws rds restore-db-instance-from-db-snapshot \
    --db-instance-identifier ${RESTORE_INSTANCE_ID} \
    --db-snapshot-identifier ${SNAPSHOT_ID} \
    --db-instance-class db.t3.medium \
    --publicly-accessible false \
    --region ${AWS_REGION}

log_info "Waiting for restored instance to be available..."
aws rds wait db-instance-available \
    --db-instance-identifier ${RESTORE_INSTANCE_ID} \
    --region ${AWS_REGION}

log_info "Restored instance is available"

# Get restored instance endpoint
RESTORE_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier ${RESTORE_INSTANCE_ID} \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text \
    --region ${AWS_REGION})

log_info "Restored instance endpoint: ${RESTORE_ENDPOINT}"

# Update parameter store or DNS to point to restored instance
log_info "Updating application configuration..."

# Option 1: Update parameter store
aws ssm put-parameter \
    --name "/${PROJECT_NAME}/${ENVIRONMENT}/db/host" \
    --value "${RESTORE_ENDPOINT}" \
    --overwrite \
    --region ${AWS_REGION}

# Option 2: Rename instances (requires downtime)
# This is more complex but provides seamless cutover
log_info "For production cutover, consider:"
log_info "1. Rename current instance to ${PROJECT_NAME}-${ENVIRONMENT}-db-old"
log_info "2. Rename restored instance to ${PROJECT_NAME}-${ENVIRONMENT}-db"

# Restart application services
log_info "Restarting application services..."
aws ecs update-service \
    --cluster ${CLUSTER_NAME} \
    --service ${SERVICE_NAME} \
    --desired-count 3 \
    --force-new-deployment \
    --region ${AWS_REGION}

log_info "Waiting for services to stabilize..."
aws ecs wait services-stable \
    --cluster ${CLUSTER_NAME} \
    --services ${SERVICE_NAME} \
    --region ${AWS_REGION}

# Verify restoration
log_info "Verifying restoration..."
sleep 10

ALB_DNS=$(aws elbv2 describe-load-balancers \
    --names ${PROJECT_NAME}-${ENVIRONMENT}-alb \
    --query 'LoadBalancers[0].DNSName' \
    --output text \
    --region ${AWS_REGION})

if [ -n "$ALB_DNS" ]; then
    HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://${ALB_DNS}/health || echo "000")
    if [ "$HEALTH_STATUS" = "200" ]; then
        log_info "Health check passed!"
    else
        log_warn "Health check returned status: ${HEALTH_STATUS}"
    fi
fi

log_info "====================================================================="
log_info "Database restoration completed!"
log_info "====================================================================="
log_info "Restored from: ${SNAPSHOT_ID}"
log_info "New instance: ${RESTORE_INSTANCE_ID}"
log_info "Endpoint: ${RESTORE_ENDPOINT}"
log_info "Emergency backup: ${EMERGENCY_BACKUP}"
log_info ""
log_info "Next steps:"
log_info "1. Verify data integrity"
log_info "2. Test critical functionality"
log_info "3. Monitor application logs"
log_info "4. If successful, delete old instance after verification period"
log_info "5. Update DNS/configuration if needed"
log_info "====================================================================="
