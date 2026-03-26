import 'react-native-gesture-handler';
console.log('LAYOUT_LOADED_DEBUG');
import React, { useEffect, useRef } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ThemeProvider } from '@rneui/themed';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { store, persistor } from '@store';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { loadStoredAuth } from '@store/slices/authSlice';
import { Loading, OfflineDataRefresher, NavigationDebugger, ErrorBoundary } from '@components';
import { theme } from '@config/theme';
import { authService } from '@utils/authService';
import { 
  getInitialURL, 
  addDeepLinkListener, 
  parseDeepLink, 
  isValidDeepLink,
  normalizeDeepLink 
} from '@utils/deepLinking';

// Prevent splash screen from auto-hiding (only on native platforms)
if (Platform.OS !== 'web') {
  const SplashScreen = require('expo-splash-screen');
  SplashScreen.preventAutoHideAsync();
}

// Check iOS compatibility on iOS devices (will run on app init)
// checkIOSCompatibility is called in the useEffect hook below

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function RootLayoutNav() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading, activeRole } = useAppSelector(state => state.auth);
  const initialURLHandled = useRef(false);

  const handleDeepLink = React.useCallback((url: string) => {
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

    if (!isAuthenticated && !route.path.startsWith('(auth)')) {
      console.log('User not authenticated, redirecting to login with return path');
      router.replace({
        pathname: '/(auth)/login',
        params: { returnPath: route.path, ...route.params }
      } as any);
      return;
    }

    try {
      if (route.params && Object.keys(route.params).length > 0) {
        router.push({
          pathname: route.path,
          params: route.params
        } as any);
      } else {
        router.push(route.path as any);
      }
    } catch (error) {
      console.error('Failed to navigate to deep link:', error);
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize platform-specific features first
        if (Platform.OS === 'ios') {
          try {
            // Dynamic import for iOS-specific initialization
            const { checkIOSCompatibility, initializeIOSPlatform } = await import('@utils/iosInit');
            await checkIOSCompatibility();
            await initializeIOSPlatform();
          } catch (e) {
            console.warn('iOS initialization warning:', e);
          }
        } else if (Platform.OS === 'android') {
          try {
            // Dynamic import for Android-specific initialization
            const { checkAndroidCompatibility, initializeAndroidPlatform } = await import('@utils/androidInit');
            await checkAndroidCompatibility();
            await initializeAndroidPlatform();
          } catch (e) {
            console.warn('Android initialization warning:', e);
          }
        }

        // Load stored authentication - this will fetch fresh user data from API if tokens exist
        console.log('[App Init] Dispatching loadStoredAuth');
        try {
          const result = await dispatch(loadStoredAuth()).unwrap();
          console.log('[App Init] loadStoredAuth result:', result ? 'User restored' : 'No stored session');
        } catch (authError) {
          console.warn('[App Init] Failed to restore auth session (continuing):', authError);
          // Continue initialization even if auth restoration fails
        }
        
        // Initialize offline support on native platforms only
        if (Platform.OS !== 'web') {
          try {
            const { initializeOfflineSupport } = await import('@utils/offlineInit');
            await initializeOfflineSupport();
          } catch (e) {
            console.warn('Offline support initialization warning:', e);
          }
        }
      } catch (error) {
        console.error('Fatal error during app initialization:', error);
      } finally {
        // Hide splash screen after initialization
        if (Platform.OS !== 'web') {
          try {
            const SplashScreen = require('expo-splash-screen');
            await SplashScreen.hideAsync();
          } catch (e) {
            console.warn('Failed to hide splash screen:', e);
          }
        }
      }
    };

    initApp();
  }, [dispatch]);

  useEffect(() => {
    const handleInitialURL = async () => {
      if (initialURLHandled.current || isLoading) return;
      
      try {
        const url = await getInitialURL();
        if (url) {
          initialURLHandled.current = true;
          console.log('Initial URL:', url);
          handleDeepLink(url);
        }
      } catch (error) {
        console.error('Failed to get initial URL:', error);
      }
    };

    handleInitialURL();
  }, [isLoading, isAuthenticated, handleDeepLink]);

  useEffect(() => {
    const subscription = addDeepLinkListener((url) => {
      console.log('Deep link received:', url);
      handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, [handleDeepLink]);

  useEffect(() => {
    if (isAuthenticated) {
      authService.initializeAuth();
    } else {
      authService.stopAutoRefresh();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    console.log('[Navigation] useEffect triggered:', {
      isAuthenticated,
      activeRole,
      segments,
      inAuthGroup,
    });

    const checkTokenEdgeCase = async () => {
      const { getAccessToken, getRefreshToken } = await import('@utils/secureStorage');
      const accessToken = await getAccessToken();
      const refreshToken = await getRefreshToken();
      
      if ((accessToken || refreshToken) && !isAuthenticated) {
        console.warn('[Navigation] Edge case detected: User has tokens but isAuthenticated is false', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          isAuthenticated,
        });
      }
    };

    checkTokenEdgeCase();

    if (!isAuthenticated && !inAuthGroup) {
      console.log('[Navigation] Redirecting to login - user not authenticated');
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      console.log('[Navigation] User authenticated in auth group, redirecting based on role:', activeRole);
      if (activeRole === 'parent') {
        router.replace('/(tabs)/parent');
      } else if (activeRole === 'student') {
        router.replace('/(tabs)/student');
      } else if (activeRole) {
        router.replace('/(tabs)/student');
      } else {
        router.replace('/(tabs)/student');
      }
    }
  }, [isAuthenticated, activeRole, segments, isLoading, router]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <OfflineDataRefresher autoRefresh={true} refreshIntervalMinutes={15}>
      <Slot />
      <NavigationDebugger enabled={__DEV__} />
    </OfflineDataRefresher>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate 
          loading={<Loading />} 
          persistor={persistor}
          onBeforeLift={() => {
            console.log('[PersistGate] Hydration complete, lifting gate');
          }}
        >
          <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
              <SafeAreaProvider>
                <RootLayoutNav />
                <StatusBar style="auto" />
              </SafeAreaProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
}
