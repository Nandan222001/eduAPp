# Web Platform Implementation

This document describes the implementation of web platform support for the EduTrack mobile app.

## Overview

The EduTrack app now supports web platform using Expo's Metro bundler for web. All native-only features have been stubbed or replaced with web-compatible alternatives.

## Files Created/Modified

### 1. Platform-Specific Initialization

#### `src/utils/iosInit.web.ts`
- Web stub for iOS-specific initialization
- All iOS features are no-ops on web platform
- Ensures app doesn't crash when iOS init is called on web

#### `src/utils/androidInit.web.ts`
- Web stub for Android-specific initialization
- All Android features are no-ops on web platform
- Ensures app doesn't crash when Android init is called on web

#### `src/utils/offlineInit.web.ts`
- Web-compatible offline support initialization
- Uses browser's `navigator.onLine` instead of NetInfo
- Listens to window `online`/`offline` events
- Manages offline queue with browser APIs

### 2. Network Status Management

#### `src/utils/networkStatus.web.ts`
- Web implementation for network status monitoring
- Uses `navigator.onLine` API
- Listens to browser `online`/`offline` events
- Provides same API as native version

#### `src/utils/offlineQueue.web.ts`
- Web-compatible offline queue manager
- Uses browser's online/offline detection
- Stores queued requests in AsyncStorage (uses localStorage on web)
- Automatically processes queue when browser comes online

#### `src/hooks/useNetworkStatus.web.ts`
- React hook for network status on web
- Uses browser's Navigator API
- Dispatches Redux actions for online/offline state
- Compatible with existing Redux store structure

### 3. Metro Configuration

#### `metro.config.js`
Enhanced with MIME type middleware:
- Sets proper `Content-Type` headers for JavaScript bundles (`.bundle`, `.js`, `.mjs`, `.cjs`)
- Sets correct MIME types for JSON, CSS, HTML, source maps
- Handles image types (PNG, JPG, GIF, WebP, SVG)
- Handles font types (WOFF, WOFF2, TTF, OTF, EOT)

### 4. Webpack Configuration

#### `webpack.config.js`
Enhanced dev server configuration:
- Added `onBeforeSetupMiddleware` to set proper MIME types
- Ensures all JavaScript files are served with `application/javascript; charset=utf-8`
- Prevents MIME type warnings in browser console
- Handles all asset types properly

### 5. HTML Template

#### `index.html`
Custom HTML template for web builds:
- Responsive viewport settings
- Initial loading spinner
- Proper meta tags for PWA support
- CSS reset and base styles
- Optimized for mobile and desktop

### 6. App Configuration

#### `app.json`
Updated web configuration:
- Uses Metro bundler (`"bundler": "metro"`)
- Single output mode
- Removed unnecessary build configuration

## How It Works

### Platform Detection

The app uses React Native's `Platform.OS` to detect the platform:

```typescript
if (Platform.OS === 'web') {
  // Web-specific code
} else {
  // Native code
}
```

### Module Resolution

Metro automatically resolves platform-specific files:
- `file.web.ts` for web platform
- `file.native.ts` or `file.ts` for native platforms

### Stubs for Native Modules

Existing stubs in `src/utils/stubs/`:
- `camera.web.ts` - Camera API stub
- `auth.web.ts` - Local authentication stub
- `notifications.web.ts` - Notifications stub
- `background.web.ts` - Background fetch stub
- `tasks.web.ts` - Task manager stub
- `imagePicker.web.ts` - Image picker stub
- `barcode.web.ts` - Barcode scanner stub

### Network Detection

**Native:**
- Uses `@react-native-community/netinfo`
- Detects WiFi, cellular, and other connection types
- Provides detailed network information

**Web:**
- Uses `navigator.onLine` API
- Listens to `online`/`offline` events
- Simplified but reliable detection

### Offline Queue

Both platforms use the same offline queue API:
- Add requests to queue when offline
- Automatically process when online
- Retry failed requests with exponential backoff
- Store queue in persistent storage

### Storage

**Native:**
- Uses `expo-secure-store` for sensitive data (tokens)
- Uses `@react-native-async-storage/async-storage` for other data

