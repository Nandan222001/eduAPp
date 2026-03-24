# Expo Router Migration Guide

This comprehensive guide documents the migration from React Navigation to Expo Router, including removed navigation files, changes to routing patterns, deep linking configuration, path alias troubleshooting, and detailed code examples.

## Table of Contents

- [Overview](#overview)
- [Removed Navigation Files](#removed-navigation-files)
- [File-Based Routing Structure](#file-based-routing-structure)
- [Navigation Pattern Changes](#navigation-pattern-changes)
- [Deep Linking with Expo Router](#deep-linking-with-expo-router)
- [Path Alias Configuration](#path-alias-configuration)
- [Troubleshooting Common Import Errors](#troubleshooting-common-import-errors)
- [Migration Examples: Old vs New](#migration-examples-old-vs-new)
- [Testing Checklist](#testing-checklist)

---

## Overview

The migration from React Navigation to Expo Router represents a fundamental shift in how navigation is handled in the application.

### What Changed

| Aspect | React Navigation (Old) | Expo Router (New) |
|--------|----------------------|-------------------|
| **Route Definition** | Imperative, code-based | Declarative, file-based |
| **Navigation Container** | `<NavigationContainer>` wrapper | Built-in via `<Slot>` |
| **Type Safety** | Manual type definitions | Auto-generated from files |
| **Deep Linking** | Manual configuration | Automatic from file structure |
| **Screen Access** | Via navigator prop | Via hooks (`useRouter`) |
| **URL Structure** | Separate configuration | Mirrors file structure |

### Key Benefits

✅ **Automatic Route Generation** - Files in `app/` directory automatically become routes  
✅ **Type-Safe Navigation** - TypeScript types generated from file structure  
✅ **Simplified Deep Linking** - URLs automatically map to file paths  
✅ **Better DX** - Less boilerplate, faster development  
✅ **Web Support** - Clean URLs that work seamlessly on web

---

## Removed Navigation Files

The following files were removed during the migration. Their functionality has been replaced by Expo Router's file-based routing and layout system.

### 1. AuthNavigator.tsx

**Previous Location:** `src/navigation/AuthNavigator.tsx`

**What It Did:**
- Configured stack navigator for authentication screens
- Defined routes for login, register, forgot password, OTP flows
- Set screen options (headers, transitions, gestures)

**Example of Old Code:**
```typescript
// ❌ OLD: src/navigation/AuthNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

const Stack = createNativeStackNavigator();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
```

**Replaced By:** `app/(auth)/_layout.tsx`

```typescript
// ✅ NEW: app/(auth)/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
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

**File Structure:**
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

### 2. MainNavigator.tsx

**Previous Location:** `src/navigation/MainNavigator.tsx`

**What It Did:**
- Root navigator that switched between Auth and Main app
- Handled authentication state checking
- Conditionally rendered auth or main stack based on login state

**Example of Old Code:**
```typescript
// ❌ OLD: src/navigation/MainNavigator.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppSelector } from '../store/hooks';
import { AuthNavigator } from './AuthNavigator';
import { TabNavigator } from './TabNavigator';

const Stack = createNativeStackNavigator();

export function MainNavigator() {
  const { isAuthenticated } = useAppSelector(state => state.auth);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={TabNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
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
    if (isLoading) return; // Wait for auth check

    const inAuthGroup = segments[0] === '(auth)';

    // Redirect logic
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/student');
    }
  }, [isAuthenticated, segments, isLoading]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <RootLayoutNav />
    </Provider>
  );
}
```

---

### 3. StudentTabNavigator.tsx

**Previous Location:** `src/navigation/StudentTabNavigator.tsx`

**What It Did:**
- Created bottom tab navigator for student role
- Defined tabs: Home, Assignments, Schedule, Grades, Profile
- Configured tab icons, labels, and badge counts
- Set tab bar styling and active/inactive colors

**Example of Old Code:**
```typescript
// ❌ OLD: src/navigation/StudentTabNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from '@rneui/themed';
import HomeScreen from '../screens/student/HomeScreen';
import AssignmentsScreen from '../screens/student/AssignmentsScreen';
import ScheduleScreen from '../screens/student/ScheduleScreen';

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
import React from 'react';
import { Tabs } from 'expo-router';
import { Icon } from '@rneui/themed';

export default function StudentTabsLayout() {
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

**File Structure:**
```
app/(tabs)/student/
├── _layout.tsx         → Tab navigator configuration
├── index.tsx           → Home tab (/student)
├── assignments.tsx     → Assignments tab
├── schedule.tsx        → Schedule tab
├── grades.tsx          → Grades tab
└── profile.tsx         → Profile tab
```

---

### 4. ParentTabNavigator.tsx

**Previous Location:** `src/navigation/ParentTabNavigator.tsx`

**What It Did:**
- Created bottom tab navigator for parent role
- Defined tabs: Dashboard, Children, Communication, Reports, Profile
- Configured parent-specific tab icons and navigation

**Example of Old Code:**
```typescript
// ❌ OLD: src/navigation/ParentTabNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from '@rneui/themed';
import DashboardScreen from '../screens/parent/DashboardScreen';
import ChildrenScreen from '../screens/parent/ChildrenScreen';

const Tab = createBottomTabNavigator();

export function ParentTabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="dashboard" type="material" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Children"
        component={ChildrenScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="people" type="material" color={color} size={size} />
          ),
        }}
      />
      {/* More tabs... */}
    </Tab.Navigator>
  );
}
```

**Replaced By:** `app/(tabs)/parent/_layout.tsx`

```typescript
// ✅ NEW: app/(tabs)/parent/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { Icon } from '@rneui/themed';

export default function ParentTabsLayout() {
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
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Icon name="dashboard" type="material" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="children"
        options={{
          title: 'Children',
          tabBarLabel: 'Children',
          tabBarIcon: ({ color, size }) => (
            <Icon name="people" type="material" color={color} size={size} />
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
- Typed screen props and navigation props
- Defined param lists for each navigator

**Example of Old Code:**
```typescript
// ❌ OLD: src/types/navigation.ts
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Assignments: undefined;
  AssignmentDetail: { assignmentId: string };
  Profile: undefined;
};

// Screen props
export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type AssignmentDetailProps = NativeStackScreenProps<MainTabParamList, 'AssignmentDetail'>;
```

**Replaced By:** Auto-generated types from Expo Router

```typescript
// ✅ NEW: No manual definitions needed!
// Types are auto-generated in .expo/types/router.d.ts

import { useLocalSearchParams } from 'expo-router';

function AssignmentDetail() {
  // Type-safe params without manual definitions
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  // assignmentId is correctly typed as string
}
```

---

## File-Based Routing Structure

Expo Router uses your file structure to automatically generate routes.

### Directory Structure

```
app/
├── _layout.tsx              → Root layout (wraps all routes)
├── index.tsx                → Entry point (/)
├── +not-found.tsx           → 404 page
│
├── (auth)/                  → Auth group (hidden from URL)
│   ├── _layout.tsx          → Auth stack configuration
│   ├── login.tsx            → /login
│   ├── register.tsx         → /register
│   └── forgot-password.tsx  → /forgot-password
│
├── (tabs)/                  → Tab navigation group
│   ├── _layout.tsx          → Role-based tab router
│   ├── student/             → Student role routes
│   │   ├── _layout.tsx      → Student tab bar
│   │   ├── index.tsx        → /student (home)
│   │   ├── assignments.tsx  → /student/assignments
│   │   └── grades.tsx       → /student/grades
│   └── parent/              → Parent role routes
│       ├── _layout.tsx      → Parent tab bar
│       ├── index.tsx        → /parent (dashboard)
│       └── children.tsx     → /parent/children
│
├── assignments/             → Assignment routes
│   └── [id].tsx            → /assignments/:id (dynamic)
│
├── courses/                 → Course routes
│   └── [id].tsx            → /courses/:id
│
├── profile.tsx              → /profile
└── settings.tsx             → /settings
```

### File Naming Conventions

| Pattern | Purpose | Example | Generated Route |
|---------|---------|---------|----------------|
| `filename.tsx` | Regular route | `settings.tsx` | `/settings` |
| `index.tsx` | Directory default | `student/index.tsx` | `/student` |
| `[param].tsx` | Dynamic segment | `[id].tsx` | `/assignments/123` |
| `[...rest].tsx` | Catch-all route | `[...slug].tsx` | `/docs/a/b/c` |
| `(group)/` | Layout group (hidden) | `(auth)/login.tsx` | `/login` (not `/auth/login`) |
| `_layout.tsx` | Layout wrapper | `_layout.tsx` | N/A (wrapper only) |
| `+not-found.tsx` | 404 error page | `+not-found.tsx` | Unmatched routes |

### Layout Files (`_layout.tsx`)

Layout files wrap their child routes and can:
- Configure navigation patterns (Stack, Tabs, Drawer)
- Set screen options (headers, transitions)
- Provide shared UI (headers, footers)
- Share state/context with children

**Example:**
```typescript
// app/(tabs)/student/_layout.tsx
import { Tabs } from 'expo-router';

export default function StudentLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="grades" options={{ title: 'Grades' }} />
    </Tabs>
  );
}
```

---

## Navigation Pattern Changes

### 1. Screen Access

**React Navigation (Old):**
```typescript
// ❌ OLD: Screens receive navigation prop
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<MainTabParamList>;

function MyScreen({ navigation, route }) {
  // Via prop
  navigation.navigate('AssignmentDetail', { assignmentId: '123' });
  
  // Or via hook
  const nav = useNavigation<NavigationProp>();
  nav.navigate('AssignmentDetail', { assignmentId: '123' });
  
  // Access params
  const { assignmentId } = route.params;
}
```

**Expo Router (New):**
```typescript
// ✅ NEW: Use hooks, no props needed
import { useRouter, useLocalSearchParams } from 'expo-router';

function MyScreen() {
  const router = useRouter();
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  
  // Navigate with router
  router.push('/assignments/123');
  
  // Or use paths
  router.push(`/assignments/${assignmentId}`);
}
```

### 2. Navigation Methods

| Action | React Navigation (Old) | Expo Router (New) |
|--------|----------------------|-------------------|
| **Navigate** | `navigation.navigate('Screen', params)` | `router.push('/screen')` or `router.push({ pathname: '/screen', params })` |
| **Replace** | `navigation.replace('Screen')` | `router.replace('/screen')` |
| **Go Back** | `navigation.goBack()` | `router.back()` |
| **Pop to Top** | `navigation.popToTop()` | `router.dismiss()` or `router.dismissAll()` |
| **Reset** | `navigation.reset({ routes: [...] })` | Navigate to desired route with `replace` |

### 3. Passing Parameters

**React Navigation (Old):**
```typescript
// ❌ OLD: Pass params as second argument
navigation.navigate('AssignmentDetail', { 
  assignmentId: '123',
  mode: 'edit'
});

// Access params
const { assignmentId, mode } = route.params;
```

**Expo Router (New):**
```typescript
// ✅ NEW: Multiple ways to pass params

// Method 1: String interpolation
router.push(`/assignments/${assignmentId}?mode=edit`);

// Method 2: Object with params
router.push({
  pathname: '/assignments/[id]',
  params: { id: '123', mode: 'edit' }
});

// Access params
const { id, mode } = useLocalSearchParams<{ id: string; mode?: string }>();
```

### 4. Nested Navigation

**React Navigation (Old):**
```typescript
// ❌ OLD: Navigate through nested navigators
navigation.navigate('Main', {
  screen: 'StudentTabs',
  params: {
    screen: 'Assignments',
    params: { assignmentId: '123' }
  }
});
```

**Expo Router (New):**
```typescript
// ✅ NEW: Direct path-based navigation
router.push('/student/assignments');
router.push('/assignments/123');

// No need to specify parent navigators!
```

### 5. Conditional Rendering vs Route Guards

**React Navigation (Old):**
```typescript
// ❌ OLD: Conditional rendering in navigator
<Stack.Navigator>
  {isAuthenticated ? (
    <>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </>
  ) : (
    <>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </>
  )}
</Stack.Navigator>
```

**Expo Router (New):**
```typescript
// ✅ NEW: Route guards in root layout
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

  return <Slot />;
}
```

### 6. Tab Visibility

**React Navigation (Old):**
```typescript
// ❌ OLD: Conditional tab rendering
<Tab.Navigator>
  <Tab.Screen name="Home" component={HomeScreen} />
  {isPremium && <Tab.Screen name="Premium" component={PremiumScreen} />}
</Tab.Navigator>
```

**Expo Router (New):**
```typescript
// ✅ NEW: Use href: null to hide tabs
<Tabs>
  <Tabs.Screen name="index" options={{ title: 'Home' }} />
  <Tabs.Screen 
    name="ai-predictions" 
    options={{
      title: 'AI Predictions',
      href: null, // Hidden from tab bar, but accessible via navigation
    }} 
  />
</Tabs>
```

---

## Deep Linking with Expo Router

One of Expo Router's biggest advantages is automatic deep linking support.

### Automatic URL Mapping

Expo Router automatically creates URL schemes based on your file structure:

| File Path | Generated URL |
|-----------|---------------|
| `app/login.tsx` | `edutrack://login` |
| `app/assignments/[id].tsx` | `edutrack://assignments/123` |
| `app/courses/[id]/lessons.tsx` | `edutrack://courses/math101/lessons` |
| `app/(tabs)/student/index.tsx` | `edutrack://student` |

### Configuration in `app.config.js`

```javascript
export default {
  expo: {
    // Custom URL scheme
    scheme: "edutrack",
    
    // iOS Universal Links
    ios: {
      bundleIdentifier: "com.edutrack.app",
      associatedDomains: [
        "applinks:edutrack.app",
        "applinks:*.edutrack.app"
      ]
    },
    
    // Android App Links
    android: {
      package: "com.edutrack.app",
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "edutrack.app",
              pathPrefix: "/"
            },
            {
              scheme: "edutrack"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
};
```

### Deep Link Utilities

The app includes utilities in `src/utils/deepLinking.ts`:

```typescript
import * as Linking from 'expo-linking';

// Parse a deep link URL
export function parseDeepLink(url: string): DeepLinkRoute | null {
  const parsed = Linking.parse(url);
  return {
    path: parsed.path,
    params: parsed.queryParams as Record<string, string>
  };
}

// Create a deep link
export function createDeepLink(path: string, params?: Record<string, string>): string {
  const queryString = params 
    ? '?' + Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&')
    : '';
  
  return `edutrack://${path}${queryString}`;
}

// Validate deep link
export function isValidDeepLink(url: string): boolean {
  return url.startsWith('edutrack://') || 
         url.startsWith('https://edutrack.app') ||
         url.includes('edutrack.app');
}
```

### Deep Link Handling in `app/_layout.tsx`

```typescript
const handleDeepLink = useCallback((url: string) => {
  if (!isValidDeepLink(url)) {
    console.warn('Invalid deep link:', url);
    return;
  }

  const normalizedUrl = normalizeDeepLink(url);
  const route = parseDeepLink(normalizedUrl);
  
  if (!route) {
    console.warn('Failed to parse deep link:', url);
    return;
  }

  console.log('Deep link navigation:', route);

  // Check authentication
  if (!isAuthenticated && !route.path.startsWith('(auth)')) {
    router.replace({
      pathname: '/(auth)/login',
      params: { returnPath: route.path, ...route.params }
    });
    return;
  }

  // Navigate to the route
  if (route.params && Object.keys(route.params).length > 0) {
    router.push({
      pathname: route.path,
      params: route.params
    });
  } else {
    router.push(route.path);
  }
}, [isAuthenticated, router]);

// Listen for initial URL (app opened via link)
useEffect(() => {
  const handleInitialURL = async () => {
    const url = await getInitialURL();
    if (url) {
      handleDeepLink(url);
    }
  };
  handleInitialURL();
}, [handleDeepLink]);

// Listen for URL changes (app already open)
useEffect(() => {
  const subscription = addDeepLinkListener((url) => {
    handleDeepLink(url);
  });
  return () => subscription.remove();
}, [handleDeepLink]);
```

### Testing Deep Links

#### iOS Simulator
```bash
xcrun simctl openurl booted edutrack://assignments/123
xcrun simctl openurl booted "edutrack://courses/math101?tab=materials"
```

#### Android Emulator
```bash
adb shell am start -W -a android.intent.action.VIEW \
  -d "edutrack://assignments/123" \
  com.edutrack.app
```

#### Web Browser
```
http://localhost:8081/assignments/123
http://localhost:8081/student/grades
```

---

## Path Alias Configuration

The project uses path aliases to simplify imports and avoid relative path hell.

### Configuration Files

Path aliases must be configured in **three places** to work correctly:

#### 1. TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components": ["src/components"],
      "@components/*": ["src/components/*"],
      "@screens": ["src/screens"],
      "@screens/*": ["src/screens/*"],
      "@store": ["src/store"],
      "@store/*": ["src/store/*"],
      "@utils": ["src/utils"],
      "@utils/*": ["src/utils/*"],
      "@config": ["src/config"],
      "@config/*": ["src/config/*"],
      "@types": ["src/types"],
      "@types/*": ["src/types/*"],
      "@api": ["src/api"],
      "@api/*": ["src/api/*"],
      "@hooks": ["src/hooks"],
      "@hooks/*": ["src/hooks/*"],
      "@services": ["src/services"],
      "@services/*": ["src/services/*"],
      "@constants": ["src/constants"],
      "@constants/*": ["src/constants/*"],
      "@theme": ["src/theme"],
      "@theme/*": ["src/theme/*"]
    }
  }
}
```

#### 2. Babel Configuration (`babel.config.js`)

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@store': './src/store',
            '@utils': './src/utils',
            '@config': './src/config',
            '@types': './src/types',
            '@api': './src/api',
            '@hooks': './src/hooks',
            '@services': './src/services',
            '@constants': './src/constants',
            '@theme': './src/theme',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
```

#### 3. Metro Configuration (`metro.config.js`)

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add path alias resolution
config.resolver.extraNodeModules = {
  '@': path.resolve(__dirname, 'src'),
  '@components': path.resolve(__dirname, 'src/components'),
  '@screens': path.resolve(__dirname, 'src/screens'),
  '@store': path.resolve(__dirname, 'src/store'),
  '@utils': path.resolve(__dirname, 'src/utils'),
  '@config': path.resolve(__dirname, 'src/config'),
  '@types': path.resolve(__dirname, 'src/types'),
  '@api': path.resolve(__dirname, 'src/api'),
  '@hooks': path.resolve(__dirname, 'src/hooks'),
  '@services': path.resolve(__dirname, 'src/services'),
  '@constants': path.resolve(__dirname, 'src/constants'),
  '@theme': path.resolve(__dirname, 'src/theme'),
};

module.exports = config;
```

### Available Aliases

| Alias | Resolves To | Example Usage |
|-------|-------------|---------------|
| `@components` | `src/components` | `import { Button } from '@components/shared/Button'` |
| `@screens` | `src/screens` | `import HomeScreen from '@screens/student/HomeScreen'` |
| `@store` | `src/store` | `import { store } from '@store'` |
| `@utils` | `src/utils` | `import { formatDate } from '@utils/dateHelpers'` |
| `@config` | `src/config` | `import { API_URL } from '@config/env'` |
| `@types` | `src/types` | `import type { User } from '@types/user'` |
| `@api` | `src/api` | `import { studentApi } from '@api/studentApi'` |
| `@hooks` | `src/hooks` | `import { useAuth } from '@hooks/useAuth'` |
| `@services` | `src/services` | `import { authService } from '@services/auth'` |
| `@constants` | `src/constants` | `import { COLORS } from '@constants/theme'` |
| `@theme` | `src/theme` | `import { theme } from '@theme'` |

### Why Three Configurations?

- **TypeScript (`tsconfig.json`)**: Provides IntelliSense and type checking in your IDE
- **Babel (`babel.config.js`)**: Transforms aliases during JavaScript transpilation
- **Metro (`metro.config.js`)**: Resolves aliases during bundling for React Native

All three must match or you'll get import errors!

---

## Troubleshooting Common Import Errors

### Error: "Unable to resolve module @components/Button"

**Symptom:**
```
Error: Unable to resolve module @components/Button from app/index.tsx:
Module @components/Button does not exist in the Haste module map
```

**Causes:**
1. Path aliases not configured in all three places (tsconfig, babel, metro)
2. Metro cache not cleared after configuration changes
3. TypeScript server not restarted
4. Typo in alias or import path

**Solutions:**

✅ **Step 1: Verify all three configs match**

Check that aliases are identical in:
- `tsconfig.json` → `compilerOptions.paths`
- `babel.config.js` → `plugins.module-resolver.alias`
- `metro.config.js` → `resolver.extraNodeModules`

✅ **Step 2: Clear all caches**

```bash
# Clear Metro bundler cache
npx expo start -c

# Clear additional caches
rm -rf node_modules/.cache
rm -rf .expo
rm -rf .metro

# Nuclear option (if above doesn't work)
rm -rf node_modules
npm install
npx expo start -c
```

✅ **Step 3: Restart TypeScript server**

In VS Code:
1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
2. Type "TypeScript: Restart TS Server"
3. Press Enter

✅ **Step 4: Verify import path is correct**

```typescript
// ✅ Correct
import { Button } from '@components/shared/Button';
import { useAuth } from '@hooks/useAuth';

// ❌ Wrong - missing directory
import { Button } from '@components/Button';

// ❌ Wrong - incorrect alias
import { Button } from '@component/shared/Button';
```

---

### Error: "Cannot find module '@components/Button' or its corresponding type declarations"

**Symptom:**
Red squiggly lines in IDE, but app runs fine.

**Cause:** TypeScript configuration issue.

**Solution:**

✅ **Check `tsconfig.json` has correct paths:**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@components": ["src/components"],
      "@components/*": ["src/components/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", "app/**/*.ts", "app/**/*.tsx"]
}
```

✅ **Restart TypeScript server** (see steps above)

✅ **Check file exists at expected path:**

```bash
ls -la src/components/shared/Button.tsx
```

---

### Error: "Invariant Violation: expo-secure-store is not available on web"

**Symptom:**
```
Invariant Violation: "expo-secure-store" is not available on web
```

**Cause:** Trying to import SecureStore on web platform where it's not available.

**Solution:**

✅ **Use the abstraction layer:** `src/utils/secureStorage.ts`

```typescript
// ❌ WRONG - Direct import fails on web
import * as SecureStore from 'expo-secure-store';

// ✅ CORRECT - Use abstraction
import { getAccessToken, setAccessToken } from '@utils/secureStorage';

async function saveToken(token: string) {
  await setAccessToken(token);  // Works on all platforms
}
```

✅ **If you must use directly, lazy load:**

```typescript
import { Platform } from 'react-native';

let SecureStore: any = null;
if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
}

async function saveSecurely(key: string, value: string) {
  if (Platform.OS === 'web') {
    // Use AsyncStorage on web
    await AsyncStorage.setItem(key, value);
  } else {
    // Use SecureStore on native
    await SecureStore.setItemAsync(key, value);
  }
}
```

---

### Error: "No routes matched location"

**Symptom:**
```
Error: No route matched for location: /assignments/123
```

**Causes:**
1. File doesn't exist at expected path
2. File named incorrectly
3. Missing parent `_layout.tsx`
4. Metro cache not updated

**Solutions:**

✅ **Step 1: Verify file exists and is named correctly**

```bash
# For /assignments/123 route, need:
ls -la app/assignments/[id].tsx

# Dynamic routes use [param] syntax:
# ✅ app/assignments/[id].tsx
# ❌ app/assignments/id.tsx
# ❌ app/assignments/detail.tsx
```

✅ **Step 2: Check parent layout exists**

```bash
# Root layout is required
ls -la app/_layout.tsx
```

✅ **Step 3: Clear Metro cache**

```bash
npx expo start -c
```

✅ **Step 4: Check route in dev tools**

```typescript
import { usePathname } from 'expo-router';

console.log('Current route:', usePathname());
// Should print: /assignments/123
```

---

### Error: "Infinite redirect loop"

**Symptom:**
- App continuously redirects between routes
- Console flooded with navigation logs
- App becomes unresponsive

**Cause:** Navigation guard logic without proper loading checks.

**Solution:**

```typescript
// ❌ WRONG - Missing isLoading check
useEffect(() => {
  if (!isAuthenticated) {
    router.replace('/(auth)/login');
  }
}, [isAuthenticated]);
// Runs immediately, even while auth is loading!

// ✅ CORRECT - Wait for loading to complete
useEffect(() => {
  if (isLoading) return; // Critical!
  
  const inAuthGroup = segments[0] === '(auth)';
  
  if (!isAuthenticated && !inAuthGroup) {
    router.replace('/(auth)/login');
  } else if (isAuthenticated && inAuthGroup) {
    router.replace('/(tabs)/student');
  }
}, [isAuthenticated, segments, isLoading]);
```

**Key Points:**
- Always check `isLoading` before redirecting
- Use `segments` to detect current route group
- Use `router.replace()` (not `push()`) for guards
- Include all dependencies in useEffect array

---

### Error: "Property 'navigation' does not exist on type 'Props'"

**Symptom:**
```typescript
Property 'navigation' does not exist on type 'Props'
```

**Cause:** Using React Navigation patterns with Expo Router.

**Solution:**

```typescript
// ❌ WRONG - React Navigation pattern
function MyScreen({ navigation, route }) {
  navigation.navigate('Details', { id: route.params.id });
}

// ✅ CORRECT - Expo Router pattern
import { useRouter, useLocalSearchParams } from 'expo-router';

function MyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  
  router.push(`/details/${params.id}`);
}
```

---

### Error: "Module not found: Can't resolve 'babel-plugin-module-resolver'"

**Symptom:**
```
Module not found: Error: Can't resolve 'babel-plugin-module-resolver'
```

**Cause:** Missing dependency.

**Solution:**

```bash
npm install --save-dev babel-plugin-module-resolver
```

Then restart:
```bash
npx expo start -c
```

---

## Migration Examples: Old vs New

### Example 1: Basic Screen Navigation

**React Navigation (Old):**
```typescript
// ❌ OLD: src/screens/student/AssignmentsScreen.tsx
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList } from '../../types/navigation';

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
// ❌ OLD: src/screens/student/AssignmentDetailScreen.tsx
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<MainStackParamList, 'AssignmentDetail'>;

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

