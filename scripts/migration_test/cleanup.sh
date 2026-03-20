#!/bin/bash
#
# Clean up migration test artifacts and test database
#

set -e

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

if [ -f .env.test.migration ]; then
    export $(grep -v '^#' .env.test.migration | xargs)
fi

TEST_DATABASE_NAME="${TEST_DATABASE_NAME:-fastapi_db_migration_test}"
DATABASE_USER="${DATABASE_USER:-postgres}"
PGPASSWORD="${DATABASE_PASSWORD:-postgres}"

export PGPASSWORD

echo "============================================"
echo "Migration Test Cleanup"
echo "============================================"
echo "This will remove:"
echo "  - Test database: $TEST_DATABASE_NAME"
echo "  - Test reports in backups/migration_test/"
echo "  - Test configuration: .env.test.migration"
echo "============================================"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled"
    exit 0
fi

# Drop test database
echo "Dropping test database..."
psql -h localhost -U "$DATABASE_USER" -d postgres -c "DROP DATABASE IF EXISTS $TEST_DATABASE_NAME;" 2>/dev/null || true
echo "✓ Test database dropped"

# Remove test reports
echo "Removing test reports..."
rm -f backups/migration_test/*.json
rm -f backups/migration_test/*.txt
rm -f backups/migration_test/*.log
echo "✓ Test reports removed"

# Remove test configuration
echo "Removing test configuration..."
rm -f .env.test.migration
echo "✓ Test configuration removed"

echo ""
echo "============================================"
echo "Cleanup completed successfully!"
echo "============================================"
echo ""
echo "To set up the test environment again:"
echo "  ./scripts/migration_test/setup_test_db.sh"
echo ""
