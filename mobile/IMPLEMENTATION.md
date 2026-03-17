# Mobile App Implementation Guide

## Overview

Complete React Native mobile application for EduTrack with authentication, role-based navigation, biometric support, and secure token management.

## Architecture

### Technology Stack
- **Framework**: React Native with Expo SDK 50
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation v6
- **HTTP Client**: Axios with interceptors
- **Secure Storage**: Expo Secure Store
- **Biometric Auth**: Expo Local Authentication
- **Language**: TypeScript
- **Deep Linking**: Expo Linking

### Key Features Implemented

#### 1. Authentication System
- **Email/Password Login**: Traditional authentication
- **OTP Login**: Phone/email OTP-based authentication (requires backend endpoints)
- **Biometric Login**: Face ID/Touch ID/Fingerprint support
- **Token Management**: Automatic refresh token handling
- **Secure Storage**: All tokens stored in device secure storage

#### 2. API Client (`src/api/client.ts`)
- Axios instance with request/response interceptors
- Automatic token injection in headers
- Automatic token refresh on 401 responses
- Token refresh debouncing to prevent multiple simultaneous requests
- Error handling and retry logic

#### 3. Redux Store (`src/store/`)
- **Auth Slice**: Complete authentication state management
- **Async Thunks**: Login, logout, OTP, biometric authentication
- **Persistent State**: Auto-restore authentication on app restart
- **Type-Safe**: Full TypeScript support with typed hooks

#### 4. Navigation System
- **Auth Stack**: Login → OTP Login → OTP Verify
- **Student Tab Navigator**: Home, Courses, Assignments, Profile
- **Parent Tab Navigator**: Home, Children, Reports, Profile
- **Role-Based Routing**: Automatic navigation based on user role
- **Deep Linking**: URL scheme support for all screens

#### 5. Security Features
- Secure token storage (Expo Secure Store)
- Biometric authentication with device fallback
- Automatic session restoration
- Token refresh on expiry
- Logout from all devices support

## File Structure

```
mobile/
├── src/
│   ├── api/
│   │   ├── client.ts              # Axios client with interceptors
│   │   └── authApi.ts             # Authentication endpoints
│   ├── components/
│   │   ├── Button.tsx             # Reusable button component
│   │   ├── Input.tsx              # Input with password toggle
│   │   └── index.ts               # Component exports
│   ├── navigation/
│   │   ├── RootNavigator.tsx      # Root navigation container
│   │   ├── AuthNavigator.tsx      # Auth stack navigator
│   │   ├── StudentNavigator.tsx   # Student tab navigator
│   │   ├── ParentNavigator.tsx    # Parent tab navigator
│   │   └── linking.ts             # Deep linking configuration
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── OTPLoginScreen.tsx
│   │   │   └── OTPVerifyScreen.tsx
│   │   ├── student/
│   │   │   ├── StudentHomeScreen.tsx
│   │   │   ├── StudentCoursesScreen.tsx
│   │   │   ├── StudentAssignmentsScreen.tsx
│   │   │   └── StudentProfileScreen.tsx
│   │   └── parent/
│   │       ├── ParentHomeScreen.tsx
│   │       ├── ParentChildrenScreen.tsx
│   │       ├── ParentReportsScreen.tsx
│   │       └── ParentProfileScreen.tsx
│   ├── store/
│   │   ├── index.ts               # Store configuration
│   │   ├── hooks.ts               # Typed Redux hooks
│   │   └── slices/
│   │       └── authSlice.ts       # Auth state and thunks
│   ├── types/
│   │   ├── auth.ts                # Auth type definitions
│   │   └── navigation.ts          # Navigation type definitions
│   └── utils/
│       ├── secureStorage.ts       # Secure storage wrapper
│       └── biometric.ts           # Biometric auth utilities
├── App.tsx                        # Root component
├── index.js                       # Entry point
├── app.json                       # Expo configuration
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── babel.config.js                # Babel config
└── .eslintrc.js                   # ESLint config
```

## API Endpoints Used

The mobile app integrates with the following backend endpoints:

### Implemented in Backend
- `POST /api/v1/auth/login` - Email/password authentication
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout current session
- `POST /api/v1/auth/logout-all` - Logout all sessions
- `GET /api/v1/auth/me` - Get current user info
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `POST /api/v1/auth/change-password` - Change password

### Required Backend Implementation
The following endpoints are called by the mobile app but need to be implemented in the backend:

```python
# src/api/v1/auth.py

@router.post("/otp/request")
async def request_otp(
    data: OTPLoginRequest,
    db: Session = Depends(get_db),
    redis: Redis = Depends(get_redis),
) -> dict:
    """Send OTP to user's email/phone"""
    # Generate 6-digit OTP
    # Store in Redis with expiry (5 minutes)
    # Send via email/SMS
    return {"message": "OTP sent successfully"}

@router.post("/otp/verify")
async def verify_otp(
    data: OTPVerifyRequest,
    db: Session = Depends(get_db),
    redis: Redis = Depends(get_redis),
) -> Token:
    """Verify OTP and return tokens"""
    # Validate OTP from Redis
    # Authenticate user
    # Generate and return tokens
    return Token(...)
```

Required schemas in `src/schemas/auth.py`:

```python
class OTPLoginRequest(BaseModel):
    email: EmailStr
    institution_id: Optional[int] = None

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=4, max_length=6)
    institution_id: Optional[int] = None
```

## Setup Instructions

### 1. Install Dependencies
```bash
cd mobile
npm install
# or
yarn install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
API_BASE_URL=http://your-api-server:8000
API_VERSION=v1
```

