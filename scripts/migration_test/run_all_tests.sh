#!/bin/bash
#
# Comprehensive Migration Test Suite Runner
# Runs all migration validation tests in sequence
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNINGS=0

echo -e "${CYAN}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                                    ║${NC}"
echo -e "${CYAN}║        COMPREHENSIVE MIGRATION TEST SUITE                          ║${NC}"
echo -e "${CYAN}║                                                                    ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Started at: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""

# Function to run a test
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Test: ${test_name}${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✓ ${test_name} PASSED${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ ${test_name} FAILED${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Test 1: Set up test database
run_test "Test Database Setup" "./scripts/migration_test/setup_test_db.sh" || true

# Test 2: Backup production schema
if [ -f ".env" ]; then
    run_test "Production Schema Backup" "./scripts/migration_test/backup_production_schema.sh" || {
        echo -e "${YELLOW}⚠ Production database not available, skipping backup${NC}"
        ((TESTS_WARNINGS++))
    }
else
    echo -e "${YELLOW}⚠ No .env file found, skipping production schema backup${NC}"
    ((TESTS_WARNINGS++))
fi

# Test 3: Full migration validation
run_test "Full Migration Validation" "python scripts/migration_test/validate_migrations.py"

# Test 4: Test recent migrations
run_test "Recent Migrations Test" "python scripts/migration_test/test_recent_migrations.py -n 3"

# Test 5: Schema comparison (if production DB is available)
if [ -f ".env" ] && [ -f ".env.test.migration" ]; then
    run_test "Schema Comparison" "python scripts/migration_test/compare_schemas.py fastapi_db fastapi_db_migration_test" || {
        echo -e "${YELLOW}⚠ Schema comparison found differences (this may be expected)${NC}"
        ((TESTS_WARNINGS++))
    }
else
    echo -e "${YELLOW}⚠ Skipping schema comparison (production DB not configured)${NC}"
    ((TESTS_WARNINGS++))
fi

# Print final summary
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                                    ║${NC}"
echo -e "${CYAN}║                      TEST SUITE SUMMARY                            ║${NC}"
echo -e "${CYAN}║                                                                    ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${GREEN}Passed:${NC}   $TESTS_PASSED"
echo -e "  ${RED}Failed:${NC}   $TESTS_FAILED"
echo -e "  ${YELLOW}Warnings:${NC} $TESTS_WARNINGS"
echo ""
echo -e "${BLUE}Completed at: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""

# Generate summary report
REPORT_DIR="backups/migration_test"
mkdir -p "$REPORT_DIR"

cat > "$REPORT_DIR/test_suite_summary.txt" << EOF
Migration Test Suite Summary
=============================
Run Date: $(date '+%Y-%m-%d %H:%M:%S')

Results:
  Passed:   $TESTS_PASSED
  Failed:   $TESTS_FAILED
  Warnings: $TESTS_WARNINGS

Reports Generated:
  - migration_validation_report.json
  - recent_migrations_test_report.json
  - schema_comparison_report.json (if applicable)

Status: $([ $TESTS_FAILED -eq 0 ] && echo "SUCCESS" || echo "FAILED")
EOF

echo -e "${GREEN}✓ Summary report saved to: $REPORT_DIR/test_suite_summary.txt${NC}"
echo ""

# Exit with appropriate code
if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                   ALL TESTS PASSED! ✓                              ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                   SOME TESTS FAILED! ✗                             ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
