import { secureStorage } from './secureStorage';
import { authApi } from '@api/authApi';
import { STORAGE_KEYS } from '@constants';
import { store } from '@store';
import { logout } from '@store/slices/authSlice';

let refreshTimeout: NodeJS.Timeout | null = null;

const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000;

export const authService = {
  async initializeAuth() {
    try {
      const accessToken = await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

      if (accessToken && refreshToken) {
        const isDemoUser = this.isDemoToken(accessToken);
        
        if (isDemoUser) {
          this.startAutoRefresh();
          return true;
        }

        await this.checkAndRefreshIfNeeded();
        this.startAutoRefresh();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      return false;
    }
  },

  isDemoToken(token: string): boolean {
    return token.startsWith('demo_student_access_token_') || token.startsWith('demo_parent_access_token_');
  },

  startAutoRefresh() {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }

    refreshTimeout = setTimeout(async () => {
      await this.refreshTokens();
    }, TOKEN_REFRESH_INTERVAL);
  },

  stopAutoRefresh() {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
      refreshTimeout = null;
    }
  },

  async refreshTokens() {
    try {
      const refreshToken = await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      const accessToken = await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      if (accessToken && this.isDemoToken(accessToken)) {
        const isStudent = refreshToken.startsWith('demo_student_refresh_token_');
        const newAccessToken = isStudent 
          ? `demo_student_access_token_${Date.now()}`
          : `demo_parent_access_token_${Date.now()}`;
        
        await secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
        await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);

        this.startAutoRefresh();
        return true;
      }

      const response = await authApi.refreshToken({ refresh_token: refreshToken });
      const { access_token, refresh_token } = response;

      await secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
      await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);

      this.startAutoRefresh();

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.stopAutoRefresh();
      await this.clearSession();
      return false;
    }
  },

  async clearSession() {
    try {
      await secureStorage.clearAll();
      this.stopAutoRefresh();
      store.dispatch(logout());
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  },

  async saveSession(accessToken: string, refreshToken: string, user: any) {
    try {
      await secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      await secureStorage.setObject(STORAGE_KEYS.USER_DATA, user);

      this.startAutoRefresh();
    } catch (error) {
      console.error('Failed to save session:', error);
      throw error;
    }
  },

  isTokenExpiringSoon(token: string): boolean {
    try {
      if (this.isDemoToken(token)) {
        return false;
      }

      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;

      return timeUntilExpiration < 5 * 60 * 1000;
    } catch (error) {
      console.error('Failed to check token expiration:', error);
      return true;
    }
  },

  async checkAndRefreshIfNeeded() {
    try {
      const accessToken = await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      if (accessToken && this.isTokenExpiringSoon(accessToken)) {
        await this.refreshTokens();
      }
    } catch (error) {
      console.error('Failed to check and refresh token:', error);
    }
  },

  async getBiometricCredentials(): Promise<{ email: string; password: string } | null> {
    try {
      return await secureStorage.getObject<{ email: string; password: string }>(
        STORAGE_KEYS.BIOMETRIC_CREDENTIALS
      );
    } catch (error) {
      console.error('Failed to get biometric credentials:', error);
      return null;
    }
  },

  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await secureStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
      return enabled === 'true';
    } catch (error) {
      console.error('Failed to check biometric enabled:', error);
      return false;
    }
  },
};
