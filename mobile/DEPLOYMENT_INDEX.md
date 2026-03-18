# EDU Mobile - Deployment Documentation Index

Complete deployment and distribution documentation for EDU Mobile iOS and Android apps.

## 📚 Documentation Structure

### Getting Started
1. **[EAS Setup Guide](./EAS_SETUP_GUIDE.md)** - First-time setup of EAS Build and credentials
2. **[Deployment Quick Reference](./DEPLOYMENT_QUICK_REFERENCE.md)** - Common commands and workflows
3. **[Deployment Guide](./DEPLOYMENT.md)** - Comprehensive deployment procedures

### Configuration Files
- **[eas.json](./eas.json)** - EAS Build profiles configuration
- **[app.json](./app.json)** - App configuration and metadata
- **[package.json](./package.json)** - Build and deployment scripts

### Scripts and Tools
Located in `scripts/`:
- **[version-bump.js](./scripts/version-bump.js)** - Semantic version management
- **[pre-build.sh](./scripts/pre-build.sh)** - Pre-build validation
- **[pre-submit.sh](./scripts/pre-submit.sh)** - Pre-submission checks
- **[setup-credentials.sh](./scripts/setup-credentials.sh)** - Interactive credential setup
- **[publish-update.sh](./scripts/publish-update.sh)** - OTA update publishing
- **[rollback-update.sh](./scripts/rollback-update.sh)** - OTA rollback procedure
- **[check-build-status.sh](./scripts/check-build-status.sh)** - Build monitoring
- **[deployment-checklist.md](./scripts/deployment-checklist.md)** - Pre/post deployment checklist

### Store Metadata
Located in `store/`:
- **[iOS Metadata](./store/ios/metadata.json)** - App Store Connect metadata
- **[Android Metadata](./store/android/metadata.json)** - Google Play Console metadata
- **[Store Assets Guide](./store/README.md)** - Screenshot and asset requirements
- **[Privacy Policy Template](./store/assets/privacy-policy-template.md)** - Privacy policy template

### CI/CD
- **[GitHub Actions Workflow](../.github/workflows/eas-build.yml)** - Automated builds and deployments

## 🚀 Quick Start

### First-Time Setup (30-60 minutes)
```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Run setup wizard
cd mobile
./scripts/setup-credentials.sh

# 3. Follow the EAS Setup Guide
# See: EAS_SETUP_GUIDE.md
```

### Daily Development
```bash
# Build preview for testing
npm run build:preview:ios
npm run build:preview:android

# Publish OTA update
npm run update:publish:dev "Feature update"
```

### Production Release
```bash
# 1. Bump version
npm run version:bump:minor

# 2. Build production
npm run build:prod

# 3. Submit to stores
npm run submit:prod:ios
npm run submit:prod:android
```

## 📖 Documentation by Role

### For Developers
Start here:
1. [EAS Setup Guide](./EAS_SETUP_GUIDE.md) - Initial configuration
2. [Deployment Quick Reference](./DEPLOYMENT_QUICK_REFERENCE.md) - Common commands
3. Configure your development environment
4. Run preview builds for testing

Key commands:
```bash
npm run build:dev          # Development builds
npm run build:preview      # TestFlight/Internal testing
npm run update:publish:dev # OTA updates
```

### For Release Managers
Start here:
1. [Deployment Guide](./DEPLOYMENT.md) - Full deployment procedures
2. [Deployment Checklist](./scripts/deployment-checklist.md) - Pre/post checks
3. Understand staged rollout strategy
4. Set up monitoring and alerts

Key commands:
```bash
npm run version:bump:minor  # Version management
npm run build:prod         # Production builds
npm run submit:prod:ios    # App Store submission
npm run submit:prod:android # Play Store submission
```

### For DevOps/CI Engineers
Start here:
1. [GitHub Actions Workflow](../.github/workflows/eas-build.yml) - CI/CD configuration
2. Configure secrets and environment variables
3. Set up build triggers
4. Configure monitoring and notifications

Key files:
- `.github/workflows/eas-build.yml` - Workflow configuration
- `eas.json` - Build profiles
- `.env.example` - Environment variables template

