# Android Asset Loading Issue - Fix Guide

## Problem
Expo development app on Android shows error: "failed to load all assets"

## Root Causes

1. **Asset bundle not properly configured** - assetBundlePatterns might not include all files
2. **Missing or corrupted cache** - Metro bundler cache needs clearing
3. **Plugin configuration issues** - Notification icon or other plugin assets missing
4. **Gradle/native build issues** - Android build cache corrupted

## Quick Fixes (Try These First)

### Step 1: Clear All Caches
```bash
cd d:\htdocs\edu\mobile

# Clear npm/metro caches
rm -r node_modules/.cache
rm -r .expo
rm -r .next
rm -r ~/.gradle/caches (if on different system)

# Windows:
rmdir /s /q node_modules\.cache
rmdir /s /q .expo
rmdir /s /q .next
```

### Step 2: Reinstall Dependencies
```bash
npm install
```

### Step 3: Clear Android Cache
```bash
# If using Android Studio or local build
cd android
./gradlew clean
cd ..

# Windows:
cd android
gradlew.bat clean
cd ..
```

### Step 4: Start Fresh Development Server
```bash
npx expo start --clear --reset-cache
```

### Step 5: Rebuild Development App
```bash
npx expo run:android --clear
```

## If Issue Persists

### Option A: Use Expo Go Instead of Development Client
```bash
# Stop current tunnel
# Open Expo Go app
# Scan QR code instead of building development client
npx expo start --tunnel
```

### Option B: Check Assets Configuration

Verify `app.config.js` has proper assetBundlePatterns:
```javascript
assetBundlePatterns: [
  '**/*',
  'assets/**/*',
  'src/**/*.{png,jpg,jpeg,gif,webp,svg}',
],
```

### Option C: Verify Asset Files Exist
```bash
# Check required assets
cd d:\htdocs\edu\mobile\assets
ls -la

# Required files:
# - icon.png
# - splash.png
# - adaptive-icon.png
# - favicon.png
# - notification-icon.png (optional but recommended)
```

### Option D: Check Build Logs
```bash
# Run build with verbose output
npx expo run:android --verbose 2>&1 | tee build.log

# Windows PowerShell:
npx expo run:android --verbose 2>&1 | Tee-Object -FilePath build.log
```

## Environmental Troubleshooting

### Check Android Environment
```bash
# Verify Android SDK is installed
echo %ANDROID_HOME%  # Windows
echo $ANDROID_HOME   # PowerShell

# Verify Java is installed
java -version

# Check Android tools
adb devices
```

### Verify .env Configuration
```bash
# Check your .env file has correct settings
cat .env

# Should have:
API_BASE_URL=http://localhost:8000
API_VERSION=v1
APP_ENV=development
```

## Metro Bundler Cache Issues

If the bundler cache is corrupted:

```bash
# Windows - Clear Metro temp files
rmdir /s /q %TEMP%\metro-cache
rmdir /s /q %TEMP%\haste-map-*

# Clear Gradle cache
rmdir /s /q %USERPROFILE%\.gradle\caches
```

## Plugin Configuration Check

Verify all plugins in `app.config.js` have valid paths:

```javascript
plugins: [
  [
    'expo-notifications',
    {
      icon: existsSync('./assets/notification-icon.png') 
        ? './assets/notification-icon.png' 
        : './assets/icon.png',  // fallback to icon.png
      color: '#ffffff',
    },
  ],
  // ... other plugins
]
```

## Asset Pipeline Verification

Create a test script to verify assets are bundled:

```bash
# Run export to check bundling
npx expo export --platform android --extra-dump-dir ./bundle-test

# Check if assets are in the bundle
ls -la bundle-test/
```

## Network Troubleshooting

If using Tunnel mode:

```bash
# Try LAN mode instead
npx expo start --clear --lanIf that works, tunnel mode has issues

# Or try localhost mode (Android device must be connected via USB)
npx expo start --clear --localhost
```

## Step-by-Step Debug Process

1. **Verify Android emulator/device is running**
   ```bash
   adb devices
   ```

2. **Check connection to dev server**
   ```bash
   # Should see output with your IP and port
   npx expo start
   ```

3. **Check bundler output for errors**
   - Look for warnings about missing assets
   - Look for Metro bundler errors

4. **Check app logs while running**
   ```bash
   # In another terminal
   adb logcat | grep "assets\|error\|failed"
   ```

5. **Test with minimal app**
   - Temporarily move/rename large asset files
   - Restart server
   - See if app loads with fewer assets

## Common Failed Asset Patterns

### ❌ Wrong Pattern
```javascript
assetBundlePatterns: ['assets/**']  // Might miss some files
```

### ✅ Correct Pattern
```javascript
assetBundlePatterns: [
  '**/*',
  'assets/**/*',
  'src/**/*.{png,jpg,jpeg,gif,webp,svg}',
]
```

## Final Nuclear Option

If nothing works, start completely fresh:

```bash
# Backup current work
copy package.json package.json.bak
copy app.config.js app.config.js.bak

# Remove everything and rebuild
rm -r node_modules android/app/build .expo

# Windows:
rmdir /s /q node_modules
rmdir /s /q android\app\build
rmdir /s /q .expo

# Reinstall
npm install

# Rebuild
npx expo run:android --clear
```

## Getting Help

If issue persists:

1. Check console output for specific asset name that failed to load
2. Note the exact error message
3. Run: `npm list | grep expo` to check versions
4. Check Expo documentation for your version
5. Consider updating Expo: `npx expo@latest`

## Preventive Measures

For future development:

1. ✅ Always use `--clear` flag when starting server
2. ✅ Keep assets in `assets/` folder, not scattered in `src/`
3. ✅ Use URI-based images for dynamic content
4. ✅ Test on both Android emulator and physical device
5. ✅ Keep assetBundlePatterns broad: `['**/*']`
6. ✅ Regularly clear caches: `npm run start:clear`
