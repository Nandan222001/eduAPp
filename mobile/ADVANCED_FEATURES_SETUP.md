# Advanced Mobile Features - Setup Guide

## Prerequisites

Before setting up the advanced mobile features, ensure you have:
- Node.js 16+ installed
- Expo CLI installed (`npm install -g expo-cli`)
- iOS Simulator (for iOS development) or Android Emulator (for Android development)
- Physical device for testing biometric features (simulators have limited support)

## Installation Steps

### 1. Install Required Dependencies

```bash
cd mobile

# Install all dependencies using the package manager
npm install

# OR using yarn
yarn install
```

### 2. Install Expo Modules (if needed)

If you need to manually install specific modules:

```bash
# Biometric Authentication
npx expo install expo-local-authentication

# QR Code Scanner
npx expo install expo-barcode-scanner

# File System Operations
npx expo install expo-file-system

# Image Manipulation
npx expo install expo-image-manipulator

# Media Library (Save Images)
npx expo install expo-media-library

# Sharing
npx expo install expo-sharing

# Already included (verify in package.json):
# - expo-camera
# - expo-document-picker
# - expo-image-picker
# - expo-print
# - react-native-reanimated
# - react-native-gesture-handler
```

### 3. Configure Native Projects

#### For Development Builds (Recommended)

```bash
# Create development build for iOS
npx expo run:ios

# Create development build for Android
npx expo run:android
```

#### For EAS Build

Update `eas.json` (already configured):

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```

Build with EAS:

```bash
# iOS
eas build --profile development --platform ios

# Android
eas build --profile development --platform android
```

### 4. Platform-Specific Setup

#### iOS Setup

1. **Info.plist Permissions** (handled by Expo plugins in app.json):
   - Camera Usage Description
   - Photo Library Usage Description
   - Face ID Usage Description

2. **Capabilities**:
   - Face ID capability is automatically enabled

3. **Testing Biometrics**:
   - Use physical device (Face ID/Touch ID)
   - Simulator: Features → Face ID → Enrolled

#### Android Setup

1. **Permissions** (handled by Expo plugins in app.json):
   - Camera
   - Read/Write External Storage
   - Biometric Authentication

2. **Testing Biometrics**:
   - Use physical device
   - Emulator: Settings → Security → Fingerprint → Add fingerprint

### 5. Verify Installation

Create a test file to verify all imports work:

```typescript
// test-imports.ts
import { biometricsService } from '@utils/biometrics';
import { cameraService } from '@utils/camera';
import { documentScanner } from '@utils/documentScanner';
import { fileDownloadManager } from '@utils/fileDownloadManager';
import { imageViewerService } from '@utils/imageViewer';
import { qrScannerService } from '@utils/qrScanner';
import { sharingService } from '@utils/sharing';

import { ImageViewer } from '@components/shared/ImageViewer';
import { QRScanner } from '@components/shared/QRScanner';
import { DocumentScanner } from '@components/shared/DocumentScanner';
import { FileDownloadList } from '@components/shared/FileDownloadList';

console.log('All imports successful!');
```

### 6. Run the Application

```bash
# Start the development server
npx expo start

# Or with specific platform
npx expo start --ios
npx expo start --android

# For development client
npx expo start --dev-client
```

### 7. Test Features

#### Test Biometric Authentication
1. Navigate to Profile screen
2. Scroll to Security section
3. Enable biometric authentication
4. Verify authentication prompt appears

#### Test Camera & Document Scanner
1. Navigate to an assignment
2. Tap "Camera" button to take photo
3. Tap "Scan" button to scan document
4. Verify multi-page scanning works

#### Test Image Viewer
1. Add image attachments to assignment
2. Tap on image icon
3. Test pinch-to-zoom
4. Test save and share options

#### Test QR Scanner
1. Navigate to QR Scanner screen
2. Grant camera permission
3. Scan a QR code
4. Verify correct parsing and action

#### Test File Downloads
1. Download a study material
2. Verify progress tracking
3. Test pause/resume
4. Access file offline

#### Test Sharing
1. Navigate to Grades screen
2. Tap share icon (text format)
3. Tap download icon (PDF format)
4. Verify share sheet appears

## Troubleshooting

### Common Issues

#### 1. Camera Permission Denied
```typescript
// Reset permissions in device settings
// iOS: Settings → Privacy → Camera → EDU Mobile
// Android: Settings → Apps → EDU Mobile → Permissions
```

#### 2. Biometrics Not Available
```typescript
// Check device enrollment
// iOS: Settings → Face ID & Passcode
// Android: Settings → Security → Fingerprint
```

#### 3. Build Errors
```bash
# Clear cache and rebuild
npx expo start -c