### For QA/Testers
Start here:
1. Access TestFlight (iOS) or Internal Testing (Android)
2. Install preview builds
3. Follow test plans
4. Report issues

Getting preview builds:
- **iOS**: TestFlight invitation link
- **Android**: Google Play Internal Testing link

## 🎯 Common Scenarios

### Scenario 1: New Feature Release
**Goal**: Deploy new features to production

1. Read: [Deployment Guide](./DEPLOYMENT.md) → Version Management
2. Follow: [Deployment Checklist](./scripts/deployment-checklist.md)
3. Execute:
   ```bash
   npm run version:bump:minor
   npm run build:prod
   npm run submit:prod:ios
   npm run submit:prod:android
   ```
4. Monitor: Staged rollout metrics

### Scenario 2: Critical Bug Fix
**Goal**: Quick hotfix deployment

1. Read: [Deployment Guide](./DEPLOYMENT.md) → Hotfix Process
2. For JS-only bugs: Use OTA updates
   ```bash
   npm run update:publish:prod "Critical bug fix"
   ```
3. For native bugs: Build and submit hotfix
   ```bash
   npm run version:bump:patch
   npm run build:prod
   npm run submit:prod:ios
   npm run submit:prod:android
   ```

### Scenario 3: Rollback Required
**Goal**: Revert problematic release

1. Read: [Deployment Guide](./DEPLOYMENT.md) → Rollback Procedure
2. For OTA updates:
   ```bash
   ./scripts/rollback-update.sh production
   ```
3. For native builds: Remove from store + submit fixed version

### Scenario 4: First-Time Store Submission
**Goal**: Submit app to App Store and Google Play

1. Read: [EAS Setup Guide](./EAS_SETUP_GUIDE.md) - Complete setup
2. Read: [Deployment Guide](./DEPLOYMENT.md) → App Store Submission
3. Prepare store assets in `store/` directory
4. Complete metadata in `store/ios/metadata.json` and `store/android/metadata.json`
5. Submit:
   ```bash
   npm run build:prod
   npm run submit:prod:ios
   npm run submit:prod:android
   ```

### Scenario 5: Internal Testing
**Goal**: Distribute to internal testers

1. Build preview:
   ```bash
   npm run build:preview
   ```
2. Submit to testing tracks:
   ```bash
   npm run submit:preview:ios    # TestFlight
   npm run submit:preview:android # Internal Testing
   ```
3. Invite testers through respective consoles
4. Share testing links

## 📋 Checklists

### Before Your First Deployment
- [ ] Read [EAS Setup Guide](./EAS_SETUP_GUIDE.md)
- [ ] Complete Apple Developer enrollment
- [ ] Complete Google Play Developer registration
- [ ] Run `./scripts/setup-credentials.sh`
- [ ] Configure all environment variables
- [ ] Test builds on both platforms
- [ ] Prepare store metadata and screenshots
- [ ] Write privacy policy
- [ ] Set up monitoring (Sentry, Analytics)

### Before Each Production Release
- [ ] Review [Deployment Checklist](./scripts/deployment-checklist.md)
- [ ] Update version number
- [ ] Update CHANGELOG.md
- [ ] Run all tests
- [ ] Test on physical devices
- [ ] Prepare release notes
- [ ] Backup keystores and certificates
- [ ] Notify stakeholders

### After Each Production Release
- [ ] Monitor crash reports (first 24 hours)
- [ ] Check user reviews
- [ ] Monitor staged rollout metrics
- [ ] Respond to support tickets
- [ ] Document any issues
- [ ] Plan next release

## 🔧 Troubleshooting Guide

### Build Issues
- Check: [Deployment Guide](./DEPLOYMENT.md) → Troubleshooting → Build Issues
- Run: `npm run build:view <build-id>`
- Verify: Credentials are valid and not expired

### Submission Issues
- Check: [Deployment Guide](./DEPLOYMENT.md) → Troubleshooting → Submission Issues
- Verify: Store metadata is complete
- Confirm: Compliance requirements met

### Update Issues
- Check: [Deployment Guide](./DEPLOYMENT.md) → Troubleshooting → OTA Updates
- Verify: Update configuration in app.json
- Test: Force check for updates in app

