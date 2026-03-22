# Authentication Quick Reference

Quick reference for authentication implementation.

## Demo Credentials

```
Student: demo@example.com / Demo@123
Parent:  parent@demo.com / Demo@123
```

## Key Files

```
src/
├── store/slices/authSlice.ts       # Redux auth state
├── utils/authService.ts            # Core auth service
├── utils/secureStorage.ts          # Platform storage
├── utils/biometric.ts              # Biometric auth
├── api/authApi.ts                  # Auth API calls
└── api/client.ts                   # API client w/ refresh
```

## Common Operations

### Login
```typescript
import { useAppDispatch } from '@store/hooks';
import { login } from '@store/slices/authSlice';

const dispatch = useAppDispatch();

dispatch(login({
  email: 'demo@example.com',
  password: 'Demo@123'
}));
```

### Logout
```typescript
import { logout } from '@store/slices/authSlice';

dispatch(logout());
```

### Check Auth State
```typescript
import { useAppSelector } from '@store/hooks';

const { isAuthenticated, user, accessToken } = useAppSelector(state => state.auth);
```

### Enable Biometric
```typescript
import { enableBiometric } from '@store/slices/authSlice';

dispatch(enableBiometric());
```

### Login with Biometric
```typescript
import { loginWithBiometric } from '@store/slices/authSlice';

dispatch(loginWithBiometric());
```

## Storage Keys

```typescript
ACCESS_TOKEN: '@edu_access_token'
REFRESH_TOKEN: '@edu_refresh_token'
USER_DATA: '@edu_user_data'
BIOMETRIC_ENABLED: '@edu_biometric_enabled'
```

## Token Refresh

- **Interval:** 14 minutes
- **On 401:** Automatic via API client
- **Demo Users:** Generates new demo tokens
- **Regular Users:** API call to /auth/refresh

## Platform Differences

| Feature | iOS | Android | Web |
|---------|-----|---------|-----|
| Token Storage | SecureStore | SecureStore | AsyncStorage |
| Biometric | Face ID/Touch ID | Fingerprint | Not Supported |
| Auto-refresh | ✅ | ✅ | ✅ |
| Session Persist | ✅ | ✅ | ✅ |

## Debugging

### Check Tokens
```typescript
import { secureStorage } from '@utils/secureStorage';
import { STORAGE_KEYS } from '@constants';

const accessToken = await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
console.log('Access Token:', accessToken);
```

### Check Auth State
```typescript
import { store } from '@store';

console.log('Auth:', store.getState().auth);
```

### Monitor Refresh
```typescript
import { authService } from '@utils/authService';

// Will log refresh events
authService.initializeAuth();
```

## Testing

```bash
# Run all auth tests
npm test authenticationFlowComplete.test.tsx

# Run specific test
npm test -- --testNamePattern="Login with Demo Credentials"

# Check coverage
npm test -- --coverage
```

## Common Issues

**Tokens not persisting**
- Check storage permissions
- Verify platform implementation

**Biometric not working**
- Check device has biometric hardware
- Verify enrollment in device settings
- Web platform not supported

**Auto-refresh failing**
- Check authService initialization
- Verify token format
- Check network connectivity

## API Endpoints

```
POST /api/v1/auth/login       # Login
POST /api/v1/auth/logout      # Logout
POST /api/v1/auth/refresh     # Refresh tokens
GET  /api/v1/auth/me          # Get current user
```

## Token Format

```typescript
// Demo tokens
demo_student_access_token_[timestamp]
demo_student_refresh_token_[timestamp]
demo_parent_access_token_[timestamp]
demo_parent_refresh_token_[timestamp]

// Regular tokens
JWT format from backend
```

## Security Checklist

- ✅ Tokens in secure storage
- ✅ Never log tokens in production
- ✅ Clear tokens on logout
- ✅ Auto-refresh prevents expiration
- ✅ Biometric requires enrollment
- ✅ Failed refresh triggers logout

## Redux State Shape

```typescript
{
  user: User | null,
  accessToken: string | null,
  refreshToken: string | null,
  isAuthenticated: boolean,
  isLoading: boolean,
  error: string | null,
  biometricEnabled: boolean,
  activeRole: string | null,
  availableRoles: string[],
}
```

## Demo User Detection

```typescript
// Check if token is demo
const isDemoToken = (token: string): boolean => {
  return token.startsWith('demo_student_access_token_') || 
         token.startsWith('demo_parent_access_token_');
};

// Get demo user data
if (token.startsWith('demo_student_access_token_')) {
  return demoStudentUser.user;
}
```

## Logout Cleanup

When logout executes, the following are cleared:
- ✅ Access token
- ✅ Refresh token
- ✅ User data
- ✅ Biometric settings
- ✅ Active role
- ✅ Redux state
- ✅ Auto-refresh timer

## Session Restore

On app startup:
1. Load tokens from storage
2. Validate tokens
3. Fetch user profile
4. Restore biometric settings
5. Set active role
6. Start auto-refresh
7. If any step fails → logout

## Configuration

```typescript
// Token refresh interval (14 minutes)
const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000;

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@edu_access_token',
  REFRESH_TOKEN: '@edu_refresh_token',
  // ...
};
```

## Useful Commands

```bash
# Check storage (iOS Simulator)
xcrun simctl get_app_container booted com.yourapp.bundle data

# Check storage (Android Debug)
adb shell run-as com.yourapp.package ls -R /data/data/

# Clear storage (Web)
# In browser console:
AsyncStorage.clear()
```
