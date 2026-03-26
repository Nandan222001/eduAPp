# Expo Router Migration Guide

This comprehensive guide documents the complete migration from React Navigation to Expo Router, covering all aspects of the transition including removed legacy files, new file-based routing structure, platform-specific storage handling, troubleshooting common issues, testing procedures, and developer setup.

## Table of Contents

- [Overview](#overview)
- [Removed Legacy Files](#removed-legacy-files)
- [New File-Based Routing Structure](#new-file-based-routing-structure)
- [Platform-Specific Storage Handling](#platform-specific-storage-handling)
- [Troubleshooting Guide](#troubleshooting-guide)
- [Testing Checklist](#testing-checklist)
- [Developer Setup Instructions](#developer-setup-instructions)
- [Migration Examples](#migration-examples)

---

## Overview

The migration from React Navigation to Expo Router represents a fundamental architectural shift in how navigation is handled in the EduTrack mobile application.

### What Changed

| Aspect | React Navigation (Legacy) | Expo Router (Current) |
|--------|---------------------------|------------------------|
| **Route Definition** | Imperative, code-based | Declarative, file-based |
| **Navigation Container** | `<NavigationContainer>` wrapper | Built-in via `<Slot>` |
| **Type Safety** | Manual type definitions | Auto-generated from file structure |
| **Deep Linking** | Manual configuration required | Automatic from file structure |
| **Screen Access** | Via `navigation` prop | Via `useRouter()` hook |
| **URL Structure** | Separate configuration | Mirrors file structure exactly |
| **Web Support** | Limited, requires setup | Native support with clean URLs |

### Key Benefits

✅ **Automatic Route Generation** - Files in `app/` directory automatically become accessible routes  
✅ **Type-Safe Navigation** - TypeScript types automatically generated from file structure  
✅ **Simplified Deep Linking** - URLs automatically map to file paths without configuration  
✅ **Better Developer Experience** - Less boilerplate code, faster development cycles  
✅ **Superior Web Support** - Clean, SEO-friendly URLs that work seamlessly across platforms  
✅ **Built-in 404 Handling** - Automatic error pages for unmatched routes  
✅ **Layout Composition** - Shared layouts with `_layout.tsx` files

---

## Removed Legacy Files

The following legacy navigation files were completely removed during the migration. Their functionality has been replaced by Expo Router's file-based routing system and new layout components.

### 1. Legacy App.tsx

**Previous Location:** `mobile/App.tsx` (root directory)

**What It Did:**
- Served as the main entry point for React Navigation
- Wrapped the entire app with `NavigationContainer`
- Initialized global providers (Redux, Theme, etc.)
- Registered navigation ref for global access
- Set up linking configuration for deep links

**Example of Removed Code:**
```typescript
// ❌ REMOVED: App.tsx (legacy)
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { RootNavigator } from './src/navigation/RootNavigator';
import { store, persistor } from './src/store';
import { navigationRef } from './src/utils/navigationRef';

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer 
        ref={navigationRef}
        linking={linkingConfig}
      >
        <RootNavigator />
      </NavigationContainer>
    </Provider>
  );
}
```

**Replaced By:** 
- `app/_layout.tsx` - Root layout with providers and navigation setup
- `index.js` - Expo Router entry point (auto-generated)

---

### 2. RootNavigator.tsx

**Previous Location:** `src/navigation/RootNavigator.tsx`

**What It Did:**
- Root-level navigator that managed app-wide navigation state
- Switched between authenticated and unauthenticated stacks
- Handled initial route determination
- Managed global screen options and transitions
- Coordinated between Auth and Main navigation flows

**Example of Removed Code:**
```typescript
// ❌ REMOVED: src/navigation/RootNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppSelector } from '@store/hooks';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { Loading } from '@components';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { isAuthenticated, isLoading } = useAppSelector(state => state.auth);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
```

**Replaced By:** `app/_layout.tsx` with route guards

```typescript
// ✅ NEW: app/_layout.tsx (simplified excerpt)
import { Slot, useRouter, useSegments } from 'expo-router';
import { useAppSelector } from '@store/hooks';

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading } = useAppSelector(state => state.auth);

  useEffect(() => {
    if (isLoading) return; // Wait for auth check to complete

    const inAuthGroup = segments[0] === '(auth)';

    // Automatic route protection
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/student');
    }
  }, [isAuthenticated, segments, isLoading]);

  return <Slot />;
}
```

---

### 3. AuthNavigator.tsx

**Previous Location:** `src/navigation/AuthNavigator.tsx`

**What It Did:**
- Configured stack navigator for all authentication screens
- Defined routes for login, register, forgot password, OTP flows
- Set consistent screen options (headers, transitions, gestures)
- Managed auth-specific navigation options

**Example of Removed Code:**
```typescript
// ❌ REMOVED: src/navigation/AuthNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '@screens/auth/LoginScreen';
import RegisterScreen from '@screens/auth/RegisterScreen';
import ForgotPasswordScreen from '@screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '@screens/auth/ResetPasswordScreen';
import OTPLoginScreen from '@screens/auth/OTPLoginScreen';
import OTPVerifyScreen from '@screens/auth/OTPVerifyScreen';

const Stack = createNativeStackNavigator();

export function AuthNavigator() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="OTPLogin" component={OTPLoginScreen} />
      <Stack.Screen name="OTPVerify" component={OTPVerifyScreen} />
    </Stack.Navigator>
  );
}
```

**Replaced By:** `app/(auth)/_layout.tsx`

```typescript
// ✅ NEW: app/(auth)/_layout.tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="otp-login" />
      <Stack.Screen name="otp-verify" />
    </Stack>
  );
}
```

**New File Structure:**
```
app/(auth)/
├── _layout.tsx         → Stack navigator configuration
├── login.tsx           → /login route
├── register.tsx        → /register route
├── forgot-password.tsx → /forgot-password route
├── reset-password.tsx  → /reset-password route
├── otp-login.tsx       → /otp-login route
└── otp-verify.tsx      → /otp-verify route
```

---

### 4. MainNavigator.tsx / TabNavigator.tsx

**Previous Location:** `src/navigation/MainNavigator.tsx` and `src/navigation/TabNavigator.tsx`

**What It Did:**
- Created role-based navigation structures
- Managed separate tab navigators for student and parent roles
- Configured tab icons, labels, and badge counts
- Set tab bar styling and active/inactive colors
- Handled role switching and permission-based tab visibility

**Example of Removed Code:**
```typescript
// ❌ REMOVED: src/navigation/StudentTabNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from '@rneui/themed';
import HomeScreen from '@screens/student/HomeScreen';
import AssignmentsScreen from '@screens/student/AssignmentsScreen';
import ScheduleScreen from '@screens/student/ScheduleScreen';
import GradesScreen from '@screens/student/GradesScreen';
import ProfileScreen from '@screens/student/ProfileScreen';

const Tab = createBottomTabNavigator();

export function StudentTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2089dc',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" type="material" color={color} size={size} />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tab.Screen
        name="Assignments"
        component={AssignmentsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="assignment" type="material" color={color} size={size} />
          ),
        }}
      />
      {/* More tabs... */}
    </Tab.Navigator>
  );
}
```

**Replaced By:** `app/(tabs)/student/_layout.tsx`

```typescript
// ✅ NEW: app/(tabs)/student/_layout.tsx
import { Tabs } from 'expo-router';
import { Icon } from '@rneui/themed';
import { useAppSelector } from '@store/hooks';

export default function StudentTabsLayout() {
  const unreadCount = useAppSelector(state => state.notifications.unreadCount);

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#2089dc',
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" type="material" color={color} size={size} />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tabs.Screen
        name="assignments"
        options={{
          title: 'Assignments',
          tabBarLabel: 'Assignments',
          tabBarIcon: ({ color, size }) => (
            <Icon name="assignment" type="material" color={color} size={size} />
          ),
        }}
      />
      {/* More tabs... */}
    </Tabs>
  );
}
```

---

### 5. Navigation Type Definitions

**Previous Location:** `src/types/navigation.ts`

**What It Did:**
- Manually defined TypeScript types for all navigation routes
- Typed screen props and navigation props for each screen
- Defined parameter lists for each navigator
- Created type-safe navigation helpers

**Example of Removed Code:**
```typescript
// ❌ REMOVED: src/types/navigation.ts
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

// Root stack
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

// Auth stack
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  OTPLogin: undefined;
  OTPVerify: { phone: string };
};

// Main tab stack
export type MainTabParamList = {
  Home: undefined;
  Assignments: undefined;
  Schedule: undefined;
  Grades: undefined;
  Profile: undefined;
};

// Nested stacks
export type AssignmentStackParamList = {
  AssignmentList: undefined;
  AssignmentDetail: { assignmentId: string };
  AssignmentSubmission: { assignmentId: string; mode: 'new' | 'edit' };
};

// Screen props
export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type AssignmentDetailProps = CompositeScreenProps<
  NativeStackScreenProps<AssignmentStackParamList, 'AssignmentDetail'>,
  BottomTabScreenProps<MainTabParamList>
>;
```

**Replaced By:** Auto-generated types from Expo Router

```typescript
// ✅ NEW: Auto-generated in .expo/types/router.d.ts
// No manual type definitions needed!

// Usage in components:
import { useLocalSearchParams } from 'expo-router';

export default function AssignmentDetail() {
  // Type-safe params without manual type definitions
  const { id } = useLocalSearchParams<{ id: string }>();
  // 'id' is automatically typed as string
}
```

---

### 6. Navigation Utilities

**Previous Location:** `src/utils/navigationRef.ts`

**What It Did:**
- Created a navigation reference for use outside React components
- Enabled navigation from Redux actions, API interceptors, etc.
- Provided imperative navigation helpers

**Example of Removed Code:**
```typescript
// ❌ REMOVED: src/utils/navigationRef.ts
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name: string, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as never, params as never);
  }
}

export function goBack() {
  if (navigationRef.isReady()) {
    navigationRef.goBack();
  }
}
```

**Replaced By:** Expo Router's programmatic navigation

```typescript
// ✅ NEW: Use router from expo-router
import { router } from 'expo-router';

// Can be used anywhere, even outside React components
export function navigateToLogin() {
  router.replace('/(auth)/login');
}

export function navigateToAssignment(id: string) {
  router.push(`/assignments/${id}`);
}
```

---

## New File-Based Routing Structure

Expo Router uses your file system structure to automatically generate routes. This is a fundamental shift from manually defining routes in code.

### Complete Directory Structure

```
app/
├── _layout.tsx              → Root layout (wraps entire app)
├── index.tsx                → Entry point route (/)
├── +html.tsx                → Custom HTML document for web
├── +not-found.tsx           → 404 error page
│
├── (auth)/                  → Auth group (parentheses hide from URL)
│   ├── _layout.tsx          → Auth stack configuration
│   ├── login.tsx            → /login
│   ├── register.tsx         → /register
│   ├── forgot-password.tsx  → /forgot-password
│   ├── reset-password.tsx   → /reset-password
│   ├── otp-login.tsx        → /otp-login
│   └── otp-verify.tsx       → /otp-verify
│
├── (tabs)/                  → Tab navigation group
│   ├── _layout.tsx          → Role-based tab router
│   │
│   ├── student/             → Student role routes
│   │   ├── _layout.tsx      → Student tab bar configuration
│   │   ├── index.tsx        → /student (home)
│   │   ├── assignments.tsx  → /student/assignments
│   │   ├── schedule.tsx     → /student/schedule
│   │   ├── grades.tsx       → /student/grades
│   │   └── profile.tsx      → /student/profile
│   │
│   └── parent/              → Parent role routes
│       ├── _layout.tsx      → Parent tab bar configuration
│       ├── index.tsx        → /parent (dashboard)
│       ├── children.tsx     → /parent/children
│       ├── communication.tsx→ /parent/communication
│       ├── reports.tsx      → /parent/reports
│       └── profile.tsx      → /parent/profile
│
├── assignments/             → Assignment detail routes
│   └── [id].tsx            → /assignments/:id (dynamic route)
│
├── courses/                 → Course routes
│   ├── [id].tsx            → /courses/:id
│   └── [id]/
│       ├── lessons.tsx     → /courses/:id/lessons
│       └── materials.tsx   → /courses/:id/materials
│
├── children/                → Parent-specific child routes
│   └── [id].tsx            → /children/:id
│
├── messages/                → Messaging routes
│   ├── index.tsx           → /messages (list)
│   └── [id].tsx            → /messages/:id (conversation)
│
├── notifications/           → Notification routes
│   └── index.tsx           → /notifications
│
├── profile.tsx              → /profile (shared)
└── settings.tsx             → /settings (shared)
```

### File Naming Conventions

| Pattern | Purpose | Example | Generated Route | URL Example |
|---------|---------|---------|-----------------|-------------|
| `filename.tsx` | Regular route | `settings.tsx` | `/settings` | `edutrack://settings` |
| `index.tsx` | Directory default | `student/index.tsx` | `/student` | `edutrack://student` |
| `[param].tsx` | Dynamic segment | `assignments/[id].tsx` | `/assignments/:id` | `edutrack://assignments/123` |
| `[...rest].tsx` | Catch-all route | `docs/[...slug].tsx` | `/docs/*` | `edutrack://docs/a/b/c` |
| `(group)/` | Layout group (hidden) | `(auth)/login.tsx` | `/login` | `edutrack://login` |
| `_layout.tsx` | Layout wrapper | `_layout.tsx` | N/A | Wraps child routes |
| `+not-found.tsx` | 404 error page | `+not-found.tsx` | N/A | Unmatched routes |
| `+html.tsx` | Custom HTML (web) | `+html.tsx` | N/A | HTML document template |

### Layout Files Deep Dive

Layout files (`_layout.tsx`) are special files that wrap their child routes. They are powerful tools for:

1. **Configuring Navigation Patterns**
   - Stack navigation for linear flows
   - Tab navigation for parallel sections
   - Drawer navigation for side menus

2. **Setting Screen Options**
   - Headers, titles, and styling
   - Transitions and animations
   - Gestures and swipe behavior

3. **Providing Shared UI**
   - Common headers or footers
   - Persistent elements across routes
   - Background components

4. **Sharing State/Context**
   - Provider components
   - Shared data contexts
   - Common hooks

**Example Root Layout:**
```typescript
// app/_layout.tsx
import { Slot } from 'expo-router';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@rneui/themed';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store, persistor } from '@store';

export default function RootLayout() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider theme={theme}>
          <SafeAreaProvider>
            <Slot />
          </SafeAreaProvider>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}
```

**Example Tab Layout:**
```typescript
// app/(tabs)/student/_layout.tsx
import { Tabs } from 'expo-router';
import { Icon } from '@rneui/themed';

export default function StudentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#2089dc',
        tabBarStyle: { backgroundColor: '#fff' },
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Home',
          tabBarIcon: ({ color }) => <Icon name="home" color={color} />
        }} 
      />
      <Tabs.Screen 
        name="assignments" 
        options={{ 
          title: 'Assignments',
          tabBarIcon: ({ color }) => <Icon name="assignment" color={color} />
        }} 
      />
    </Tabs>
  );
}
```

### Route Groups

Route groups use parentheses `()` to organize files without affecting the URL structure:

```
app/
├── (auth)/
│   ├── login.tsx      → URL: /login (not /auth/login)
│   └── register.tsx   → URL: /register (not /auth/register)
│
└── (tabs)/
    └── student/
        └── index.tsx  → URL: /student (not /tabs/student)
```

This allows logical organization without cluttering URLs.

---

## Platform-Specific Storage Handling

One of the most critical aspects of cross-platform development is handling storage differently on web vs. native platforms.

### The Challenge

**Problem:** `expo-secure-store` is only available on iOS and Android. Importing it on web causes runtime errors:

```
Invariant Violation: "expo-secure-store" is not available on web
```

### The Solution: Storage Abstraction Layer

The app uses a unified storage abstraction layer in `src/utils/secureStorage.ts` that automatically uses the appropriate storage mechanism for each platform.

### Implementation Details

**File:** `src/utils/secureStorage.ts`

```typescript
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Lazy load SecureStore only on native platforms
let SecureStore: any = null;
if (Platform.OS !== 'web') {
  try {
    SecureStore = require('expo-secure-store');
  } catch (error) {
    console.warn('expo-secure-store not available, falling back to AsyncStorage');
  }
}

// Storage abstraction layer
const storage = {
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web' || !SecureStore) {
      // Use AsyncStorage on web (localStorage wrapper)
      await AsyncStorage.setItem(key, value);
    } else {
      // Use SecureStore on native (encrypted keychain)
      await SecureStore.setItemAsync(key, value);
    }
  },

  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web' || !SecureStore) {
      return await AsyncStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },

  deleteItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web' || !SecureStore) {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

// Public API
export const secureStorage = {
  setAccessToken: async (token: string): Promise<void> => {
    await storage.setItem('accessToken', token);
  },

  getAccessToken: async (): Promise<string | null> => {
    return await storage.getItem('accessToken');
  },

  setRefreshToken: async (token: string): Promise<void> => {
    await storage.setItem('refreshToken', token);
  },

  getRefreshToken: async (): Promise<string | null> => {
    return await storage.getItem('refreshToken');
  },

  setTokens: async (accessToken: string, refreshToken: string): Promise<void> => {
    await Promise.all([
      storage.setItem('accessToken', accessToken),
      storage.setItem('refreshToken', refreshToken),
    ]);
  },

  clearTokens: async (): Promise<void> => {
    await Promise.all([
      storage.deleteItem('accessToken'),
      storage.deleteItem('refreshToken'),
    ]);
  },

  clearAll: async (): Promise<void> => {
    await Promise.all([
      storage.deleteItem('accessToken'),
      storage.deleteItem('refreshToken'),
      storage.deleteItem('biometricEnabled'),
      storage.deleteItem('userEmail'),
      storage.deleteItem('isDemoUser'),
    ]);
  },
};

// Convenience exports
export const getAccessToken = secureStorage.getAccessToken;
export const getRefreshToken = secureStorage.getRefreshToken;
```

### Platform-Specific Features

The app also handles other platform-specific features using similar patterns:

#### 1. Biometric Authentication

**Native (iOS/Android):** Full biometric support with Face ID, Touch ID, fingerprint
**Web:** Gracefully degrades to password-only authentication

```typescript
// src/utils/biometrics.web.ts
export async function authenticateWithBiometrics() {
  console.warn('Biometrics not available on web platform');
  return { success: false, error: 'Not available' };
}

// src/utils/biometrics.native.ts
import * as LocalAuthentication from 'expo-local-authentication';

export async function authenticateWithBiometrics() {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Authenticate to access your account',
    fallbackLabel: 'Use password instead',
  });
  return result;
}
```

#### 2. Camera/Scanner Features

**Native:** Full camera access with QR scanning, document scanning
**Web:** Stub implementation or file upload fallback

```typescript
// src/utils/stubs/camera.web.ts
export const Camera = {
  Constants: {},
  requestCameraPermissionsAsync: async () => ({ status: 'denied' }),
};
```

#### 3. Background Tasks

**Native:** Background sync, notifications, task scheduling
**Web:** Polling-based updates when app is active

```typescript
// src/utils/backgroundSync.web.ts
export async function registerBackgroundTask() {
  console.log('Background tasks not supported on web');
  return null;
}

// src/utils/backgroundSync.native.ts
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

export async function registerBackgroundTask() {
  await BackgroundFetch.registerTaskAsync('BACKGROUND_SYNC', {
    minimumInterval: 60 * 15, // 15 minutes
    stopOnTerminate: false,
    startOnBoot: true,
  });
}
```

### Storage Security Considerations

| Platform | Storage Mechanism | Security Level | Notes |
|----------|-------------------|----------------|-------|
| **iOS** | Keychain (SecureStore) | 🔒 High | Hardware-encrypted, requires device unlock |
| **Android** | Keystore (SecureStore) | 🔒 High | Hardware-backed when available |
| **Web** | localStorage (AsyncStorage) | ⚠️ Low | Base64 encoded, not encrypted |

**Important:** For web deployments:
- Never store highly sensitive data (passwords, credit cards)
- Use HTTPS to encrypt data in transit
- Implement server-side session management
- Consider additional client-side encryption for tokens
- Set appropriate CORS and CSP headers

### Best Practices for Storage

1. **Always use the abstraction layer:**
   ```typescript
   // ✅ CORRECT
   import { getAccessToken } from '@utils/secureStorage';
   
   // ❌ WRONG
   import * as SecureStore from 'expo-secure-store';
   ```

2. **Handle platform differences gracefully:**
   ```typescript
   import { Platform } from 'react-native';
   
   if (Platform.OS === 'web') {
     // Web-specific logic
   } else {
     // Native-specific logic
   }
   ```

3. **Use file extensions for platform-specific files:**
   - `file.ts` - Shared across all platforms
   - `file.native.ts` - iOS and Android only
   - `file.web.ts` - Web only
   - `file.ios.ts` - iOS only
   - `file.android.ts` - Android only

4. **Test on all platforms:**
   - Always test storage operations on iOS, Android, and web
   - Verify data persists across app restarts
   - Check for any platform-specific errors

---

## Troubleshooting Guide

This comprehensive guide covers all common issues you might encounter during development with Expo Router.

### 1. MIME Type Errors

#### Symptom
```
Failed to load resource: The server responded with a status of 200 ()
Refused to execute script from '<URL>' because its MIME type ('text/html') 
is not executable, and strict MIME type checking is enabled.
```

#### Cause
Metro bundler serving files without proper Content-Type headers, especially common on Windows development machines.

#### Solution

**✅ Fixed in `metro.config.js`:**

```javascript
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      const urlPath = req.url.split('?')[0];
      
      // Set proper MIME types
      if (urlPath.endsWith('.bundle') || urlPath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (urlPath.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      } else if (urlPath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      }
      
      return middleware(req, res, next);
    };
  },
};
```

**✅ Fixed in `webpack.config.js` for web:**

```javascript
if (config.devServer) {
  const mimeTypeMiddleware = (req, res, next) => {
    const urlPath = req.url.split('?')[0];
    
    if (urlPath.match(/\.(bundle|js|mjs|cjs)$/)) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    }
    next();
  };

  config.devServer.setupMiddlewares = (middlewares, devServer) => {
    devServer.app.use(mimeTypeMiddleware);
    return middlewares;
  };
}
```

#### Verification

After applying fixes:
1. Clear Metro cache: `npx expo start -c`
2. Restart dev server
3. Check browser Network tab for correct Content-Type headers

---

### 2. Import Resolution Errors

#### Symptom
```
Error: Unable to resolve module @components/Button from app/index.tsx:
Module @components/Button does not exist in the Haste module map
```

#### Causes
1. Path aliases not configured in all three required files
2. Metro cache not cleared after configuration changes
3. TypeScript server not restarted
4. Typo in alias or import path
5. File doesn't exist at expected path

#### Solution

**✅ Step 1: Verify all three configs match exactly**

Check that aliases are identical in:
- `tsconfig.json` → `compilerOptions.paths`
- `babel.config.js` → `plugins[module-resolver].alias`
- `metro.config.js` → `resolver.extraNodeModules`

**Example configuration:**

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@components": ["src/components"],
      "@components/*": ["src/components/*"],
      "@store": ["src/store"],
      "@store/*": ["src/store/*"],
      "@utils": ["src/utils"],
      "@utils/*": ["src/utils/*"]
    }
  }
}
```

```javascript
// babel.config.js
module.exports = {
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@components': './src/components',
          '@store': './src/store',
          '@utils': './src/utils',
        },
      },
    ],
  ],
};
```

```javascript
// metro.config.js
const path = require('path');

config.resolver.extraNodeModules = {
  '@components': path.resolve(__dirname, 'src/components'),
  '@store': path.resolve(__dirname, 'src/store'),
  '@utils': path.resolve(__dirname, 'src/utils'),
};
```

**✅ Step 2: Clear all caches**

```bash
# Clear Metro bundler cache
npx expo start -c

# Clear additional caches (if above doesn't work)
rm -rf node_modules/.cache
rm -rf .expo
rm -rf .metro

# Nuclear option (last resort)
rm -rf node_modules
npm install
npx expo start -c
```

**✅ Step 3: Restart TypeScript server**

In VS Code:
1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type "TypeScript: Restart TS Server"
3. Press Enter

**✅ Step 4: Verify import paths are correct**

```typescript
// ✅ CORRECT
import { Button } from '@components/shared/Button';
import { useAuth } from '@hooks/useAuth';
import { store } from '@store';

// ❌ WRONG - missing directory level
import { Button } from '@components/Button';

// ❌ WRONG - incorrect alias (typo)
import { Button } from '@component/shared/Button';

// ❌ WRONG - using relative when alias exists
import { Button } from '../../../components/shared/Button';
```

**✅ Step 5: Check file exists**

```bash
# Verify file exists at expected path
ls -la src/components/shared/Button.tsx

# If on Windows
dir src\components\shared\Button.tsx
```

---

### 3. SecureStore Web Errors

#### Symptom
```
Invariant Violation: "expo-secure-store" is not available on web
Error: expo-secure-store is not available on this platform
```

#### Cause
Attempting to directly import or use `expo-secure-store` on web platform where it's not supported.

#### Solution

**✅ Always use the storage abstraction layer:**

```typescript
// ❌ WRONG - Direct import fails on web
import * as SecureStore from 'expo-secure-store';

async function saveToken(token: string) {
  await SecureStore.setItemAsync('token', token); // Crashes on web!
}

// ✅ CORRECT - Use abstraction
import { setAccessToken, getAccessToken } from '@utils/secureStorage';

async function saveToken(token: string) {
  await setAccessToken(token); // Works on all platforms!
}
```

**✅ If you must use platform-specific code, check platform first:**

```typescript
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Lazy load only on native
let SecureStore: any = null;
if (Platform.OS !== 'web') {
  try {
    SecureStore = require('expo-secure-store');
  } catch (error) {
    console.warn('SecureStore not available');
  }
}

async function saveSecurely(key: string, value: string) {
  if (Platform.OS === 'web' || !SecureStore) {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}
```

**✅ Use platform-specific file extensions:**

Create separate files for different platforms:
- `secureStorage.ts` - Shared types/interface
- `secureStorage.native.ts` - iOS/Android implementation
- `secureStorage.web.ts` - Web implementation

Metro will automatically pick the correct file based on the platform.

---

### 4. No Routes Matched Error

#### Symptom
```
Error: No route matched for location: /assignments/123
404: Not Found
```

#### Causes
1. File doesn't exist at expected path
2. File named incorrectly (especially dynamic routes)
3. Missing parent `_layout.tsx` file
4. Metro cache not updated after adding new files
5. Incorrect file extension (must be `.tsx` or `.ts`)

#### Solutions

**✅ Step 1: Verify file exists with correct naming**

```bash
# For /assignments/123 route, check:
ls -la app/assignments/[id].tsx

# Dynamic routes MUST use [param] syntax:
# ✅ CORRECT: app/assignments/[id].tsx
# ❌ WRONG: app/assignments/id.tsx
# ❌ WRONG: app/assignments/:id.tsx
# ❌ WRONG: app/assignments/detail.tsx
```

**✅ Step 2: Verify parent layout exists**

```bash
# Root layout is required
ls -la app/_layout.tsx

# Nested layouts may also be needed
ls -la app/assignments/_layout.tsx  # If using nested navigation
```

**✅ Step 3: Check file extension**

```bash
# Must be .tsx (React component) or .ts (if no JSX)
# ✅ CORRECT
app/assignments/[id].tsx

# ❌ WRONG
app/assignments/[id].jsx
app/assignments/[id].js
```

**✅ Step 4: Clear Metro cache**

```bash
npx expo start -c
```

**✅ Step 5: Verify route in dev tools**

```typescript
import { usePathname, useSegments } from 'expo-router';

export default function DebugScreen() {
  const pathname = usePathname();
  const segments = useSegments();
  
  console.log('Current pathname:', pathname);  // /assignments/123
  console.log('Current segments:', segments);  // ['assignments', '123']
  
  return <Text>Route: {pathname}</Text>;
}
```

**✅ Step 6: Check for typos in navigation calls**

```typescript
// ✅ CORRECT
router.push('/assignments/123');
router.push(`/assignments/${id}`);

// ❌ WRONG - typo in path
router.push('/assignment/123');  // Missing 's'

// ❌ WRONG - wrong parameter format
router.push('/assignments/:id');  // Should be actual value, not :id
```

---

### 5. Infinite Redirect Loop

#### Symptom
- App continuously redirects between routes
- Console flooded with navigation logs
- App becomes unresponsive
- White screen or loading screen that never completes

#### Cause
Navigation guard logic executing before authentication state is fully loaded, or missing proper dependency checks.

#### Solution

**❌ WRONG - Causes infinite loop:**

```typescript
useEffect(() => {
  if (!isAuthenticated) {
    router.replace('/(auth)/login');
  } else {
    router.replace('/(tabs)/student');
  }
}, [isAuthenticated]);
// Runs immediately, even while auth is still loading!
// Causes continuous redirects as state updates
```

**✅ CORRECT - Waits for loading to complete:**

```typescript
function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading } = useAppSelector(state => state.auth);

  useEffect(() => {
    // CRITICAL: Wait for auth loading to complete
    if (isLoading) return;
    
    const inAuthGroup = segments[0] === '(auth)';
    
    // Only redirect if user is in the wrong group
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/student');
    }
  }, [isAuthenticated, segments, isLoading, router]);

  // Show loading screen while auth is checking
  if (isLoading) {
    return <Loading />;
  }

  return <Slot />;
}
```

**Key Points:**
1. **Always check `isLoading` before redirecting** - Most important!
2. **Use `segments` to detect current route group** - Prevents unnecessary redirects
3. **Use `router.replace()` not `router.push()`** - Avoids back button issues
4. **Include all dependencies in useEffect array** - Prevents stale closures
5. **Show loading UI while auth is checking** - Better UX

**Debugging infinite loops:**

```typescript
useEffect(() => {
  console.log('[Navigation Debug]', {
    isLoading,
    isAuthenticated,
    segments,
    inAuthGroup: segments[0] === '(auth)',
  });

  if (isLoading) {
    console.log('[Navigation] Waiting for auth to load...');
    return;
  }

  const inAuthGroup = segments[0] === '(auth)';

  if (!isAuthenticated && !inAuthGroup) {
    console.log('[Navigation] Redirecting to login - not authenticated');
    router.replace('/(auth)/login');
  } else if (isAuthenticated && inAuthGroup) {
    console.log('[Navigation] Redirecting to app - authenticated in auth group');
    router.replace('/(tabs)/student');
  } else {
    console.log('[Navigation] No redirect needed');
  }
}, [isAuthenticated, segments, isLoading]);
```

---

### 6. TypeScript Errors with Routes

#### Symptom
```typescript
Property 'navigation' does not exist on type 'Props'
Type '{ pathname: string; params: { id: string; }; }' is not assignable to type 'string'
```

#### Cause
Using React Navigation patterns with Expo Router, or incorrect type usage.

#### Solution

**❌ WRONG - React Navigation pattern:**

```typescript
function MyScreen({ navigation, route }) {
  navigation.navigate('Details', { id: route.params.id });
}
```

**✅ CORRECT - Expo Router pattern:**

```typescript
import { useRouter, useLocalSearchParams } from 'expo-router';

function MyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  
  router.push(`/details/${params.id}`);
}
```

**Type-safe navigation:**

```typescript
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';

function MyComponent() {
  const router = useRouter();
  
  // Simple string path
  const navigateSimple = () => {
    router.push('/assignments/123');
  };
  
  // With type-safe params
  const navigateWithParams = () => {
    router.push({
      pathname: '/assignments/[id]',
      params: { id: '123', mode: 'edit' }
    } as Href);
  };
  
  // Type-safe href
  const href: Href = '/assignments/123';
  router.push(href);
}
```

---

### 7. Module Resolution Errors

#### Symptom
```
Module not found: Can't resolve 'babel-plugin-module-resolver'
Cannot find module '@expo/webpack-config'
```

#### Cause
Missing required dependencies in `package.json`.

#### Solution

**Install missing dependencies:**

```bash
# Babel module resolver
npm install --save-dev babel-plugin-module-resolver

# Expo webpack config (for web)
npm install --save-dev @expo/webpack-config

# Metro config
npm install --save-dev @expo/metro-config

# React Native Web
npm install react-native-web
```

**Verify package.json has all required devDependencies:**

```json
{
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@types/react": "~18.2.45",
    "babel-plugin-module-resolver": "^5.0.0",
    "typescript": "^5.1.3",
    "eslint": "^8.0.0"
  }
}
```

Then restart dev server:
```bash
npx expo start -c
```

---

### 8. Web Platform Errors

#### Common Web-Specific Issues

**Issue: Native modules not available**
```
TypeError: Cannot read property 'setItem' of undefined (SecureStore)
ReferenceError: expo-camera is not available
```

**Solution: Use webpack aliases for web stubs**

```javascript
// webpack.config.js
config.resolve.alias = {
  ...config.resolve.alias,
  'expo-secure-store': path.resolve(__dirname, 'src/utils/stubs/secureStore.web.ts'),
  'expo-camera': path.resolve(__dirname, 'src/utils/stubs/camera.web.ts'),
  'expo-barcode-scanner': path.resolve(__dirname, 'src/utils/stubs/barcode.web.ts'),
  'expo-notifications': path.resolve(__dirname, 'src/utils/stubs/notifications.web.ts'),
};
```

**Create stub files:**

```typescript
// src/utils/stubs/camera.web.ts
export const Camera = {
  Constants: {},
  requestCameraPermissionsAsync: async () => ({ 
    status: 'denied',
    granted: false 
  }),
};