## 📊 Metrics and Monitoring

### Key Performance Indicators
- **Crash-free rate**: Target > 99.5%
- **App size**: Monitor growth over time
- **Build time**: Optimize for efficiency
- **Submission approval time**: Track store review times

### Monitoring Tools
- **Sentry**: Crash and error reporting
- **EAS Dashboard**: Build and update status
- **App Store Connect**: iOS metrics and reviews
- **Google Play Console**: Android metrics and reviews
- **Analytics**: User behavior and feature adoption

## 🔒 Security Considerations

### Credentials Management
- Never commit secrets to git
- Use environment variables
- Rotate keys regularly
- Enable 2FA on all accounts
- Backup keystores securely

### Build Security
- Review dependencies for vulnerabilities
- Keep SDK and tools updated
- Use code obfuscation for production
- Implement certificate pinning
- Regular security audits

## 📞 Support and Resources

### Internal Resources
- **Team Wiki**: [Add internal wiki link]
- **Slack Channels**: #mobile-dev, #releases
- **Issue Tracker**: GitHub Issues

### External Resources
- **EAS Documentation**: https://docs.expo.dev/eas/
- **Expo Forums**: https://forums.expo.dev/
- **Discord**: https://chat.expo.dev/
- **Apple Developer**: https://developer.apple.com/support/
- **Google Play Support**: https://support.google.com/googleplay/android-developer/

### Emergency Contacts
- **Technical Lead**: [Add contact]
- **DevOps Team**: [Add contact]
- **On-Call**: [Add rotation schedule]

## 🗓️ Release Schedule

### Suggested Cadence
- **Major Releases**: Quarterly (3-4 months)
- **Minor Releases**: Monthly
- **Patch Releases**: As needed (bug fixes)
- **OTA Updates**: Weekly (JS-only updates)

### Release Windows
- **iOS**: Tuesday-Thursday (avoid weekends)
- **Android**: Any day (gradual rollout)
- **Avoid**: Major holidays, weekends

## 📈 Version History

Maintain version history in:
- `CHANGELOG.md` - User-facing changes
- Git tags - `v1.0.0`, `v1.1.0`, etc.
- EAS Build history - Automatic tracking
- Store release notes - Platform-specific

## 🎓 Training Resources

### For New Team Members
1. Review this index
2. Read EAS Setup Guide
3. Watch EAS Build tutorial: https://docs.expo.dev/tutorial/eas/
4. Set up development environment
5. Build and test preview version
6. Shadow a production deployment

### Video Tutorials
- [Expo EAS Build Overview](https://www.youtube.com/expo)
- [App Store Submission Process](https://developer.apple.com/videos/)
- [Google Play Console Tutorial](https://www.youtube.com/googleplaydev)

## 🔄 Update This Documentation

This documentation should be updated when:
- Build process changes
- New tools or services added
- Store requirements change
- Team processes evolve
- Issues discovered and resolved

**Last Updated**: 2024-01-15
**Maintained By**: Mobile Team
**Review Frequency**: Quarterly

---

## Quick Navigation

| I want to... | Read this... |
|--------------|--------------|
| Set up EAS for the first time | [EAS Setup Guide](./EAS_SETUP_GUIDE.md) |
| Build and deploy to production | [Deployment Guide](./DEPLOYMENT.md) |
| Find a specific command | [Quick Reference](./DEPLOYMENT_QUICK_REFERENCE.md) |
| Prepare for release | [Deployment Checklist](./scripts/deployment-checklist.md) |
| Publish OTA update | [Deployment Guide](./DEPLOYMENT.md#ota-updates) |
| Rollback a release | [Rollback Script](./scripts/rollback-update.sh) |
| Troubleshoot build issue | [Deployment Guide](./DEPLOYMENT.md#troubleshooting) |
| Configure CI/CD | [GitHub Workflow](../.github/workflows/eas-build.yml) |
| Update store metadata | [Store Assets](./store/README.md) |

---

**Ready to deploy?** Start with the [EAS Setup Guide](./EAS_SETUP_GUIDE.md)! 🚀
