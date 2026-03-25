# Web Build Testing Guide

Quick reference guide for testing the web platform build.

## Quick Start

```bash
cd mobile
npx expo start --web
```

App will be available at: `http://localhost:8081`

## Test Checklist

### ✅ 1. App Load Test
- [ ] Navigate to `http://localhost:8081`
- [ ] Verify app loads without 500 errors
- [ ] Check browser console for errors
- [ ] Verify no MIME type warnings

### ✅ 2. MIME Type Verification
Open browser DevTools → Network tab:
- [ ] Filter by `.js` files
- [ ] Check all JS files have `Content-Type: application/javascript; charset=utf-8`
- [ ] Filter by `.bundle` files
- [ ] Verify bundle files have correct content type
- [ ] No MIME type warnings in console

### ✅ 3. Login Route Test
Navigate to `/(auth)/login` or `http://localhost:8081/login`:
- [ ] Login form renders correctly
- [ ] Email input works
- [ ] Password input works
- [ ] Institution ID input works (optional)
- [ ] Sign In button is clickable
- [ ] No console errors on render

### ✅ 4. Authentication Flow Test
- [ ] Enter valid credentials
- [ ] Click Sign In
- [ ] Verify redirect to `/(tabs)/student`
- [ ] Check localStorage for auth tokens
- [ ] Verify user session persists on reload

### ✅ 5. Student Tab Navigation
After login, test navigation:
- [ ] Home tab loads
- [ ] Assignments tab loads
- [ ] Schedule tab loads
- [ ] Grades tab loads
- [ ] Profile tab loads
- [ ] No console errors on tab switches

### ✅ 6. Network Tab Inspection
Open DevTools → Network tab:
- [ ] Check all `.js` files have proper headers
- [ ] Verify `.bundle` files are served correctly
- [ ] Check bundle sizes are reasonable
- [ ] No failed resource loads (404s)

### ✅ 7. Console Verification
Check browser console for:
- [ ] No critical errors
- [ ] Proper initialization logs
- [ ] No unhandled promise rejections
- [ ] No React warnings

### ✅ 8. Offline Support Test
Test offline functionality:
- [ ] Open DevTools → Network tab
- [ ] Set throttling to "Offline"
- [ ] Verify offline indicator appears
- [ ] Try to perform actions (should queue)
- [ ] Set back to "Online"
- [ ] Verify queued actions process

### ✅ 9. Responsive Design Test
Test different screen sizes:
- [ ] Desktop view (1920x1080)
- [ ] Tablet view (768x1024)
- [ ] Mobile view (375x667)
- [ ] Layout adjusts properly
- [ ] No horizontal scroll

### ✅ 10. Browser Compatibility
Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

## Expected Results

### Successful Load
```
Console Output:
✓ [Web] Skipping iOS-specific initialization on web platform
✓ [Web] Skipping Android-specific initialization on web platform
✓ [Web] Initializing web offline support...
✓ [Web] Offline support initialized successfully
✓ [App Init] loadStoredAuth result: ...
```

### Network Headers
```
Request URL: http://localhost:8081/index.bundle
Status: 200 OK
Content-Type: application/javascript; charset=utf-8
```

### No MIME Warnings
Console should NOT contain:
```
❌ Failed to load resource: the server responded with a status of 500
❌ Refused to execute script... MIME type ('text/plain')
❌ Refused to execute script... MIME type ('text/html')
```

## Common Issues & Solutions

### Issue: 500 Server Error

**Symptoms:**
- App shows blank screen
- Console shows 500 error
- Bundle fails to load

**Solutions:**
1. Clear Metro cache:
   ```bash
   npx expo start --web --clear
   ```
2. Delete `.expo` folder and restart:
   ```bash
   rm -rf .expo
   npx expo start --web
   ```

### Issue: MIME Type Warnings

**Symptoms:**
- Console warns about MIME types
- Scripts refused to execute
- App may partially load

**Solutions:**
1. Verify `metro.config.js` has MIME type middleware
2. Restart Metro bundler
3. Clear browser cache (Ctrl+Shift+Delete)

### Issue: Module Not Found

**Symptoms:**
- "Module not found" errors
- Missing `.web.ts` files
- Import errors

**Solutions:**
1. Verify all `.web.ts` files exist:
   - `src/utils/iosInit.web.ts`
   - `src/utils/androidInit.web.ts`
   - `src/utils/offlineInit.web.ts`
   - `src/utils/networkStatus.web.ts`
   - `src/utils/offlineQueue.web.ts`
   - `src/hooks/useNetworkStatus.web.ts`
2. Restart Metro with `--clear` flag

### Issue: Login Route Not Found

**Symptoms:**
- 404 when navigating to /login
- Login form doesn't render

**Solutions:**
1. Check `app/(auth)/login.tsx` exists
2. Verify Expo Router configuration
3. Clear Metro cache and restart

### Issue: Storage Not Persisting

**Symptoms:**
- User logged out on refresh
- Settings not saved
- Data loss on reload

**Solutions:**
1. Check browser allows localStorage
2. Verify no Private/Incognito mode
3. Check browser storage quota
4. Clear localStorage and try again:
   ```javascript
   // In browser console
   localStorage.clear()
   ```

### Issue: Network Detection Not Working

**Symptoms:**
- Offline status not detected
- Queue doesn't process when online
- Network events not firing

**Solutions:**
1. Check browser console for errors
2. Verify browser supports Navigator API
3. Test with DevTools throttling
4. Check network event listeners are attached

## Performance Benchmarks

### Initial Load Time
- **Target:** < 3 seconds on 3G
- **Measure:** Time to interactive (TTI)

### Bundle Size
- **Main bundle:** < 2MB (gzipped)
- **Vendor chunks:** < 1MB each
- **Total assets:** < 5MB

### Runtime Performance
- **Frame rate:** 60 FPS
- **Memory usage:** < 100MB
- **CPU usage:** < 30% on interactions

## Testing Tools

### Browser DevTools
- **Console:** Check for errors and logs
- **Network:** Monitor requests and responses
- **Application:** Inspect localStorage/sessionStorage
- **Performance:** Measure load times
- **Lighthouse:** Run audit for PWA score

### Command Line
```bash
# Start web server
npx expo start --web

# Start with cache cleared
npx expo start --web --clear

# Build production bundle
npm run build:web

# Analyze bundle
npm run analyze-bundle
```

### Browser Extensions
- **React DevTools:** Debug React components
- **Redux DevTools:** Inspect Redux state
- **Web Vitals:** Measure performance metrics

## Reporting Issues

When reporting issues, include:
1. Browser name and version
2. Console error messages (full stack trace)
3. Network tab screenshot showing failed requests
4. Steps to reproduce
5. Expected vs actual behavior

## Additional Resources

- [WEB_PLATFORM_IMPLEMENTATION.md](./WEB_PLATFORM_IMPLEMENTATION.md) - Implementation details
- [WEB_OPTIMIZATION_SUMMARY.md](./WEB_OPTIMIZATION_SUMMARY.md) - Performance optimization
- [Expo Router Docs](https://expo.github.io/router/) - Routing documentation
- [Metro Docs](https://facebook.github.io/metro/) - Bundler documentation
