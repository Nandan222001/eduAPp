#!/bin/bash

# Complete deployment workflow script
# Usage: ./deploy.sh [environment] [platform]
# Examples:
#   ./deploy.sh preview ios
#   ./deploy.sh production all
#   ./deploy.sh staging android

set -e

ENVIRONMENT=${1:-staging}
PLATFORM=${2:-all}

echo "================================================"
echo "  EDU Mobile Deployment Workflow"
echo "================================================"
echo ""
echo "Environment: $ENVIRONMENT"
echo "Platform: $PLATFORM"
echo ""

# Validate environment
case $ENVIRONMENT in
  development|preview|staging|production)
    ;;
  *)
    echo "❌ Invalid environment: $ENVIRONMENT"
    echo "   Valid: development, preview, staging, production"
    exit 1
    ;;
esac

# Validate platform
case $PLATFORM in
  ios|android|all)
    ;;
  *)
    echo "❌ Invalid platform: $PLATFORM"
    echo "   Valid: ios, android, all"
    exit 1
    ;;
esac

# Confirmation for production
if [ "$ENVIRONMENT" = "production" ]; then
  echo "⚠️  WARNING: Deploying to PRODUCTION!"
  echo ""
  read -p "Are you sure? (type 'deploy' to confirm): " confirm
  
  if [ "$confirm" != "deploy" ]; then
    echo "❌ Deployment cancelled"
    exit 0
  fi
fi

# Step 1: Pre-deployment checks
echo ""
echo "================================================"
echo "  Step 1: Pre-Deployment Validation"
echo "================================================"
echo ""

if [ -f "./scripts/pre-build.sh" ]; then
  chmod +x ./scripts/pre-build.sh
  ./scripts/pre-build.sh "$ENVIRONMENT"
else
  echo "⚠️  Pre-build script not found, skipping validation"
fi

# Step 2: Clean and install dependencies
echo ""
echo "================================================"
echo "  Step 2: Dependency Check"
echo "================================================"
echo ""

if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm ci
else
  echo "✅ Dependencies up to date"
fi

# Step 3: Run tests
echo ""
echo "================================================"
echo "  Step 3: Running Tests"
echo "================================================"
echo ""

echo "🧪 Running unit tests..."
if npm run test:unit -- --passWithNoTests; then
  echo "✅ Tests passed"
else
  echo "⚠️  Tests failed"
  read -p "Continue anyway? (y/n): " continue_anyway
  if [[ ! $continue_anyway =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Step 4: Build
echo ""
echo "================================================"
echo "  Step 4: Building Application"
echo "================================================"
echo ""

BUILD_PROFILE="$ENVIRONMENT"

case $PLATFORM in
  ios)
    echo "🍎 Building iOS for $ENVIRONMENT..."
    eas build --profile "$BUILD_PROFILE" --platform ios --non-interactive
    BUILD_SUCCESS=$?
    ;;
  android)
    echo "🤖 Building Android for $ENVIRONMENT..."
    eas build --profile "$BUILD_PROFILE" --platform android --non-interactive
    BUILD_SUCCESS=$?
    ;;
  all)
    echo "📱 Building both platforms for $ENVIRONMENT..."
    eas build --profile "$BUILD_PROFILE" --platform all --non-interactive
    BUILD_SUCCESS=$?
    ;;
esac

if [ $BUILD_SUCCESS -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi

echo "✅ Build(s) initiated successfully"
echo ""
echo "📊 Monitor build progress:"
echo "   eas build:list"
echo "   https://expo.dev"

# Step 5: Wait for builds (optional)
echo ""
read -p "Wait for builds to complete? (y/n): " wait_builds

if [[ $wait_builds =~ ^[Yy]$ ]]; then
  echo ""
  echo "⏳ Waiting for builds to complete..."
  echo "   This may take 10-20 minutes..."
  echo ""
  
  # Poll build status
  while true; do
    sleep 30
    BUILDS_STATUS=$(eas build:list --limit 2 --status in-progress --json 2>/dev/null || echo "[]")
    
    if [ "$BUILDS_STATUS" = "[]" ]; then
      echo "✅ Builds completed!"
      break
    else
      echo "⏳ Builds still in progress..."
    fi
  done
fi

# Step 6: Pre-submission checks
if [ "$ENVIRONMENT" = "production" ] || [ "$ENVIRONMENT" = "staging" ]; then
  echo ""
  echo "================================================"
  echo "  Step 5: Pre-Submission Validation"
  echo "================================================"
  echo ""
  
  if [ -f "./scripts/pre-submit.sh" ]; then
    chmod +x ./scripts/pre-submit.sh
    ./scripts/pre-submit.sh "$PLATFORM" "$ENVIRONMENT"
  else
    echo "⚠️  Pre-submit script not found, skipping validation"
  fi
fi

# Step 7: Submit to stores
if [ "$ENVIRONMENT" = "production" ] || [ "$ENVIRONMENT" = "staging" ]; then
  echo ""
  echo "================================================"
  echo "  Step 6: Submit to App Stores"
  echo "================================================"
  echo ""
  
  read -p "Submit to app stores? (y/n): " submit_confirm
  
  if [[ $submit_confirm =~ ^[Yy]$ ]]; then
    case $PLATFORM in
      ios)
        echo "🍎 Submitting to App Store..."
        eas submit --profile "$ENVIRONMENT" --platform ios --non-interactive --latest
        ;;
      android)
        echo "🤖 Submitting to Google Play..."
        eas submit --profile "$ENVIRONMENT" --platform android --non-interactive --latest
        ;;
      all)
        echo "📱 Submitting to both stores..."
        eas submit --profile "$ENVIRONMENT" --platform ios --non-interactive --latest
        eas submit --profile "$ENVIRONMENT" --platform android --non-interactive --latest
        ;;
    esac
    
    echo "✅ Submission(s) initiated"
  else
    echo "⏭️  Skipping app store submission"
    echo "   Submit later with: npm run submit:$ENVIRONMENT:$PLATFORM"
  fi
fi

# Step 8: Summary
echo ""
echo "================================================"
echo "  Deployment Summary"
echo "================================================"
echo ""
echo "Environment: $ENVIRONMENT"
echo "Platform: $PLATFORM"
echo "Time: $(date)"
echo ""

if [ "$ENVIRONMENT" = "production" ]; then
  echo "================================================"
  echo "  Post-Deployment Actions"
  echo "================================================"
  echo ""
  echo "1. Monitor build status: eas build:list"
  echo "2. Check submission status: eas submission:list"
  echo "3. Monitor crash reports in Sentry"
  echo "4. Check user reviews in App Store/Play Console"
  echo "5. Monitor staged rollout metrics"
  echo "6. Be ready to rollback if needed"
  echo ""
  echo "Rollback command: ./scripts/rollback-update.sh production"
  echo ""
fi

echo "✅ Deployment workflow completed!"
echo ""
echo "Next steps:"
echo "  - View builds: npm run build:list"
echo "  - View channels: npm run channel:list"
echo "  - Check status: ./scripts/check-build-status.sh"
echo ""
