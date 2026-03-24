# Expo Router Multi-Platform Testing

This document provides complete instructions for testing Expo Router on all platforms: Web, iOS, and Android.

## Overview

The Expo Router testing implementation includes:

1. **Test Scripts** - Automated test guides for each platform
2. **Configuration Verification** - Script to verify all configs are correct
3. **Comprehensive Documentation** - Step-by-step testing guides
4. **Quick Reference Checklist** - Fast reference for testing

## Files Created

### In `mobile/` directory:

- **`test-expo-router.ps1`** - PowerShell test script for Windows
- **`test-expo-router.sh`** - Bash test script for macOS/Linux
- **`verify-expo-router-config.js`** - Configuration verification script
- **`EXPO_ROUTER_TEST_GUIDE.md`** - Comprehensive testing guide
- **`EXPO_ROUTER_TEST_CHECKLIST.md`** - Quick reference checklist

## Quick Start

### 1. Verify Configuration

Before testing, verify all configuration files are correct:

```bash
cd mobile
node verify-expo-router-config.js
```

This will check:
- ✅ `babel.config.js` - Path aliases
- ✅ `metro.config.js` - MIME types and module resolution
- ✅ `tsconfig.json` - TypeScript paths
- ✅ `webpack.config.js` - Web stubs
- ✅ Web stubs for native modules
- ✅ App directory structure
- ✅ Package dependencies

### 2. Run Test Scripts

**On Windows (PowerShell):**
```powershell
cd mobile
.\test-expo-router.ps1 -All
```

**On macOS/Linux (Bash):**
```bash
cd mobile
chmod +x test-expo-router.sh
./test-expo-router.sh --all
```

### 3. Manual Testing

Follow the comprehensive guide in `mobile/EXPO_ROUTER_TEST_GUIDE.md` for detailed testing instructions.

## Testing Each Platform

### Web Platform

```bash
cd mobile
npx expo start --clear  # Clear cache first
npx expo start --web    # Start web server
```

**What to test:**
1. Navigate to `http://localhost:8081` - should load without 500 errors
2. Navigate to `http://localhost:8081/(auth)/login` - route should work
3. Open browser DevTools (F12):
   - Check Console for MIME type errors
   - Check Network tab for correct Content-Type headers
4. Verify path aliases resolve (no "module not found" errors)
5. Verify native modules use web stubs

### iOS Platform (macOS only)

```bash
cd mobile
npx expo start --ios    # Start iOS simulator
```

**What to test:**
1. App builds successfully
2. iOS Simulator launches
3. App opens without crashes
4. Login screen shows (navigation works)
5. Metro bundler console is clean
6. Deep linking works:
   ```bash
   xcrun simctl openurl booted "edutrack:///(auth)/login"
   ```

### Android Platform

```bash
cd mobile
npx expo start --android    # Start Android emulator
```

**What to test:**
1. App builds successfully
2. Android emulator shows app
3. App opens without crashes
4. Login screen shows (navigation works)
5. Metro bundler console is clean
6. Deep linking works:
   ```bash
   adb shell am start -W -a android.intent.action.VIEW -d "edutrack:///(auth)/login" com.yourcompany.edutrack
   ```

## Path Aliases Configuration

All path aliases are configured and should work on all platforms:

| Alias | Path |
|-------|------|
| `@components` | `src/components` |
| `@screens` | `src/screens` |
| `@store` | `src/store` |
| `@utils` | `src/utils` |
| `@config` | `src/config` |
| `@types` | `src/types` |
| `@api` | `src/api` |
| `@hooks` | `src/hooks` |
| `@services` | `src/services` |
| `@constants` | `src/constants` |
| `@theme` | `src/theme` |

## Configuration Files

### babel.config.js
Configures:
- Path aliases for module resolution
- React Native Reanimated plugin
- Console removal in production

### metro.config.js
Configures:
- MIME types for web server
- Path aliases as extraNodeModules
- Source and asset extensions
- Minification settings

### tsconfig.json
Configures:
- TypeScript path mappings
- Compiler options
- Include/exclude patterns

### webpack.config.js
Configures:
- Web build settings
- Native module stubs for web
- Code splitting
- Bundle optimization

### app.config.js
Configures:
- App metadata
- Deep linking scheme
- Platform-specific settings
- Plugins and extras

## Web Stubs for Native Modules

Native-only modules are stubbed for web compatibility:

- `src/utils/stubs/camera.web.ts` - Camera module
- `src/utils/stubs/barcode.web.ts` - Barcode scanner
- `src/utils/stubs/auth.web.ts` - Local authentication
- `src/utils/stubs/notifications.web.ts` - Push notifications
- `src/utils/stubs/background.web.ts` - Background fetch
- `src/utils/stubs/tasks.web.ts` - Task manager
- `src/utils/stubs/imagePicker.web.ts` - Image picker

