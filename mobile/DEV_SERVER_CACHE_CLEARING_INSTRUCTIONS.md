# Development Server Cache Clearing Instructions

This document provides complete instructions for starting the Expo development server with cache clearing flags to force complete Metro bundler cache invalidation.

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm run start:clear` | Start mobile dev server with cache clearing |
| `npm run start:web:clear` | Start web dev server with cache clearing |
| `npm run verify-dev-server` | Verify server is running and accessible |

## Complete Instructions

### Step 1: Navigate to Mobile Directory

```bash
cd mobile
```

### Step 2: Start Development Server with Cache Clearing

#### Option A: For Mobile (iOS/Android)

Choose one of the following methods:

**Method 1: Using npm script (Recommended)**
```bash
npm run start:clear
```

**Method 2: Using npx directly**
```bash
npx expo start --clear --reset-cache
```

**Method 3: Using shell scripts**

Windows (PowerShell):
```powershell
.\scripts\start-dev-clear-cache.ps1
```

Windows (Batch):
```bat
.\scripts\start-dev-clear-cache.bat
```

macOS/Linux:
```bash
./scripts/start-dev-clear-cache.sh
```

#### Option B: For Web Platform

Choose one of the following methods:

**Method 1: Using npm script (Recommended)**
```bash
npm run start:web:clear
```

**Method 2: Using npx directly**
```bash
npx expo start --clear --web
```

**Method 3: Using shell scripts**

Windows (PowerShell):
```powershell
.\scripts\start-web-clear-cache.ps1
```

Windows (Batch):
```bat
.\scripts\start-web-clear-cache.bat
```

macOS/Linux:
```bash
./scripts/start-web-clear-cache.sh
```

### Step 3: Verify Server Started Successfully

#### For Mobile (iOS/Android)

1. **Check Terminal Output**
   - Look for the QR code displayed in the terminal
   - Verify the server is running on `exp://[your-ip]:8081`
   - Ensure no bundling errors appear

2. **Expected Output:**
   ```
   Starting Metro Bundler
   
   Metro waiting on exp://192.168.x.x:8081
   › Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
   
   › Press a │ open Android
   › Press i │ open iOS simulator
   › Press w │ open web
   ```

3. **Verify No Errors**
   - No red error messages
   - No "Unable to resolve module" errors
   - No "Transform error" messages

#### For Web Platform

1. **Check Terminal Output**
   - Look for confirmation that web server started
   - Note the port number (default: 8081)
   - Ensure no bundling errors appear

2. **Navigate to Web Server**
   ```
   http://localhost:8081
   ```

3. **Verify index.bundle Loads**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Look for `index.bundle?platform=web` request
   - Verify it returns 200 status
   - Check that bundle size is reasonable (not 0 bytes)

4. **Check Console for Errors**
   - Open browser Console tab
   - Verify no red error messages
   - Application should load successfully

### Step 4: Optional - Verify Server Programmatically

In a separate terminal window:

```bash
cd mobile
npm run verify-dev-server
```

This will check:
- ✓ Server is running on port 8081
- ✓ Web bundle is accessible
- ✓ Returns detailed status

## What Gets Cleared

When you use `--clear --reset-cache` flags:

### Metro Bundler Cache
- JavaScript module cache
- Babel transformation cache
- Asset cache

### Watchman Cache (if installed)
- File system watch cache
- Directory state cache

### Expo Cache
- Expo-specific caches
- Temporary build artifacts

### Transform Cache
- Cached transformed modules
- Cached dependencies

## Troubleshooting

### Server Won't Start

**Port Already in Use:**

Windows (PowerShell):
```powershell
$processId = (Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue).OwningProcess
if ($processId) { Stop-Process -Id $processId -Force }
```

macOS/Linux:
```bash
lsof -ti:8081 | xargs kill -9
```

**Node Modules Issues:**
```bash
rm -rf node_modules
npm install
npm run start:clear
```

### Cache Still Not Clearing

**Full Clean:**

Windows (PowerShell):
```powershell
Remove-Item -Recurse -Force node_modules, .expo, dist -ErrorAction SilentlyContinue
npm install
npm run start:clear
```

macOS/Linux:
```bash
rm -rf node_modules .expo dist
npm install
npm run start:clear
```

**Clear System Caches:**
```bash
# Clear Metro cache
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*

# Clear Expo cache
rm -rf ~/.expo/

# Reset Watchman (if installed)
watchman watch-del-all
watchman shutdown-server
```

### Bundle Not Loading on Web

1. **Check if server is running:**
   ```bash
   npm run verify-dev-server
   ```

2. **Try different browser:**
   - Open in incognito/private mode
   - Clear browser cache
   - Try Chrome/Firefox/Safari

3. **Check browser console:**
   - Look for CORS errors
   - Look for network errors
   - Verify bundle URL is correct

4. **Restart with fresh cache:**
   ```bash
   # Stop server (Ctrl+C)
   npm run start:web:clear
   ```

### QR Code Not Showing

1. **Check terminal size:**
   - Make terminal window larger
   - QR code needs space to display

2. **Use tunnel mode:**
   ```bash
   npx expo start --clear --reset-cache --tunnel
   ```

3. **Get URL manually:**
   - Look for the exp:// URL in terminal
   - Type it manually in Expo Go app

## Platform-Specific Notes

### iOS

**Scanning QR Code:**
- Use native Camera app (iOS 11+)
- Or use Expo Go app scanner
- Must be on same WiFi network

**Common Issues:**
- Trust developer certificate if needed
- Check firewall isn't blocking port 8081
- Ensure iPhone and computer on same network

### Android

**Scanning QR Code:**
- Use Expo Go app scanner
- Must be on same WiFi network

**Common Issues:**
- Enable "Unknown sources" if needed
- Check firewall isn't blocking port 8081
- Try USB debugging if WiFi fails

### Web

**Accessing Bundle:**
- Navigate to `http://localhost:8081`
- Bundle served at `http://localhost:8081/index.bundle?platform=web`

**Common Issues:**
- Clear browser cache
- Try incognito mode
- Check for ad blockers
- Verify no proxy interference

## Additional Resources

- [CACHE_CLEARING_GUIDE.md](./CACHE_CLEARING_GUIDE.md) - Detailed cache clearing guide
- [QUICK_START_CACHE_CLEARING.md](./QUICK_START_CACHE_CLEARING.md) - Quick reference card
- [scripts/README.md](./scripts/README.md) - All available scripts

## Cheat Sheet

```bash
# Navigate to mobile directory
cd mobile

# Start mobile dev server with cache clearing
npm run start:clear

# Start web dev server with cache clearing
npm run start:web:clear

# Verify server is running
npm run verify-dev-server

# Full clean and rebuild
rm -rf node_modules .expo dist
npm install
npm run start:clear
```

---

**Note:** The development server will continue running until you stop it with `Ctrl+C`. Leave it running while you develop and test your application.
