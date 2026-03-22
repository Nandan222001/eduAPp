# Web Compatibility Changes

This document outlines all the changes made to ensure the Expo Router app works seamlessly on web, iOS, and Android platforms without errors.

## Overview

The main issue was that many Expo native modules (like `expo-secure-store`, `expo-camera`, `expo-local-authentication`, etc.) are not available on web and importing them directly would cause errors. The solution was to use lazy loading with platform checks.

## Changes Made

### 1. Secure Storage (`mobile/src/utils/secureStorage.ts`)

**Change:** Lazy load `expo-secure-store` only on native platforms
- On web: Uses `AsyncStorage` (which works on web via `localStorage`)
- On native: Uses `SecureStore` for encrypted storage

**Pattern:**
```typescript
let SecureStore: any = null;
if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
}
```

### 2. Biometrics (`mobile/src/utils/biometrics.ts` & `mobile/src/utils/biometric.ts`)

**Change:** Lazy load `expo-local-authentication` only on native platforms
- On web: Returns false/not available for all biometric operations
- On native: Uses LocalAuthentication for Face ID/Touch ID

### 3. Camera (`mobile/src/utils/camera.ts`)

**Change:** Lazy load `expo-camera` and `expo-image-manipulator` only on native platforms
- On web: Returns errors or shows alerts that camera is not available
- On native: Full camera functionality

### 4. QR Scanner (`mobile/src/utils/qrScanner.ts`)

**Change:** Lazy load `expo-barcode-scanner` only on native platforms
- On web: Returns not available
- On native: Full QR scanning functionality

### 5. Document Scanner (`mobile/src/utils/documentScanner.ts`)

**Change:** Lazy load camera and image manipulation modules only on native platforms
- On web: Returns not available
- On native: Full document scanning functionality

### 6. Notifications (`mobile/src/utils/notificationService.ts`)

**Change:** Lazy load `expo-notifications` and `expo-device` only on native platforms
- On web: Logs that notifications are not available
- On native: Full push notification support

### 7. File Manager (`mobile/src/utils/fileManager.ts`)

**Change:** Lazy load `expo-file-system` only on native platforms
- On web: Opens URLs in new tab for downloads
- On native: Full file system operations

### 8. Sharing (`mobile/src/utils/sharing.ts`)

**Change:** Lazy load `expo-sharing` and `expo-print` only on native platforms
- On web: Uses Web Share API if available, falls back to clipboard
- On native: Full sharing functionality

### 9. Image Picker Component (`mobile/src/components/shared/ImagePicker.tsx`)

**Change:** Lazy load `expo-image-picker` only on native platforms
- On web: Uses HTML file input for image selection
- On native: Full camera and gallery access

### 10. File Picker Component (`mobile/src/components/shared/FilePicker.tsx`)

**Change:** Lazy load `expo-document-picker` only on native platforms
- On web: Uses HTML file input for document selection
- On native: Full document picker functionality

### 11. Root Layout (`mobile/app/_layout.tsx`)

**Change:** Lazy load `expo-splash-screen` only on native platforms
- On web: Skips splash screen logic
- On native: Normal splash screen behavior

## Pattern Used Throughout

The consistent pattern for all changes:

```typescript
import { Platform } from 'react-native';

// Lazy load module only on native platforms
let NativeModule: any = null;
if (Platform.OS !== 'web') {
  NativeModule = require('native-module-name');
}

export const someService = {
  someMethod: async () => {
    if (Platform.OS === 'web') {
      // Web-specific implementation or graceful degradation
      return null;
    }
    
    // Native implementation using NativeModule
    return await NativeModule.doSomething();
  }
};
```

## Benefits

1. **No Import Errors:** Native modules are never imported on web, preventing runtime errors
2. **Graceful Degradation:** Features that don't work on web show helpful messages or use web alternatives
3. **Single Codebase:** Same code works across all platforms with platform-specific behavior
4. **Type Safety:** Maintained TypeScript support while allowing platform-specific code
5. **Performance:** Only loads modules needed for each platform

## Testing Checklist

- [ ] Web: `npx expo start --web` - Verify login route loads without errors
- [ ] iOS: `npx expo start --ios` - Verify full native functionality
- [ ] Android: `npx expo start --android` - Verify full native functionality
- [ ] Secure storage works on all platforms (no expo-secure-store errors on web)
- [ ] Navigation works correctly on all platforms
- [ ] Login/logout flow works on all platforms
- [ ] No console errors related to missing native modules on web

## Files Modified

1. `mobile/src/utils/secureStorage.ts`
2. `mobile/src/utils/biometrics.ts`
3. `mobile/src/utils/biometric.ts`
4. `mobile/src/utils/camera.ts`
5. `mobile/src/utils/qrScanner.ts`
6. `mobile/src/utils/documentScanner.ts`
7. `mobile/src/utils/notificationService.ts`
8. `mobile/src/utils/fileManager.ts`
9. `mobile/src/utils/sharing.ts`
10. `mobile/src/components/shared/ImagePicker.tsx`
11. `mobile/src/components/shared/FilePicker.tsx`
12. `mobile/app/_layout.tsx`

## Notes

- All changes maintain backward compatibility with existing native functionality
- Web platform gracefully degrades features that aren't available (camera, biometrics, etc.)
- Some features have web alternatives (file picker, image picker use HTML inputs)
- No changes to package.json or dependencies needed
- The approach is scalable for adding more platform-specific features in the future