## Routes to Test

### Web Routes (Direct URL)
- `http://localhost:8081/` - Root
- `http://localhost:8081/(auth)/login` - Login
- `http://localhost:8081/profile` - Profile
- `http://localhost:8081/settings` - Settings
- `http://localhost:8081/assignments` - Assignments
- `http://localhost:8081/courses` - Courses

### Native Routes (Deep Links)
- `edutrack:///` - Root
- `edutrack:///(auth)/login` - Login
- `edutrack:///profile` - Profile
- `edutrack:///settings` - Settings

## Common Issues and Solutions

### Web Shows 500 Error
1. Clear cache: `npx expo start --clear`
2. Check `app/_layout.tsx` for web-incompatible code
3. Verify native modules have web stubs
4. Check browser console for specific error

### MIME Type Errors
1. Check `metro.config.js` middleware configuration
2. Verify file extensions in imports
3. Restart Metro bundler
4. Clear browser cache

### Module Not Found
1. Verify `babel.config.js` has correct aliases
2. Check `tsconfig.json` paths match
3. Restart Metro bundler
4. Run `npm install` to ensure dependencies are installed

### iOS Build Fails
1. Run `npx expo prebuild --clean`
2. Delete `ios` folder and regenerate
3. Check Xcode version compatibility
4. Verify iOS-specific code in `src/utils/iosInit.ts`

### Android Build Fails
1. Run `npx expo prebuild --clean`
2. Delete `android` folder and regenerate
3. Check Android SDK and Gradle versions
4. Verify Android-specific code in `src/utils/androidInit.ts`

## MIME Type Verification (Web)

Expected Content-Type headers:

| File Type | Expected MIME Type |
|-----------|-------------------|
| `.js` | `application/javascript; charset=utf-8` |
| `.json` | `application/json; charset=utf-8` |
| `.css` | `text/css; charset=utf-8` |
| `.html` | `text/html; charset=utf-8` |
| `.png` | `image/png` |
| `.jpg` | `image/jpeg` |
| `.svg` | `image/svg+xml; charset=utf-8` |
| `.woff` | `font/woff` |
| `.woff2` | `font/woff2` |

To check:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Reload page
4. Click on any file
5. Check Headers → Response Headers → Content-Type

## Performance Expectations

### Web
- Initial bundle size: < 2MB
- Page load time: < 3 seconds
- No console errors
- Smooth navigation (60fps)

### Native (iOS/Android)
- App launch time: < 2 seconds
- Navigation: 60fps
- No memory warnings
- Minimal Metro bundler warnings

## Success Criteria

All platforms pass testing when:

✅ **Build & Launch**
- App builds without errors
- App launches without crashes

✅ **Navigation**
- All routes work correctly
- Deep linking works (native)
- Back navigation works

✅ **Configuration**
- Path aliases resolve properly
- MIME types correct (web)
- No module resolution errors

✅ **Performance**
- Fast load times
- Smooth navigation
- No memory leaks

✅ **Console**
- No red errors
- Minimal warnings
- Clean Metro bundler output

## Troubleshooting Commands

```bash
# Clear all caches
cd mobile
npx expo start --clear
rm -rf node_modules/.cache
watchman watch-del-all  # macOS/Linux only

# Reinstall dependencies
rm -rf node_modules
npm install

# Reset native projects
rm -rf ios android
npx expo prebuild --clean

# Type check
npm run type-check

# Lint check
npm run lint
```

## Additional Resources

- **Comprehensive Guide**: `mobile/EXPO_ROUTER_TEST_GUIDE.md`
- **Quick Checklist**: `mobile/EXPO_ROUTER_TEST_CHECKLIST.md`
- **Test Script (PowerShell)**: `mobile/test-expo-router.ps1`
- **Test Script (Bash)**: `mobile/test-expo-router.sh`
- **Config Verification**: `mobile/verify-expo-router-config.js`

## External Documentation

- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [Metro Bundler Documentation](https://facebook.github.io/metro/)
- [React Native Web Documentation](https://necolas.github.io/react-native-web/)
- [Expo Development Build](https://docs.expo.dev/develop/development-builds/introduction/)

## Support

If you encounter issues:

1. Run configuration verification: `node verify-expo-router-config.js`
2. Check the comprehensive guide for your platform
3. Review common issues section
4. Clear all caches and restart
5. Check Metro bundler console output

## Notes

- **iOS testing requires macOS** - Cannot test iOS on Windows/Linux
- **Android testing requires Android SDK** - Can be tested on any platform
- **Web testing works everywhere** - No special requirements
- **Always clear cache first** - Prevents stale bundle issues
- **Check Metro bundler console** - Primary source of error information
