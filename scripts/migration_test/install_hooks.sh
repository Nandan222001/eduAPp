#!/bin/bash
#
# Install Git hooks for migration validation
#

set -e

HOOKS_DIR=".git/hooks"
HOOK_FILE="$HOOKS_DIR/pre-commit"
SOURCE_HOOK="scripts/migration_test/pre-commit-migration-check"

echo "Installing migration validation pre-commit hook..."

# Check if .git directory exists
if [ ! -d ".git" ]; then
    echo "Error: Not in a git repository"
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_DIR"

# Check if hook already exists
if [ -f "$HOOK_FILE" ]; then
    echo "Warning: Pre-commit hook already exists"
    echo "Backing up to $HOOK_FILE.backup"
    cp "$HOOK_FILE" "$HOOK_FILE.backup"
fi

# Copy hook file
cp "$SOURCE_HOOK" "$HOOK_FILE"
chmod +x "$HOOK_FILE"

echo "✓ Pre-commit hook installed successfully"
echo ""
echo "The hook will:"
echo "  - Validate migration file syntax"
echo "  - Check for duplicate revision IDs"
echo "  - Run quick migration validation (optional)"
echo ""
echo "To skip the hook for a commit: git commit --no-verify"
echo "To skip migration test: SKIP_MIGRATION_TEST=1 git commit"
echo ""
