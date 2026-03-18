# EDU Mobile - Deployment Guide

Complete guide for deploying EDU Mobile to App Store and Google Play using EAS Build and EAS Submit.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [iOS Code Signing](#ios-code-signing)
- [Android Keystore](#android-keystore)
- [Build Profiles](#build-profiles)
- [Building](#building)
- [OTA Updates](#ota-updates)
- [App Store Submission](#app-store-submission)
- [Google Play Submission](#google-play-submission)
- [Staged Rollout Strategy](#staged-rollout-strategy)
- [Version Management](#version-management)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Accounts

1. **Expo Account**: https://expo.dev
2. **Apple Developer Account**: https://developer.apple.com ($99/year)
3. **Google Play Console Account**: https://play.google.com/console ($25 one-time)

### Required Tools

```bash
# Install Node.js (v18 or later)
node --version

# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Verify installation
eas --version
```

## Initial Setup

### 1. Configure EAS Project

```bash
cd mobile

# Initialize EAS (if not already done)
eas init

# Configure project ID in app.json
# Update "extra.eas.projectId" with your actual project ID
```

### 2. Update Configuration Files

Edit `app.json`:
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-actual-project-id"
      }
    },
    "owner": "your-expo-username",
    "updates": {
      "url": "https://u.expo.dev/your-project-id"
    }
  }
}
```

### 3. Environment Variables

Create `.env.production`:
```bash
APP_ENV=production
API_URL=https://api.edu.app
SENTRY_DSN=your-sentry-dsn
ANALYTICS_KEY=your-analytics-key
```

## iOS Code Signing

### Option 1: Automatic (Recommended)

EAS handles certificates and provisioning profiles automatically:

```bash
# EAS will prompt you to create credentials
eas build --profile production --platform ios
```

### Option 2: Manual Setup

1. **Generate Certificates in Apple Developer Portal**:
   - Login to https://developer.apple.com
   - Go to Certificates, Identifiers & Profiles
   - Create App ID: `com.edu.mobile`
   - Create Distribution Certificate
   - Create Provisioning Profile (App Store Distribution)

2. **Configure EAS Credentials**:
```bash
# Manage iOS credentials
eas credentials -p ios

# Options:
# 1. Use existing credentials
# 2. Upload certificates manually
# 3. Let EAS manage credentials
```

3. **Store Credentials Securely**:
```bash
# Upload distribution certificate
eas credentials -p ios

# Select: Upload credentials
# Provide: .p12 file and password
```

### Apple Developer Portal Configuration

1. **Bundle Identifier**: `com.edu.mobile`
2. **Capabilities**: 
   - Push Notifications
   - Associated Domains
   - Sign in with Apple (if needed)
   - Background Modes
3. **App Store Connect**:
   - Create app listing
   - Note the ASC App ID for `eas.json`

## Android Keystore

### Generate Production Keystore

```bash
# Generate keystore (run this once)
keytool -genkeypair -v -storetype PKCS12 -keystore edu-mobile-release.keystore \
  -alias edu-mobile -keyalg RSA -keysize 2048 -validity 10000

# Provide:
# - Strong password (save in password manager)
# - Organization details
# - Alias password
```

### Configure EAS with Keystore

```bash
# Upload keystore to EAS
eas credentials -p android

# Select: Build credentials
# Select: Upload new keystore
# Provide keystore file and passwords
```

### Store Keystore Securely

⚠️ **CRITICAL**: Backup your keystore file securely!

```bash
# Backup locations (choose at least 2):
# 1. Encrypted cloud storage
# 2. Password manager vault
# 3. Encrypted external drive
# 4. Company secrets management system

# Generate keystore fingerprints for verification
keytool -list -v -keystore edu-mobile-release.keystore -alias edu-mobile
```

### Google Play Console Configuration

1. **Create Application**:
   - Login to Google Play Console
   - Create new app: "EDU Mobile"
   - Package name: `com.edu.mobile`

2. **Service Account Setup**:
   ```bash
   # 1. In Google Play Console:
   #    - Settings > API access
   #    - Create service account
   #    - Download JSON key
   
   # 2. Save as mobile/service-account-key.json
   # 3. Add to .gitignore (already included)
   ```

3. **Configure Release Tracks**:
   - Internal testing
   - Closed testing (alpha/beta)
   - Open testing
   - Production

## Build Profiles

Our project has 4 build profiles configured in `eas.json`:

### Development Profile
- **Purpose**: Local development and testing
- **Distribution**: Internal (Ad-hoc)
- **Features**: Development client, simulator builds
- **Usage**:
  ```bash
  npm run build:dev:ios
  npm run build:dev:android
  npm run build:dev  # Both platforms
  ```

### Preview Profile
- **Purpose**: Internal testing (TestFlight/Internal Testing)
- **Distribution**: Internal
- **Features**: Release configuration, real devices only
- **Usage**:
  ```bash
  npm run build:preview:ios
  npm run build:preview:android
  npm run build:preview  # Both platforms
  ```

### Staging Profile
- **Purpose**: Pre-production testing
- **Distribution**: Internal
- **Bundle ID**: `com.edu.mobile.staging` (separate from production)
- **Usage**:
  ```bash
  npm run build:staging:ios
  npm run build:staging:android
  npm run build:staging  # Both platforms
  ```

### Production Profile
- **Purpose**: App Store and Google Play releases
- **Distribution**: Store
- **Features**: Optimized builds, auto-increment versions
- **Usage**:
  ```bash
  npm run build:prod:ios
  npm run build:prod:android
  npm run build:prod  # Both platforms
  ```

## Building

### Pre-Build Checklist

- [ ] Update version numbers (`npm run version:bump:[patch|minor|major]`)
- [ ] Test app thoroughly
- [ ] Update changelog
- [ ] Verify environment variables
- [ ] Check credentials are valid
- [ ] Review app.json configuration

### Build Commands

```bash
# Development builds
npm run build:dev:ios        # iOS development
npm run build:dev:android    # Android development

# Preview builds (for testing)
npm run build:preview:ios
npm run build:preview:android

# Staging builds
npm run build:staging:ios
npm run build:staging:android

# Production builds
npm run build:prod:ios
npm run build:prod:android

# Monitor build progress
eas build:list
eas build:view <build-id>

# Cancel a build if needed
npm run build:cancel
```

### Build Configuration

Builds are configured in `eas.json`:

```json
{
  "build": {
    "production": {
      "ios": {
        "resourceClass": "m-medium",      // Build machine size
        "autoIncrement": "buildNumber",   // Auto-increment build number
        "buildConfiguration": "Release"   // Xcode configuration
      },
      "android": {
        "buildType": "aab",              // Android App Bundle
        "autoIncrement": "versionCode"   // Auto-increment version code
      }
    }
  }
}
```

## OTA Updates

Over-The-Air (OTA) updates allow JavaScript bundle updates without app store review.

### Channels and Branches

We maintain these update channels:
- `development` - Development builds
- `preview` - Preview/staging builds
- `staging` - Staging environment
- `production` - Production releases

### Publishing Updates

```bash
# Publish to development
npm run update:publish:dev "Fix: Resolved login issue"

# Publish to preview
npm run update:publish:preview "Feature: Added new dashboard"

# Publish to staging
npm run update:publish:staging "Release: v1.2.0 staging"

# Publish to production
npm run update:publish:prod "Release: v1.2.0"
```

### Managing Channels

```bash
# List all channels
npm run channel:list

# View channel details
npm run channel:view production

# Create new channel
npm run channel:create beta
```

### Update Strategy

1. **Development**: Frequent updates for testing
2. **Staging**: Pre-release updates for QA
3. **Production**: Stable releases only

### OTA Update Limitations

⚠️ **Cannot update via OTA**:
- Native code changes
- New native dependencies
- Permission changes
- App icon/splash screen
- Build configuration changes

For these changes, you MUST submit a new build to app stores.

### Rollback Strategy

```bash
# View update history
eas update:list --branch production

# Rollback to previous update
eas channel:edit production --branch <previous-branch-id>
```

## App Store Submission

### TestFlight Distribution

```bash
# Build and submit to TestFlight
npm run build:preview:ios
npm run submit:preview:ios

# Or in one command
eas build --profile preview --platform ios --auto-submit
```

### TestFlight Groups

Create testing groups in App Store Connect:

1. **Internal Testing**:
   - Development team (up to 100 members)
   - Immediate distribution
   - No review required

2. **External Testing**:
   - Beta testers (up to 10,000)
   - Requires Beta App Review
   - Public link available

### Production Submission

```bash
# 1. Build production iOS app
npm run build:prod:ios

# 2. Submit to App Store
npm run submit:prod:ios

# 3. Complete in App Store Connect
# - Add screenshots
# - Write description
# - Set pricing
# - Submit for review
```

### App Store Connect Configuration

Required information:
- **App Name**: EDU Mobile
- **Subtitle**: Education Management Platform
- **Category**: Education
- **Age Rating**: 4+
- **Privacy Policy URL**: https://edu.app/privacy
- **Support URL**: https://edu.app/support

### App Store Review Guidelines

Ensure compliance:
- [ ] No bugs or crashes
- [ ] Complete functionality
- [ ] Privacy policy linked
- [ ] Accurate screenshots
- [ ] Clear app description
- [ ] Proper age rating
- [ ] No forbidden content

### Submission Checklist

- [ ] Version number incremented
- [ ] Build tested on physical device
- [ ] Screenshots prepared (all required sizes)
- [ ] App description written
- [ ] Keywords optimized
- [ ] Privacy policy updated
- [ ] What's New text added
- [ ] Support contact information current

## Google Play Submission

### Internal Testing

```bash
# Build and submit to Internal Testing
npm run build:preview:android
npm run submit:preview:android
```

### Internal Testing Group Setup

In Google Play Console:
1. Go to Testing > Internal testing
2. Create testing track
3. Add testers by email or Google Group
4. Share testing link

### Production Submission with Staged Rollout

```bash
# 1. Build production Android app
npm run build:prod:android

# 2. Submit with 10% rollout (configured in eas.json)
npm run submit:prod:android

# 3. Monitor and increase rollout
# See "Staged Rollout Strategy" section
```

### Google Play Console Configuration

Required assets:
- **App icon**: 512x512 PNG
- **Feature graphic**: 1024x500 PNG
- **Screenshots**: 
  - Phone: 2-8 screenshots
  - Tablet (optional): 2-8 screenshots
- **Privacy Policy URL**: https://edu.app/privacy
- **Content rating**: Complete questionnaire

### Release Management

```bash
# Submit to internal track
npm run submit:preview:android

# Promote to production with gradual rollout
eas submit --profile production --platform android

# Increase rollout percentage (manual in console)
# Google Play Console > Production > Manage rollout
```

## Staged Rollout Strategy

### Overview

Staged rollouts minimize risk by gradually releasing to users.

### iOS Phased Release

Configure in App Store Connect:
1. Go to app version
2. Enable "Phased Release for Automatic Updates"
3. Rollout schedule (automatic):
   - Day 1: 1% of users
   - Day 2: 2% of users
   - Day 3: 5% of users
   - Day 4: 10% of users
   - Day 5: 20% of users
   - Day 6: 50% of users
   - Day 7: 100% of users

### Android Staged Rollout

Configured in `eas.json`:
```json
{
  "submit": {
    "production": {
      "android": {
        "rolloutFraction": 0.1  // Start with 10%
      }
    }
  }
}
```

Rollout process:
```bash
# 1. Initial 10% rollout
npm run submit:prod:android

# 2. Monitor for 24-48 hours
# Check crash reports in Play Console

# 3. Increase rollout to 25%
# Update eas.json rolloutFraction to 0.25
npm run submit:prod:android

# 4. Continue increasing:
# - 50% (2-3 days later)
# - 100% (full release)

# Or use full rollout profile
npm run submit:prod:android:rollout
```

### Monitoring During Rollout

Check these metrics:
- Crash-free rate (target: >99.5%)
- ANR (Application Not Responding) rate
- User ratings and reviews
- Specific error reports

### Rollback Procedure

**iOS**:
1. App Store Connect > My Apps > [App]
2. Click version → Remove from Sale
3. Fix issues
4. Submit new build

**Android**:
1. Google Play Console → Production
2. Halt rollout immediately
3. Create new release with fixes
4. Resume rollout

## Version Management

### Semantic Versioning

We follow semver: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes, major features (1.0.0 → 2.0.0)
- **MINOR**: New features, backwards compatible (1.0.0 → 1.1.0)
- **PATCH**: Bug fixes, minor updates (1.0.0 → 1.0.1)

### Version Bump Scripts

```bash
# Patch version (1.0.0 → 1.0.1)
npm run version:bump:patch

# Minor version (1.0.0 → 1.1.0)
npm run version:bump:minor

# Major version (1.0.0 → 2.0.0)
npm run version:bump:major
```

This script automatically:
- Updates `package.json` version
- Updates `app.json` version
- Increments iOS build number
- Increments Android version code
- Provides git commit suggestions

### Version Files

Versions are maintained in:
1. `package.json`: `version`
2. `app.json`: `expo.version`
3. iOS: `expo.ios.buildNumber`
4. Android: `expo.android.versionCode`

### Release Tagging

```bash
# After version bump
git add .
git commit -m "chore: bump version to 1.2.0"
git tag v1.2.0
git push origin main
git push origin v1.2.0
```

### Changelog Maintenance

Update `CHANGELOG.md` with each release:

```markdown
## [1.2.0] - 2024-01-15

### Added
- New feature X
- Feature Y improvements

### Fixed
- Bug Z resolution
- Performance improvement in component A

### Changed
- Updated dependency B to v2.0
```

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/eas-build.yml`:

```yaml
name: EAS Build

on:
  push:
    branches: [main, develop]
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Setup Expo and EAS
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
          
      - name: Install dependencies
        run: |
          cd mobile
          npm ci
          
      - name: Build preview
        if: github.ref == 'refs/heads/develop'
        run: |
          cd mobile
          eas build --profile preview --platform all --non-interactive
          
      - name: Build production
        if: startsWith(github.ref, 'refs/tags/v')
        run: |
          cd mobile
          eas build --profile production --platform all --non-interactive
          
      - name: Submit to stores
        if: startsWith(github.ref, 'refs/tags/v')
        run: |
          cd mobile
          eas submit --profile production --platform all --non-interactive
```

### Environment Secrets

Add to GitHub Secrets or CI/CD platform:

```bash
EXPO_TOKEN=<expo-access-token>
APPLE_ID=<your-apple-id>
APPLE_TEAM_ID=<your-team-id>
ASC_APP_ID=<app-store-connect-app-id>
GOOGLE_SERVICE_ACCOUNT_KEY=<base64-encoded-key>
```

### Build Triggers

Automated builds trigger on:
- **Push to develop**: Preview builds
- **Push to main**: Staging builds
- **Tag creation (v*)**: Production builds
- **Pull requests**: Development builds (optional)

## Troubleshooting

### Common Build Issues

**Issue**: Build fails with "No certificate found"
```bash
# Solution: Configure credentials
eas credentials -p ios
# Select: Set up build credentials
```

**Issue**: Android build fails with keystore error
```bash
# Solution: Upload keystore
eas credentials -p android
# Select: Upload new keystore
```

**Issue**: Build timeout
```bash
# Solution: Increase resource class in eas.json
"ios": {
  "resourceClass": "m-large"  // or m-xlarge
}
```

### Common Submission Issues

**Issue**: Missing compliance information (iOS)
```json
// Add to app.json
"ios": {
  "infoPlist": {
    "ITSAppUsesNonExemptEncryption": false
  }
}
```

**Issue**: Google Play submission fails
```bash
# Verify service account permissions
# Ensure service account has "Release Manager" role
```

### OTA Update Issues

**Issue**: Updates not downloading
```bash
# Check update configuration in app.json
"updates": {
  "enabled": true,
  "checkAutomatically": "ON_LOAD",
  "fallbackToCacheTimeout": 0
}
```

**Issue**: Wrong channel receiving updates
```bash
# Verify build channel
eas build:view <build-id>

# Update channel mapping
eas channel:edit production --branch production
```

### Credential Issues

**Issue**: Expired certificates
```bash
# Renew iOS certificates
eas credentials -p ios
# Select: Remove credentials
# Rebuild to generate new ones
```

**Issue**: Provisioning profile mismatch
```bash
# Clear and regenerate
eas credentials -p ios
# Select: Set up build credentials
# Select: Remove all credentials
# Rebuild application
```

### Support Resources

- **EAS Documentation**: https://docs.expo.dev/eas/
- **Expo Forums**: https://forums.expo.dev/
- **Discord**: https://chat.expo.dev/
- **Stack Overflow**: Tag `expo` or `eas`

## Best Practices

### Security
- ✅ Never commit credentials to git
- ✅ Use environment variables for secrets
- ✅ Rotate API keys regularly
- ✅ Enable 2FA on all accounts
- ✅ Backup keystores securely

### Testing
- ✅ Test on physical devices before release
- ✅ Use TestFlight/Internal Testing for pre-release
- ✅ Monitor crash reports daily
- ✅ Maintain >99% crash-free rate
- ✅ Get feedback from beta testers

### Release Process
- ✅ Follow semantic versioning
- ✅ Maintain comprehensive changelogs
- ✅ Tag releases in git
- ✅ Use staged rollouts
- ✅ Monitor metrics during rollout
- ✅ Have rollback plan ready

### Communication
- ✅ Notify users of major updates
- ✅ Maintain release notes
- ✅ Respond to user reviews
- ✅ Keep support documentation current

---

## Quick Reference

### Essential Commands

```bash
# Build
npm run build:prod:ios
npm run build:prod:android

# Submit
npm run submit:prod:ios
npm run submit:prod:android

# Update (OTA)
npm run update:publish:prod "Description"

# Version
npm run version:bump:patch

# Credentials
npm run credentials:ios
npm run credentials:android

# Monitor
npm run build:list
npm run channel:list
```

### Support Contacts

- **Technical Issues**: tech-support@edu.app
- **Apple Developer**: https://developer.apple.com/contact/
- **Google Play Support**: https://support.google.com/googleplay/android-developer/
- **Expo Support**: https://expo.dev/support

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