// src/utils/stubs/notifications.web.ts
export async function requestPermissionsAsync() {
  return { status: 'denied', granted: false };
}

export async function getPermissionsAsync() {
  return { status: 'denied', granted: false };
}
```

---

## Testing Checklist

Use this comprehensive checklist to verify the migration is complete and all functionality works correctly across platforms.

### ✅ Navigation Testing

#### Core Navigation
- [ ] All screens are accessible via file-based routes
- [ ] Home screen loads correctly after authentication
- [ ] Tab navigation works for both student and parent roles
- [ ] Stack navigation works for detail screens (assignments, courses, etc.)
- [ ] Back button functions correctly on all screens
- [ ] Forward navigation maintains proper history
- [ ] Modal screens display and dismiss properly
- [ ] Nested navigation (tabs within stacks) works correctly

#### Tab-Specific Testing
- [ ] All tabs are visible and correctly labeled
- [ ] Tab icons display correctly
- [ ] Active tab highlighting works
- [ ] Tab badge counts display when applicable
- [ ] Hidden tabs (href: null) are not visible but still accessible via code
- [ ] Tab switching is smooth without flickering
- [ ] Tab state persists when switching between tabs

#### Route Guards
- [ ] Unauthenticated users are redirected to login
- [ ] Authenticated users cannot access login/register screens
- [ ] Role-based routing works (student vs parent tabs)
- [ ] No infinite redirect loops occur
- [ ] Protected routes require authentication
- [ ] Public routes are accessible without authentication

---

### ✅ Authentication Flow Testing

#### Login/Logout
- [ ] Login successfully redirects to appropriate role dashboard
- [ ] Logout successfully redirects to login screen
- [ ] Remember me / biometric login works (native only)
- [ ] Session persistence across app restarts
- [ ] Token refresh works automatically
- [ ] Expired token handling redirects to login

#### Registration
- [ ] New user registration works
- [ ] Form validation displays errors correctly
- [ ] Successful registration redirects appropriately
- [ ] Email verification flow works (if applicable)

#### Password Reset
- [ ] Forgot password sends reset email
- [ ] Reset password with token works
- [ ] Invalid token shows appropriate error
- [ ] Successful reset redirects to login

#### OTP/2FA
- [ ] OTP login initiates correctly
- [ ] OTP verification works
- [ ] Invalid OTP shows error
- [ ] OTP resend functionality works
- [ ] OTP timeout handled gracefully

---

### ✅ Deep Linking Testing

#### Custom Scheme (edutrack://)
- [ ] `edutrack://login` opens login screen
- [ ] `edutrack://assignments/123` opens specific assignment
- [ ] `edutrack://courses/math101` opens specific course
- [ ] `edutrack://student` opens student dashboard
- [ ] `edutrack://parent/children` opens parent children view
- [ ] Invalid routes show 404 page
- [ ] Deep links work when app is closed
- [ ] Deep links work when app is backgrounded
- [ ] Deep links work when app is active

