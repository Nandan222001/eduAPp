#!/bin/bash

echo "Making cache clearing scripts executable..."

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

chmod +x "$SCRIPT_DIR/start-dev-clear-cache.sh"
chmod +x "$SCRIPT_DIR/start-web-clear-cache.sh"

echo "✓ start-dev-clear-cache.sh is now executable"
echo "✓ start-web-clear-cache.sh is now executable"
echo ""
echo "You can now run:"
echo "  ./scripts/start-dev-clear-cache.sh"
echo "  ./scripts/start-web-clear-cache.sh"