### Example 3: Nested Tab Navigation

**React Navigation (Old):**
```typescript
// ❌ OLD: Navigate to nested tab
navigation.navigate('Main', {
  screen: 'StudentTabs',
  params: {
    screen: 'Assignments',
    params: { filter: 'pending' }
  }
});
```

**Expo Router (New):**
```typescript
// ✅ NEW: Direct path navigation
router.push('/student/assignments?filter=pending');

// Or with object syntax
router.push({
  pathname: '/student/assignments',
  params: { filter: 'pending' }
});
```

---

### Example 4: Modal Navigation

**React Navigation (Old):**
```typescript
// ❌ OLD: Define modal in navigator
<Stack.Group screenOptions={{ presentation: 'modal' }}>
  <Stack.Screen name="FilterModal" component={FilterModal} />
</Stack.Group>

// Navigate to modal
navigation.navigate('FilterModal', { filters });
```

**Expo Router (New):**
```typescript
// ✅ NEW: Define modal in layout
// app/_layout.tsx
<Stack>
  <Stack.Screen name="index" />
  <Stack.Screen 
    name="filter-modal" 
    options={{
      presentation: 'modal',
      animation: 'slide_from_bottom'
    }} 
  />
</Stack>

// Navigate to modal
router.push('/filter-modal');
```

