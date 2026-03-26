# Expo Router Troubleshooting Guide

This guide documents common issues encountered when working with Expo Router across different platforms (iOS, Android, Web) and provides comprehensive solutions.

## Table of Contents

- [Permission Errors](#permission-errors)
- [Metro Configuration Issues](#metro-configuration-issues)
- [Build Cache Issues](#build-cache-issues)
- [Platform-Specific Issues](#platform-specific-issues)
- [Verification Steps](#verification-steps)
- [Complete Cleanup Process](#complete-cleanup-process)

## Permission Errors

### expo-screen-capture Module Error

**Problem**: Permission errors when running Expo Router on web platform:
```
Error: The package 'expo-screen-capture' doesn't seem to be linked. Make sure you have run 'expo prebuild' or you have the package expo-modules-core in your dependencies.
```

**Root Cause**: The `expo-screen-capture` module is a native-only module that is bundled with Expo SDK but not compatible with web platform. When Expo Router tries to bundle for web, it attempts to include this module, causing permission and linking errors.

**Solutions**:

#### Solution 1: Platform-Specific Plugin Configuration (Recommended)

Add platform restrictions to modules that don't support web in `app.config.js`:

```javascript
export default ({ config }) => ({
  // ... other config
  plugins: [
    // Restrict native-only modules to iOS and Android
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
    ],
    // Add similar restrictions for other native-only modules
  ],
});
```

#### Solution 2: Platform-Specific Imports

Use platform-specific imports in your code:

```typescript
import { Platform } from 'react-native';

// Only import on native platforms
let ScreenCapture;
if (Platform.OS !== 'web') {
  ScreenCapture = require('expo-screen-capture');
}
```

#### Solution 3: Metro Config Blocklist (Advanced)

For modules that are auto-imported by the Expo SDK, you can exclude them from web bundles using Metro config. However, this is generally not recommended as it can cause unexpected issues.

**Note**: As of Expo SDK 50, `expo-screen-capture` is bundled with the core SDK. The issue typically resolves itself with proper platform configuration and clean builds.

## Metro Configuration Issues

### Web Platform Bundle Errors

**Problem**: Metro bundler fails when building for web platform, or web bundle doesn't load correctly.

**Root Cause**: Metro configuration may not be properly set up for web platform, missing proper MIME types, platform-specific extensions, or bundling optimizations.

**Required Metro Configuration**:

The `metro.config.js` file must include:

#### 1. Platform Support

```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  // Support all three platforms
  platforms: ['ios', 'android', 'web'],
  
  // Platform-specific file extensions
  sourceExts: ['js', 'jsx', 'json', 'ts', 'tsx', 'mjs', 'cjs'],
  
  // Prioritize platform-specific versions
  resolverMainFields: ['react-native', 'browser', 'main'],
};
```

#### 2. Web Server MIME Types

Critical for preventing "MIME type mismatch" errors:

```javascript
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      const urlPath = req.url.split('?')[0];
      
      // JavaScript files
      if (urlPath.endsWith('.bundle') || urlPath.endsWith('.js') || 
          urlPath.endsWith('.mjs') || urlPath.endsWith('.cjs')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      }
      // JSON files
      else if (urlPath.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      // CSS files
      else if (urlPath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      }
      // HTML files
      else if (urlPath.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
      }
      // Source maps
      else if (urlPath.endsWith('.map')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      
      return middleware(req, res, next);
    };
  },
};
```

#### 3. Transformer Optimizations

```javascript
config.transformer = {
  ...config.transformer,
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
  minifierPath: 'metro-minify-terser',
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};
```

#### 4. Path Aliases (Optional but Recommended)

```javascript
const path = require('path');

config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    '@components': path.resolve(__dirname, 'src/components'),
    '@screens': path.resolve(__dirname, 'src/screens'),
    '@store': path.resolve(__dirname, 'src/store'),
    '@utils': path.resolve(__dirname, 'src/utils'),
    '@config': path.resolve(__dirname, 'src/config'),
    '@types': path.resolve(__dirname, 'src/types'),
    '@api': path.resolve(__dirname, 'src/api'),
    '@hooks': path.resolve(__dirname, 'src/hooks'),
    '@services': path.resolve(__dirname, 'src/services'),
    '@constants': path.resolve(__dirname, 'src/constants'),
    '@theme': path.resolve(__dirname, 'src/theme'),
  },
};
```

### Common Metro Errors

#### Error: "Unable to resolve module"

**Solution**:
1. Verify the module is installed: `npm list [module-name]`
2. Clear Metro cache: `npx expo start --clear`
3. Reinstall dependencies: `rm -rf node_modules && npm install`

#### Error: "MIME type ('text/html') is not executable"

**Solution**: Add proper MIME type headers in metro.config.js server middleware (see section above).

#### Error: "Module not found: Can't resolve '@components/...'"

**Solution**: Ensure path aliases are configured in both `metro.config.js` and `tsconfig.json`:

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@components/*": ["./src/components/*"],
      "@screens/*": ["./src/screens/*"],
      // ... other aliases
    }
  }
}
```

## Build Cache Issues

### Metro Cache Corruption

**Problem**: Build errors persist even after code fixes, or changes don't reflect in the app.

**Root Cause**: Metro bundler caches transformed files. If the cache becomes corrupted or outdated, it can cause persistent errors.

**Solution**: Clear Metro cache using any of these methods:

```bash
# Method 1: Start with clear flag
npx expo start --clear

# Method 2: Alternative clear flag
npx expo start -c

# Method 3: Manual cache deletion
rm -rf .expo
rm -rf node_modules/.cache
```

### Node Modules Issues

**Problem**: "Cannot find module" errors, version conflicts, or dependency-related crashes.

**Root Cause**: Corrupted node_modules directory, outdated package-lock.json, or incomplete installations.

**Cleanup Commands**:

#### PowerShell (Windows):

```powershell
# Quick cleanup
Remove-Item -Recurse -Force node_modules, package-lock.json, .expo
npm cache clean --force
npm install
npx expo start --clear

# Thorough cleanup (handles long paths on Windows)
New-Item -ItemType Directory -Force -Path empty_temp
robocopy empty_temp node_modules /MIR /R:0 /W:0 /NFL /NDL /NJH /NJS /nc /ns /np
Remove-Item -Force -Recurse empty_temp, node_modules
Remove-Item -Force package-lock.json, .expo
npm cache clean --force
npm install
npx expo start --clear
```

#### Bash (macOS/Linux):

```bash
# Quick cleanup
rm -rf node_modules package-lock.json .expo
npm cache clean --force
npm install
npx expo start --clear

# Alternative using cleanup script
./cleanup-and-rebuild.sh
```

#### Using Provided Scripts:

The repository includes automated cleanup scripts:

```bash
# PowerShell
.\cleanup-and-rebuild.ps1

# Bash
./cleanup-and-rebuild.sh

# With options
.\cleanup-and-rebuild.ps1 -SkipInstall  # Clean but don't install
.\cleanup-and-rebuild.ps1 -SkipStart    # Clean and install but don't start
```

### Complete Cache Cleanup Checklist

When experiencing persistent build issues, clean all caches:

```bash
# 1. Remove node modules
rm -rf node_modules

# 2. Remove package lock
rm package-lock.json

# 3. Remove Expo cache
rm -rf .expo

# 4. Remove Metro cache (if exists)
rm -rf node_modules/.cache

# 5. Remove temporary build artifacts
rm -rf dist
rm -rf .expo-shared

# 6. Clear npm cache
npm cache clean --force

# 7. Clear global Expo cache (optional, for severe issues)
rm -rf ~/.expo

# 8. Reinstall
npm install

# 9. Start with clear cache
npx expo start --clear
```

### Platform-Specific Build Caches

#### iOS:

```bash
# Clear iOS build cache
cd ios
rm -rf Pods
rm Podfile.lock
pod cache clean --all
pod deintegrate
pod install
cd ..

# Or use automated script
npx expo prebuild --clean
```

#### Android:

```bash
# Clear Android build cache
cd android
./gradlew clean
rm -rf .gradle
rm -rf app/build
cd ..

# Or use automated script
npx expo prebuild --clean
```

#### Web:

```bash
# Clear web build artifacts
rm -rf dist
rm -rf .expo-shared
npx expo start --web --clear
```

## Platform-Specific Issues

### Web Platform

#### Issue: Blank white screen on web

**Causes**:
1. JavaScript bundle not loading
2. MIME type errors
3. Missing index.html
4. Router configuration issues

**Solutions**:

```bash
# 1. Verify index.html exists in project root
ls index.html

# 2. Check metro.config.js has proper MIME types (see Metro Configuration section)

# 3. Clear cache and rebuild
npx expo start --web --clear

# 4. Check browser console for errors
# Open DevTools (F12) and check Console and Network tabs
```

#### Issue: Web bundle build fails

**Solution**:

```bash
# 1. Ensure web bundler is set to metro in app.config.js
# web: { bundler: 'metro' }

# 2. Build web bundle explicitly
npx expo export --platform web

# 3. If errors persist, check for web-incompatible modules
# See Permission Errors section
```

### iOS Platform

#### Issue: App crashes on iOS but works on Android

**Solutions**:

```bash
# 1. Clear iOS cache
cd ios && rm -rf Pods && pod install && cd ..

# 2. Rebuild with prebuild
npx expo prebuild --clean --platform ios

# 3. Check iOS-specific permissions in app.config.js
# Ensure all required NSUsageDescription keys are present
```

### Android Platform

#### Issue: App crashes on Android but works on iOS

**Solutions**:

```bash
# 1. Clear Android cache
cd android && ./gradlew clean && cd ..

# 2. Rebuild with prebuild
npx expo prebuild --clean --platform android

# 3. Check Android permissions in app.config.js
# Ensure all required permissions are declared
```

## Verification Steps

After applying fixes, verify your setup with these comprehensive steps:

### 1. Configuration Verification

```bash
# Verify Expo configuration
npx expo config --type public

# Check for configuration errors
npx expo doctor

# Validate metro config syntax
node -c metro.config.js
```

### 2. Platform-Specific Testing

#### Test iOS:

```bash
# Prebuild iOS
npx expo prebuild --platform ios

# Run on simulator
npx expo run:ios

# Check for errors in logs
npx expo run:ios --device
```

#### Test Android:

```bash
# Prebuild Android
npx expo prebuild --platform android

# Run on emulator
npx expo run:android

# Check for errors in logs
adb logcat | grep -i "expo\|react"
```

#### Test Web:

```bash
# Start web development server
npx expo start --web

# Build production web bundle
npx expo export --platform web

# Verify bundle size and contents
ls -lh dist

# Test in browser
# Navigate to http://localhost:8081 (or port shown)
# Check browser console for errors (F12)
```

### 3. Router Verification

Create a test script to verify Expo Router functionality:

```typescript
// verify-expo-router.ts
import { router } from 'expo-router';

console.log('Testing Expo Router...');

// Check router availability
if (!router) {
  console.error('❌ Router not available');
  process.exit(1);
}

console.log('✅ Router available');

// Check routing methods
const methods = ['push', 'replace', 'back', 'canGoBack', 'setParams'];
for (const method of methods) {
  if (typeof router[method] !== 'function') {
    console.error(`❌ Router.${method} not available`);
    process.exit(1);
  }
}

console.log('✅ All router methods available');
console.log('✅ Expo Router verification complete');
```

Run verification:

```bash
node verify-expo-router.ts
```

### 4. Cross-Platform Build Test

Test all platforms to ensure no regressions:

```bash
# Test iOS build
eas build --platform ios --profile preview

# Test Android build
eas build --platform android --profile preview

# Test web build
npx expo export --platform web

# Verify all builds complete without errors
eas build:list
```

### 5. Runtime Testing Checklist

- [ ] App launches without crashes on iOS
- [ ] App launches without crashes on Android
- [ ] Web app loads in browser
- [ ] Navigation works correctly (push, pop, replace)
- [ ] Deep links work on all platforms
- [ ] No console errors or warnings
- [ ] No MIME type errors in browser console
- [ ] Bundle size is reasonable (check with `npx expo export --platform web`)
- [ ] Hot reload works in development
- [ ] Production builds work correctly

### 6. Module Verification

Verify critical modules are working:

```typescript
// test-modules.ts
import { Platform } from 'react-native';

// Test platform detection
console.log('Platform:', Platform.OS);

// Test native modules (only on native platforms)
if (Platform.OS !== 'web') {
  const SecureStore = require('expo-secure-store');
  const LocalAuth = require('expo-local-authentication');
  
  console.log('✅ Native modules loaded');
} else {
  console.log('✅ Web platform detected, skipping native modules');
}

// Test common modules
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

console.log('✅ Common modules loaded');
console.log('All modules verified successfully');
```

## Complete Cleanup Process

When facing multiple issues or starting fresh, follow this complete cleanup process:

### Step-by-Step Deep Clean

```bash
# 1. Stop all running processes
# - Stop Expo dev server (Ctrl+C)
# - Stop Metro bundler
# - Close all terminal windows running Expo

# 2. Clear all caches (PowerShell)
Remove-Item -Recurse -Force node_modules, package-lock.json, .expo, dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue

# 3. Clear npm cache
npm cache clean --force

# 4. Clear Expo global cache (if issues persist)
Remove-Item -Recurse -Force $env:USERPROFILE\.expo -ErrorAction SilentlyContinue

# 5. Clear platform-specific caches

# iOS (if applicable)
# cd ios
# Remove-Item -Recurse -Force Pods, Podfile.lock
# pod cache clean --all
# cd ..

# Android (if applicable)
# cd android
# .\gradlew clean
# Remove-Item -Recurse -Force .gradle, app\build
# cd ..

# 6. Reinstall dependencies
npm install

# 7. Prebuild (if using bare workflow)
# npx expo prebuild --clean

# 8. Start with clear cache
npx expo start --clear
```

### Using Automated Scripts

```powershell
# Run comprehensive cleanup script
.\cleanup-and-rebuild.ps1

# Script performs:
# - Removes node_modules (using robocopy for Windows path length issues)
# - Removes .expo directory
# - Removes package-lock.json
# - Clears npm cache
# - Reinstalls dependencies
# - Starts Expo with clear cache
```

### Verification After Cleanup

```bash
# 1. Verify directory structure
Test-Path node_modules      # Should be True
Test-Path package-lock.json  # Should be True
Test-Path .expo              # May be False (created on first run)

# 2. Verify installation
npm list expo
npm list expo-router

# 3. Start development server
npx expo start --clear

# 4. Test on each platform
# Press 'w' for web
# Press 'i' for iOS simulator
# Press 'a' for Android emulator

# 5. Check for errors in console
# No permission errors
# No MIME type errors
# No module resolution errors
```

## Common Error Messages and Solutions

### "expo-screen-capture doesn't seem to be linked"

**Solution**: See [Permission Errors](#permission-errors) section.

### "MIME type ('text/html') is not executable"

**Solution**: Add proper MIME types in metro.config.js. See [Metro Configuration Issues](#metro-configuration-issues).

### "Cannot find module 'expo-router'"

**Solution**:
```bash
npm install expo-router
npx expo start --clear
```

### "Unable to resolve module @react-native-async-storage/async-storage"

**Solution**:
```bash
npm install @react-native-async-storage/async-storage
npx expo prebuild --clean
```

### "Error: Metro has encountered an error"

**Solution**:
```bash
# Clear all Metro caches
rm -rf .expo node_modules/.cache
npx expo start --clear
```

### "The package 'expo-modules-core' doesn't seem to be installed"

**Solution**:
```bash
npm install expo-modules-core
npx expo prebuild --clean
```

## Best Practices

### Development Workflow

1. **Always use clear cache after major changes**:
   ```bash
   npx expo start --clear
   ```

2. **Test on all target platforms regularly**:
   - Don't wait until the end to test web if you're targeting web
   - Use platform-specific code when necessary

3. **Keep dependencies updated**:
   ```bash
   npx expo install --check
   npx expo install --fix
   ```

4. **Monitor bundle size**:
   ```bash
   npx expo export --platform web
   # Check dist/ folder size
   ```

5. **Use platform-specific files when needed**:
   - `component.ios.tsx`
   - `component.android.tsx`
   - `component.web.tsx`

### Preventive Measures

1. **Configure platform restrictions early**:
   - Add platform restrictions to native-only plugins in app.config.js
   - Use Platform.select() for platform-specific code

2. **Validate configuration regularly**:
   ```bash
   npx expo config --type public
   npx expo doctor
   ```

3. **Commit working states**:
   - Use git to commit when everything works
   - Easy to rollback if issues occur

4. **Document custom configurations**:
   - Note any special metro.config.js changes
   - Document platform-specific workarounds

## Additional Resources

- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [Metro Configuration](https://docs.expo.dev/guides/customizing-metro/)
- [Expo Platform Support](https://docs.expo.dev/workflow/web/)
- [Troubleshooting Builds](https://docs.expo.dev/build/troubleshooting/)
- [Project Troubleshooting Guide](./TROUBLESHOOTING.md)

## Getting Help

If issues persist after following this guide:

1. **Check Expo Status**: https://status.expo.dev/
2. **Search Expo Forums**: https://forums.expo.dev/
3. **Check GitHub Issues**: https://github.com/expo/expo/issues
4. **Stack Overflow**: Tag questions with `expo` and `expo-router`
5. **Contact Team**: Post in your development Slack/Discord channel

## Summary

The most common Expo Router issues are related to:

1. **Native module compatibility** - Use platform restrictions in app.config.js
2. **Metro configuration** - Ensure proper MIME types and platform support
3. **Build cache** - Regularly clear caches when making major changes
4. **Platform differences** - Test on all target platforms early and often

Following the cleanup and verification steps in this guide should resolve most Expo Router issues.