For local development:
- iOS Simulator: `http://localhost:8000`
- Android Emulator: `http://10.0.2.2:8000`
- Physical Device: `http://your-computer-ip:8000`

### 3. Start Development Server
```bash
npm start
```

### 4. Run on Device/Simulator
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## Development Workflow

### Running the App
1. Start the Expo development server: `npm start`
2. Scan QR code with Expo Go app (iOS/Android)
3. Or press `i` for iOS simulator, `a` for Android emulator

### Testing Authentication
1. Start backend server
2. Ensure API_BASE_URL points to backend
3. Test login with existing user credentials
4. Test biometric authentication (device must support it)

### Adding New Screens
1. Create screen component in `src/screens/[role]/`
2. Add route to navigation type in `src/types/navigation.ts`
3. Add screen to appropriate navigator
4. Add deep linking path in `src/navigation/linking.ts`

### Redux State Management
```typescript
// Using Redux in components
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login, logout } from '../store/slices/authSlice';

const MyComponent = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  
  const handleLogin = () => {
    dispatch(login({ email, password }));
  };
};
```

## Deep Linking

### URL Schemes
- Custom scheme: `edutrack://`
- Universal links: Can be configured for production

### Available Deep Links

**Authentication:**
- `edutrack://login`
- `edutrack://otp-login`
- `edutrack://otp-verify`

**Student:**
- `edutrack://student/home`
- `edutrack://student/courses`
- `edutrack://student/assignments`
- `edutrack://student/profile`

**Parent:**
- `edutrack://parent/home`
- `edutrack://parent/children`
- `edutrack://parent/reports`
- `edutrack://parent/profile`

### Testing Deep Links

**iOS Simulator:**
```bash
xcrun simctl openurl booted "edutrack://login"
```

**Android Emulator:**
```bash
adb shell am start -W -a android.intent.action.VIEW -d "edutrack://login"
```

## Security Best Practices

### Token Storage
- Access tokens: Stored in Expo Secure Store (iOS Keychain/Android Keystore)
- Refresh tokens: Stored in Expo Secure Store
- Never stored in AsyncStorage or plain text

### Biometric Authentication
- Only enabled after explicit user consent
- Falls back to device passcode if biometric fails
- Can be disabled at any time from settings

### API Security
- All tokens transmitted via Authorization header
- HTTPS required in production
- Token refresh handled automatically
- Session expiry properly managed

## Build for Production

### Prerequisites
- Expo account (create at expo.dev)
- Apple Developer account (for iOS)
- Google Play Console account (for Android)

### Build Commands

**Development Build:**
```bash
expo build:ios
expo build:android
```

**Production Build:**
```bash
eas build --platform ios --profile production
eas build --platform android --profile production
```

### App Store Submission
1. Build production app: `eas build --platform ios`
2. Download IPA from Expo dashboard
3. Upload to App Store Connect via Transporter
4. Submit for review

### Google Play Submission
1. Build production app: `eas build --platform android`
2. Download AAB from Expo dashboard
3. Upload to Google Play Console
4. Submit for review

## Troubleshooting

### Common Issues

**1. Cannot connect to API**
- Check API_BASE_URL in .env
- For Android emulator, use `10.0.2.2` instead of `localhost`
- For physical device, use computer's IP address
- Ensure backend is running and accessible

**2. Biometric authentication not working**
- Check device has biometric hardware
- Ensure biometric is enrolled on device
- Check app permissions in device settings
- Test on physical device (simulators may not support)

**3. Token refresh failing**
- Check refresh token is being stored correctly
- Verify backend refresh endpoint is working
- Check token expiry times are properly set
- Review axios interceptor logs

**4. Deep linking not working**
- Verify URL scheme in app.json
- Check linking configuration
- Test with correct URL format
- Rebuild app after changing app.json

### Debug Tips

**Enable Debug Logs:**
```typescript
// Add to src/api/client.ts
this.client.interceptors.request.use(config => {
  console.log('Request:', config);
  return config;
});
```

**Check Secure Storage:**
```typescript
import * as SecureStore from 'expo-secure-store';

const checkTokens = async () => {
  const access = await SecureStore.getItemAsync('accessToken');
  const refresh = await SecureStore.getItemAsync('refreshToken');
  console.log('Tokens:', { access, refresh });
};
```

**Redux DevTools:**
Install Redux DevTools extension for debugging state:
```bash
npm install --save-dev redux-devtools-extension
```

## Performance Optimization

### Current Optimizations
- Redux state selector memoization
- React Navigation optimized re-renders
- Lazy loading of screens
- Image optimization with proper sizing

### Recommended Improvements
- Add React.memo for expensive components
- Implement FlatList virtualization for long lists
- Add proper loading states and skeleton screens
- Optimize images with expo-image
- Add offline support with Redux Persist

## Next Steps

### Immediate Enhancements
1. Implement OTP endpoints in backend
2. Add password reset flow in mobile
3. Add remember me functionality
4. Implement offline mode
5. Add push notifications

### Future Features
1. Multi-language support (i18n)
2. Dark mode theme
3. Advanced biometric options
4. Social authentication (Google, Apple)
5. Two-factor authentication
6. Device management
7. Session history
8. Accessibility improvements
9. Performance monitoring
10. Analytics integration

## Support

For issues or questions:
1. Check this documentation
2. Review backend API documentation
3. Check Expo documentation: https://docs.expo.dev
4. Check React Navigation docs: https://reactnavigation.org

## License

This mobile application is part of the EduTrack project.