---

### Example 5: Authentication Flow

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
// ✅ NEW: Route guards in layout
// app/_layout.tsx
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

  return <Slot />;
}
```

---

### Example 6: Deep Linking

**React Navigation (Old):**
```typescript
// ❌ OLD: Manual linking configuration
const linking = {
  prefixes: ['edutrack://', 'https://edutrack.app'],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          Register: 'register',
        },
      },
      Main: {
        screens: {
          StudentTabs: {
            screens: {
              Assignments: 'assignments',
              AssignmentDetail: 'assignments/:id',
            },
          },
        },
      },
    },
  },
};

<NavigationContainer linking={linking}>
  {/* navigators */}
</NavigationContainer>
```

**Expo Router (New):**
```typescript
// ✅ NEW: Automatic from file structure!
// File: app/assignments/[id].tsx
// Automatically creates: edutrack://assignments/:id

// Configure scheme in app.config.js:
export default {
  expo: {
    scheme: "edutrack",
  }
};

// That's it! No manual configuration needed.
```

---

### Example 7: Header Configuration

**React Navigation (Old):**
```typescript
// ❌ OLD: Configure in navigator
<Stack.Screen
  name="AssignmentDetail"
  component={AssignmentDetailScreen}
  options={{
    title: 'Assignment Details',
    headerRight: () => <HeaderButton />,
    headerStyle: {
      backgroundColor: '#2089dc',
    },
    headerTintColor: '#fff',
  }}
