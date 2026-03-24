# Expo Router Testing Checklist

Quick reference checklist for testing Expo Router across all platforms.

## Pre-Testing Setup

- [ ] Install dependencies: `cd mobile && npm install`
- [ ] Clear all caches: `npx expo start --clear`

## Web Platform Testing

### Commands
```bash
cd mobile
npx expo start --clear    # Clear cache first
npx expo start --web      # Start web server
```

### Test Items
- [ ] Server starts without errors
- [ ] Navigate to `http://localhost:8081` - no 500 errors
- [ ] Navigate to `http://localhost:8081/(auth)/login` - route works
- [ ] Open browser console (F12) - no MIME type errors
- [ ] Check Network tab - JS files have `Content-Type: application/javascript`
- [ ] All path aliases resolve (@components, @screens, etc.)
- [ ] Native modules use web stubs (no native module errors)

### Browser Console Checks
- [ ] No red errors in Console tab
- [ ] No MIME type warnings
- [ ] No "module not found" errors
- [ ] No 404 errors for module files

## iOS Platform Testing (macOS only)

### Commands
```bash
cd mobile
npx expo start --ios              # Start iOS
npx expo start --clear --ios      # With cache clear
```

### Test Items
- [ ] App builds successfully (no build errors)
- [ ] iOS Simulator launches
- [ ] App installs and opens without crashes
- [ ] Login screen shows (/(auth)/login route works)
- [ ] Metro bundler console clean (no red errors)
- [ ] All path aliases resolve
- [ ] Deep linking works: `xcrun simctl openurl booted "edutrack:///(auth)/login"`

### Simulator Checks
- [ ] App icon appears
- [ ] App launches without crash
- [ ] Navigation works smoothly
- [ ] No Metro bundler errors

## Android Platform Testing

### Commands
```bash
cd mobile
npx expo start --android              # Start Android
npx expo start --clear --android      # With cache clear
```

### Test Items
- [ ] App builds successfully (no build errors)
- [ ] Android emulator shows app
- [ ] App installs and opens without crashes
- [ ] Login screen shows (/(auth)/login route works)
- [ ] Metro bundler console clean (no red errors)
- [ ] All path aliases resolve
- [ ] Deep linking works: `adb shell am start -W -a android.intent.action.VIEW -d "edutrack:///(auth)/login" com.yourcompany.edutrack`

### Emulator Checks
- [ ] App installs successfully
- [ ] App launches without crash
- [ ] Navigation works smoothly
- [ ] No Metro bundler errors

## Path Aliases Verification

Test these imports work on all platforms:

- [ ] `@components` → `src/components`
- [ ] `@screens` → `src/screens`
- [ ] `@store` → `src/store`
- [ ] `@utils` → `src/utils`
- [ ] `@config` → `src/config`
- [ ] `@types` → `src/types`
- [ ] `@api` → `src/api`
- [ ] `@hooks` → `src/hooks`
- [ ] `@services` → `src/services`
- [ ] `@constants` → `src/constants`
- [ ] `@theme` → `src/theme`

## Navigation Routes Testing

Test these routes on all platforms:

### Web (Direct URL)
- [ ] `http://localhost:8081/` - Root
- [ ] `http://localhost:8081/(auth)/login` - Login
- [ ] `http://localhost:8081/profile` - Profile
- [ ] `http://localhost:8081/settings` - Settings

### Native (Deep Links)
- [ ] `edutrack:///` - Root
- [ ] `edutrack:///(auth)/login` - Login
- [ ] `edutrack:///profile` - Profile
- [ ] `edutrack:///settings` - Settings

## MIME Type Verification (Web Only)

### Expected MIME Types
- [ ] `.js` files → `application/javascript; charset=utf-8`
- [ ] `.json` files → `application/json; charset=utf-8`
- [ ] `.css` files → `text/css; charset=utf-8`
- [ ] `.html` files → `text/html; charset=utf-8`
- [ ] `.png` files → `image/png`
- [ ] `.jpg` files → `image/jpeg`
- [ ] `.svg` files → `image/svg+xml; charset=utf-8`