**Web:**
- Uses `@react-native-async-storage/async-storage` for all data
- Falls back to `localStorage` on web
- Same API as native for compatibility

## Running the Web Build

### Development Server

```bash
cd mobile
npx expo start --web
```

The app will be available at `http://localhost:8081`

### Production Build

```bash
cd mobile
npm run build:web
```

This creates an optimized static build in the `web-build/` directory.

## Testing the Web Build

### Manual Testing Checklist

1. **Start the dev server:**
   ```bash
   cd mobile && npx expo start --web
   ```

2. **Verify app loads without errors:**
   - Open `http://localhost:8081` in browser
   - Check for 500 errors in browser
   - Check console for MIME type warnings

3. **Test authentication flow:**
   - Navigate to `/(auth)/login`
   - Verify login form renders correctly
   - Test login functionality
   - Verify redirect to `/(tabs)/student` after login

4. **Test navigation:**
   - Verify tab navigation works
   - Test all student tabs (Home, Assignments, Schedule, Grades, Profile)
   - Verify routing works correctly

5. **Inspect Network tab:**
   - Check `.js` and `.bundle` files have `application/javascript` content-type
   - Verify no MIME type warnings in console
   - Check all assets load correctly

### Browser DevTools

1. **Console Tab:**
   - Should see app initialization logs
   - No MIME type warnings
   - No critical errors

2. **Network Tab:**
   - Filter by JS files
   - Verify `Content-Type: application/javascript; charset=utf-8`
   - Check bundle sizes

3. **Application Tab:**
   - Verify localStorage is being used
   - Check stored tokens and user data

## Known Limitations on Web

1. **No biometric authentication** - Face ID/Touch ID not available
2. **No background sync** - Background fetch not supported in browsers
3. **No push notifications** - Native push notifications not available (can use web push in future)
4. **Camera limitations** - Uses file input instead of camera API
5. **No QR scanning** - QR scanner not available (can implement web-based scanner)

## Future Enhancements

1. **Progressive Web App (PWA):**
   - Add service worker for offline support
   - Add manifest.json for installability
   - Add app icons and splash screens

2. **Web Push Notifications:**
   - Implement Web Push API
   - Add notification permission requests
   - Sync with native notifications

3. **Web Authentication API:**
   - Implement WebAuthn for biometric-like authentication
   - Add platform authenticator support

4. **Enhanced Camera Support:**
   - Add web-based QR scanner using libraries
   - Implement WebRTC camera access
   - Add image capture and processing

5. **Service Worker:**
   - Add offline-first architecture
   - Cache static assets
   - Background sync API for queue processing

## Troubleshooting

### MIME Type Warnings

If you see MIME type warnings:
1. Clear browser cache
2. Restart Metro bundler
3. Check `metro.config.js` middleware is properly configured

### Module Not Found Errors

If web stubs are not found:
1. Verify `.web.ts` files exist in `src/utils/`
2. Check Metro config includes `.web` extensions
3. Restart Metro bundler with `--clear` flag

### Network Detection Not Working

If online/offline detection fails:
1. Verify browser supports Navigator API
2. Check browser console for errors
3. Test with browser DevTools throttling

### Storage Issues

If data persistence fails:
1. Check browser localStorage is enabled
2. Verify no storage quota exceeded
3. Check AsyncStorage implementation

## Maintenance

### Adding New Platform-Specific Code

When adding new native features:

1. Create web stub: `feature.web.ts`
2. Implement native version: `feature.ts` or `feature.native.ts`
3. Use Platform checks if needed
4. Update this documentation

### Updating Dependencies

When updating Expo or React Native:
1. Test web build after updates
2. Check for deprecated web APIs
3. Update stubs if needed
4. Test all platform-specific code

## Related Documentation

- [WEB_OPTIMIZATION_SUMMARY.md](./WEB_OPTIMIZATION_SUMMARY.md)
- [WEB_COMPATIBILITY_CHANGES.md](./WEB_COMPATIBILITY_CHANGES.md)
- [EXPO_ROUTER_TEST_GUIDE.md](./EXPO_ROUTER_TEST_GUIDE.md)
