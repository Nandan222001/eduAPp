# Expo Router Multi-Platform Testing Guide

This guide provides comprehensive instructions for testing Expo Router across all platforms (Web, iOS, and Android).

## Quick Start

### Using Test Scripts

**PowerShell (Windows):**
```powershell
# Test all platforms
.\test-expo-router.ps1

# Test specific platforms
.\test-expo-router.ps1 -Web
.\test-expo-router.ps1 -iOS
.\test-expo-router.ps1 -Android
.\test-expo-router.ps1 -All
```

**Bash (macOS/Linux):**
```bash
# Make script executable (first time only)
chmod +x test-expo-router.sh

# Test all platforms
./test-expo-router.sh

# Test specific platforms
./test-expo-router.sh --web
./test-expo-router.sh --ios
./test-expo-router.sh --android
./test-expo-router.sh --all
```

## Manual Testing Instructions

### 1. Web Platform Testing

#### Step 1: Clear Cache and Start
```bash
cd mobile
npx expo start --clear
```

This command:
- Clears the Metro bundler cache
- Clears the Expo cache
- Rebuilds the application

#### Step 2: Start Web Server
```bash
cd mobile
npx expo start --web
```

This starts the development server and opens the app in your browser at `http://localhost:8081`.

#### Web Test Checklist

- [ ] **Server starts without errors**
  - Check terminal for any error messages
  - Verify Metro bundler starts successfully

- [ ] **Homepage loads without 500 errors**
  - Navigate to `http://localhost:8081`
  - Page should load successfully
  - No 500 Internal Server Error

- [ ] **Login route works**
  - Navigate to `http://localhost:8081/(auth)/login`
  - Login screen should render
  - URL should be correct in address bar

- [ ] **No MIME type errors**
  - Open browser DevTools (F12)
  - Check Console tab for MIME type warnings
  - Check Network tab → JS files have `Content-Type: application/javascript`

- [ ] **Path aliases resolve**
  - Check console for "module not found" errors
  - Verify imports like `@components`, `@screens`, etc. work
  - No 404 errors for module files

- [ ] **Native modules stubbed properly**
  - No errors about native modules on web
  - Camera, notifications, etc. use web stubs
  - Check `src/utils/stubs/*.web.ts` files are loaded

#### Common Web Issues and Solutions

**Issue: 500 Internal Server Error**
- Solution: Check `app/_layout.tsx` for web-incompatible code
- Solution: Verify all native modules have web stubs
- Solution: Clear cache with `npx expo start --clear`

**Issue: MIME type errors**
- Solution: Check `metro.config.js` MIME type configuration
- Solution: Verify webpack config has correct settings
- Solution: Check file extensions in imports

**Issue: Module not found**
- Solution: Verify `babel.config.js` has correct path aliases
- Solution: Check `tsconfig.json` paths match babel config
- Solution: Restart Metro bundler

### 2. iOS Platform Testing

#### Prerequisites
- macOS required
- Xcode installed
- iOS Simulator available

#### Step 1: Clear Cache and Start (Optional)
```bash
cd mobile
npx expo start --clear --ios
```

#### Step 2: Start iOS Simulator
```bash
cd mobile
npx expo start --ios
```

This command:
- Starts Metro bundler
- Builds the iOS app
- Launches iOS Simulator
- Installs and runs the app

#### iOS Test Checklist

- [ ] **App builds successfully**
  - No build errors in terminal
  - Metro bundler starts
  - iOS Simulator launches

- [ ] **App launches without crashes**
  - App icon appears on simulator
  - App opens successfully
  - No crash on launch

- [ ] **Login route navigation works**
  - App should show login screen (if not authenticated)
  - Can navigate to `/(auth)/login` route
  - Navigation stack works correctly

- [ ] **Path aliases resolve**
  - No "module not found" errors in Metro bundler
  - All `@components`, `@screens`, etc. imports work
  - App loads without import errors

- [ ] **Metro bundler console clean**
  - Check terminal for warnings/errors
  - No red error messages
  - Yellow warnings are acceptable

