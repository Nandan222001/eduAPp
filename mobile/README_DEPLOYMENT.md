# EDU Mobile - Deployment & Distribution

Quick navigation for all deployment-related documentation and resources.

## 🚀 Quick Start

**Never deployed before?** Start here:

1. Read: [EAS Setup Guide](./EAS_SETUP_GUIDE.md)
2. Run: `npm install -g eas-cli && eas login`
3. Execute: `./scripts/setup-credentials.sh`
4. Test: `npm run build:preview:ios`

**Ready to deploy?** Use these:

```bash
npm run build:prod              # Build for production
npm run submit:prod:ios         # Submit to App Store
npm run submit:prod:android     # Submit to Google Play
```

## 📚 Documentation

### Essential Reading (In Order)
1. **[EAS Setup Guide](./EAS_SETUP_GUIDE.md)** - First-time setup (30-60 min)
2. **[Quick Reference](./DEPLOYMENT_QUICK_REFERENCE.md)** - Common commands (5 min)
3. **[Deployment Guide](./DEPLOYMENT.md)** - Complete procedures (30 min)
4. **[Documentation Index](./DEPLOYMENT_INDEX.md)** - Full navigation

### Quick Access
- **[Deployment Checklist](./scripts/deployment-checklist.md)** - Use before each release
- **[Implementation Summary](./EAS_IMPLEMENTATION_SUMMARY.md)** - What was implemented
- **[Setup Complete](./EAS_BUILD_SETUP_COMPLETE.md)** - Setup confirmation

## 🛠️ Tools & Scripts

All scripts located in `scripts/`:

```bash
./scripts/deploy.sh                    # Complete deployment workflow
./scripts/version-bump.js              # Bump version numbers
./scripts/setup-credentials.sh         # Setup credentials
./scripts/publish-update.sh            # Publish OTA updates
./scripts/rollback-update.sh           # Rollback updates
./scripts/check-build-status.sh        # Check build status
./scripts/pre-build.sh                 # Pre-build validation
./scripts/pre-submit.sh                # Pre-submission checks
```

## 📱 Common Commands

### Building
```bash
npm run build:dev               # Development
npm run build:preview           # Testing  
npm run build:staging           # Staging
npm run build:prod              # Production
```

### Submitting
```bash
npm run submit:preview:ios      # TestFlight
npm run submit:preview:android  # Internal Testing
npm run submit:prod:ios         # App Store
npm run submit:prod:android     # Google Play
```

### OTA Updates
```bash
npm run update:publish:prod "Bug fixes"
npm run update:publish:staging "New feature"
```

### Version Management
```bash
npm run version:bump:patch      # 1.0.0 → 1.0.1
npm run version:bump:minor      # 1.0.0 → 1.1.0
npm run version:bump:major      # 1.0.0 → 2.0.0
```

## 🏗️ Project Structure

```
mobile/
├── .github/workflows/
│   └── eas-build.yml           # CI/CD automation
├── scripts/
│   ├── deploy.sh               # Main deployment script
│   ├── version-bump.js         # Version management
│   ├── setup-credentials.sh    # Credential setup
│   ├── publish-update.sh       # OTA updates
│   ├── rollback-update.sh      # Rollback tool
│   ├── check-build-status.sh   # Build monitoring
│   ├── pre-build.sh            # Pre-build checks
│   ├── pre-submit.sh           # Pre-submit checks
│   └── deployment-checklist.md # Deployment checklist
├── store/
│   ├── ios/metadata.json       # iOS store metadata
│   ├── android/metadata.json   # Android store metadata
│   └── assets/                 # Store assets
├── eas.json                    # EAS Build config
├── app.json                    # App configuration
├── package.json                # Scripts
├── DEPLOYMENT.md               # Main deployment guide
├── EAS_SETUP_GUIDE.md          # Setup instructions
├── DEPLOYMENT_QUICK_REFERENCE.md
├── DEPLOYMENT_INDEX.md
└── README_DEPLOYMENT.md        # This file
```

## 🎯 Workflows by Scenario

### New Feature Release
```bash
# 1. Bump version
npm run version:bump:minor

# 2. Build
npm run build:prod

# 3. Submit
npm run submit:prod:ios
npm run submit:prod:android

# 4. Tag and push
git add . && git commit -m "chore: v1.1.0"
git tag v1.1.0 && git push --tags
```

### Hotfix
```bash
# 1. Patch version
npm run version:bump:patch

# 2. Build and submit
npm run build:prod
npm run submit:prod:ios
npm run submit:prod:android
```

### OTA Update (JS-only)
```bash
npm run update:publish:prod "Critical bug fix"
```

### Internal Testing
```bash
npm run build:preview
npm run submit:preview:ios
npm run submit:preview:android
```

### Rollback
```bash
./scripts/rollback-update.sh production
```

## 🔧 Configuration Files

### Required Environment Variables
Copy `.env.example` to `.env.production` and fill in:

