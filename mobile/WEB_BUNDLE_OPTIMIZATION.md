# Web Bundle Optimization Guide

## Overview

This document describes the optimizations implemented to reduce web bundle size and improve performance for the Expo Router-based mobile application.

## Optimizations Implemented

### 1. Metro Config Optimizations

**File**: `metro.config.js`

- **Tree-shaking**: Enhanced with advanced minification settings
- **Dead code elimination**: Enabled through terser configuration
- **Inline requires**: Reduces initial bundle size by deferring module loading
- **Production optimizations**: Console statements removed, aggressive compression enabled

```javascript
compress: {
  dead_code: true,
  drop_console: process.env.NODE_ENV === 'production',
  passes: 3,
  pure_getters: true,
}
```

### 2. Platform-Specific Module Loading

**Purpose**: Exclude native-only modules from web bundle

#### Native Modules with Web Stubs

The following modules now have platform-specific implementations:

- **Camera** (`camera.native.ts` / `camera.web.ts`)
  - Native: Full expo-camera and expo-image-picker support
  - Web: File input fallback

- **Biometrics** (`biometrics.native.ts` / `biometrics.web.ts`)
  - Native: expo-local-authentication support
  - Web: Web Authentication API detection

- **Notifications** (`notifications.native.ts` / `notifications.web.ts`)
  - Native: Full expo-notifications support
  - Web: Browser Notification API

- **Background Sync** (`backgroundSync.native.ts` / `backgroundSync.web.ts`)
  - Native: expo-background-fetch and expo-task-manager
  - Web: Stub (background sync not supported)

- **Document Scanner** (`documentScanner.native.ts` / `documentScanner.web.ts`)
  - Native: expo-document-picker and expo-file-system
  - Web: File API implementation

### 3. Secure Storage Strategy

**File**: `src/utils/secureStorage.ts`

✅ **Already implemented correctly**:
- Uses `@react-native-async-storage/async-storage` on web
- Uses `expo-secure-store` on native platforms
- Platform detection with conditional imports

```typescript
if (Platform.OS === 'web') {
  await AsyncStorage.setItem(key, value);
} else {
  await SecureStore.setItemAsync(key, value);
}
```

### 4. Dynamic Imports for Platform-Specific Code

**File**: `app/_layout.tsx`

Platform initialization modules are now loaded dynamically:

```typescript
if (Platform.OS === 'ios') {
  const { initializeIOSPlatform } = await import('@utils/iosInit');
  await initializeIOSPlatform();
} else if (Platform.OS === 'android') {
  const { initializeAndroidPlatform } = await import('@utils/androidInit');
  await initializeAndroidPlatform();
}
```

This prevents iOS/Android-specific code from being included in the web bundle.

### 5. Web-Specific Screen Components

Heavy screens that use native modules have web-specific implementations:

- `QRScannerScreen.web.tsx` - Placeholder for QR scanner
- `CameraScreen.web.tsx` - Placeholder for camera
- `QRScanner.web.tsx` - Placeholder for QR component

These prevent native camera/barcode modules from being bundled on web.

### 6. Webpack Configuration

**File**: `webpack.config.js`

- **Module aliases**: Maps native-only modules to web stubs
- **Code splitting**: Automatic vendor and common chunk separation
- **Performance budgets**: 2MB warning threshold for assets and entry points
- **Tree-shaking**: Enabled via `usedExports` and `sideEffects`

### 7. App Configuration

**File**: `app.config.js`

Native-only plugins are excluded from web builds:

```javascript
[
  'expo-secure-store',
  {
    platforms: ['ios', 'android'],
  },
],
[
  'expo-local-authentication',
  {
    platforms: ['ios', 'android'],
  },
]
```

### 8. Lazy Loading Component

**File**: `src/components/LazyScreen.tsx`

Utility component for implementing route-based code splitting:

```typescript
import { LazyScreen } from '@components/LazyScreen';

<LazyScreen 
  loader={() => import('@screens/student/HeavyScreen')} 
  {...props} 
/>
```

## Bundle Analysis

### Running Bundle Analysis

```bash
npm run analyze-bundle
```

This command:
1. Exports the web bundle using `expo export --platform web`
2. Analyzes the `dist` folder
3. Reports:
   - Total bundle size
   - Large files (>100KB)
   - Bundle size vs 2MB threshold
   - Optimization recommendations

### Expected Results

✅ **Target**: Bundle size under 2MB
✅ **Native modules**: Excluded from web bundle
✅ **AsyncStorage**: Used instead of SecureStore on web
✅ **Tree-shaking**: Working correctly

## Verification Steps

### 1. Check Bundle Size

```bash
npx expo export --platform web
du -sh dist/
```

### 2. Verify No Native Modules in Web Bundle

```bash
# Search for native module imports in bundled files
grep -r "expo-camera" dist/
grep -r "expo-secure-store" dist/
grep -r "expo-local-authentication" dist/
```

Should return no results if optimization is working.

### 3. Test Web Build

```bash
npx expo start --web
```

Verify:
- ✅ App loads without errors
- ✅ Authentication works (using AsyncStorage)
- ✅ Native features show appropriate fallbacks
- ✅ No console errors about missing native modules

## Best Practices

### Adding New Native Features

When adding features that use native modules:

1. **Create platform-specific files**:
   ```
   feature.native.ts  // iOS/Android implementation
   feature.web.ts     // Web stub or alternative
   ```

2. **Use Platform detection**:
   ```typescript
   if (Platform.OS !== 'web') {
     const module = await import('./nativeModule');
   }
   ```

3. **Test both platforms**:
   - Run on native: `npm run ios` or `npm run android`
   - Run on web: `npm run web`

### Dynamic Imports for Heavy Screens

For screens with large dependencies:

```typescript
// Instead of:
import HeavyScreen from './HeavyScreen';

// Use:
const HeavyScreen = lazy(() => import('./HeavyScreen'));
```

## Monitoring

### Continuous Integration

Add bundle size checks to CI:

```yaml
- name: Check bundle size
  run: |
    npm run build:web
    node scripts/analyze-bundle.js
    # Fail if bundle > 2MB
```

### Performance Metrics

Monitor in production:
- Initial load time
- Time to interactive
- Bundle size trends
- Core Web Vitals

## Troubleshooting

### Issue: Bundle size still too large

**Solutions**:
1. Check for accidental imports of native modules
2. Review `webpack.config.js` aliases
3. Use `npm run analyze-bundle` to find large files
4. Consider lazy loading more screens

### Issue: Native module errors on web

**Solutions**:
1. Verify platform-specific files exist (`.native.ts` and `.web.ts`)
2. Check webpack aliases in `webpack.config.js`
3. Ensure imports use conditional Platform checks

### Issue: AsyncStorage not working on web

**Solutions**:
1. Verify `@react-native-async-storage/async-storage` is installed
2. Check that `secureStorage.ts` uses Platform detection
3. Clear browser storage and retry

## References

- [Expo Web](https://docs.expo.dev/workflow/web/)
- [Metro Bundler](https://facebook.github.io/metro/)
- [React Native for Web](https://necolas.github.io/react-native-web/)
- [Bundle Size Optimization](https://docs.expo.dev/guides/analyzing-bundles/)

## Summary

All optimizations have been implemented to ensure:

✅ Web bundle size is optimized and under 2MB threshold  
✅ Native-only modules are excluded from web builds  
✅ AsyncStorage is used instead of SecureStore on web  
✅ Platform-specific code is loaded dynamically  
✅ Tree-shaking is properly configured  
✅ Bundle analysis tools are available  
