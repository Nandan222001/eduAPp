#!/bin/bash
# MySQL 8.0 Comprehensive Migration Testing Script (Bash)
# This script runs comprehensive migration tests on MySQL 8.0

set -e

# Default configuration
DATABASE_HOST="${DATABASE_HOST:-localhost}"
DATABASE_PORT="${DATABASE_PORT:-3306}"
DATABASE_USER="${DATABASE_USER:-root}"
DATABASE_PASSWORD="${DATABASE_PASSWORD:-test_password}"
DATABASE_NAME="${DATABASE_NAME:-test_mysql_migration}"

echo ""
echo "================================================================================"
echo "MySQL 8.0 COMPREHENSIVE MIGRATION TESTING"
echo "================================================================================"
echo ""

# Construct database URL
DATABASE_URL="mysql+pymysql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}?charset=utf8mb4"

echo "Database Configuration:"
echo "  Host: $DATABASE_HOST"
echo "  Port: $DATABASE_PORT"
echo "  User: $DATABASE_USER"
echo "  Database: $DATABASE_NAME"
echo ""

# Check if Python is available
echo "Checking Python installation..."
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "✗ Python not found in PATH"
    echo "  Please install Python 3.9+ and add to PATH"
    exit 1
fi

# Use python3 if available, otherwise python
PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    PYTHON_CMD="python"
fi

PYTHON_VERSION=$($PYTHON_CMD --version)
echo "✓ Found: $PYTHON_VERSION"
echo ""

# Check if MySQL client is available (optional, just for info)
echo "Checking MySQL client..."
if command -v mysql &> /dev/null; then
    echo "✓ MySQL client found"
else
    echo "⚠ MySQL client not found (optional)"
    echo "  Install MySQL client for manual database operations"
fi
echo ""

# Set environment variable for test
export MYSQL_TEST_DATABASE_URL="$DATABASE_URL"

# Run the comprehensive test script
echo "Running comprehensive migration tests..."
echo ""

EXIT_CODE=0
$PYTHON_CMD scripts/test_mysql_migrations_comprehensive.py || EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "================================================================================"
    echo "✓ ALL TESTS PASSED"
    echo "================================================================================"
    echo ""
    echo "Test results saved to: backups/migration_test/mysql_migration_test_results.json"
else
    echo "================================================================================"
    echo "✗ TESTS FAILED"
    echo "================================================================================"
    echo ""
    echo "Check test results in: backups/migration_test/mysql_migration_test_results.json"
fi

exit $EXIT_CODE