#### Universal Links (iOS) - https://edutrack.app
- [ ] https://edutrack.app/login opens in app
- [ ] https://edutrack.app/assignments/123 opens in app
- [ ] Universal link configuration in iOS verified
- [ ] Associated domains properly configured
- [ ] Fallback to browser if app not installed

#### App Links (Android) - https://edutrack.app
- [ ] https://edutrack.app/login opens in app
- [ ] https://edutrack.app/assignments/123 opens in app
- [ ] Intent filters properly configured
- [ ] Auto-verify enabled and working
- [ ] Fallback to browser if app not installed

#### Web URLs (http://localhost:8081)
- [ ] http://localhost:8081/login works
- [ ] http://localhost:8081/assignments/123 works
- [ ] Browser back/forward buttons work
- [ ] URL updates correctly on navigation
- [ ] Bookmarking works
- [ ] Direct URL access works
- [ ] Query parameters are preserved

#### Authentication with Deep Links
- [ ] Unauthenticated deep link redirects to login with return path
- [ ] After login, returns to originally requested deep link
- [ ] Authenticated deep links work directly
- [ ] Invalid deep links handled gracefully

---

### ✅ Path Aliases Testing

#### Import Resolution
- [ ] All `@components` imports resolve correctly
- [ ] All `@store` imports resolve correctly
- [ ] All `@utils` imports resolve correctly
- [ ] All `@api` imports resolve correctly
- [ ] All `@hooks` imports resolve correctly
- [ ] All `@config` imports resolve correctly
- [ ] All `@types` imports resolve correctly
- [ ] All `@services` imports resolve correctly

