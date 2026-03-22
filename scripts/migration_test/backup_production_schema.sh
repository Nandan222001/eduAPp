#!/bin/bash

# Script to backup production database schema using mysqldump --no-data
# This creates a baseline schema for comparison and testing

set -e

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Default values
DATABASE_NAME="${DATABASE_NAME:-fastapi_db}"
DATABASE_HOST="${DATABASE_HOST:-localhost}"
DATABASE_PORT="${DATABASE_PORT:-3306}"
DATABASE_USER="${DATABASE_USER:-root}"
DATABASE_PASSWORD="${DATABASE_PASSWORD:-test_password}"

# Backup directory and file
BACKUP_DIR="backups/migration_test"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SCHEMA_FILE="$BACKUP_DIR/schema_${DATABASE_NAME}_${TIMESTAMP}.sql"
LATEST_SCHEMA_LINK="$BACKUP_DIR/schema_latest.sql"

echo "============================================"
echo "Production Schema Backup"
echo "============================================"
echo "Database: $DATABASE_NAME"
echo "Host: $DATABASE_HOST"
echo "Port: $DATABASE_PORT"
echo "User: $DATABASE_USER"
echo "============================================"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if MySQL is accessible
echo "Checking MySQL connection..."
if ! mysql -h "$DATABASE_HOST" -P "$DATABASE_PORT" -u "$DATABASE_USER" -p"$DATABASE_PASSWORD" -e "USE \`$DATABASE_NAME\`" > /dev/null 2>&1; then
    echo "ERROR: Cannot connect to database $DATABASE_NAME"
    echo "Please ensure MySQL is running and the database exists"
    exit 1
fi

echo "✓ Database connection successful"

# Backup schema only (no data)
echo "Backing up database schema..."
mysqldump -h "$DATABASE_HOST" -P "$DATABASE_PORT" -u "$DATABASE_USER" -p"$DATABASE_PASSWORD" \
    --no-data \
    --skip-comments \
    --skip-dump-date \
    --skip-triggers \
    --routines \
    "$DATABASE_NAME" > "$SCHEMA_FILE"

if [ $? -eq 0 ]; then
    echo "✓ Schema backup created: $SCHEMA_FILE"
else
    echo "ERROR: Schema backup failed"
    exit 1
fi

# Create/update symbolic link to latest schema
ln -sf "$(basename "$SCHEMA_FILE")" "$LATEST_SCHEMA_LINK"
echo "✓ Latest schema link updated: $LATEST_SCHEMA_LINK"

# Get schema statistics
echo ""
echo "Schema Statistics:"
echo "----------------------------------------"
TABLE_COUNT=$(grep -c "^CREATE TABLE" "$SCHEMA_FILE" || echo "0")
INDEX_COUNT=$(grep -c "^  KEY" "$SCHEMA_FILE" || echo "0")
CONSTRAINT_COUNT=$(grep -c "CONSTRAINT" "$SCHEMA_FILE" || echo "0")

echo "Tables: $TABLE_COUNT"
echo "Indexes: $INDEX_COUNT"
echo "Constraints: $CONSTRAINT_COUNT"
echo "File size: $(du -h "$SCHEMA_FILE" | cut -f1)"
echo "----------------------------------------"

echo ""
echo "============================================"
echo "Schema backup completed successfully!"
echo "============================================"
echo ""
echo "Backup file: $SCHEMA_FILE"
echo "Latest link: $LATEST_SCHEMA_LINK"
echo ""
