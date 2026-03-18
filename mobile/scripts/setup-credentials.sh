#!/bin/bash

# Interactive script to set up EAS credentials
# Run this script to configure iOS and Android credentials

set -e

echo "================================================"
echo "  EAS Credentials Setup Wizard"
echo "================================================"
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
  echo "❌ EAS CLI is not installed"
  echo "   Installing EAS CLI..."
  npm install -g eas-cli
fi

# Check if logged in
if ! eas whoami &> /dev/null; then
  echo "📝 Please login to your Expo account:"
  eas login
fi

echo "✅ Logged in as: $(eas whoami)"
echo ""

# iOS Credentials Setup
echo "================================================"
echo "  iOS Credentials Setup"
echo "================================================"
echo ""
echo "Choose iOS credential setup method:"
echo "1. Automatic (EAS manages everything) - RECOMMENDED"
echo "2. Manual (Upload existing certificates)"
echo "3. Skip iOS setup"
echo ""
read -p "Enter choice (1-3): " ios_choice

case $ios_choice in
  1)
    echo ""
    echo "🍎 Setting up iOS credentials automatically..."
    echo ""
    echo "EAS will:"
    echo "  - Generate distribution certificates"
    echo "  - Create provisioning profiles"
    echo "  - Store credentials securely"
    echo ""
    echo "You'll need:"
    echo "  - Apple Developer account access"
    echo "  - Admin access to your Apple Team"
    echo ""
    read -p "Press Enter to continue..."
    
    eas credentials -p ios
    echo "✅ iOS credentials configured"
    ;;
    
  2)
    echo ""
    echo "🍎 Manual iOS credentials setup..."
    echo ""
    echo "You'll need:"
    echo "  - Distribution certificate (.p12 file)"
    echo "  - Certificate password"
    echo "  - Provisioning profile"
    echo ""
    read -p "Press Enter when ready..."
    
    eas credentials -p ios
    echo "✅ iOS credentials uploaded"
    ;;
    
  3)
    echo "⏭️  Skipping iOS setup"
    ;;
esac

echo ""

# Android Credentials Setup
echo "================================================"
echo "  Android Credentials Setup"
echo "================================================"
echo ""
echo "Choose Android credential setup method:"
echo "1. Generate new keystore (for new apps) - RECOMMENDED"
echo "2. Upload existing keystore"
echo "3. Skip Android setup"
echo ""
read -p "Enter choice (1-3): " android_choice

case $android_choice in
  1)
    echo ""
    echo "🤖 Generating new Android keystore..."
    echo ""
    read -p "Enter keystore alias (e.g., edu-mobile): " keystore_alias
    
    if [ -z "$keystore_alias" ]; then
      keystore_alias="edu-mobile"
    fi
    
    echo ""
    echo "EAS will generate and store a keystore for you."
    echo "Alias: $keystore_alias"
    echo ""
    read -p "Press Enter to continue..."
    
    eas credentials -p android
    echo "✅ Android keystore generated"
    ;;
    
  2)
    echo ""
    echo "🤖 Upload existing Android keystore..."
    echo ""
    echo "You'll need:"
    echo "  - Keystore file (.keystore or .jks)"
    echo "  - Keystore password"
    echo "  - Key alias"
    echo "  - Key password"
    echo ""
    read -p "Keystore file path: " keystore_path
    
    if [ ! -f "$keystore_path" ]; then
      echo "❌ Keystore file not found: $keystore_path"
      exit 1
    fi
    
    echo ""
    read -p "Press Enter to upload..."
    
    eas credentials -p android
    echo "✅ Android keystore uploaded"
    ;;
    
  3)
    echo "⏭️  Skipping Android setup"
    ;;
esac

echo ""

# Google Play Service Account Setup
if [ "$android_choice" != "3" ]; then
  echo "================================================"
  echo "  Google Play Service Account Setup"
  echo "================================================"
  echo ""
  echo "For automated Google Play submissions, you need a service account."
  echo ""
  echo "Steps:"
  echo "1. Go to Google Play Console"
  echo "2. Settings > API access"
  echo "3. Create or link a service account"
  echo "4. Grant 'Release Manager' permissions"
  echo "5. Download the JSON key file"
  echo ""
  read -p "Do you have the service account JSON key? (y/n): " has_key
  
  if [[ $has_key =~ ^[Yy]$ ]]; then
    read -p "Path to service account JSON: " service_account_path
    
    if [ -f "$service_account_path" ]; then
      cp "$service_account_path" ./service-account-key.json
      echo "✅ Service account key copied to ./service-account-key.json"
      echo "⚠️  This file is gitignored. Keep it secure!"
    else
      echo "❌ File not found: $service_account_path"
    fi
  else
    echo "⚠️  You'll need to set this up before submitting to Google Play"
    echo "   See: mobile/DEPLOYMENT.md#google-play-console-configuration"
  fi
fi

echo ""
echo "================================================"
echo "  Setup Summary"
echo "================================================"
echo ""

# Display configured credentials
echo "📋 Current credentials status:"
echo ""
eas credentials -p ios 2>/dev/null || echo "iOS: Not configured"
echo ""
eas credentials -p android 2>/dev/null || echo "Android: Not configured"

echo ""
echo "================================================"
echo "  Next Steps"
echo "================================================"
echo ""
echo "1. Update app.json with your project details:"
echo "   - EAS Project ID"
echo "   - Owner/Username"
echo ""
echo "2. Update environment variables:"
echo "   - Copy .env.example to .env.production"
echo "   - Fill in API URLs and keys"
echo ""
echo "3. Test builds:"
echo "   npm run build:preview:ios"
echo "   npm run build:preview:android"
echo ""
echo "4. Read the deployment guide:"
echo "   mobile/DEPLOYMENT.md"
echo ""
echo "✅ Setup complete!"
