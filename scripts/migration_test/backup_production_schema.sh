#!/bin/bash

# Script to backup production database schema using pg_dump --schema-only
# This creates a baseline schema for comparison and testing

set -e

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Default values
DATABASE_NAME="${DATABASE_NAME:-fastapi_db}"
DATABASE_HOST="${DATABASE_HOST:-localhost}"
DATABASE_PORT="${DATABASE_PORT:-5432}"
DATABASE_USER="${DATABASE_USER:-postgres}"
PGPASSWORD="${DATABASE_PASSWORD:-postgres}"

export PGPASSWORD

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

# Check if PostgreSQL is accessible
echo "Checking PostgreSQL connection..."
if ! psql -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USER" -d "$DATABASE_NAME" -c "SELECT 1" > /dev/null 2>&1; then
    echo "ERROR: Cannot connect to database $DATABASE_NAME"
    echo "Please ensure PostgreSQL is running and the database exists"
    exit 1
fi

echo "✓ Database connection successful"

# Backup schema only (no data)
echo "Backing up database schema..."
pg_dump -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USER" \
    --schema-only \
    --no-owner \
    --no-privileges \
    --no-tablespaces \
    --no-security-labels \
    --no-publications \
    --no-subscriptions \
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
INDEX_COUNT=$(grep -c "^CREATE.*INDEX" "$SCHEMA_FILE" || echo "0")
CONSTRAINT_COUNT=$(grep -c "CONSTRAINT" "$SCHEMA_FILE" || echo "0")
ENUM_COUNT=$(grep -c "CREATE TYPE.*ENUM" "$SCHEMA_FILE" || echo "0")

echo "Tables: $TABLE_COUNT"
echo "Indexes: $INDEX_COUNT"
echo "Constraints: $CONSTRAINT_COUNT"
echo "Enums: $ENUM_COUNT"
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
