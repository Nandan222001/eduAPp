#!/bin/bash
# Bash script to run PostgreSQL audit
# Usage: ./scripts/run_postgresql_audit.sh [--verbose] [--output <file>]

set -e

OUTPUT="postgresql_audit_report.txt"
VERBOSE=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose|-v)
            VERBOSE="--verbose"
            shift
            ;;
        --output|-o)
            OUTPUT="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--verbose] [--output <file>]"
            exit 1
            ;;
    esac
done

echo "================================"
echo "PostgreSQL References Audit"
echo "================================"
echo ""

# Build command
CMD="python3 scripts/audit_postgresql_references.py --output $OUTPUT $VERBOSE"

echo "Running PostgreSQL audit..."
echo ""

# Run the audit
if $CMD; then
    echo ""
    echo "================================"
    echo "✓ Audit PASSED - No PostgreSQL references found!"
    echo "================================"
    exit 0
else
    EXIT_CODE=$?
    echo ""
    echo "================================"
    echo "✗ Audit FAILED - PostgreSQL references found"
    echo "================================"
    echo ""
    echo "See $OUTPUT for details"
    exit $EXIT_CODE
fi
