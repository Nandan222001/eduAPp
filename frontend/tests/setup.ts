import { afterEach, beforeEach, vi } from 'vitest';
import { useAuthStore } from '@/store/useAuthStore';
import { DEMO_CREDENTIALS, demoAuthUser, demoAuthTokens } from '@/data/dummyData';
import type { AuthUser, AuthTokens, UserRole } from '@/types/auth';

/**
 * Demo User Test Configuration
 *
 * This file provides mock implementations and test utilities for testing
 * with demo user context. All tests can run in isolation and clean up properly.
 */

// ============================================================================
// LocalStorage Mock
// ============================================================================

class LocalStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value.toString();
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  get length(): number {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

// Setup localStorage mock
if (!global.localStorage) {
  global.localStorage = new LocalStorageMock() as Storage;
}

// ============================================================================
// Demo User Test Utilities
// ============================================================================

/**
 * Creates a demo user with the specified role
 */
export function createDemoUser(role: UserRole = 'student'): AuthUser {
  return {
    ...demoAuthUser,
    role,
  };
}

/**
 * Creates demo auth tokens
 */
export function createDemoTokens(): AuthTokens {
  return { ...demoAuthTokens };
}

/**
 * Sets up the auth store with a demo user
 */
export function setupDemoUserAuth(role: UserRole = 'student'): void {
  const user = createDemoUser(role);
  const tokens = createDemoTokens();

  useAuthStore.setState({
    user,
    isAuthenticated: true,
    isLoading: false,
    selectedInstitution: user.institution_id?.toString() || null,
  });

  // Set tokens in localStorage
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
}

/**
 * Sets up the auth store with a non-demo user
 */
export function setupRegularUserAuth(
  role: UserRole = 'student',
  email: string = 'user@example.com'
): void {
  const user: AuthUser = {
    id: '2001',
    email,
    firstName: 'Test',
    lastName: 'User',
    fullName: 'Test User',
    role,
    isActive: true,
    emailVerified: true,
    isSuperuser: false,
    institution_id: 2,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const tokens: AuthTokens = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    expiresIn: 3600,
    tokenType: 'Bearer',
  };

  useAuthStore.setState({
    user,
    isAuthenticated: true,
    isLoading: false,
    selectedInstitution: user.institution_id?.toString() || null,
  });

  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
}

/**
 * Clears the auth store and localStorage
 */
export function clearAuth(): void {
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    selectedInstitution: null,
  });

  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('auth-storage');
}

/**
 * Sets up an unauthenticated state
 */
export function setupUnauthenticatedState(): void {
  clearAuth();
}

/**
 * Creates a custom auth user for testing
 */
export function createCustomAuthUser(overrides: Partial<AuthUser>): AuthUser {
  return {
    ...demoAuthUser,
    ...overrides,
  };
}

/**
 * Sets up the auth store with a custom user
 */
export function setupCustomUserAuth(user: AuthUser, tokens?: AuthTokens): void {
  const authTokens = tokens || createDemoTokens();

  useAuthStore.setState({
    user,
    isAuthenticated: true,
    isLoading: false,
    selectedInstitution: user.institution_id?.toString() || null,
  });

  localStorage.setItem('accessToken', authTokens.accessToken);
  localStorage.setItem('refreshToken', authTokens.refreshToken);
}

/**
 * Checks if the current user is a demo user
 */
export function isDemoUserInStore(): boolean {
  const { user } = useAuthStore.getState();
  return user?.email === DEMO_CREDENTIALS.email;
}

/**
 * Gets the current auth user from the store
 */
export function getCurrentAuthUser(): AuthUser | null {
  return useAuthStore.getState().user;
}

/**
 * Gets the current auth state from the store
 */
export function getAuthState() {
  return useAuthStore.getState();
}

// ============================================================================
// Test Lifecycle Hooks
// ============================================================================

/**
 * Runs before each test to ensure clean state
 */
beforeEach(() => {
  // Clear localStorage
  localStorage.clear();

  // Reset auth store to initial state
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    selectedInstitution: null,
  });

  // Clear any persisted state
  localStorage.removeItem('auth-storage');
});

/**
 * Runs after each test to ensure cleanup
 */
afterEach(() => {
  // Clear localStorage
  localStorage.clear();

  // Reset auth store
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    selectedInstitution: null,
  });

  // Clear timers and mocks
  vi.clearAllTimers();
  vi.clearAllMocks();
});

// ============================================================================
// Role-specific Test Utilities
// ============================================================================

/**
 * Sets up a demo student user
 */
export function setupDemoStudent(): void {
  setupDemoUserAuth('student');
}

/**
 * Sets up a demo teacher user
 */
export function setupDemoTeacher(): void {
  setupDemoUserAuth('teacher');
}

/**
 * Sets up a demo parent user
 */
export function setupDemoParent(): void {
  setupDemoUserAuth('parent');
}

/**
 * Sets up a demo admin user
 */
export function setupDemoAdmin(): void {
  const adminUser = createCustomAuthUser({
    role: 'admin',
    isSuperuser: true,
  });
  setupCustomUserAuth(adminUser);
}

// ============================================================================
// Mock Data Helpers
// ============================================================================

/**
 * Creates a mock response for API calls
 */
export function createMockResponse<T>(data: T, delay: number = 0): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
}

/**
 * Creates a mock error response
 */
export function createMockError(message: string, code: number = 400): Promise<never> {
  return new Promise((_, reject) => {
    reject({
      response: {
        status: code,
        data: { message },
      },
    });
  });
}

// ============================================================================
// Session Storage Mock
// ============================================================================

class SessionStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value.toString();
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  get length(): number {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

// Setup sessionStorage mock
if (!global.sessionStorage) {
  global.sessionStorage = new SessionStorageMock() as Storage;
}

// ============================================================================
// Test Context Builders
// ============================================================================

/**
 * Creates a complete test context with demo user
 */
export interface DemoUserTestContext {
  user: AuthUser;
  tokens: AuthTokens;
  isDemo: boolean;
  role: UserRole;
}

export function createDemoUserTestContext(role: UserRole = 'student'): DemoUserTestContext {
  const user = createDemoUser(role);
  const tokens = createDemoTokens();

  return {
    user,
    tokens,
    isDemo: true,
    role,
  };
}

/**
 * Creates a complete test context with regular user
 */
export interface RegularUserTestContext {
  user: AuthUser;
  tokens: AuthTokens;
  isDemo: boolean;
  role: UserRole;
}

export function createRegularUserTestContext(
  role: UserRole = 'student',
  email: string = 'user@example.com'
): RegularUserTestContext {
  const user: AuthUser = {
    id: '2001',
    email,
    firstName: 'Test',
    lastName: 'User',
    fullName: 'Test User',
    role,
    isActive: true,
    emailVerified: true,
    isSuperuser: false,
    institution_id: 2,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const tokens: AuthTokens = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    expiresIn: 3600,
    tokenType: 'Bearer',
  };

  return {
    user,
    tokens,
    isDemo: false,
    role,
  };
}

// ============================================================================
// Utility Exports
// ============================================================================

export { DEMO_CREDENTIALS, demoAuthUser, demoAuthTokens };
export { LocalStorageMock, SessionStorageMock };
