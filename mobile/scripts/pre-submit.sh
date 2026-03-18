#!/bin/bash

# Pre-submission validation script
# Run before submitting to app stores

set -e

PLATFORM=${1:-all}
PROFILE=${2:-production}

echo "🔍 Running pre-submission validations for $PLATFORM ($PROFILE)..."

# Check for latest successful build
echo "📦 Checking for recent builds..."
LATEST_BUILDS=$(eas build:list --limit 5 --json --non-interactive)

if [ -z "$LATEST_BUILDS" ] || [ "$LATEST_BUILDS" = "[]" ]; then
  echo "❌ No recent builds found"
  echo "   Build the app first with: npm run build:prod:$PLATFORM"
  exit 1
fi
echo "✅ Recent builds found"

# iOS-specific checks
if [ "$PLATFORM" = "ios" ] || [ "$PLATFORM" = "all" ]; then
  echo "🍎 Validating iOS submission requirements..."
  
  # Check Apple credentials
  APPLE_ID=$(node -p "process.env.APPLE_ID || ''" 2>/dev/null)
  if [ -z "$APPLE_ID" ]; then
    echo "⚠️  APPLE_ID environment variable not set"
    echo "   Set it in .env.production or environment"
  fi
  
  # Check App Store Connect App ID
  ASC_APP_ID=$(node -p "process.env.ASC_APP_ID || ''" 2>/dev/null)
  if [ -z "$ASC_APP_ID" ]; then
    echo "⚠️  ASC_APP_ID environment variable not set"
    echo "   Get it from App Store Connect"
  fi
  
  # Check Team ID
  APPLE_TEAM_ID=$(node -p "process.env.APPLE_TEAM_ID || ''" 2>/dev/null)
  if [ -z "$APPLE_TEAM_ID" ]; then
    echo "⚠️  APPLE_TEAM_ID environment variable not set"
  fi
  
  echo "✅ iOS validation complete"
fi

# Android-specific checks
if [ "$PLATFORM" = "android" ] || [ "$PLATFORM" = "all" ]; then
  echo "🤖 Validating Android submission requirements..."
  
  # Check for service account key
  SERVICE_ACCOUNT_KEY=${GOOGLE_SERVICE_ACCOUNT_KEY_PATH:-./service-account-key.json}
  if [ ! -f "$SERVICE_ACCOUNT_KEY" ]; then
    echo "❌ Google Play service account key not found"
    echo "   Expected at: $SERVICE_ACCOUNT_KEY"
    echo "   Download from Google Play Console > Settings > API access"
    exit 1
  fi
  echo "✅ Service account key found"
  
  # Validate JSON format
  if ! python3 -m json.tool "$SERVICE_ACCOUNT_KEY" > /dev/null 2>&1; then
    echo "❌ Service account key is not valid JSON"
    exit 1
  fi
  echo "✅ Service account key is valid JSON"
  
  echo "✅ Android validation complete"
fi

# Version validation
echo "📋 Validating version information..."
APP_VERSION=$(node -p "require('./app.json').expo.version")
PACKAGE_VERSION=$(node -p "require('./package.json').version")

if [ "$APP_VERSION" != "$PACKAGE_VERSION" ]; then
  echo "⚠️  Version mismatch!"
  echo "   app.json: $APP_VERSION"
  echo "   package.json: $PACKAGE_VERSION"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
else
  echo "✅ Version numbers match: $APP_VERSION"
fi

# Check for changelog/release notes
if [ "$PROFILE" = "production" ]; then
  echo "📝 Checking for release notes..."
  if [ ! -f "CHANGELOG.md" ]; then
    echo "⚠️  CHANGELOG.md not found"
    echo "   Consider adding release notes"
  else
    echo "✅ CHANGELOG.md exists"
  fi
fi

# Git tag validation (for production)
if [ "$PROFILE" = "production" ]; then
  CURRENT_TAG="v$APP_VERSION"
  if git rev-parse "$CURRENT_TAG" >/dev/null 2>&1; then
    echo "✅ Git tag $CURRENT_TAG exists"
  else
    echo "⚠️  Git tag $CURRENT_TAG not found"
    echo "   Consider tagging this release: git tag $CURRENT_TAG"
  fi
fi

echo "✅ All pre-submission validations passed!"
echo "🚀 Ready to submit to app stores"
echo ""
echo "Next steps:"
echo "1. Review the latest build in EAS"
echo "2. Submit with: npm run submit:prod:$PLATFORM"
