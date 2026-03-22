# Authentication Flow Testing Guide

This guide provides step-by-step instructions for testing all authentication flows across all platforms (iOS, Android, and Web).

## Prerequisites

- App installed on test device or running in simulator/emulator
- Demo credentials ready:
  - Student: `demo@example.com` / `Demo@123`
  - Parent: `parent@demo.com` / `Demo@123`

## Test Cases

### 1. Login with Demo Credentials

#### Test 1.1: Student Login
**Steps:**
1. Open the app
2. Navigate to login screen
3. Enter email: `demo@example.com`
4. Enter password: `Demo@123`
5. Tap "Login" button

**Expected Results:**
- ✅ Login successful
- ✅ Redirected to student dashboard
- ✅ User name "Alex Johnson" displayed
- ✅ Student role active
- ✅ No error messages

**Platforms:** iOS ✓ | Android ✓ | Web ✓

---

#### Test 1.2: Parent Login
**Steps:**
1. Open the app
2. Navigate to login screen
3. Enter email: `parent@demo.com`
4. Enter password: `Demo@123`
5. Tap "Login" button

**Expected Results:**
- ✅ Login successful
- ✅ Redirected to parent dashboard
- ✅ User name "Sarah Johnson" displayed
- ✅ Parent role active
- ✅ Children list displayed
- ✅ No error messages

**Platforms:** iOS ✓ | Android ✓ | Web ✓

---

#### Test 1.3: Invalid Credentials
**Steps:**
1. Open the app
2. Navigate to login screen
3. Enter email: `invalid@example.com`
4. Enter password: `WrongPassword`
5. Tap "Login" button

**Expected Results:**
- ❌ Login fails
- ✅ Error message displayed
- ✅ User remains on login screen
- ✅ Fields remain editable

**Platforms:** iOS ✓ | Android ✓ | Web ✓

---

### 2. Token Storage

#### Test 2.1: Token Storage on Native Platforms (iOS/Android)
**Steps:**
1. Login with demo credentials
2. Open device file explorer or use debugging tools
3. Check SecureStore for tokens

**Expected Results:**
- ✅ Access token stored in SecureStore
- ✅ Refresh token stored in SecureStore
- ✅ Tokens are encrypted
- ✅ User email stored

**Platforms:** iOS ✓ | Android ✓

**Verification Commands:**
```bash
# iOS Simulator
xcrun simctl get_app_container booted com.yourapp.bundle data

# Android Debug
adb shell run-as com.yourapp.package ls -R /data/data/com.yourapp.package/
```

---

#### Test 2.2: Token Storage on Web Platform
**Steps:**
1. Login with demo credentials
2. Open browser DevTools (F12)
3. Navigate to Application → Storage → Local Storage
4. Check for stored tokens

**Expected Results:**
- ✅ Access token stored in AsyncStorage
- ✅ Refresh token stored in AsyncStorage
- ✅ Tokens accessible via AsyncStorage API
- ✅ User email stored

**Platforms:** Web ✓

**Verification:**
```javascript
// In browser console
AsyncStorage.getItem('@edu_access_token').then(console.log);
AsyncStorage.getItem('@edu_refresh_token').then(console.log);
```

---

### 3. Automatic Token Refresh

#### Test 3.1: Token Auto-Refresh
**Steps:**
1. Login with demo credentials
2. Wait for 14 minutes (token refresh interval)
3. Make an API call or navigate to different screens
4. Check network activity or logs

**Expected Results:**
- ✅ Token refresh occurs automatically
- ✅ New access token generated
- ✅ Refresh token updated
- ✅ User session continues seamlessly
- ✅ No logout or errors

**Platforms:** iOS ✓ | Android ✓ | Web ✓

**Debug Logs to Check:**
```
Token refresh successful
Auto-refresh started
New access token: demo_student_access_token_[timestamp]
```

---

#### Test 3.2: Token Refresh on 401 Error
**Steps:**
1. Login with demo credentials
2. Manually expire access token (in backend if possible)
3. Make an API call
4. Observe refresh behavior

**Expected Results:**
- ✅ 401 error detected
- ✅ Token refresh triggered automatically
- ✅ Original request retried with new token
- ✅ Request succeeds
- ✅ User not logged out

**Platforms:** iOS ✓ | Android ✓ | Web ✓

---

#### Test 3.3: Failed Token Refresh
**Steps:**
1. Login with demo credentials
2. Invalidate refresh token (manually or via backend)
3. Wait for auto-refresh or trigger manually
4. Observe behavior

**Expected Results:**
- ✅ Refresh fails
- ✅ User logged out automatically
- ✅ Redirected to login screen
- ✅ All tokens cleared from storage
- ✅ Redux state reset

**Platforms:** iOS ✓ | Android ✓ | Web ✓

---

### 4. Logout Functionality

#### Test 4.1: Standard Logout
**Steps:**
1. Login with demo credentials
2. Navigate to Settings or Profile
3. Tap "Logout" button
4. Confirm logout if prompted

