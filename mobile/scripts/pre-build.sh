#!/bin/bash

# Pre-build validation script
# Run before initiating any build process

set -e

echo "🔍 Running pre-build validations..."

# Check Node version
REQUIRED_NODE_VERSION=18
CURRENT_NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)

if [ "$CURRENT_NODE_VERSION" -lt "$REQUIRED_NODE_VERSION" ]; then
  echo "❌ Node.js version $REQUIRED_NODE_VERSION or higher is required"
  echo "   Current version: $(node -v)"
  exit 1
fi
echo "✅ Node.js version check passed"

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
  echo "❌ EAS CLI is not installed"
  echo "   Run: npm install -g eas-cli"
  exit 1
fi
echo "✅ EAS CLI is installed"

# Check if logged in to EAS
if ! eas whoami &> /dev/null; then
  echo "❌ Not logged in to EAS"
  echo "   Run: eas login"
  exit 1
fi
echo "✅ Logged in to EAS"

# Verify app.json exists and is valid
if [ ! -f "app.json" ]; then
  echo "❌ app.json not found"
  exit 1
fi

# Check if project ID is configured
PROJECT_ID=$(node -p "require('./app.json').expo.extra.eas.projectId" 2>/dev/null)
if [ "$PROJECT_ID" = "your-project-id" ] || [ -z "$PROJECT_ID" ]; then
  echo "❌ EAS project ID not configured in app.json"
  echo "   Run: eas init"
  exit 1
fi
echo "✅ EAS project ID configured: $PROJECT_ID"

# Check for required environment files based on build type
BUILD_TYPE=${1:-development}

case $BUILD_TYPE in
  production)
    if [ ! -f ".env.production" ]; then
      echo "⚠️  .env.production not found"
      echo "   Using default environment configuration"
    else
      echo "✅ Production environment file found"
    fi
    ;;
  staging)
    if [ ! -f ".env.staging" ]; then
      echo "⚠️  .env.staging not found"
      echo "   Using default environment configuration"
    else
      echo "✅ Staging environment file found"
    fi
    ;;
  development)
    if [ ! -f ".env.development" ]; then
      echo "⚠️  .env.development not found"
      echo "   Using default environment configuration"
    else
      echo "✅ Development environment file found"
    fi
    ;;
esac

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
  echo "❌ node_modules not found"
  echo "   Run: npm install"
  exit 1
fi
echo "✅ Dependencies installed"

# Run TypeScript check
echo "🔍 Running TypeScript validation..."
if npm run type-check; then
  echo "✅ TypeScript validation passed"
else
  echo "⚠️  TypeScript validation failed"
  echo "   Consider fixing type errors before building"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Verify git status (for production builds)
if [ "$BUILD_TYPE" = "production" ]; then
  if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Uncommitted changes detected"
    echo "   Consider committing changes before production build"
    git status --short
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  else
    echo "✅ Working directory is clean"
  fi
fi

echo "✅ All pre-build validations passed!"
echo "🚀 Ready to build for: $BUILD_TYPE"
