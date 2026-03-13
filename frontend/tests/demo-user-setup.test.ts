import { describe, it, expect } from 'vitest';
import {
  setupDemoStudent,
  setupDemoTeacher,
  setupDemoParent,
  setupDemoAdmin,
  setupRegularUserAuth,
  setupUnauthenticatedState,
  createDemoUser,
  createCustomAuthUser,
  setupCustomUserAuth,
  isDemoUserInStore,
  getCurrentAuthUser,
  getAuthState,
  createDemoUserTestContext,
  createRegularUserTestContext,
  clearAuth,
  DEMO_CREDENTIALS,
} from './setup';

describe('Demo User Test Setup Utilities', () => {
  describe('setupDemoStudent', () => {
    it('should set up demo student user', () => {
      setupDemoStudent();

      const state = getAuthState();
      expect(state.user).not.toBeNull();
      expect(state.user?.role).toBe('student');
      expect(state.user?.email).toBe(DEMO_CREDENTIALS.email);
      expect(state.isAuthenticated).toBe(true);
      expect(isDemoUserInStore()).toBe(true);
    });

    it('should set tokens in localStorage', () => {
      setupDemoStudent();

      expect(localStorage.getItem('accessToken')).toBeTruthy();
      expect(localStorage.getItem('refreshToken')).toBeTruthy();
    });
  });

  describe('setupDemoTeacher', () => {
    it('should set up demo teacher user', () => {
      setupDemoTeacher();

      const state = getAuthState();
      expect(state.user).not.toBeNull();
      expect(state.user?.role).toBe('teacher');
      expect(state.user?.email).toBe(DEMO_CREDENTIALS.email);
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('setupDemoParent', () => {
    it('should set up demo parent user', () => {
      setupDemoParent();

      const state = getAuthState();
      expect(state.user).not.toBeNull();
      expect(state.user?.role).toBe('parent');
      expect(state.user?.email).toBe(DEMO_CREDENTIALS.email);
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('setupDemoAdmin', () => {
    it('should set up demo admin user', () => {
      setupDemoAdmin();

      const state = getAuthState();
      expect(state.user).not.toBeNull();
      expect(state.user?.role).toBe('admin');
      expect(state.user?.isSuperuser).toBe(true);
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('setupRegularUserAuth', () => {
    it('should set up non-demo user', () => {
      setupRegularUserAuth('student', 'regular@example.com');

      const state = getAuthState();
      expect(state.user).not.toBeNull();
      expect(state.user?.email).toBe('regular@example.com');
      expect(state.user?.email).not.toBe(DEMO_CREDENTIALS.email);
      expect(state.isAuthenticated).toBe(true);
      expect(isDemoUserInStore()).toBe(false);
    });

    it('should use default email if not provided', () => {
      setupRegularUserAuth();

      const state = getAuthState();
      expect(state.user?.email).toBe('user@example.com');
    });
  });

  describe('setupUnauthenticatedState', () => {
    it('should clear authentication', () => {
      setupDemoStudent(); // First authenticate
      setupUnauthenticatedState();

      const state = getAuthState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });

  describe('createDemoUser', () => {
    it('should create demo user with default role', () => {
      const user = createDemoUser();

      expect(user.role).toBe('student');
      expect(user.email).toBe(DEMO_CREDENTIALS.email);
    });

    it('should create demo user with specified role', () => {
      const user = createDemoUser('teacher');

      expect(user.role).toBe('teacher');
      expect(user.email).toBe(DEMO_CREDENTIALS.email);
    });
  });

  describe('createCustomAuthUser', () => {
    it('should create custom user with overrides', () => {
      const user = createCustomAuthUser({
        email: 'custom@example.com',
        role: 'admin',
        isSuperuser: true,
      });

      expect(user.email).toBe('custom@example.com');
      expect(user.role).toBe('admin');
      expect(user.isSuperuser).toBe(true);
    });

    it('should preserve base properties', () => {
      const user = createCustomAuthUser({ email: 'custom@example.com' });

      expect(user.firstName).toBeTruthy();
      expect(user.lastName).toBeTruthy();
      expect(user.id).toBeTruthy();
    });
  });

  describe('setupCustomUserAuth', () => {
    it('should set up custom user', () => {
      const customUser = createCustomAuthUser({
        email: 'custom@example.com',
        role: 'teacher',
      });

      setupCustomUserAuth(customUser);

      const state = getAuthState();
      expect(state.user?.email).toBe('custom@example.com');
      expect(state.user?.role).toBe('teacher');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('isDemoUserInStore', () => {
    it('should return true for demo user', () => {
      setupDemoStudent();
      expect(isDemoUserInStore()).toBe(true);
    });

    it('should return false for regular user', () => {
      setupRegularUserAuth();
      expect(isDemoUserInStore()).toBe(false);
    });

    it('should return false for unauthenticated', () => {
      setupUnauthenticatedState();
      expect(isDemoUserInStore()).toBe(false);
    });
  });

  describe('getCurrentAuthUser', () => {
    it('should return current user', () => {
      setupDemoStudent();
      const user = getCurrentAuthUser();

      expect(user).not.toBeNull();
      expect(user?.role).toBe('student');
    });

    it('should return null when unauthenticated', () => {
      setupUnauthenticatedState();
      const user = getCurrentAuthUser();

      expect(user).toBeNull();
    });
  });

  describe('getAuthState', () => {
    it('should return complete auth state', () => {
      setupDemoStudent();
      const state = getAuthState();

      expect(state).toHaveProperty('user');
      expect(state).toHaveProperty('isAuthenticated');
      expect(state).toHaveProperty('isLoading');
      expect(state).toHaveProperty('selectedInstitution');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('clearAuth', () => {
    it('should clear all auth state', () => {
      setupDemoStudent();
      clearAuth();

      const state = getAuthState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });

  describe('createDemoUserTestContext', () => {
    it('should create complete demo user context', () => {
      const context = createDemoUserTestContext('teacher');

      expect(context.user).toBeDefined();
      expect(context.tokens).toBeDefined();
      expect(context.isDemo).toBe(true);
      expect(context.role).toBe('teacher');
      expect(context.user.email).toBe(DEMO_CREDENTIALS.email);
    });

    it('should default to student role', () => {
      const context = createDemoUserTestContext();

      expect(context.role).toBe('student');
      expect(context.user.role).toBe('student');
    });
  });

  describe('createRegularUserTestContext', () => {
    it('should create complete regular user context', () => {
      const context = createRegularUserTestContext('parent', 'parent@example.com');

      expect(context.user).toBeDefined();
      expect(context.tokens).toBeDefined();
      expect(context.isDemo).toBe(false);
      expect(context.role).toBe('parent');
      expect(context.user.email).toBe('parent@example.com');
    });

    it('should use defaults', () => {
      const context = createRegularUserTestContext();

      expect(context.role).toBe('student');
      expect(context.user.email).toBe('user@example.com');
    });
  });

  describe('localStorage mock', () => {
    it('should support setItem and getItem', () => {
      localStorage.setItem('test-key', 'test-value');
      expect(localStorage.getItem('test-key')).toBe('test-value');
    });

    it('should support removeItem', () => {
      localStorage.setItem('test-key', 'test-value');
      localStorage.removeItem('test-key');
      expect(localStorage.getItem('test-key')).toBeNull();
    });

    it('should support clear', () => {
      localStorage.setItem('key1', 'value1');
      localStorage.setItem('key2', 'value2');
      localStorage.clear();

      expect(localStorage.getItem('key1')).toBeNull();
      expect(localStorage.getItem('key2')).toBeNull();
    });

    it('should support length property', () => {
      localStorage.clear();
      expect(localStorage.length).toBe(0);

      localStorage.setItem('key1', 'value1');
      localStorage.setItem('key2', 'value2');
      expect(localStorage.length).toBe(2);
    });

    it('should support key method', () => {
      localStorage.clear();
      localStorage.setItem('key1', 'value1');
      localStorage.setItem('key2', 'value2');

      const key = localStorage.key(0);
      expect(key).toBeTruthy();
      expect(['key1', 'key2']).toContain(key);
    });
  });

  describe('sessionStorage mock', () => {
    it('should support setItem and getItem', () => {
      sessionStorage.setItem('test-key', 'test-value');
      expect(sessionStorage.getItem('test-key')).toBe('test-value');
    });

    it('should support clear', () => {
      sessionStorage.setItem('key1', 'value1');
      sessionStorage.clear();
      expect(sessionStorage.getItem('key1')).toBeNull();
    });
  });

  describe('Test isolation', () => {
    it('should start with clean state - test 1', () => {
      // This test sets up a user
      setupDemoStudent();
      expect(getCurrentAuthUser()).not.toBeNull();
    });

    it('should start with clean state - test 2', () => {
      // This test should start fresh, not affected by previous test
      expect(getCurrentAuthUser()).toBeNull();
      expect(localStorage.getItem('accessToken')).toBeNull();
    });

    it('should start with clean state - test 3', () => {
      // Verify again that state is clean
      const state = getAuthState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(localStorage.length).toBe(0);
    });
  });

  describe('Multiple role switches in single test', () => {
    it('should allow switching between roles', () => {
      // Start as student
      setupDemoStudent();
      expect(getCurrentAuthUser()?.role).toBe('student');

      // Switch to teacher
      setupDemoTeacher();
      expect(getCurrentAuthUser()?.role).toBe('teacher');

      // Switch to admin
      setupDemoAdmin();
      expect(getCurrentAuthUser()?.role).toBe('admin');
      expect(getCurrentAuthUser()?.isSuperuser).toBe(true);

      // Clear auth
      clearAuth();
      expect(getCurrentAuthUser()).toBeNull();
    });
  });

  describe('Institution selection', () => {
    it('should set selected institution from user', () => {
      setupDemoStudent();
      const state = getAuthState();

      expect(state.selectedInstitution).toBeTruthy();
    });

    it('should allow custom institution', () => {
      const customUser = createCustomAuthUser({
        institution_id: 999,
      });
      setupCustomUserAuth(customUser);

      const state = getAuthState();
      expect(state.selectedInstitution).toBe('999');
    });
  });
});