**Expected Results:**
- ✅ Logout API called
- ✅ All tokens cleared from storage
- ✅ Redux state reset (user, tokens, role)
- ✅ Biometric settings cleared
- ✅ Redirected to login screen
- ✅ Auto-refresh stopped

**Platforms:** iOS ✓ | Android ✓ | Web ✓

**Verification:**
```javascript
// Check Redux state
store.getState().auth.isAuthenticated === false
store.getState().auth.user === null
store.getState().auth.accessToken === null
store.getState().auth.refreshToken === null
store.getState().auth.biometricEnabled === false
```

---

#### Test 4.2: Logout with API Failure
**Steps:**
1. Login with demo credentials
2. Disconnect network
3. Navigate to Settings or Profile
4. Tap "Logout" button

**Expected Results:**
- ✅ Logout API fails (network error)
- ✅ Tokens still cleared from storage
- ✅ Redux state still reset
- ✅ User still redirected to login
- ✅ No errors shown to user

**Platforms:** iOS ✓ | Android ✓ | Web ✓

---

### 5. Biometric Login (iOS/Android Only)

#### Test 5.1: Enable Biometric Authentication (iOS)
**Steps:**
1. Login with demo credentials
2. Navigate to Settings
3. Tap "Enable Face ID"
4. Authenticate with Face ID when prompted
5. Observe result

**Expected Results:**
- ✅ Face ID prompt appears
- ✅ Successful authentication
- ✅ Biometric enabled in settings
- ✅ Setting persisted to storage
- ✅ Confirmation message shown

**Platforms:** iOS ✓

---

#### Test 5.2: Enable Biometric Authentication (Android)
**Steps:**
1. Login with demo credentials
2. Navigate to Settings
3. Tap "Enable Fingerprint"
4. Authenticate with fingerprint when prompted
5. Observe result

**Expected Results:**
- ✅ Fingerprint prompt appears
- ✅ Successful authentication
- ✅ Biometric enabled in settings
- ✅ Setting persisted to storage
- ✅ Confirmation message shown

**Platforms:** Android ✓

---

#### Test 5.3: Biometric Login (iOS)
**Steps:**
1. Enable Face ID (see Test 5.1)
2. Logout
3. On login screen, tap "Login with Face ID"
4. Authenticate with Face ID

**Expected Results:**
- ✅ Face ID prompt appears
- ✅ Successful authentication
- ✅ Stored tokens retrieved
- ✅ User logged in automatically
- ✅ Redirected to appropriate dashboard

**Platforms:** iOS ✓

---

#### Test 5.4: Biometric Login (Android)
**Steps:**
1. Enable Fingerprint (see Test 5.2)
2. Logout
3. On login screen, tap "Login with Fingerprint"
4. Authenticate with fingerprint

**Expected Results:**
- ✅ Fingerprint prompt appears
- ✅ Successful authentication
- ✅ Stored tokens retrieved
- ✅ User logged in automatically
- ✅ Redirected to appropriate dashboard

**Platforms:** Android ✓

---

#### Test 5.5: Biometric Login Failure
**Steps:**
1. Enable biometric authentication
2. Logout
3. On login screen, tap biometric login
4. Cancel authentication or use wrong biometric

**Expected Results:**
- ✅ Authentication fails
- ✅ Error message displayed
- ✅ User remains on login screen
- ✅ Regular login still available
- ✅ No crash or freeze

**Platforms:** iOS ✓ | Android ✓

---

#### Test 5.6: Biometric Not Available on Web
**Steps:**
1. Open web app
2. Navigate to login screen
3. Check for biometric option

**Expected Results:**
- ✅ No biometric login option shown
- ✅ Only email/password login available
- ✅ Settings don't show biometric option

**Platforms:** Web ✓

---

### 6. Session Persistence

#### Test 6.1: App Restart - Session Persists
**Steps:**
1. Login with demo credentials
2. Note current screen/state
3. Force close app (swipe up in task manager)
4. Reopen app

**Expected Results:**
- ✅ User still logged in
- ✅ Redirected to last screen or dashboard
- ✅ User data loaded correctly
- ✅ Tokens restored from storage
- ✅ Biometric settings maintained
- ✅ Active role maintained

**Platforms:** iOS ✓ | Android ✓ | Web ✓

---

#### Test 6.2: Device Reboot - Session Persists
**Steps:**
1. Login with demo credentials
2. Reboot device/simulator
3. Reopen app

**Expected Results:**
- ✅ User still logged in
- ✅ Tokens restored from storage
- ✅ User data loaded correctly
- ✅ All settings maintained

**Platforms:** iOS ✓ | Android ✓

---

#### Test 6.3: Browser Refresh - Session Persists (Web)
**Steps:**
1. Login with demo credentials in web browser
2. Refresh page (F5 or Cmd+R)
3. Observe behavior