#### IDE Support
- [ ] IntelliSense/autocomplete works for all aliases
- [ ] Go to definition works for aliased imports
- [ ] No red squiggly lines for valid imports
- [ ] Import suggestions show alias options
- [ ] Refactoring maintains alias imports

#### Build/Runtime
- [ ] No "module not found" errors at runtime
- [ ] Metro bundler resolves aliases correctly
- [ ] TypeScript compilation succeeds
- [ ] Web build resolves aliases correctly
- [ ] Native builds (iOS/Android) resolve aliases correctly

---

### ✅ Platform-Specific Testing

#### iOS (Native)
- [ ] App launches without errors
- [ ] All screens render correctly
- [ ] Tab navigation works smoothly
- [ ] Biometric authentication works (Face ID/Touch ID)
- [ ] Camera features work (if applicable)
- [ ] Push notifications work
- [ ] Background tasks execute
- [ ] SecureStore saves/retrieves data
- [ ] App doesn't crash on any navigation
- [ ] Gestures work correctly (swipe back, etc.)

#### Android (Native)
- [ ] App launches without errors
- [ ] All screens render correctly
- [ ] Tab navigation works smoothly
- [ ] Biometric authentication works (fingerprint)
- [ ] Camera features work (if applicable)
- [ ] Push notifications work
- [ ] Background tasks execute
- [ ] SecureStore saves/retrieves data
- [ ] App doesn't crash on any navigation
- [ ] Back button works correctly