- [ ] **Deep linking works**
  - Test with: `xcrun simctl openurl booted "edutrack:///(auth)/login"`
  - App should navigate to login screen
  - Deep link parsing works correctly

#### Common iOS Issues and Solutions

**Issue: Build fails**
- Solution: Run `npx expo prebuild --clean` to regenerate iOS project
- Solution: Delete `ios` folder and run `npx expo prebuild`
- Solution: Check Xcode version compatibility

**Issue: App crashes on launch**
- Solution: Check Metro bundler console for errors
- Solution: Verify `app/_layout.tsx` iOS initialization code
- Solution: Check `src/utils/iosInit.ts` file

**Issue: Deep linking doesn't work**
- Solution: Verify `app.config.js` has correct scheme
- Solution: Check `app/_layout.tsx` deep link listeners
- Solution: Test with command: `xcrun simctl openurl booted "edutrack:///..."`

### 3. Android Platform Testing

#### Prerequisites
- Android Studio installed
- Android SDK configured
- Android Emulator or physical device

#### Step 1: Start Android Emulator (if using emulator)
```bash
# List available emulators
emulator -list-avds

# Start specific emulator
emulator -avd <emulator_name>
```

#### Step 2: Clear Cache and Start (Optional)
```bash
cd mobile
npx expo start --clear --android
```

#### Step 3: Start Android App
```bash
cd mobile
npx expo start --android
```

This command:
- Starts Metro bundler
- Builds the Android app
- Installs app on emulator/device
- Launches the app

#### Android Test Checklist

- [ ] **App builds successfully**
  - No build errors in terminal
  - Metro bundler starts
  - Android emulator shows app

- [ ] **App launches without crashes**
  - App installs successfully
  - App opens without errors
  - No crash on launch

- [ ] **Login route navigation works**
  - App shows login screen (if not authenticated)
  - Can navigate to `/(auth)/login` route
  - Navigation works correctly

- [ ] **Path aliases resolve**
  - No "module not found" errors in Metro bundler
  - All path imports work
  - No import resolution errors

- [ ] **Metro bundler console clean**
  - Check terminal for errors
  - No red error messages
  - Warnings are acceptable

- [ ] **Deep linking works**
  - Test with: `adb shell am start -W -a android.intent.action.VIEW -d "edutrack:///(auth)/login" com.yourcompany.edutrack`
  - App navigates to login screen
  - Deep link parsing works

#### Common Android Issues and Solutions

**Issue: Build fails**
- Solution: Run `npx expo prebuild --clean` to regenerate Android project
- Solution: Delete `android` folder and run `npx expo prebuild`
- Solution: Check Android SDK/Gradle versions

**Issue: App crashes on launch**
- Solution: Check Metro bundler console for errors
- Solution: Verify `app/_layout.tsx` Android initialization code
- Solution: Check `src/utils/androidInit.ts` file

**Issue: Deep linking doesn't work**
- Solution: Verify `app.config.js` has correct scheme and intent filters
- Solution: Check AndroidManifest.xml for deep link configuration
- Solution: Test with: `adb shell am start -W -a android.intent.action.VIEW -d "edutrack:///..."`

## Path Alias Testing

### Configured Path Aliases

The following path aliases are configured and should work on all platforms:

- `@components` → `src/components`
- `@screens` → `src/screens`
- `@store` → `src/store`
- `@utils` → `src/utils`
- `@config` → `src/config`
- `@types` → `src/types`
- `@api` → `src/api`
- `@hooks` → `src/hooks`
- `@services` → `src/services`
- `@constants` → `src/constants`
- `@theme` → `src/theme`

### Testing Path Aliases

1. **Check imports in code**
   ```typescript
   import { Button } from '@components';
   import { LoginScreen } from '@screens/auth/LoginScreen';
   import { store } from '@store';
   ```

2. **Verify in Metro bundler**
   - Imports should resolve without errors
   - No "module not found" errors
   - Bundle builds successfully

