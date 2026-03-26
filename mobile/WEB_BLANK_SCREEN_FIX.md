# Fixed: Blank Screen Issue on Expo Web

## Changes Made

1. **Fixed localStorage support on web platform** 
   - Store now uses `localStorage` on web instead of AsyncStorage
   - Uses AsyncStorage on native platforms (iOS/Android)

2. **Improved error handling in app initialization**
   - `loadStoredAuth()` no longer blocks app rendering if API is unavailable
   - All platform-specific init wrapped in try/catch with warnings instead of crashes

3. **Added ErrorBoundary wrapper**
   - Prevents entire app from crashing on component errors
   - Shows error message if something goes wrong

4. **Better PersistGate logging**
   - Added hooks to track Redux hydration status

## Troubleshooting Steps

### If you still see a blank screen:

#### 1. **Clear all caches and rebuild**
```bash
cd d:\htdocs\edu\mobile
rm -r .expo .next node_modules/.cache
npm run start:clear
```

#### 2. **Ensure environment variables are set**
Create/update `.env` file in mobile folder:
```
API_BASE_URL=http://localhost:8000
API_VERSION=v1
APP_ENV=development
```

#### 3. **Check browser console for errors**
- Open browser DevTools (F12)
- Go to Console tab
- Look for any error messages
- Check Network tab to see if assets load correctly

#### 4. **Verify backend is running**
```bash
# Check if backend API is accessible
curl http://localhost:8000/api/v1/health
```

If you get "Connection refused", the backend needs to be started.

#### 5. **Check if node_modules are installed**
```bash
cd mobile
npm install
```

#### 6. **Try different Expo mode**
Instead of tunnel mode, try local mode:
```bash
npx expo start --clear --localhost
```

Then open in browser: `http://localhost:8081`

### Common Issues & Solutions

**Issue: "Something went wrong" error message**
- Check the console error details
- This usually means a component threw an error during render
- Ensure all dependencies are installed

**Issue: Blank white screen, no error**
- The PersistGate might be stuck loading
- Try clearing AsyncStorage/localStorage and reloading

**Issue: API endpoints not responding**
- Make sure backend at `http://localhost:8000` is running
- Check API_BASE_URL in .env matches your backend URL
- App should still show login screen even if API is down

**Issue: Assets (icons, images) not loading**
- Ensure assets/ folder exists with: icon.png, splash.png, favicon.png
- Check Network tab in DevTools to see 404 errors
- Try npm run start:clear to rebuild asset bundle

## What Was Fixed

The main issues were:
1. Storage system wasn't compatible with web platform
2. App initialization was blocking on API calls
3. No error boundaries to catch component errors
4. Missing error handling in async initialization

The app should now:
- ✅ Render immediately even if API is unreachable
- ✅ Show login screen on startup (no auth required for web)
- ✅ Gracefully handle missing API
- ✅ Display helpful error messages if something fails
- ✅ Store state properly on web using localStorage

## Next Steps

1. Start the development server: `npx expo start --clear`
2. Open http://localhost:8081 in your browser
3. Check browser console for any messages
4. Try logging in with demo credentials
5. Check backend logs if API calls fail

If you're still having issues, share the error message from browser console (F12).