#### Web
- [ ] App loads in browser without errors
- [ ] All screens render correctly
- [ ] Tab navigation works
- [ ] No SecureStore errors (uses AsyncStorage)
- [ ] No native module errors (stubs work)
- [ ] Camera features gracefully degrade
- [ ] Biometric features gracefully degrade
- [ ] Push notifications gracefully degrade
- [ ] Responsive design works on different screen sizes
- [ ] Browser back/forward buttons work
- [ ] URLs update correctly
- [ ] Page refresh maintains state

---

### ✅ TypeScript Testing

#### Type Checking
- [ ] `npm run type-check` passes without errors
- [ ] No TypeScript errors in IDE
- [ ] Auto-generated route types work correctly
- [ ] Parameter types are inferred correctly
- [ ] Hook return types are correct

#### Type Safety
- [ ] Navigation parameters are type-safe
- [ ] Route params are type-checked
- [ ] Store selectors are properly typed
- [ ] API responses are typed
- [ ] Component props are typed

---

### ✅ Performance Testing

#### App Performance
- [ ] App loads in < 3 seconds
- [ ] Navigation transitions are smooth (60 FPS)
- [ ] No visible lag when switching tabs
- [ ] List scrolling is smooth
- [ ] Images load efficiently
- [ ] No memory leaks detected
- [ ] App doesn't crash under normal use

