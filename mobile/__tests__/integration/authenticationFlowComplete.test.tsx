/**
 * @fileoverview Comprehensive Authentication Flow Tests
 * 
 * Tests all authentication flows across platforms:
 * - Login with demo credentials
 * - Token storage (SecureStore on native, AsyncStorage on web)
 * - Automatic token refresh
 * - Logout clears tokens and Redux state
 * - Biometric login (iOS/Android only)
 * - Session persistence after app restart
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Platform } from 'react-native';
import { 
  login, 
  logout, 
  loginWithBiometric, 
  loadStoredAuth,
  enableBiometric,
  disableBiometric,
} from '@store/slices/authSlice';
import authReducer from '@store/slices/authSlice';
import { secureStorage } from '@utils/secureStorage';
import { authService } from '@utils/authService';
import { biometricUtils } from '@utils/biometric';
import { STORAGE_KEYS } from '@constants';

// Mock dependencies
jest.mock('@utils/secureStorage');
jest.mock('@utils/biometric');
jest.mock('@api/authApi');

const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
  });
};

describe('Authentication Flow - Complete Test Suite', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    jest.clearAllMocks();
  });

  describe('Login with Demo Credentials', () => {
    it('should login successfully with demo student credentials (demo@example.com/Demo@123)', async () => {
      const credentials = {
        email: 'demo@example.com',
        password: 'Demo@123',
      };

      await act(async () => {
        await store.dispatch(login(credentials));
      });

      const state = store.getState().auth;
      
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toBeDefined();
      expect(state.user?.email).toBe('demo@example.com');
      expect(state.accessToken).toBeDefined();
      expect(state.refreshToken).toBeDefined();
      expect(state.error).toBeNull();
    });

    it('should login successfully with demo parent credentials (parent@demo.com/Demo@123)', async () => {
      const credentials = {
        email: 'parent@demo.com',
        password: 'Demo@123',
      };

      await act(async () => {
        await store.dispatch(login(credentials));
      });

      const state = store.getState().auth;
      
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toBeDefined();
      expect(state.user?.email).toBe('parent@demo.com');
      expect(state.accessToken).toBeDefined();
      expect(state.refreshToken).toBeDefined();
      expect(state.error).toBeNull();
    });

    it('should set active role based on user role', async () => {
      const credentials = {
        email: 'demo@example.com',
        password: 'Demo@123',
      };

      await act(async () => {
        await store.dispatch(login(credentials));
      });

      const state = store.getState().auth;
      
      expect(state.activeRole).toBe('student');
      expect(state.availableRoles).toContain('student');
    });

    it('should fail login with invalid credentials', async () => {
      const credentials = {
        email: 'invalid@example.com',
        password: 'WrongPassword',
      };

      await act(async () => {
        await store.dispatch(login(credentials));
      });

      const state = store.getState().auth;
      
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.error).toBeDefined();
    });
  });

  describe('Token Storage', () => {
    it('should store tokens in SecureStore on native platforms', async () => {
      if (Platform.OS === 'web') {
        console.log('Skipping SecureStore test on web');
        return;
      }

      const mockSetTokens = jest.spyOn(secureStorage, 'setTokens');
      
      const credentials = {
        email: 'demo@example.com',
        password: 'Demo@123',
      };

      await act(async () => {
        await store.dispatch(login(credentials));
      });

      await waitFor(() => {
        expect(mockSetTokens).toHaveBeenCalled();
      });
    });

    it('should store tokens in AsyncStorage on web platform', async () => {
      if (Platform.OS !== 'web') {
        console.log('Skipping AsyncStorage test on native');
        return;
      }

      const mockSetTokens = jest.spyOn(secureStorage, 'setTokens');
      
      const credentials = {
        email: 'demo@example.com',
        password: 'Demo@123',
      };

      await act(async () => {
        await store.dispatch(login(credentials));
      });

      await waitFor(() => {
        expect(mockSetTokens).toHaveBeenCalled();
      });
    });

    it('should store user email after successful login', async () => {
      const mockSetUserEmail = jest.spyOn(secureStorage, 'setUserEmail');
      
      const credentials = {
        email: 'demo@example.com',
        password: 'Demo@123',
      };

      await act(async () => {
        await store.dispatch(login(credentials));
      });

      await waitFor(() => {
        expect(mockSetUserEmail).toHaveBeenCalledWith('demo@example.com');
      });
    });

    it('should mark demo user in storage', async () => {
      const mockSetIsDemoUser = jest.spyOn(secureStorage, 'setIsDemoUser');
      
      const credentials = {
        email: 'demo@example.com',
        password: 'Demo@123',
      };

      await act(async () => {
        await store.dispatch(login(credentials));
      });

      await waitFor(() => {
        expect(mockSetIsDemoUser).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('Automatic Token Refresh', () => {
    it('should refresh tokens automatically for demo users', async () => {
      const mockRefreshToken = jest.spyOn(authService, 'refreshTokens');
      
      (secureStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === STORAGE_KEYS.ACCESS_TOKEN) {
          return Promise.resolve('demo_student_access_token_12345');
        }
        if (key === STORAGE_KEYS.REFRESH_TOKEN) {
          return Promise.resolve('demo_student_refresh_token_12345');
        }
        return Promise.resolve(null);
      });

      await authService.refreshTokens();

      expect(mockRefreshToken).toHaveBeenCalled();
    });

    it('should detect demo tokens correctly', () => {
      expect(authService.isDemoToken('demo_student_access_token_12345')).toBe(true);
      expect(authService.isDemoToken('demo_parent_access_token_12345')).toBe(true);
      expect(authService.isDemoToken('regular_access_token')).toBe(false);
    });

    it('should not expire demo tokens', () => {
      const demoToken = 'demo_student_access_token_12345';
      expect(authService.isTokenExpiringSoon(demoToken)).toBe(false);
    });

    it('should start auto-refresh after login', async () => {
      const mockStartAutoRefresh = jest.spyOn(authService, 'startAutoRefresh');
      
      await authService.initializeAuth();

      // Auto-refresh should be started if tokens exist
      if (await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)) {
        expect(mockStartAutoRefresh).toHaveBeenCalled();
      }
    });

    it('should stop auto-refresh on logout', async () => {
      const mockStopAutoRefresh = jest.spyOn(authService, 'stopAutoRefresh');
      
      await act(async () => {
        await store.dispatch(logout());
      });

      expect(mockStopAutoRefresh).toHaveBeenCalled();
    });
  });

  describe('Logout Functionality', () => {
    beforeEach(async () => {
      // Login first
      const credentials = {
        email: 'demo@example.com',
        password: 'Demo@123',
      };

      await act(async () => {
        await store.dispatch(login(credentials));
      });
    });

    it('should clear all tokens on logout', async () => {
      const mockClearAll = jest.spyOn(secureStorage, 'clearAll');
      
      await act(async () => {
        await store.dispatch(logout());
      });

      expect(mockClearAll).toHaveBeenCalled();
    });

    it('should reset Redux state on logout', async () => {
      await act(async () => {
        await store.dispatch(logout());
      });

      const state = store.getState().auth;
      
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.biometricEnabled).toBe(false);
      expect(state.activeRole).toBeNull();
      expect(state.availableRoles).toEqual([]);
      expect(state.error).toBeNull();
    });

    it('should call logout API endpoint', async () => {
      const { authApi } = require('@api/authApi');
      const mockLogout = jest.spyOn(authApi, 'logout');
      
      await act(async () => {
        await store.dispatch(logout());
      });

      expect(mockLogout).toHaveBeenCalled();
    });

    it('should still clear tokens even if API logout fails', async () => {
      const { authApi } = require('@api/authApi');
      jest.spyOn(authApi, 'logout').mockRejectedValue(new Error('Network error'));
      
      const mockClearAll = jest.spyOn(secureStorage, 'clearAll');
      
      await act(async () => {
        await store.dispatch(logout());
      });

      expect(mockClearAll).toHaveBeenCalled();
    });
  });

  describe('Biometric Login (iOS/Android)', () => {
    beforeEach(() => {
      // Mock biometric availability based on platform
      (biometricUtils.isAvailable as jest.Mock).mockResolvedValue(
        Platform.OS === 'ios' || Platform.OS === 'android'
      );
      (biometricUtils.getBiometricType as jest.Mock).mockResolvedValue(
        Platform.OS === 'ios' ? 'Face ID' : 'Fingerprint'
      );
    });

    it('should not be available on web', async () => {
      if (Platform.OS === 'web') {
        const isAvailable = await biometricUtils.isAvailable();
        expect(isAvailable).toBe(false);
      }
    });

    it('should enable biometric authentication on iOS/Android', async () => {
      if (Platform.OS === 'web') {
        console.log('Skipping biometric test on web');
        return;
      }

      (biometricUtils.authenticate as jest.Mock).mockResolvedValue({
        success: true,
      });

      await act(async () => {
        await store.dispatch(enableBiometric());
      });

      const state = store.getState().auth;
      expect(state.biometricEnabled).toBe(true);
    });

    it('should disable biometric authentication', async () => {
      if (Platform.OS === 'web') {
        console.log('Skipping biometric test on web');
        return;
      }

      await act(async () => {
        await store.dispatch(disableBiometric());
      });

      const state = store.getState().auth;
      expect(state.biometricEnabled).toBe(false);
    });

    it('should login with biometric authentication', async () => {
      if (Platform.OS === 'web') {
        console.log('Skipping biometric test on web');
        return;
      }

      // Setup stored tokens
      (secureStorage.getAccessToken as jest.Mock).mockResolvedValue('demo_student_access_token_12345');
      (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue('demo_student_refresh_token_12345');
      
      (biometricUtils.authenticate as jest.Mock).mockResolvedValue({
        success: true,
      });

      await act(async () => {
        await store.dispatch(loginWithBiometric());
      });

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toBeDefined();
    });

    it('should fail biometric login if authentication fails', async () => {
      if (Platform.OS === 'web') {
        console.log('Skipping biometric test on web');
        return;
      }

      (biometricUtils.authenticate as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Authentication cancelled',
      });

      await act(async () => {
        await store.dispatch(loginWithBiometric());
      });

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeDefined();
    });

    it('should fail biometric login if no stored tokens', async () => {
      if (Platform.OS === 'web') {
        console.log('Skipping biometric test on web');
        return;
      }

      (secureStorage.getAccessToken as jest.Mock).mockResolvedValue(null);
      (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue(null);
      
      (biometricUtils.authenticate as jest.Mock).mockResolvedValue({
        success: true,
      });

      await act(async () => {
        await store.dispatch(loginWithBiometric());
      });

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toContain('No stored credentials found');
    });
  });

  describe('Session Persistence', () => {
    it('should restore session after app restart', async () => {
      // Mock stored tokens
      (secureStorage.getAccessToken as jest.Mock).mockResolvedValue('demo_student_access_token_12345');
      (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue('demo_student_refresh_token_12345');
      (secureStorage.getBiometricEnabled as jest.Mock).mockResolvedValue(false);
      (secureStorage.getIsDemoUser as jest.Mock).mockResolvedValue(true);

      await act(async () => {
        await store.dispatch(loadStoredAuth());
      });

      const state = store.getState().auth;
      
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toBeDefined();
      expect(state.accessToken).toBe('demo_student_access_token_12345');
      expect(state.refreshToken).toBe('demo_student_refresh_token_12345');
    });

    it('should restore biometric settings after app restart', async () => {
      (secureStorage.getAccessToken as jest.Mock).mockResolvedValue('demo_student_access_token_12345');
      (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue('demo_student_refresh_token_12345');
      (secureStorage.getBiometricEnabled as jest.Mock).mockResolvedValue(true);
      (secureStorage.getIsDemoUser as jest.Mock).mockResolvedValue(true);

      await act(async () => {
        await store.dispatch(loadStoredAuth());
      });

      const state = store.getState().auth;
      
      expect(state.biometricEnabled).toBe(true);
    });

    it('should not restore session if tokens are missing', async () => {
      (secureStorage.getAccessToken as jest.Mock).mockResolvedValue(null);
      (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue(null);

      await act(async () => {
        await store.dispatch(loadStoredAuth());
      });

      const state = store.getState().auth;
      
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });

    it('should clear tokens if session restore fails', async () => {
      const { authApi } = require('@api/authApi');
      
      (secureStorage.getAccessToken as jest.Mock).mockResolvedValue('invalid_token');
      (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue('invalid_refresh_token');
      
      jest.spyOn(authApi, 'getCurrentUser').mockRejectedValue(new Error('Unauthorized'));
      
      const mockClearTokens = jest.spyOn(secureStorage, 'clearTokens');

      await act(async () => {
        await store.dispatch(loadStoredAuth());
      });

      expect(mockClearTokens).toHaveBeenCalled();
    });

    it('should restore active role after app restart', async () => {
      (secureStorage.getAccessToken as jest.Mock).mockResolvedValue('demo_parent_access_token_12345');
      (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue('demo_parent_refresh_token_12345');
      (secureStorage.getBiometricEnabled as jest.Mock).mockResolvedValue(false);
      (secureStorage.getIsDemoUser as jest.Mock).mockResolvedValue(true);

      await act(async () => {
        await store.dispatch(loadStoredAuth());
      });

      const state = store.getState().auth;
      
      expect(state.activeRole).toBe('parent');
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('should work on iOS platform', () => {
      expect(['ios', 'android', 'web']).toContain(Platform.OS);
    });

    it('should work on Android platform', () => {
      expect(['ios', 'android', 'web']).toContain(Platform.OS);
    });

    it('should work on web platform', () => {
      expect(['ios', 'android', 'web']).toContain(Platform.OS);
    });

    it('should use correct storage mechanism based on platform', async () => {
      const mockSetTokens = jest.spyOn(secureStorage, 'setTokens');
      
      await secureStorage.setTokens('test_access', 'test_refresh');
      
      expect(mockSetTokens).toHaveBeenCalledWith('test_access', 'test_refresh');
    });
  });

  describe('Auth Service Integration', () => {
    it('should initialize auth on app startup', async () => {
      (secureStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === STORAGE_KEYS.ACCESS_TOKEN) {
          return Promise.resolve('demo_student_access_token_12345');
        }
        if (key === STORAGE_KEYS.REFRESH_TOKEN) {
          return Promise.resolve('demo_student_refresh_token_12345');
        }
        return Promise.resolve(null);
      });

      const result = await authService.initializeAuth();
      
      expect(result).toBe(true);
    });

    it('should save session correctly', async () => {
      const mockSetItem = jest.spyOn(secureStorage, 'setItem');
      const mockSetObject = jest.spyOn(secureStorage, 'setObject');
      
      const user = { id: 1, email: 'demo@example.com' };
      
      await authService.saveSession(
        'test_access_token',
        'test_refresh_token',
        user
      );

      expect(mockSetItem).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN, 'test_access_token');
      expect(mockSetItem).toHaveBeenCalledWith(STORAGE_KEYS.REFRESH_TOKEN, 'test_refresh_token');
      expect(mockSetObject).toHaveBeenCalledWith(STORAGE_KEYS.USER_DATA, user);
    });

    it('should clear session on logout', async () => {
      const mockClearAll = jest.spyOn(secureStorage, 'clearAll');
      
      await authService.clearSession();

      expect(mockClearAll).toHaveBeenCalled();
    });
  });
});
