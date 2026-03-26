# Metro Bundler Cache Clearing Guide

This guide provides instructions for starting the Expo development server with cache clearing flags to force complete Metro bundler cache invalidation.

## Overview

When developing with Expo and React Native, cached assets and bundles can sometimes cause issues. This guide shows you how to properly clear all caches and start fresh.

## Quick Start Commands

### Start Development Server with Cache Clearing

```bash
# From the mobile directory
npx expo start --clear --reset-cache
```

Or use the npm script:

```bash
npm run start:clear
```

Or use the shell scripts:

**PowerShell (Windows):**
```powershell
.\scripts\start-dev-clear-cache.ps1
```

**Bash (macOS/Linux):**
```bash
./scripts/start-dev-clear-cache.sh
```

### Start Web Platform with Cache Clearing

```bash
# From the mobile directory
npx expo start --clear --web
```

Or use the npm script:

```bash
npm run start:web:clear
```

Or use the shell scripts:

**PowerShell (Windows):**
```powershell
.\scripts\start-web-clear-cache.ps1
```

**Bash (macOS/Linux):**
```bash
./scripts/start-web-clear-cache.sh
```

## What Gets Cleared

When using `--clear` and `--reset-cache` flags:

1. **Metro Bundler Cache**: Clears the JavaScript bundler cache
2. **Watchman Cache**: Resets file watcher caches (if Watchman is installed)
3. **Expo Cache**: Clears Expo-specific cached data
4. **Transform Cache**: Clears cached Babel transformations

## Verification Steps

### For Mobile Development (iOS/Android)

1. Run the cache clearing command
2. Wait for the development server to start
3. Verify you see the QR code in the terminal
4. Look for output similar to:
   ```
   Metro waiting on exp://192.168.x.x:8081
   › Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
   ```
5. Confirm there are no bundling errors

### For Web Platform

1. Run the web cache clearing command
2. Wait for the development server to start on port 8081
3. Navigate to `http://localhost:8081` in your browser
4. Verify the index.bundle loads successfully
5. Open browser developer tools (F12)
6. Check the Network tab to confirm `index.bundle?platform=web` loads without errors
7. Check the Console tab for any JavaScript errors

## Common Scenarios

### When to Clear Cache

Clear the Metro bundler cache when you experience:

- Stale imports or modules not updating
- Unexpected behavior after installing new dependencies
- Build errors that don't make sense
- Assets not updating despite file changes
- Strange bundling or transformation errors

### Full Clean and Rebuild

For a complete fresh start, combine cache clearing with other cleanup steps:

**PowerShell:**
```powershell
# From mobile directory
Remove-Item -Recurse -Force node_modules, .expo, dist -ErrorAction SilentlyContinue
npm install
npx expo start --clear --reset-cache
```

**Bash:**
```bash
# From mobile directory
rm -rf node_modules .expo dist
npm install
npx expo start --clear --reset-cache
```

## Available npm Scripts

| Script | Description |
|--------|-------------|
| `npm run start` | Start dev server normally |
| `npm run start:clear` | Start with `--clear --reset-cache` |
| `npm run start:web` | Start web platform normally |
| `npm run start:web:clear` | Start web with `--clear` |

## Troubleshooting

### Port Already in Use

If you get an error that port 8081 is already in use:

**PowerShell:**
```powershell
# Find and kill process on port 8081
$processId = (Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue).OwningProcess
if ($processId) { Stop-Process -Id $processId -Force }
```

**Bash:**
```bash
# macOS/Linux
lsof -ti:8081 | xargs kill -9
```

### Cache Still Not Clearing

If cache issues persist after using `--clear --reset-cache`:

1. Stop all Metro bundler processes
2. Clear additional caches:
   ```bash
   # From mobile directory
   rm -rf $TMPDIR/metro-* $TMPDIR/haste-*
   rm -rf ~/.expo/
   ```
3. Restart your development server

### Watchman Issues

If you have Watchman installed and experiencing issues:

```bash
watchman watch-del-all
watchman shutdown-server
```

Then restart your development server with cache clearing flags.

## Platform-Specific Notes

### iOS
- The QR code can be scanned with the iPhone Camera app
- Or use the Expo Go app to scan the QR code
- Development server must be on the same network

### Android
- Use the Expo Go app to scan the QR code
- Or manually enter the development server URL in Expo Go
- Development server must be on the same network

### Web
- Navigate to `http://localhost:8081` after the server starts
- The bundle will be served at `http://localhost:8081/index.bundle?platform=web`
- Use browser DevTools to verify successful bundle loading
- Check for any console errors or network failures

## References

- [Expo CLI Documentation](https://docs.expo.dev/more/expo-cli/)
- [Metro Bundler](https://facebook.github.io/metro/)
- [Troubleshooting Expo](https://docs.expo.dev/troubleshooting/overview/)
