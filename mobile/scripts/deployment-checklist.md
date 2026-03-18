# Deployment Checklist

Use this checklist before each deployment to ensure nothing is missed.

## Pre-Deployment

### Code Quality
- [ ] All tests passing locally
- [ ] TypeScript errors resolved
- [ ] Linter warnings addressed
- [ ] No console.log or debug code
- [ ] Code reviewed by team member
- [ ] Git working directory clean

### Version Management
- [ ] Version bumped appropriately (major/minor/patch)
- [ ] CHANGELOG.md updated with changes
- [ ] Git tag created (v1.x.x)
- [ ] Release notes prepared

### Configuration
- [ ] Environment variables verified
- [ ] API endpoints correct for environment
- [ ] Feature flags set appropriately
- [ ] Third-party keys configured

### Testing
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing on both platforms
- [ ] Tested on physical iOS device
- [ ] Tested on physical Android device
- [ ] Tested offline functionality
- [ ] Tested push notifications

### iOS Specific
- [ ] Certificates valid and not expired
- [ ] Provisioning profiles up to date
- [ ] Bundle identifier correct
- [ ] Build number incremented
- [ ] Associated domains configured
- [ ] Permissions properly described
- [ ] ITSAppUsesNonExemptEncryption set

### Android Specific
- [ ] Keystore accessible and backed up
- [ ] Package name correct
- [ ] Version code incremented
- [ ] Permissions properly declared
- [ ] ProGuard rules tested (if applicable)
- [ ] Service account key valid

## Build Phase

### For All Builds
- [ ] Pre-build script executed successfully
- [ ] Dependencies up to date
- [ ] Build profile selected correctly
- [ ] Build initiated without errors

### Preview/Staging Builds
- [ ] Build completed successfully
- [ ] Artifact downloaded for verification
- [ ] Installed on test devices
- [ ] Basic smoke testing completed

### Production Builds
- [ ] Build completed successfully
- [ ] Build artifacts verified
- [ ] Size optimization checked
- [ ] Performance tested

## Submission Phase

### iOS Submission
- [ ] Pre-submission checklist completed
- [ ] Screenshots uploaded (all required sizes)
- [ ] App Store metadata complete
- [ ] Keywords optimized
- [ ] Privacy policy URL accessible
- [ ] Support URL functional
- [ ] Demo account credentials provided
- [ ] App Review Information complete
- [ ] Export compliance answered
- [ ] TestFlight beta review (if applicable)

### Android Submission
- [ ] Pre-submission checklist completed
- [ ] Screenshots uploaded (phone + tablet)
- [ ] Feature graphic uploaded
- [ ] Google Play metadata complete
- [ ] Privacy policy URL accessible
- [ ] Content rating completed
- [ ] Target audience set
- [ ] Data safety form completed
- [ ] Release notes prepared
- [ ] Rollout percentage configured

## Post-Submission

### Monitoring (First 24 Hours)
- [ ] Submission accepted by app stores
- [ ] No immediate crashes reported
- [ ] Crash-free rate > 99.5%
- [ ] User reviews monitored
- [ ] Support tickets triaged
- [ ] Analytics showing normal patterns

### Staged Rollout (Android)
- [ ] 10% rollout completed (Day 1)
- [ ] Metrics reviewed and acceptable
- [ ] 25% rollout completed (Day 2-3)
- [ ] 50% rollout completed (Day 4-5)
- [ ] 100% rollout completed (Day 7)

### Phased Release (iOS)
- [ ] Phased release enabled
- [ ] Release progression monitored
- [ ] No halt required

### Communication
- [ ] Team notified of deployment
- [ ] Release notes published
- [ ] Support team briefed on changes
- [ ] Users notified (if major update)

## Post-Deployment

### Documentation
- [ ] Deployment logged in tracking system
- [ ] Any issues documented
- [ ] Lessons learned recorded
- [ ] CHANGELOG.md published

### Verification
- [ ] App Store listing correct
- [ ] Google Play listing correct
- [ ] Deep links working
- [ ] Push notifications working
- [ ] Analytics tracking properly
- [ ] OTA updates functioning

### Cleanup
- [ ] Old test builds removed
- [ ] Temporary test channels cleaned
- [ ] Development branches merged/deleted
- [ ] CI/CD logs reviewed

## Rollback Plan (If Needed)

If critical issues are discovered:

- [ ] Issue severity assessed
- [ ] Rollback decision made
- [ ] OTA rollback executed (if JS-only)
- [ ] OR app store removal/halt (if native)
- [ ] Fix prepared and tested
- [ ] New build submitted
- [ ] Post-mortem scheduled

## Notes

Date: _______________
Deployed by: _______________
Version: _______________
Build numbers: iOS:_____ Android:_____

Issues encountered:


Resolution:


---

**Save this checklist for each deployment and review retrospectively.**