```bash
# Apple
APPLE_ID=your-apple-id@example.com
APPLE_TEAM_ID=ABCDE12345
ASC_APP_ID=1234567890

# Google
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./service-account-key.json

# App
API_URL=https://api.edu.app
```

### Build Profiles (eas.json)
- `development` - Dev builds with dev client
- `preview` - TestFlight/Internal testing
- `staging` - Pre-production
- `production` - Store releases

## 📊 Monitoring

### Check Build Status
```bash
npm run build:list              # Recent builds
npm run build:view <id>         # Build details
./scripts/check-build-status.sh # Formatted status
```

### Check Channels
```bash
npm run channel:list            # All channels
npm run channel:view production # Specific channel
```

### Credentials
```bash
npm run credentials:ios         # iOS credentials
npm run credentials:android     # Android credentials
```

## 🚨 Emergency Procedures

### Critical Bug in Production

**For JS-only bugs:**
```bash
# 1. Fix the bug
# 2. Test locally
# 3. Publish OTA update
npm run update:publish:prod "Critical: Fixed login bug"
```

**For native bugs:**
```bash
# 1. Fix the bug
# 2. Test thoroughly
# 3. Bump patch version
npm run version:bump:patch
# 4. Build and submit
npm run build:prod
npm run submit:prod:ios
npm run submit:prod:android
```

### Rollback OTA Update
```bash
./scripts/rollback-update.sh production
```

### Remove from Store
Contact platform support immediately:
- **Apple**: App Store Connect → Remove from Sale
- **Google**: Play Console → Halt rollout

## ✅ Pre-Launch Checklist

Before first production release:

- [ ] Apple Developer account active
- [ ] Google Play Developer account active
- [ ] EAS credentials configured
- [ ] iOS certificates valid
- [ ] Android keystore backed up
- [ ] Service account key configured
- [ ] Environment variables set
- [ ] Store metadata prepared
- [ ] Screenshots ready
- [ ] Privacy policy published
- [ ] TestFlight tested
- [ ] Internal testing completed

## 📖 Learn More

### Platform Documentation
- **EAS**: https://docs.expo.dev/eas/
- **Apple**: https://developer.apple.com/
- **Google**: https://play.google.com/console/

### Internal Documentation
- [Complete Deployment Guide](./DEPLOYMENT.md)
- [Setup Guide](./EAS_SETUP_GUIDE.md)
- [Quick Reference](./DEPLOYMENT_QUICK_REFERENCE.md)
- [Documentation Index](./DEPLOYMENT_INDEX.md)

### Video Resources
- [EAS Build Overview](https://www.youtube.com/expo)
- [App Store Submission](https://developer.apple.com/videos/)
- [Google Play Publishing](https://www.youtube.com/googleplaydev)

## 💬 Support

### Getting Help
1. Check [Deployment Guide](./DEPLOYMENT.md) troubleshooting
2. Review [EAS Documentation](https://docs.expo.dev/eas/)
3. Search [Expo Forums](https://forums.expo.dev/)
4. Ask in team Slack: #mobile-dev
5. Create GitHub issue

### Common Issues
- **Build fails**: Check credentials and logs
- **Submission rejected**: Review store guidelines
- **Update not downloading**: Verify app.json config
- **Certificate expired**: Regenerate in EAS

## 🎓 Training

### For Developers
1. Read EAS Setup Guide
2. Build preview version
3. Test OTA updates
4. Shadow a release

### For Release Managers
1. Read complete deployment guide
2. Review deployment checklist
3. Practice staging releases
4. Lead a production release

### For DevOps
1. Review CI/CD workflow
2. Configure GitHub secrets
3. Set up monitoring
4. Implement alerting

## 🔐 Security

**Critical Reminders:**
- ✅ Never commit credentials to git
- ✅ Use environment variables for secrets
- ✅ Enable 2FA on all accounts
- ✅ Backup keystore in multiple locations
- ✅ Rotate keys regularly
- ✅ Review access permissions quarterly

## 📈 Metrics

Track these metrics:
- **Build success rate**: Target >95%
- **Crash-free rate**: Target >99.5%
- **Deployment frequency**: Weekly OTA, Monthly stores
- **Time to production**: <2 hours
- **Rollback rate**: <5%

## 🎉 Ready to Deploy?

You have everything you need:
- ✅ Complete configuration
- ✅ Automated scripts
- ✅ Comprehensive documentation
- ✅ CI/CD integration
- ✅ Monitoring tools
- ✅ Rollback procedures

**Start deploying:** `npm run build:prod`

---

**Questions?** Check [DEPLOYMENT_INDEX.md](./DEPLOYMENT_INDEX.md) for detailed navigation.

**First time?** Start with [EAS_SETUP_GUIDE.md](./EAS_SETUP_GUIDE.md).

**Need help?** See troubleshooting in [DEPLOYMENT.md](./DEPLOYMENT.md).

---

*Last Updated: 2024-01-15 | Version: 1.0.0*
