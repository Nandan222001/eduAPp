/**
 * Test Utilities Index
 *
 * Central export point for all test utilities and helpers.
 * Import from this file to get everything you need for testing.
 */

// Re-export all setup utilities
export * from './setup';

// Re-export all test-utils (React Testing Library + custom utilities)
export * from './test-utils';

/**
 * Usage:
 *
 * For unit tests:
 * ```typescript
 * import { setupDemoStudent, clearAuth, getCurrentAuthUser } from '../tests';
 * ```
 *
 * For component tests:
 * ```typescript
 * import { renderWithDemoStudent, screen, userEvent } from '../tests';
 * ```
 *
 * For everything:
 * ```typescript
 * import * as TestUtils from '../tests';
 * ```
 */
