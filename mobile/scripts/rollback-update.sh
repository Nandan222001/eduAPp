#!/bin/bash

# Script to rollback OTA updates to a previous version
# Usage: ./rollback-update.sh [channel]

set -e

CHANNEL=${1:-production}

echo "================================================"
echo "  Rollback OTA Update"
echo "================================================"
echo ""
echo "Channel: $CHANNEL"
echo ""

# Validate channel
case $CHANNEL in
  development|preview|staging|production)
    ;;
  *)
    echo "❌ Invalid channel: $CHANNEL"
    echo "   Valid channels: development, preview, staging, production"
    exit 1
    ;;
esac

# Confirm rollback for production
if [ "$CHANNEL" = "production" ]; then
  echo "⚠️  WARNING: Rolling back PRODUCTION channel!"
  echo ""
  echo "This will revert all production users to a previous update."
  echo ""
  read -p "Are you ABSOLUTELY sure? (type 'rollback' to confirm): " confirm
  
  if [ "$confirm" != "rollback" ]; then
    echo "❌ Rollback cancelled"
    exit 0
  fi
fi

# Get recent updates
echo "📋 Fetching recent updates for $CHANNEL channel..."
echo ""

eas update:list --branch "$CHANNEL" --limit 10

echo ""
echo "================================================"
echo "  Select Update to Rollback To"
echo "================================================"
echo ""
read -p "Enter the update ID or branch name: " rollback_target

if [ -z "$rollback_target" ]; then
  echo "❌ No update ID provided"
  exit 1
fi

# Confirm rollback
echo ""
echo "Rolling back $CHANNEL to: $rollback_target"
read -p "Confirm? (y/n): " final_confirm

if [[ ! $final_confirm =~ ^[Yy]$ ]]; then
  echo "❌ Rollback cancelled"
  exit 0
fi

# Perform rollback
echo ""
echo "🔄 Performing rollback..."

eas channel:edit "$CHANNEL" --branch "$rollback_target"

echo ""
echo "✅ Rollback completed successfully!"
echo ""
echo "================================================"
echo "  Post-Rollback Actions"
echo "================================================"
echo ""
echo "1. Verify the rollback:"
echo "   eas channel:view $CHANNEL"
echo ""
echo "2. Monitor user reports and crash analytics"
echo ""
echo "3. Investigate and fix the issue that required rollback"
echo ""
echo "4. Prepare and test a new update"
echo ""
echo "5. Document the incident for future reference"
echo ""

# Log rollback
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
echo "[$TIMESTAMP] Rolled back $CHANNEL to $rollback_target" >> rollback-log.txt
echo "📝 Rollback logged to rollback-log.txt"
