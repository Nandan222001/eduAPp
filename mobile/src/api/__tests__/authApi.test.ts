import { authApi } from '../authApi';
import { apiClient } from '../client';
import { demoStudentUser, demoParentUser } from '../../data/dummyData';

jest.mock('../client');

describe('authApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    describe('demo user credentials', () => {
      it('should return tokens and user data synchronously for demo student without API calls', async () => {
        const credentials = {
          email: 'demo@example.com',
          password: 'Demo@123',
        };

        const result = await authApi.login(credentials);

        expect(apiClient.post).not.toHaveBeenCalled();
        expect(result).toHaveProperty('access_token');
        expect(result).toHaveProperty('refresh_token');
        expect(result).toHaveProperty('token_type', 'Bearer');
        expect(result.access_token).toContain('demo_student_access_token_');
        expect(result.refresh_token).toContain('demo_student_refresh_token_');
      });

      it('should return tokens and user data synchronously for demo parent without API calls', async () => {
        const credentials = {
          email: 'parent@demo.com',
          password: 'Demo@123',
        };

        const result = await authApi.login(credentials);

        expect(apiClient.post).not.toHaveBeenCalled();
        expect(result).toHaveProperty('access_token');
        expect(result).toHaveProperty('refresh_token');
        expect(result).toHaveProperty('token_type', 'Bearer');
        expect(result.access_token).toContain('demo_parent_access_token_');
        expect(result.refresh_token).toContain('demo_parent_refresh_token_');
      });

      it('should return unique tokens on each login for demo student', async () => {
        const credentials = {
          email: 'demo@example.com',
          password: 'Demo@123',
        };

        const result1 = await authApi.login(credentials);
        await new Promise(resolve => setTimeout(resolve, 10));
        const result2 = await authApi.login(credentials);

        expect(result1.access_token).not.toEqual(result2.access_token);
        expect(result1.refresh_token).not.toEqual(result2.refresh_token);
      });

      it('should verify demo credentials match dummyData constants', () => {
        expect(demoStudentUser.email).toBe('demo@example.com');
        expect(demoStudentUser.password).toBe('Demo@123');
        expect(demoParentUser.email).toBe('parent@demo.com');
        expect(demoParentUser.password).toBe('Demo@123');
      });

      it('should not make API call for correct demo credentials with wrong institution_id', async () => {
        const credentials = {
          email: 'demo@example.com',
          password: 'Demo@123',
          institution_id: 999,
        };

        const result = await authApi.login(credentials);

        expect(apiClient.post).not.toHaveBeenCalled();
        expect(result.access_token).toContain('demo_student_access_token_');
      });
    });

    describe('non-demo user credentials', () => {
      it('should make backend API request for non-demo email', async () => {
        const mockResponse = {
          access_token: 'real_access_token',
          refresh_token: 'real_refresh_token',
          token_type: 'Bearer',
        };
        (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

        const credentials = {
          email: 'user@example.com',
          password: 'password123',
        };

        const result = await authApi.login(credentials);

        expect(apiClient.post).toHaveBeenCalledWith('/auth/login', credentials);
        expect(result).toEqual(mockResponse);
      });

      it('should make backend API request for demo email with incorrect password', async () => {
        const mockResponse = {
          access_token: 'real_access_token',
          refresh_token: 'real_refresh_token',
          token_type: 'Bearer',
        };
        (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

        const credentials = {
          email: 'demo@example.com',
          password: 'WrongPassword123',
        };

        const result = await authApi.login(credentials);

        expect(apiClient.post).toHaveBeenCalledWith('/auth/login', credentials);
        expect(result).toEqual(mockResponse);
      });

      it('should make backend API request for parent demo email with incorrect password', async () => {
        const mockResponse = {
          access_token: 'real_access_token',
          refresh_token: 'real_refresh_token',
          token_type: 'Bearer',
        };
        (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

        const credentials = {
          email: 'parent@demo.com',
          password: 'WrongPassword',
        };

        const result = await authApi.login(credentials);

        expect(apiClient.post).toHaveBeenCalledWith('/auth/login', credentials);
        expect(result).toEqual(mockResponse);
      });

      it('should make backend API request for completely different user', async () => {
        const mockResponse = {
          access_token: 'real_access_token',
          refresh_token: 'real_refresh_token',
          token_type: 'Bearer',
        };
        (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

        const credentials = {
          email: 'john.doe@school.edu',
          password: 'SecurePass123!',
        };

        const result = await authApi.login(credentials);

        expect(apiClient.post).toHaveBeenCalledWith('/auth/login', credentials);
        expect(result).toEqual(mockResponse);
      });

      it('should handle API errors for non-demo users', async () => {
        const mockError = new Error('Invalid credentials');
        (apiClient.post as jest.Mock).mockRejectedValue(mockError);

        const credentials = {
          email: 'user@example.com',
          password: 'wrongpassword',
        };

        await expect(authApi.login(credentials)).rejects.toThrow('Invalid credentials');
        expect(apiClient.post).toHaveBeenCalledWith('/auth/login', credentials);
      });
    });

    describe('edge cases', () => {
      it('should be case-sensitive for demo emails', async () => {
        const mockResponse = {
          access_token: 'real_access_token',
          refresh_token: 'real_refresh_token',
          token_type: 'Bearer',
        };
        (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

        const credentials = {
          email: 'Demo@Example.com',
          password: 'Demo@123',
        };

        const result = await authApi.login(credentials);

        expect(apiClient.post).toHaveBeenCalledWith('/auth/login', credentials);
        expect(result).toEqual(mockResponse);
      });

      it('should be case-sensitive for demo passwords', async () => {
        const mockResponse = {
          access_token: 'real_access_token',
          refresh_token: 'real_refresh_token',
          token_type: 'Bearer',
        };
        (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

        const credentials = {
          email: 'demo@example.com',
          password: 'demo@123',
        };

        const result = await authApi.login(credentials);

        expect(apiClient.post).toHaveBeenCalledWith('/auth/login', credentials);
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe('other auth methods', () => {
    it('should call logout endpoint for non-demo scenarios', async () => {
      const mockResponse = { message: 'Logged out successfully' };
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.logout('some_refresh_token');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout', {
        refresh_token: 'some_refresh_token',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should call logoutAll endpoint', async () => {
      const mockResponse = { message: 'Logged out from all devices' };
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.logoutAll();

      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout-all');
      expect(result).toEqual(mockResponse);
    });

    it('should call refreshToken endpoint', async () => {
      const mockResponse = {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        token_type: 'Bearer',
      };
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.refreshToken({ refresh_token: 'old_token' });

      expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh', {
        refresh_token: 'old_token',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should call getCurrentUser endpoint', async () => {
      const mockUser = {
        id: 1,
        email: 'user@example.com',
        username: 'user',
        institution_id: 1,
        role_id: 3,
        is_active: true,
        is_superuser: false,
        email_verified: true,
        permissions: [],
      };
      (apiClient.get as jest.Mock).mockResolvedValue(mockUser);

      const result = await authApi.getCurrentUser();

      expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockUser);
    });

    it('should call requestOTP endpoint', async () => {
      const mockResponse = { message: 'OTP sent successfully' };
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.requestOTP({ email: 'user@example.com' });

      expect(apiClient.post).toHaveBeenCalledWith('/auth/otp/request', {
        email: 'user@example.com',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should call verifyOTP endpoint', async () => {
      const mockResponse = {
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        token_type: 'Bearer',
      };
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.verifyOTP({
        email: 'user@example.com',
        otp: '123456',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/auth/otp/verify', {
        email: 'user@example.com',
        otp: '123456',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should call forgotPassword endpoint', async () => {
      const mockResponse = { message: 'Password reset email sent' };
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.forgotPassword('user@example.com');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'user@example.com',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should call resetPassword endpoint', async () => {
      const mockResponse = { message: 'Password reset successfully' };
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.resetPassword('reset_token', 'NewPass123!');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'reset_token',
        new_password: 'NewPass123!',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should call changePassword endpoint', async () => {
      const mockResponse = { message: 'Password changed successfully' };
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.changePassword('OldPass123', 'NewPass123!');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/change-password', {
        current_password: 'OldPass123',
        new_password: 'NewPass123!',
      });
      expect(result).toEqual(mockResponse);
    });
  });
});
