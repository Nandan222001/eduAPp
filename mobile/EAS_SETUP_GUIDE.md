# EAS Setup Guide

Complete guide to set up EAS Build and deployment for EDU Mobile.

## Quick Start

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login to Expo
eas login

# 3. Run setup wizard
cd mobile
chmod +x scripts/setup-credentials.sh
./scripts/setup-credentials.sh
```

## Detailed Setup

### 1. Prerequisites

#### Required Accounts
- **Expo Account**: Create at https://expo.dev
- **Apple Developer Account**: $99/year - https://developer.apple.com
- **Google Play Developer Account**: $25 one-time - https://play.google.com/console

#### Install Tools
```bash
# Install Node.js 18+
node --version  # Should be 18.x or higher

# Install EAS CLI globally
npm install -g eas-cli

# Verify installation
eas --version
```

### 2. Expo Account Setup

```bash
# Login to Expo
eas login

# Create new project (if not already done)
eas init

# This will:
# - Create an Expo project
# - Generate a project ID
# - Update app.json with project ID
```

Update `app.json` with your project details:
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-actual-project-id"
      }
    },
    "owner": "your-expo-username"
  }
}
```

### 3. iOS Setup

#### 3.1. Apple Developer Account

1. Enroll in Apple Developer Program
   - Go to https://developer.apple.com/programs/
   - Complete enrollment ($99/year)
   - Wait for approval (usually 24-48 hours)

2. Create App ID
   - Login to https://developer.apple.com
   - Go to Certificates, Identifiers & Profiles
   - Create new App ID: `com.edu.mobile`
   - Enable capabilities:
     - Push Notifications
     - Associated Domains
     - Sign in with Apple (if needed)

#### 3.2. App Store Connect

1. Create app in App Store Connect
   - Login to https://appstoreconnect.apple.com
   - My Apps → + → New App
   - Platform: iOS
   - Name: EDU Mobile
   - Bundle ID: com.edu.mobile
   - SKU: edu-mobile
   - Note the ASC App ID (numeric)

2. Configure app details
   - Add app icon (1024x1024)
   - Set category: Education
   - Set age rating: 4+
   - Add privacy policy URL

#### 3.3. Configure EAS Credentials

Option A: Automatic (Recommended)
```bash
cd mobile
eas build --profile production --platform ios

# EAS will prompt to:
# 1. Generate distribution certificate
# 2. Create provisioning profile
# 3. Store credentials securely
```

Option B: Manual
```bash
# Manage credentials manually
eas credentials -p ios

# Follow prompts to upload:
# - Distribution certificate (.p12)
# - Certificate password
# - Provisioning profile
```

#### 3.4. Update Environment Variables

Create `.env.production`:
```bash
APPLE_ID=your-apple-id@example.com
APPLE_TEAM_ID=ABCDE12345
ASC_APP_ID=1234567890
```

### 4. Android Setup

#### 4.1. Google Play Console

1. Create developer account
   - Go to https://play.google.com/console
   - Pay $25 registration fee
   - Complete account setup

2. Create application
   - Create App
   - App name: EDU Mobile
   - Default language: English
   - App or game: App
   - Free or paid: Free

3. Complete store listing
   - Add app icon (512x512)
   - Add screenshots
   - Add feature graphic (1024x500)
   - Write description
   - Add privacy policy URL
   - Set content rating
   - Set target audience

#### 4.2. Generate Keystore

```bash
cd mobile

# Generate release keystore
keytool -genkeypair -v -storetype PKCS12 \
  -keystore edu-mobile-release.keystore \
  -alias edu-mobile \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# You'll be prompted for:
# - Keystore password (save in password manager!)
# - Name and organization details
# - Key password (can be same as keystore password)
```

⚠️ **CRITICAL**: Backup this keystore file securely! Store in:
- Encrypted cloud storage
- Password manager vault
- Company secrets management
- At least 2 separate locations

#### 4.3. Configure EAS with Keystore

```bash
# Upload keystore to EAS
eas credentials -p android

# Select: Build credentials
# Select: Upload new keystore
# Provide: keystore file and passwords

# EAS will securely store your credentials
```

#### 4.4. Service Account Setup

For automated submissions:

1. In Google Play Console:
   - Settings → API access
   - Create new service account (or link existing)
   - Grant permissions: Release Manager
   - Create and download JSON key

2. Save the JSON key:
```bash
# Copy to mobile directory
cp ~/Downloads/service-account-key.json mobile/

# Verify it's in .gitignore
grep service-account-key.json mobile/.gitignore
```

