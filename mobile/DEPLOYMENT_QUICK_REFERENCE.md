# Deployment Quick Reference

Fast reference for common EAS Build and deployment commands.

## 🚀 Quick Commands

### Build
```bash
# Development
npm run build:dev                  # Both platforms
npm run build:dev:ios             # iOS only
npm run build:dev:android         # Android only

# Preview (TestFlight/Internal Testing)
npm run build:preview             # Both platforms
npm run build:preview:ios         # iOS only
npm run build:preview:android     # Android only

# Staging
npm run build:staging             # Both platforms
npm run build:staging:ios         # iOS only
npm run build:staging:android     # Android only

# Production
npm run build:prod                # Both platforms
npm run build:prod:ios            # iOS only
npm run build:prod:android        # Android only
```

### Submit
```bash
# Preview
npm run submit:preview:ios        # TestFlight
npm run submit:preview:android    # Internal Testing

# Staging
npm run submit:staging:ios
npm run submit:staging:android

# Production
npm run submit:prod:ios           # App Store (10% rollout)
npm run submit:prod:android       # Play Store (10% rollout)
npm run submit:prod:android:rollout  # Full rollout
```

### OTA Updates
```bash
# Publish updates
npm run update:publish:dev "Message"
npm run update:publish:preview "Message"
npm run update:publish:staging "Message"
npm run update:publish:prod "Message"

# View channels
npm run channel:list
npm run channel:view production
```

### Version Management
```bash
# Bump version
npm run version:bump:patch        # 1.0.0 → 1.0.1
npm run version:bump:minor        # 1.0.0 → 1.1.0
npm run version:bump:major        # 1.0.0 → 2.0.0
```

### Monitoring
```bash
# View builds
npm run build:list
npm run build:view <build-id>
npm run build:cancel <build-id>

# Credentials
npm run credentials:ios
npm run credentials:android
```

## 📋 Common Workflows

### New Feature Release
```bash
# 1. Update version
npm run version:bump:minor

# 2. Commit changes
git add .
git commit -m "chore: bump version to 1.1.0"
git tag v1.1.0

# 3. Build
npm run build:prod

# 4. Submit
npm run submit:prod:ios
npm run submit:prod:android

# 5. Push to git
git push origin main --tags
```

### Hotfix Release
```bash
# 1. Patch version
npm run version:bump:patch

# 2. Build and submit
npm run build:prod
npm run submit:prod:ios
npm run submit:prod:android

# 3. Tag and push
git add .
git commit -m "fix: critical bug fix"
git tag v1.0.1
git push origin main --tags
```

### OTA Update (JS-only changes)
```bash
# 1. Make changes
# 2. Test locally
# 3. Publish update
npm run update:publish:prod "Bug fixes and performance improvements"

# 4. Monitor
eas channel:view production
```

### Preview Build for Testing
```bash
# Build preview
npm run build:preview

# Submit to TestFlight/Internal Testing
npm run submit:preview:ios
npm run submit:preview:android
```

### Rollback OTA Update
```bash
# Use rollback script
./scripts/rollback-update.sh production

# Or manually
eas channel:edit production --branch <previous-branch-id>
```

## 🔧 Troubleshooting

### Build Failed
```bash
# View build details
eas build:view <build-id>

# Check credentials
eas credentials -p ios
eas credentials -p android

# Clear cache and retry
eas build --profile production --platform ios --clear-cache
```

### Submission Failed
```bash
# Check submission status
eas submission:list

# Retry submission
eas submit --profile production --platform ios --latest
```

### Update Not Appearing
```bash
# Verify channel
eas channel:view production

# Check update configuration
grep -A 5 '"updates"' app.json

# Force check in app
# Settings → Check for updates
```

## 📱 Platform-Specific

### iOS
```bash
# Manage certificates
eas credentials -p ios

# View App Store Connect
open https://appstoreconnect.apple.com

# TestFlight builds
eas build:list --platform ios --status finished
```

### Android
```bash
# Manage keystore
eas credentials -p android

# View Google Play Console
open https://play.google.com/console

# Check release
eas submission:list --platform android
```

## 🎯 Release Strategy

### Gradual Rollout (Recommended)

**Day 1**: 10% rollout
```bash
# Already configured in eas.json
npm run submit:prod:android
```

**Day 2-3**: Increase to 25%
```bash
# Update eas.json rolloutFraction to 0.25
npm run submit:prod:android
```

**Day 4-5**: Increase to 50%
```bash
# Update eas.json rolloutFraction to 0.5
npm run submit:prod:android
```

**Day 7**: Full rollout
```bash
npm run submit:prod:android:rollout
```

### Monitoring Metrics

Check these before increasing rollout:
- Crash-free rate: > 99.5%
- ANR rate: < 0.5%
- User rating: > 4.0
- No critical bugs reported

## 🔐 Security Checklist

Before each production release:
- [ ] No hardcoded secrets
- [ ] API keys in environment variables
- [ ] Certificates not expired
- [ ] Keystore backed up
- [ ] 2FA enabled on all accounts
- [ ] Service account permissions correct

## 📊 Key Metrics to Monitor

### First 24 Hours
- Crash-free rate
- Install success rate
- Launch time
- App size
- User ratings

### First Week
- Daily active users
- Retention rate
- Feature adoption
- Performance metrics
- Error rates

## 🆘 Emergency Contacts

### Critical Issues
1. Check Sentry for crashes
2. Review user reports
3. Assess severity
4. Decide: Rollback or hotfix

### Rollback Decision Tree
- **JS-only bug**: OTA rollback (< 5 min)
- **Native bug**: Remove from store + hotfix
- **Data issue**: Backend fix + OTA update
- **Critical security**: Immediate removal

## 📚 Resources

- [EAS Documentation](https://docs.expo.dev/eas/)
- [Full Deployment Guide](./DEPLOYMENT.md)
- [Setup Guide](./EAS_SETUP_GUIDE.md)
- [Deployment Checklist](./scripts/deployment-checklist.md)

## 💡 Tips

- Always test on physical devices before production
- Use preview builds for internal testing
- Monitor crash reports during rollout
- Keep CHANGELOG.md updated
- Tag all production releases in git
- Backup keystores and certificates
- Document deployment issues
- Communicate releases to team

---

**Need Help?**
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions
- Run `eas --help` for CLI help
- Visit https://docs.expo.dev/eas/
