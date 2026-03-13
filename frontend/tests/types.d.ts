/**
 * Type definitions for test utilities
 */

import type { RenderOptions, RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';
import type { AuthUser, AuthTokens, UserRole } from '@/types/auth';

declare module '../tests/setup' {
  export function createDemoUser(role?: UserRole): AuthUser;
  export function createDemoTokens(): AuthTokens;
  export function setupDemoUserAuth(role?: UserRole): void;
  export function setupRegularUserAuth(role?: UserRole, email?: string): void;
  export function clearAuth(): void;
  export function setupUnauthenticatedState(): void;
  export function createCustomAuthUser(overrides: Partial<AuthUser>): AuthUser;
  export function setupCustomUserAuth(user: AuthUser, tokens?: AuthTokens): void;
  export function isDemoUserInStore(): boolean;
  export function getCurrentAuthUser(): AuthUser | null;
  export function getAuthState(): unknown;
  export function setupDemoStudent(): void;
  export function setupDemoTeacher(): void;
  export function setupDemoParent(): void;
  export function setupDemoAdmin(): void;
  export function createMockResponse<T>(data: T, delay?: number): Promise<T>;
  export function createMockError(message: string, code?: number): Promise<never>;

  export interface DemoUserTestContext {
    user: AuthUser;
    tokens: AuthTokens;
    isDemo: boolean;
    role: UserRole;
  }

  export interface RegularUserTestContext {
    user: AuthUser;
    tokens: AuthTokens;
    isDemo: boolean;
    role: UserRole;
  }

  export function createDemoUserTestContext(role?: UserRole): DemoUserTestContext;
  export function createRegularUserTestContext(
    role?: UserRole,
    email?: string
  ): RegularUserTestContext;

  export class LocalStorageMock implements Storage {
    readonly length: number;
    clear(): void;
    getItem(key: string): string | null;
    key(index: number): string | null;
    removeItem(key: string): void;
    setItem(key: string, value: string): void;
    [name: string]: unknown;
  }

  export class SessionStorageMock implements Storage {
    readonly length: number;
    clear(): void;
    getItem(key: string): string | null;
    key(index: number): string | null;
    removeItem(key: string): void;
    setItem(key: string, value: string): void;
    [name: string]: unknown;
  }

  export const DEMO_CREDENTIALS: {
    email: string;
    password: string;
  };

  export const demoAuthUser: AuthUser;
  export const demoAuthTokens: AuthTokens;
}

declare module '../tests/test-utils' {
  export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    authState?:
      | 'demo-student'
      | 'demo-teacher'
      | 'demo-parent'
      | 'demo-admin'
      | 'regular'
      | 'unauthenticated';
    regularUserRole?: UserRole;
    regularUserEmail?: string;
  }

  export function renderWithProviders(
    ui: ReactElement,
    options?: CustomRenderOptions
  ): RenderResult;

  export function renderWithDemoStudent(
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
  ): RenderResult;

  export function renderWithDemoTeacher(
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
  ): RenderResult;

  export function renderWithDemoParent(
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
  ): RenderResult;

  export function renderWithDemoAdmin(
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
  ): RenderResult;

  export function renderWithRegularUser(
    ui: ReactElement,
    role?: UserRole,
    email?: string,
    options?: Omit<RenderOptions, 'wrapper'>
  ): RenderResult;

  export function renderUnauthenticated(
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
  ): RenderResult;

  export function waitForCondition(
    condition: () => boolean,
    timeout?: number,
    interval?: number
  ): Promise<void>;

  export function delay(ms: number): Promise<void>;

  export function createMockFile(name?: string, size?: number, type?: string): File;

  export function createMockImageFile(name?: string, size?: number, type?: string): File;

  export function createMockChangeEvent(value: string): React.ChangeEvent<HTMLInputElement>;

  export function createMockFileChangeEvent(files: File[]): React.ChangeEvent<HTMLInputElement>;

  export function createTestQueryClient(): import('@tanstack/react-query').QueryClient;

  export function getAllByAriaRole(container: HTMLElement, role: string): HTMLElement[];

  export function isVisibleToScreenReader(element: HTMLElement): boolean;

  export function fillForm(container: HTMLElement, data: Record<string, string>): Promise<void>;

  export function submitForm(form: HTMLFormElement): Promise<void>;

  // Re-export everything from @testing-library/react
  export * from '@testing-library/react';
  export { default as userEvent } from '@testing-library/user-event';
}