**Expected Results:**
- ✅ User still logged in
- ✅ Tokens retrieved from AsyncStorage
- ✅ User redirected to dashboard
- ✅ No data loss

**Platforms:** Web ✓

---

#### Test 6.4: New Browser Tab - Session Persists (Web)
**Steps:**
1. Login with demo credentials in web browser
2. Open app URL in new tab
3. Observe behavior

**Expected Results:**
- ✅ User logged in automatically
- ✅ Same session across tabs
- ✅ Tokens shared via storage

**Platforms:** Web ✓

---

#### Test 6.5: Session Persistence with Biometric Enabled
**Steps:**
1. Login with demo credentials
2. Enable biometric authentication
3. Logout
4. Close and reopen app
5. Check biometric option

**Expected Results:**
- ✅ Biometric login option available
- ✅ Biometric setting persisted
- ✅ Can login with biometric

**Platforms:** iOS ✓ | Android ✓

---

### 7. Edge Cases

#### Test 7.1: Concurrent Logins
**Steps:**
1. Login on Device A
2. Login with same credentials on Device B
3. Try to use app on Device A

**Expected Results:**
- ✅ Both sessions work independently
- ✅ Tokens different per device
- ✅ No conflicts

**Platforms:** iOS ✓ | Android ✓ | Web ✓

---

#### Test 7.2: Storage Full Scenario
**Steps:**
1. Fill device storage to near capacity
2. Try to login
3. Observe behavior

**Expected Results:**
- ✅ Graceful error handling
- ✅ Appropriate error message
- ✅ No app crash

**Platforms:** iOS ✓ | Android ✓

---

#### Test 7.3: Network Interruption During Login
**Steps:**
1. Start login process
2. Disable network mid-request
3. Observe behavior

**Expected Results:**
- ✅ Network error detected
- ✅ Appropriate error message
- ✅ Retry option available
- ✅ No partial state saved

**Platforms:** iOS ✓ | Android ✓ | Web ✓

---

## Automated Test Execution

Run the comprehensive test suite:

```bash
# All tests
npm test authenticationFlowComplete.test.tsx

# Specific test suites
npm test -- --testNamePattern="Login with Demo Credentials"
npm test -- --testNamePattern="Token Storage"
npm test -- --testNamePattern="Automatic Token Refresh"
npm test -- --testNamePattern="Logout Functionality"
npm test -- --testNamePattern="Biometric Login"
npm test -- --testNamePattern="Session Persistence"
```

## Platform-Specific Testing

### iOS Testing
```bash
# Run on iOS simulator
npm run ios

# Run iOS tests
npm test -- --testPathPattern="ios"
```

### Android Testing
```bash
# Run on Android emulator
npm run android

# Run Android tests
npm test -- --testPathPattern="android"
```

### Web Testing
```bash
# Run on web browser
npm run web

# Run web tests
npm test -- --testPathPattern="web"
```

## Test Coverage Requirements

All test cases should achieve:
- ✅ Code coverage ≥ 80%
- ✅ Branch coverage ≥ 75%
- ✅ Function coverage ≥ 90%

## Debugging Tips

### Check Token Storage (Native)
```javascript
import { secureStorage } from '@utils/secureStorage';

// Get tokens
const accessToken = await secureStorage.getAccessToken();
const refreshToken = await secureStorage.getRefreshToken();
console.log('Access Token:', accessToken);
console.log('Refresh Token:', refreshToken);
```

### Check Token Storage (Web)
```javascript
// In browser console
AsyncStorage.getAllKeys().then(console.log);
AsyncStorage.getItem('@edu_access_token').then(console.log);
```

### Check Redux State
```javascript
import { store } from '@store';

// Get auth state
console.log('Auth State:', store.getState().auth);
```

### Monitor Token Refresh
```javascript
// Enable debug logging
import { authService } from '@utils/authService';

// Watch for token refresh
authService.initializeAuth();
```

## Known Issues & Workarounds

1. **Biometric prompt not showing (Simulator)**
   - Workaround: Enable biometrics in simulator settings
   - iOS: Features → Face ID → Enrolled
   - Android: Extended Controls → Fingerprint → Touch

2. **Storage quota exceeded (Web)**
   - Workaround: Clear browser storage
   - Chrome: DevTools → Application → Clear Storage

3. **Token refresh timing**
   - Note: Default refresh interval is 14 minutes
   - For testing, reduce interval in `authService.ts`

## Reporting Issues

When reporting authentication issues, include:
- Platform (iOS/Android/Web)
- App version
- Steps to reproduce
- Expected vs actual behavior
- Console logs
- Network logs (if applicable)
- Storage state before/after

## Success Criteria

All tests pass with:
- ✅ No crashes or freezes
- ✅ Proper error handling
- ✅ Consistent behavior across platforms
- ✅ Tokens properly stored and managed
- ✅ Session persistence works correctly
- ✅ Biometric auth works on native platforms
- ✅ Logout clears all data completely