/>
```

**Expo Router (New):**
```typescript
// ✅ NEW: Configure in layout or use Stack.Screen
// app/_layout.tsx
<Stack>
  <Stack.Screen
    name="assignments/[id]"
    options={{
      title: 'Assignment Details',
      headerRight: () => <HeaderButton />,
      headerStyle: {
        backgroundColor: '#2089dc',
      },
      headerTintColor: '#fff',
    }}
  />
</Stack>

// Or configure in the screen file itself with export
export const options = {
  title: 'Assignment Details',
  headerRight: () => <HeaderButton />,
};
```

---

### Example 8: Back Navigation

**React Navigation (Old):**
```typescript
// ❌ OLD
navigation.goBack();
navigation.pop();
navigation.popToTop();
```

**Expo Router (New):**
```typescript
// ✅ NEW
router.back();          // Go back one screen
router.dismiss();       // Close modal/dismiss
router.dismissAll();    // Dismiss all modals
router.canGoBack();     // Check if can go back
```

---

## Testing Checklist

Use this checklist to verify the migration is complete and working correctly:

### Navigation
- [ ] All screens are accessible via file-based routes
- [ ] Tab navigation works for both student and parent roles
- [ ] Stack navigation works for detail screens
- [ ] Back button works correctly
- [ ] Modal screens display properly
- [ ] Hidden tabs (href: null) are not visible but accessible

### Authentication
- [ ] Login redirects to appropriate role dashboard
- [ ] Logout redirects to login screen
- [ ] Unauthenticated users redirected to login
- [ ] Authenticated users can't access auth screens
- [ ] No infinite redirect loops

### Deep Linking
- [ ] Custom scheme works (`edutrack://`)
- [ ] Universal Links work (iOS)
- [ ] App Links work (Android)
- [ ] Web URLs work in browser
- [ ] Dynamic routes work with parameters
- [ ] Invalid routes show 404 page

### Path Aliases
- [ ] All `@components` imports work
- [ ] All `@store` imports work
- [ ] All `@utils` imports work
- [ ] IDE IntelliSense works for aliases
- [ ] No "module not found" errors

### Platform Support
- [ ] iOS app runs without errors
- [ ] Android app runs without errors
- [ ] Web app runs without errors
- [ ] No SecureStore errors on web
- [ ] Platform-specific features gracefully degrade

### TypeScript
- [ ] No type errors
- [ ] Auto-generated route types work
- [ ] Parameter types are correct
- [ ] IDE shows proper type hints

### Performance
- [ ] App loads quickly
- [ ] Navigation is smooth
- [ ] No memory leaks
- [ ] Bundle size is reasonable

---

**Migration Complete!** 🎉

This guide should help you understand all the changes made during the migration from React Navigation to Expo Router. If you encounter any issues not covered here, refer to the [official Expo Router documentation](https://docs.expo.dev/router/introduction/).