#### Bundle Size
- [ ] Web bundle size is reasonable (< 2MB initial)
- [ ] Code splitting is working
- [ ] Lazy loading is implemented where appropriate
- [ ] No duplicate dependencies in bundle
- [ ] Tree-shaking is effective

#### Network Performance
- [ ] API calls are efficient
- [ ] Caching is working
- [ ] Offline mode works (if applicable)
- [ ] No unnecessary API calls
- [ ] Loading states display correctly

---

### ✅ Data Persistence Testing

#### Secure Storage
- [ ] Access tokens persist across app restarts
- [ ] Refresh tokens persist across app restarts
- [ ] User preferences persist
- [ ] Session data persists
- [ ] Data clears on logout
- [ ] No data leakage between users

#### Redux Persist
- [ ] Redux state persists across restarts
- [ ] State hydration works correctly
- [ ] No data corruption
- [ ] Migrations work (if applicable)
- [ ] Purge works correctly

---

### ✅ Error Handling Testing

#### Network Errors
- [ ] Offline mode displays appropriate message
- [ ] Network errors show user-friendly messages
- [ ] Retry functionality works
- [ ] Timeout errors handled gracefully
- [ ] API errors show proper messages

#### Navigation Errors
- [ ] 404 page displays for invalid routes
- [ ] Deep link errors handled gracefully
- [ ] Navigation guards prevent unauthorized access
- [ ] Error boundaries catch navigation errors

#### Platform Errors
- [ ] Native module errors handled on web
- [ ] Permission errors display helpful messages
- [ ] Platform-specific errors don't crash app

---

## Developer Setup Instructions

Complete step-by-step guide for setting up the development environment.

### Prerequisites