### How to Check
1. Open browser DevTools (F12)
2. Go to Network tab
3. Reload page
4. Click on any JS file
5. Check Headers → Response Headers → Content-Type

## Configuration Files Check

Verify these files are correct:

- [ ] `babel.config.js` - Path aliases configured
- [ ] `metro.config.js` - MIME types and path aliases
- [ ] `webpack.config.js` - Web stubs for native modules
- [ ] `tsconfig.json` - TypeScript path aliases
- [ ] `app.config.js` - Expo configuration and scheme
- [ ] `app/_layout.tsx` - Router configuration

## Common Issues Checklist

### If Web Shows 500 Error
- [ ] Clear cache: `npx expo start --clear`
- [ ] Check `app/_layout.tsx` for web-incompatible code
- [ ] Verify native modules have web stubs in `src/utils/stubs/`

### If MIME Type Errors Appear
- [ ] Check `metro.config.js` middleware configuration
- [ ] Verify file extensions in imports
- [ ] Clear cache and restart server

### If Module Not Found Errors
- [ ] Check `babel.config.js` aliases
- [ ] Verify `tsconfig.json` paths
- [ ] Restart Metro bundler
- [ ] Run `npm install`

### If iOS Build Fails
- [ ] Run `npx expo prebuild --clean`
- [ ] Delete `ios` folder and regenerate
- [ ] Check Xcode version

### If Android Build Fails
- [ ] Run `npx expo prebuild --clean`
- [ ] Delete `android` folder and regenerate
- [ ] Check Android SDK/Gradle versions

## Performance Checks

### Web
- [ ] Bundle size < 2MB
- [ ] Page loads < 3 seconds
- [ ] No console errors
- [ ] Smooth navigation

### Native (iOS/Android)
- [ ] App launches < 2 seconds
- [ ] Navigation is smooth (60fps)
- [ ] No memory warnings
- [ ] No Metro bundler warnings

## Final Verification

### All Platforms
- [ ] ✅ App builds without errors
- [ ] ✅ App launches without crashes
- [ ] ✅ Navigation works correctly
- [ ] ✅ Path aliases resolve properly
- [ ] ✅ Console is clean (no red errors)
- [ ] ✅ Performance is acceptable

### Web Specific
- [ ] ✅ No 500 errors
- [ ] ✅ No MIME type errors
- [ ] ✅ All routes load correctly

### Native Specific
- [ ] ✅ Deep linking works
- [ ] ✅ Platform initialization successful
- [ ] ✅ Native features work correctly

## Quick Commands Reference

```bash
# Web testing
cd mobile && npx expo start --web

# iOS testing (macOS only)
cd mobile && npx expo start --ios

# Android testing
cd mobile && npx expo start --android

# Clear cache
cd mobile && npx expo start --clear

# Test deep link (iOS)
xcrun simctl openurl booted "edutrack:///(auth)/login"

# Test deep link (Android)
adb shell am start -W -a android.intent.action.VIEW -d "edutrack:///(auth)/login" com.yourcompany.edutrack

# Clear all caches
cd mobile
npx expo start --clear
rm -rf node_modules/.cache
watchman watch-del-all  # macOS/Linux only
```

## Notes

- iOS testing requires macOS
- Android testing requires Android SDK
- Web testing works on all platforms
- Always test with cache cleared first
- Check Metro bundler console for errors
- Use browser DevTools for web debugging

## Test Scripts

Use the provided test scripts for guided testing:

**PowerShell (Windows):**
```powershell
.\test-expo-router.ps1 -All
```

**Bash (macOS/Linux):**
```bash
chmod +x test-expo-router.sh
./test-expo-router.sh --all
```