3. **Check in browser console (Web)**
   - No 404 errors for module files
   - Network tab shows correct file paths
   - Source maps work correctly

## Navigation Testing

### Routes to Test

1. **Root Route**: `/` or `http://localhost:8081`
2. **Auth Group**:
   - `/(auth)/login` or `http://localhost:8081/(auth)/login`
   - `/(auth)/register` (if exists)
3. **Tabs Group**:
   - `/(tabs)/student` (requires authentication)
   - `/(tabs)/parent` (requires authentication)
4. **Deep Routes**:
   - `/profile`
   - `/settings`
   - `/assignments`
   - `/courses`

### Testing Navigation

1. **Direct URL navigation (Web)**
   - Enter URL in address bar
   - Route should load correctly
   - No 404 or 500 errors

2. **Programmatic navigation (All platforms)**
   - Use `router.push()` or `router.replace()`
   - Navigation should work smoothly
   - Back button works correctly

3. **Deep linking (Native)**
   - Test with scheme URLs
   - App should handle links correctly
   - Parameters passed properly

## MIME Type Verification (Web)

### Check MIME Types

1. **Open Browser DevTools** (F12)
2. **Go to Network tab**
3. **Reload page** (Ctrl+R or Cmd+R)
4. **Filter by JS files**
5. **Check Content-Type headers**:
   - `.js` files → `application/javascript`
   - `.json` files → `application/json`
   - `.css` files → `text/css`
   - `.html` files → `text/html`
   - `.png/.jpg` files → `image/png` or `image/jpeg`

### Common MIME Type Issues

**Issue: "Refused to execute script ... MIME type 'text/plain'"**
- Cause: Server sending wrong Content-Type
- Solution: Check `metro.config.js` middleware configuration
- Solution: Verify file extensions in imports

**Issue: "Resource interpreted as Stylesheet but transferred with MIME type 'text/html'"**
- Cause: 404 error returning HTML instead of CSS
- Solution: Check file paths in imports
- Solution: Verify file exists in project

## Performance Testing

### Web Performance

- [ ] Initial bundle size reasonable (< 2MB)
- [ ] Page loads in < 3 seconds
- [ ] No console errors
- [ ] React DevTools shows proper component tree

### Native Performance

- [ ] App launches in < 2 seconds
- [ ] Navigation is smooth (60fps)
- [ ] No memory leaks
- [ ] Bundle size reasonable for platform

## Troubleshooting

### Clear All Caches

```bash
cd mobile

# Clear Expo cache
npx expo start --clear

# Clear Metro bundler cache
rm -rf node_modules/.cache

# Clear watchman cache (macOS/Linux)
watchman watch-del-all

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Reset Project

```bash
cd mobile

# Remove generated folders
rm -rf ios android

# Regenerate native projects
npx expo prebuild --clean

# Clear caches and restart
npx expo start --clear
```

### Check Configuration Files

Verify these files are correctly configured:

- `babel.config.js` - Path aliases
- `metro.config.js` - Metro bundler config, MIME types
- `webpack.config.js` - Web build config, native module stubs
- `tsconfig.json` - TypeScript path aliases
- `app.config.js` - Expo configuration, deep linking

## Environment-Specific Notes

### Web Environment
- Native modules must have web stubs
- Some features may be limited (camera, notifications)
- Use browser DevTools for debugging

### iOS Environment
- Requires macOS
- Xcode must be installed
- iOS-specific features in `src/utils/iosInit.ts`

### Android Environment
- Works on Windows, macOS, Linux
- Android Studio or SDK required
- Android-specific features in `src/utils/androidInit.ts`

## Success Criteria

All platforms pass testing when:

✅ App builds without errors
✅ App launches without crashes
✅ Navigation works correctly
✅ Path aliases resolve properly
✅ No MIME type errors (web)
✅ Deep linking works (native)
✅ Console is clean (no red errors)
✅ Performance is acceptable

## Additional Resources

- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [Metro Bundler Documentation](https://facebook.github.io/metro/)
- [React Native Web Documentation](https://necolas.github.io/react-native-web/)