#### Required Software
- **Node.js**: v18.x or higher ([Download](https://nodejs.org/))
- **npm**: v9.x or higher (comes with Node.js)
- **Git**: Latest version ([Download](https://git-scm.com/))
- **VS Code**: Recommended IDE ([Download](https://code.visualstudio.com/))

#### Platform-Specific Requirements

**For iOS Development:**
- macOS 11 or higher
- Xcode 14 or higher
- CocoaPods: `sudo gem install cocoapods`
- iOS Simulator (included with Xcode)

**For Android Development:**
- Android Studio ([Download](https://developer.android.com/studio))
- Android SDK (API 33 or higher)
- Android Emulator or physical device
- Java Development Kit (JDK) 11 or higher

**For Web Development:**
- Modern browser (Chrome, Firefox, Safari, or Edge)
- No additional requirements

---

### Initial Setup

#### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/your-org/edutrack-mobile.git
cd edutrack-mobile/mobile

# Or if you're already in mobile directory
cd mobile
```

#### 2. Install Dependencies

```bash
# Install all npm dependencies
npm install

# This will install:
# - expo and expo-router
# - React Native and React
# - All required libraries
# - Development tools
```

#### 3. Environment Configuration

Create environment files:

```bash
# Copy example environment file
cp .env.example .env.development

# Edit with your values
# Use your preferred editor
code .env.development  # VS Code
# or
nano .env.development  # Terminal editor
```

**Required environment variables:**

```bash
# .env.development
API_URL=https://api-dev.edutrack.app
API_TIMEOUT=30000
SENTRY_DSN=your_sentry_dsn_here
ENVIRONMENT=development
```

#### 4. iOS Setup (macOS only)

```bash
# Navigate to iOS directory
cd ios

# Install CocoaPods dependencies
pod install

# Return to root
cd ..
```

**Configure iOS signing:**
1. Open `ios/EduTrack.xcworkspace` in Xcode
2. Select the project in navigator
3. Select your target
4. Go to "Signing & Capabilities"
5. Select your development team
6. Ensure bundle identifier matches: `com.edutrack.app`

#### 5. Android Setup

```bash
# Ensure ANDROID_HOME is set
echo $ANDROID_HOME  # Should output Android SDK path

# If not set, add to your shell profile:
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
export ANDROID_HOME=$HOME/Android/Sdk          # Linux
# Windows: Set in System Environment Variables
```

**Configure Google Services:**
1. Place `google-services.json` in `android/app/`
2. Ensure file is listed in `.gitignore`
3. Never commit this file to version control

---

### Development Commands

#### Start Development Server

```bash
# Start Expo development server
npm start

# The server will start and display:
# - QR code for Expo Go app
# - Options to run on iOS, Android, or web
# - Metro bundler URL
```

#### Run on Specific Platforms

```bash
# iOS Simulator (macOS only)
npm run ios

# Android Emulator
npm run android

# Web Browser
npm run web
```

#### Clear Cache and Restart

```bash
# Clear Metro bundler cache
npx expo start -c

# Clear all caches (nuclear option)
rm -rf node_modules/.cache
rm -rf .expo
rm -rf .metro
npx expo start -c

# Full clean and reinstall
rm -rf node_modules
npm install
npx expo start -c
```

---

### IDE Configuration

#### VS Code (Recommended)

**Install recommended extensions:**
1. ESLint
2. Prettier
3. React Native Tools
4. TypeScript and JavaScript Language Features
5. Path Intellisense

**Settings (`.vscode/settings.json`):**

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.exclude": {
    "**/.expo": true,
    "**/.expo-shared": true,
    "**/node_modules": true
  }
}
```

**Workspace recommendations (`.vscode/extensions.json`):**

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "msjsdiag.vscode-react-native",
    "christian-kohler.path-intellisense"
  ]
}
```

---

### Path Aliases Setup Verification

Verify that path aliases are correctly configured:

#### Check TypeScript Configuration

```bash
# Verify tsconfig.json has correct paths
cat tsconfig.json | grep -A 20 "paths"
```

Should show:
```json
"paths": {
  "@components": ["src/components"],
  "@components/*": ["src/components/*"],
  "@store": ["src/store"],
  "@utils": ["src/utils"],
  // ... other aliases
}
```

#### Check Babel Configuration

```bash
# Verify babel.config.js has aliases
cat babel.config.js | grep -A 15 "alias"
```

Should show module-resolver plugin with aliases.

#### Check Metro Configuration

```bash
# Verify metro.config.js has aliases
cat metro.config.js | grep -A 15 "extraNodeModules"
```

Should show path.resolve mappings for all aliases.

#### Test Import Resolution

Create a test file to verify:

```typescript
// test-imports.ts
import { Button } from '@components/shared/Button';
import { store } from '@store';
import { formatDate } from '@utils/formatters';

console.log('All imports resolved successfully!');
```

Run:
```bash
npx tsc --noEmit test-imports.ts
# Should have no errors
```

---

### Troubleshooting Setup Issues

#### npm install fails

```bash
# Clear npm cache
npm cache clean --force

# Delete lock file and try again
rm -rf package-lock.json node_modules
npm install
```

#### Pod install fails (iOS)

```bash
# Update CocoaPods
sudo gem install cocoapods

# Update pod repo
pod repo update

# Clean and reinstall
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

#### Metro bundler port already in use

```bash
# Find process using port 8081
lsof -i :8081

# Kill the process
kill -9 <PID>

# Or use different port
npx expo start --port 8082
```

#### TypeScript errors after installation

```bash
# Restart TypeScript server in VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"

# Or from command line
npx tsc --noEmit

# Clear TypeScript cache
rm -rf node_modules/.cache
```

---

### Project Structure Overview

```
mobile/
├── app/                     # Expo Router file-based routing
│   ├── _layout.tsx         # Root layout with providers
│   ├── index.tsx           # Entry point (redirects based on auth)
│   ├── (auth)/             # Authentication screens
│   ├── (tabs)/             # Tab navigation for roles
│   ├── assignments/        # Assignment detail screens
│   ├── courses/            # Course screens
│   └── +not-found.tsx      # 404 page
│
├── src/                    # Source code
│   ├── api/               # API client and endpoints
│   ├── components/        # Reusable components
│   ├── config/            # App configuration
│   ├── hooks/             # Custom React hooks
│   ├── services/          # Business logic services
│   ├── store/             # Redux store and slices
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
│
├── assets/                # Static assets (images, fonts)
├── ios/                   # iOS native code
├── android/               # Android native code
├── docs/                  # Documentation
│
├── .env.development       # Development environment variables
├── .env.production        # Production environment variables
├── app.config.js          # Expo configuration
├── babel.config.js        # Babel configuration
├── metro.config.js        # Metro bundler configuration
├── tsconfig.json          # TypeScript configuration
├── package.json           # npm dependencies and scripts
└── webpack.config.js      # Web bundler configuration
```

---

### Testing Your Setup

Run these commands to verify everything is working:

```bash
# 1. Type check
npm run type-check
# Should complete with no errors

# 2. Lint check
npm run lint
# Should complete with no errors

# 3. Start development server
npm start
# Should start without errors

# 4. Run on web (easiest to test)
npm run web
# Should open browser and display app

# 5. Verify path aliases work
# Create a test screen and try importing:
# import { Button } from '@components/shared/Button';
```

---

### Next Steps After Setup

1. **Read the documentation:**
   - `docs/QUICK_REFERENCE.md` - Quick reference guide
   - `docs/TROUBLESHOOTING.md` - Common issues and solutions
   - `docs/API_INTEGRATION.md` - API integration guide

2. **Explore the codebase:**
   - Start with `app/_layout.tsx` to understand the app structure
   - Review `src/store/` to understand state management
   - Check `src/api/` to see API integration

3. **Make your first change:**
   - Create a new screen in `app/`
   - Add a new component in `src/components/`
   - Test navigation to your new screen

4. **Join the development workflow:**
   - Create feature branches
   - Make commits following conventions
   - Submit pull requests for review

---

## Migration Examples

Practical examples showing old React Navigation code and new Expo Router equivalents.

### Example 1: Basic Screen Navigation

**React Navigation (Old):**
```typescript
// ❌ OLD: src/screens/student/AssignmentsScreen.tsx
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList } from '@types/navigation';

type NavigationProp = NativeStackNavigationProp<MainTabParamList>;

export const AssignmentsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleAssignmentPress = (assignmentId: string) => {
    navigation.navigate('AssignmentDetail', { assignmentId });
  };

  return (
    <TouchableOpacity onPress={() => handleAssignmentPress('123')}>
      <Text>View Assignment</Text>
    </TouchableOpacity>
  );
};
```

**Expo Router (New):**
```typescript
// ✅ NEW: app/(tabs)/student/assignments.tsx
import { useRouter } from 'expo-router';

export default function AssignmentsScreen() {
  const router = useRouter();

  const handleAssignmentPress = (assignmentId: string) => {
    router.push(`/assignments/${assignmentId}`);
  };

  return (
    <TouchableOpacity onPress={() => handleAssignmentPress('123')}>
      <Text>View Assignment</Text>
    </TouchableOpacity>
  );
}
```

---

### Example 2: Screen with Parameters

**React Navigation (Old):**
```typescript
// ❌ OLD: src/screens/assignments/AssignmentDetailScreen.tsx
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AssignmentStackParamList } from '@types/navigation';

type Props = NativeStackScreenProps<AssignmentStackParamList, 'AssignmentDetail'>;

export function AssignmentDetailScreen({ route, navigation }: Props) {
  const { assignmentId } = route.params;

  const handleSubmit = () => {
    navigation.navigate('AssignmentSubmission', { 
      assignmentId,
      mode: 'new'
    });
  };

  return (
    <View>
      <Text>Assignment: {assignmentId}</Text>
      <Button onPress={handleSubmit}>Submit</Button>
    </View>
  );
}
```

**Expo Router (New):**
```typescript
// ✅ NEW: app/assignments/[id].tsx
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function AssignmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const handleSubmit = () => {
    router.push({
      pathname: '/assignments/[id]/submit',
      params: { id, mode: 'new' }
    });
  };

  return (
    <View>
      <Text>Assignment: {id}</Text>
      <Button onPress={handleSubmit}>Submit</Button>
    </View>
  );
}
```

---

### Example 3: Authentication Flow

**React Navigation (Old):**
```typescript
// ❌ OLD: Conditional navigation structure
function RootNavigator() {
  const { isAuthenticated } = useAppSelector(state => state.auth);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
```

**Expo Router (New):**
```typescript
// ✅ NEW: Route guards in app/_layout.tsx
function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading } = useAppSelector(state => state.auth);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/student');
    }
  }, [isAuthenticated, segments, isLoading]);

  if (isLoading) return <Loading />;
  
  return <Slot />;
}
```

---

## Additional Resources

### Official Documentation
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)

### Related Guides
- `docs/TROUBLESHOOTING.md` - General troubleshooting
- `docs/API_INTEGRATION.md` - API integration patterns
- `docs/QUICK_REFERENCE.md` - Quick reference guide
- `docs/DEEP_LINK_INTEGRATION_EXAMPLES.md` - Deep linking examples

### Getting Help
- Check console logs for detailed error messages
- Use React DevTools for debugging
- Review Metro bundler output
- Check TypeScript compiler errors

---

**Migration Complete!** 🎉

This guide covers all aspects of the Expo Router migration. For additional help or questions, refer to the related documentation or consult the development team.