3. Update `.env.production`:
```bash
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./service-account-key.json
```

### 5. Verify Setup

#### Test iOS Build
```bash
cd mobile
npm run build:preview:ios

# Monitor build progress
eas build:list
```

#### Test Android Build
```bash
cd mobile
npm run build:preview:android

# Monitor build progress
eas build:list
```

#### Test OTA Updates
```bash
# Publish test update
npm run update:publish:dev "Test update"

# Verify update
eas channel:view development
```

### 6. Configure CI/CD

#### GitHub Secrets

Add these secrets to your GitHub repository:
- Settings → Secrets and variables → Actions → New repository secret

```
EXPO_TOKEN           - Generate at expo.dev/settings/access-tokens
APPLE_ID             - Your Apple ID email
APPLE_TEAM_ID        - Your Apple Team ID
ASC_APP_ID           - App Store Connect App ID
GOOGLE_SERVICE_ACCOUNT_KEY - Base64 encoded JSON key
```

Generate EXPO_TOKEN:
```bash
# Login to Expo
eas login

# Create access token
# Go to: https://expo.dev/settings/access-tokens
# Create token with appropriate permissions
```

Encode service account key:
```bash
# On macOS/Linux
base64 -i service-account-key.json | pbcopy

# On Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("service-account-key.json")) | Set-Clipboard
```

### 7. First Deployment

#### Version Preparation
```bash
# Ensure version is correct
npm run version:bump:patch

# Review changes
git status

# Commit version bump
git add .
git commit -m "chore: bump version to 1.0.0"
git tag v1.0.0
git push origin main --tags
```

#### Build Production
```bash
# Build both platforms
npm run build:prod

# Or build individually
npm run build:prod:ios
npm run build:prod:android

# Monitor builds
npm run build:list
```

#### Submit to Stores
```bash
# After builds complete successfully

# Submit to iOS App Store
npm run submit:prod:ios

# Submit to Google Play (10% rollout)
npm run submit:prod:android
```

### 8. TestFlight Setup (iOS)

1. In App Store Connect:
   - Go to TestFlight tab
   - Add internal testers (up to 100)
   - Add external testers (up to 10,000)
   - Generate public link (optional)

2. Submit build for beta review:
   - First external build requires review
   - Provide test account credentials
   - Add beta review notes

3. Distribute build:
   - Select build
   - Add to groups
   - Invite testers

### 9. Internal Testing Setup (Android)

1. In Google Play Console:
   - Testing → Internal testing
   - Create release
   - Upload build
   - Add testers by email

2. Share testing link:
   - Copy opt-in URL
   - Share with internal testers
   - Testers accept invite and install

## Troubleshooting

### Common Issues

**"No valid iOS distribution certificate found"**
```bash
# Solution: Let EAS generate new credentials
eas credentials -p ios
# Select: Set up build credentials
```

**"Android keystore not found"**
```bash
# Solution: Upload keystore
eas credentials -p android
# Select: Build credentials → Upload keystore
```

**"Build fails with timeout"**
```json
// Solution: Increase resource class in eas.json
{
  "build": {
    "production": {
      "ios": {
        "resourceClass": "m-large"
      }
    }
  }
}
```

**"Update not downloading in app"**
```json
// Solution: Verify update configuration in app.json
{
  "expo": {
    "updates": {
      "enabled": true,
      "checkAutomatically": "ON_LOAD"
    }
  }
}
```

### Getting Help

- **EAS Documentation**: https://docs.expo.dev/eas/
- **Expo Forums**: https://forums.expo.dev/
- **Discord**: https://chat.expo.dev/
- **GitHub Issues**: Create issue in project repo

## Next Steps

After setup is complete:

1. ✅ Read [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment procedures
2. ✅ Review [deployment-checklist.md](./scripts/deployment-checklist.md)
3. ✅ Set up monitoring and analytics
4. ✅ Configure crash reporting
5. ✅ Plan your release strategy
6. ✅ Train team on deployment process

## Security Best Practices

- ✅ Never commit credentials to git
- ✅ Use environment variables for secrets
- ✅ Enable 2FA on all accounts
- ✅ Rotate keys and certificates regularly
- ✅ Backup keystores in multiple secure locations
- ✅ Use CI/CD secrets management
- ✅ Audit access to credentials regularly
- ✅ Follow principle of least privilege

---

**Setup Complete! 🎉**

You're now ready to build and deploy EDU Mobile to app stores.
