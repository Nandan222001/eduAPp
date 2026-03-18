#!/bin/bash

# Script to publish OTA updates to specific channels
# Usage: ./publish-update.sh [channel] [message]

set -e

CHANNEL=${1:-staging}
MESSAGE=${2:-"Update published"}

echo "================================================"
echo "  Publishing OTA Update"
echo "================================================"
echo ""
echo "Channel: $CHANNEL"
echo "Message: $MESSAGE"
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

# Confirm production updates
if [ "$CHANNEL" = "production" ]; then
  echo "⚠️  WARNING: Publishing to PRODUCTION channel!"
  echo ""
  echo "This update will be deployed to all production users."
  echo ""
  read -p "Are you sure? (yes/no): " confirm
  
  if [ "$confirm" != "yes" ]; then
    echo "❌ Update cancelled"
    exit 0
  fi
fi

# Pre-update validations
echo "🔍 Running pre-update validations..."

# Check for uncommitted changes (production only)
if [ "$CHANNEL" = "production" ]; then
  if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Uncommitted changes detected"
    git status --short
    echo ""
    read -p "Continue anyway? (y/n): " continue_anyway
    if [[ ! $continue_anyway =~ ^[Yy]$ ]]; then
      echo "❌ Update cancelled"
      exit 0
    fi
  fi
fi

# Run type check
echo "🔍 Running TypeScript check..."
if ! npm run type-check; then
  echo "❌ TypeScript check failed"
  read -p "Continue anyway? (y/n): " continue_anyway
  if [[ ! $continue_anyway =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Run linter
echo "🔍 Running linter..."
if ! npm run lint; then
  echo "⚠️  Linter warnings detected"
  read -p "Continue anyway? (y/n): " continue_anyway
  if [[ ! $continue_anyway =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo "✅ Pre-update validations passed"
echo ""

# Publish update
echo "📤 Publishing update to $CHANNEL..."
echo ""

eas update --channel "$CHANNEL" --message "$MESSAGE"

echo ""
echo "✅ Update published successfully!"
echo ""
echo "================================================"
echo "  Update Information"
echo "================================================"
echo ""
echo "Channel: $CHANNEL"
echo "Message: $MESSAGE"
echo "Time: $(date)"
echo ""
echo "Users on the $CHANNEL channel will receive this update"
echo "when they next launch or reload the app."
echo ""
echo "Monitor the update:"
echo "  eas channel:view $CHANNEL"
echo ""

# Production update reminder
if [ "$CHANNEL" = "production" ]; then
  echo "================================================"
  echo "  Post-Update Actions"
  echo "================================================"
  echo ""
  echo "1. Monitor crash reports in Sentry"
  echo "2. Check user feedback and reviews"
  echo "3. Be ready to rollback if needed:"
  echo "   eas channel:edit production --branch <previous-branch>"
  echo ""
fi

echo "Done! 🎉"
