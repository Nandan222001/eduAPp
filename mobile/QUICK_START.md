# EduTrack Mobile - Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn installed
- Expo CLI (will be installed with dependencies)
- iOS Simulator (Mac only) or Android Emulator
- Or physical device with Expo Go app

## Setup (5 minutes)

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` file:
```env
# For local development
API_BASE_URL=http://localhost:8000
API_VERSION=v1

# For Android Emulator, use:
# API_BASE_URL=http://10.0.2.2:8000

# For Physical Device, use your computer's IP:
# API_BASE_URL=http://192.168.1.x:8000
```

### 3. Start Development Server
```bash
npm start
```

### 4. Run the App
Choose one option:

**A. Physical Device (Easiest)**
1. Install Expo Go from App Store/Play Store
2. Scan the QR code shown in terminal
3. App will open in Expo Go

**B. iOS Simulator (Mac only)**
```bash
npm run ios
```

**C. Android Emulator**
```bash
npm run android
```

**D. Web Browser**
```bash
npm run web
```

## Testing the App

### 1. Login with Email/Password
- Start your backend server first
- Use existing user credentials
- Example:
  ```
  Email: student@example.com
  Password: password123
  Institution ID: 1 (optional)
  ```

### 2. Test OTP Login (Requires Backend Implementation)
- Tap "Sign in with OTP instead"
- Enter email
- Receive OTP (via email/SMS)
- Enter OTP to verify

### 3. Enable Biometric Login
- Login successfully first
- Go to Profile tab
- Toggle "Biometric Authentication"
- Authenticate with Face ID/Touch ID
- Next time, you can login with biometric

### 4. Test Role-Based Navigation
- Student role → See student tabs (Home, Courses, Assignments, Profile)
- Parent role → See parent tabs (Home, Children, Reports, Profile)

## Project Structure Overview

```
mobile/
├── src/
│   ├── api/              # API client and endpoints
│   ├── components/       # Reusable UI components
│   ├── navigation/       # App navigation setup
│   ├── screens/          # Screen components
│   │   ├── auth/         # Login, OTP screens
│   │   ├── student/      # Student app screens
│   │   └── parent/       # Parent app screens
│   ├── store/            # Redux store and slices
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
├── App.tsx               # Root component
└── package.json          # Dependencies
```

## Key Features

✅ **Authentication**
- Email/Password login
- OTP login (requires backend)
- Biometric authentication
- Auto token refresh
- Secure storage

✅ **Navigation**
- Role-based routing
- Deep linking support
- Tab navigation
- Stack navigation

✅ **Security**
- Secure token storage (Keychain/Keystore)
- Biometric auth with fallback
- Automatic session management
- Token refresh on expiry

✅ **UI/UX**
- Clean, modern design
- Loading states
- Error handling
- Responsive layout

## Common Commands

```bash
# Start dev server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web

# Type check
npm run type-check

# Lint code
npm run lint

# Clear cache
npx expo start --clear
```

## Troubleshooting

### Cannot connect to backend
**Problem:** "Network request failed" error

**Solutions:**
1. Check backend is running: `http://localhost:8000`
2. Check API_BASE_URL in `.env`
3. For Android emulator, use `10.0.2.2` instead of `localhost`
4. For physical device, use your computer's IP address
5. Make sure device and computer are on same network

### Biometric not working
**Problem:** Biometric authentication fails

**Solutions:**
1. Check device has Face ID/Touch ID enabled
2. Enroll biometric in device settings
3. Test on physical device (simulators may not support)
4. Grant permissions in app settings

### App crashes on start
**Problem:** White screen or app crashes

**Solutions:**
1. Clear cache: `npx expo start --clear`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check for TypeScript errors: `npm run type-check`
4. Check logs for errors

### Deep linking not working
**Problem:** Deep links don't navigate

**Solutions:**
1. Rebuild app after changing `app.json`
2. Use correct URL format: `edutrack://login`
3. For iOS: `xcrun simctl openurl booted "edutrack://login"`
4. For Android: `adb shell am start -W -a android.intent.action.VIEW -d "edutrack://login"`

## Development Tips

### Hot Reload
- Save files to see changes instantly
- Shake device to open developer menu
- Press `r` in terminal to reload

### Debug Menu
- **iOS**: Cmd+D (simulator) or shake device
- **Android**: Cmd+M (emulator) or shake device
- Options: Reload, Debug, Performance Monitor

### Redux DevTools
View Redux state and actions:
1. Open React Native Debugger
2. Enable Redux DevTools
3. See all dispatched actions and state changes

### Network Debugging
1. Open Debug menu
2. Enable "Debug Remote JS"
3. Open Chrome DevTools
4. Go to Network tab to see API calls

## Next Steps

1. **Customize Branding**
   - Update `app.json` with your app name and icons
   - Add app icons to `assets/` folder
   - Configure splash screen

2. **Add More Features**
   - Implement additional screens
   - Add more API endpoints
   - Enhance UI components
   - Add push notifications

3. **Backend Integration**
   - Implement OTP endpoints
   - Test all API integrations
   - Handle error cases
   - Add loading states

4. **Testing**
   - Test on multiple devices
   - Test different user roles
   - Test offline scenarios
   - Test biometric flows

5. **Production Build**
   - Configure app signing
   - Build for App Store/Play Store
   - Test production builds
   - Submit for review

## Resources

- **Expo Docs**: https://docs.expo.dev
- **React Navigation**: https://reactnavigation.org
- **Redux Toolkit**: https://redux-toolkit.js.org
- **React Native**: https://reactnative.dev

## Need Help?

1. Check `IMPLEMENTATION.md` for detailed documentation
2. Review error messages in terminal
3. Check Expo documentation
4. Review backend API documentation

## Happy Coding! 🚀