# For native builds
cd ios && pod install && cd ..
cd android && ./gradlew clean && cd ..
```

#### 4. TypeScript Errors
```bash
# Regenerate TypeScript declarations
npx expo customize tsconfig.json
```

#### 5. Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules
npm install

# Clear metro bundler cache
npx expo start -c
```

### Debug Mode

Enable debug logging:

```typescript
// In App.tsx
if (__DEV__) {
  // Enable feature debugging
  console.log('[Features] Debug mode enabled');
  
  // Test feature availability
  import('@utils').then(async (utils) => {
    const biometric = await utils.biometricsService.checkAvailability();
    console.log('[Biometric]', biometric);
  });
}
```

## Environment Variables

No additional environment variables needed for these features. All configuration is in `app.json`.

## Production Checklist

Before releasing to production:

- [ ] Test all features on physical devices (iOS and Android)
- [ ] Verify all permissions are properly requested
- [ ] Test biometric enrollment flow
- [ ] Test camera on different lighting conditions
- [ ] Verify file downloads work on cellular and WiFi
- [ ] Test QR scanning with various code types
- [ ] Verify sharing works with different apps
- [ ] Test offline file access
- [ ] Check image quality and compression
- [ ] Verify all error messages are user-friendly
- [ ] Test with different device orientations
- [ ] Verify memory leaks are handled
- [ ] Test accessibility features
- [ ] Verify analytics tracking (if implemented)

## Performance Optimization

### Image Optimization
```typescript
// Default settings are optimized, but can adjust:
const photo = await cameraService.capturePhoto(cameraRef, {
  quality: 0.8, // Lower for smaller files
  autoEdgeDetection: true,
});
```

### Download Management
```typescript
// Configure download concurrency in fileDownloadManager
// Already optimized for background downloads
```

### Memory Management
```typescript
// Clean up camera resources
useEffect(() => {
  return () => {
    // Cleanup handled automatically
  };
}, []);
```

## Security Checklist

- [ ] Biometric credentials never stored in plain text
- [ ] Downloaded files stored in app sandbox
- [ ] HTTPS used for all network requests
- [ ] Sensitive data encrypted with expo-secure-store
- [ ] Camera/photo permissions requested at appropriate times
- [ ] User can revoke permissions
- [ ] No sensitive data in error messages
- [ ] Proper input validation for QR codes
- [ ] File type validation before download

## Documentation

- **Main Documentation**: `ADVANCED_MOBILE_FEATURES.md`
- **Implementation Summary**: `ADVANCED_FEATURES_IMPLEMENTATION_SUMMARY.md`
- **API Reference**: Inline code documentation
- **Type Definitions**: TypeScript interfaces in each utility file

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review error messages in the console
3. Check Expo documentation for specific APIs
4. Verify permissions are granted
5. Test on a physical device (not simulator)

## Next Steps

After setup:

1. Review the usage examples in `ADVANCED_MOBILE_FEATURES.md`
2. Customize features for your specific needs
3. Add analytics tracking (optional)
4. Implement additional error handling (optional)
5. Add custom themes/styling
6. Set up automated testing

## Updates and Maintenance

To update dependencies:

```bash
# Check for Expo SDK updates
npx expo-doctor

# Update all Expo packages
npx expo install --fix

# Update specific package
npx expo install expo-camera@latest
```

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/)
- [Expo Local Authentication](https://docs.expo.dev/versions/latest/sdk/local-authentication/)
- [Expo Barcode Scanner](https://docs.expo.dev/versions/latest/sdk/bar-code-scanner/)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)

## License

This implementation follows the same license as the main EDU Mobile application.

---

**Setup Complete!** 🎉

You're now ready to use all advanced mobile features in the EDU Mobile application.
