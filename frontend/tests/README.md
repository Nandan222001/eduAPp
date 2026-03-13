# Demo User Test Configuration

This directory contains test setup and utilities for testing with demo user context in the frontend application.

## Overview

The `setup.ts` file provides comprehensive mock implementations and test utilities that ensure:

- **Isolation**: All tests run independently without side effects
- **Clean state**: Automatic cleanup before and after each test
- **Demo user support**: Easy setup for testing with demo user credentials
- **Flexibility**: Support for multiple user roles and custom configurations

## Features

### 1. LocalStorage Mock

A complete localStorage implementation that works in the test environment:

```typescript
// Automatically available in all tests
localStorage.setItem('key', 'value');
const value = localStorage.getItem('key');
localStorage.clear();
```

### 2. Demo User Setup Utilities

Quick functions to set up different user contexts:

```typescript
import {
  setupDemoStudent,
  setupDemoTeacher,
  setupDemoParent,
  setupDemoAdmin,
} from '../tests/setup';

// In your test
describe('StudentDashboard', () => {
  beforeEach(() => {
    setupDemoStudent(); // Sets up demo student user with auth
  });

  it('should display student dashboard', () => {
    // Test with demo student context
  });
});
```

### 3. Custom User Creation

Create users with specific properties:

```typescript
import { createCustomAuthUser, setupCustomUserAuth } from '../tests/setup';

const customUser = createCustomAuthUser({
  role: 'teacher',
  email: 'custom@example.com',
  firstName: 'Custom',
  lastName: 'Teacher',
});

setupCustomUserAuth(customUser);
```

### 4. Auth State Management

Utilities to manage authentication state:

```typescript
import { clearAuth, setupUnauthenticatedState, getCurrentAuthUser } from '../tests/setup';

// Clear all auth state
clearAuth();

// Set up unauthenticated state
setupUnauthenticatedState();

// Check current user
const user = getCurrentAuthUser();
```

### 5. Test Context Builders

Create complete test contexts with all necessary data:

```typescript
import { createDemoUserTestContext, createRegularUserTestContext } from '../tests/setup';

const demoContext = createDemoUserTestContext('student');
// { user, tokens, isDemo: true, role: 'student' }

const regularContext = createRegularUserTestContext('teacher', 'teacher@example.com');
// { user, tokens, isDemo: false, role: 'teacher' }
```

## Available Utilities

### User Setup Functions

| Function                              | Description                                                |
| ------------------------------------- | ---------------------------------------------------------- |
| `setupDemoUserAuth(role?)`            | Sets up demo user with specified role (default: 'student') |
| `setupRegularUserAuth(role?, email?)` | Sets up non-demo user                                      |
| `setupCustomUserAuth(user, tokens?)`  | Sets up custom user with optional tokens                   |
| `setupDemoStudent()`                  | Quick setup for demo student                               |
| `setupDemoTeacher()`                  | Quick setup for demo teacher                               |
| `setupDemoParent()`                   | Quick setup for demo parent                                |
| `setupDemoAdmin()`                    | Quick setup for demo admin                                 |
| `clearAuth()`                         | Clears all authentication state                            |
| `setupUnauthenticatedState()`         | Sets up unauthenticated state                              |

### User Creation Functions

| Function                          | Description                        |
| --------------------------------- | ---------------------------------- |
| `createDemoUser(role?)`           | Creates demo user object           |
| `createDemoTokens()`              | Creates demo auth tokens           |
| `createCustomAuthUser(overrides)` | Creates custom user with overrides |

### State Query Functions

| Function               | Description                         |
| ---------------------- | ----------------------------------- |
| `isDemoUserInStore()`  | Checks if current user is demo user |
| `getCurrentAuthUser()` | Gets current user from store        |
| `getAuthState()`       | Gets complete auth state            |

### Mock Helper Functions

| Function                              | Description                 |
| ------------------------------------- | --------------------------- |
| `createMockResponse<T>(data, delay?)` | Creates mock API response   |
| `createMockError(message, code?)`     | Creates mock error response |

### Test Context Functions

| Function                                      | Description                           |
| --------------------------------------------- | ------------------------------------- |
| `createDemoUserTestContext(role?)`            | Creates complete demo user context    |
| `createRegularUserTestContext(role?, email?)` | Creates complete regular user context |

## Lifecycle Hooks

The setup file automatically runs cleanup hooks:

- **beforeEach**: Clears localStorage, resets auth store, removes persisted state
- **afterEach**: Clears localStorage, resets auth store, clears timers and mocks

You don't need to manually clean up in most cases, but you can if needed.

## Usage Examples

### Example 1: Testing with Demo Student

```typescript
import { describe, it, expect } from 'vitest';
import { setupDemoStudent, clearAuth } from '../tests/setup';
import { isDemoUser } from '@/api/demoDataApi';

describe('Demo User Detection', () => {
  it('should detect demo user', () => {
    setupDemoStudent();
    expect(isDemoUser()).toBe(true);
  });

  it('should not detect regular user as demo', () => {
    setupRegularUserAuth();
    expect(isDemoUser()).toBe(false);
  });
});
```

### Example 2: Testing Different Roles

```typescript
import { describe, it, expect } from 'vitest';
import { setupDemoTeacher, setupDemoStudent } from '../tests/setup';

describe('Role-based Access', () => {
  it('should allow teacher access', () => {
    setupDemoTeacher();
    // Test teacher-specific functionality
  });

  it('should allow student access', () => {
    setupDemoStudent();
    // Test student-specific functionality
  });
});
```

### Example 3: Custom User Scenarios

```typescript
import { describe, it, expect } from 'vitest';
import { createCustomAuthUser, setupCustomUserAuth } from '../tests/setup';

describe('Custom User Scenarios', () => {
  it('should handle unverified email', () => {
    const user = createCustomAuthUser({
      emailVerified: false,
    });
    setupCustomUserAuth(user);
    // Test unverified email flow
  });

  it('should handle superuser', () => {
    const user = createCustomAuthUser({
      role: 'admin',
      isSuperuser: true,
    });
    setupCustomUserAuth(user);
    // Test superuser functionality
  });
});
```

### Example 4: Testing API Mocks

```typescript
import { describe, it, expect } from 'vitest';
import { createMockResponse, createMockError } from '../tests/setup';

describe('API Error Handling', () => {
  it('should handle successful response', async () => {
    const mockData = { id: 1, name: 'Test' };
    const response = await createMockResponse(mockData);
    expect(response).toEqual(mockData);
  });

  it('should handle error response', async () => {
    await expect(createMockError('Not found', 404)).rejects.toMatchObject({
      response: {
        status: 404,
        data: { message: 'Not found' },
      },
    });
  });
});
```

### Example 5: Testing Unauthenticated State

```typescript
import { describe, it, expect } from 'vitest';
import { setupUnauthenticatedState, getCurrentAuthUser } from '../tests/setup';

describe('Unauthenticated Flow', () => {
  it('should handle unauthenticated user', () => {
    setupUnauthenticatedState();
    expect(getCurrentAuthUser()).toBeNull();
    // Test login flow, redirects, etc.
  });
});
```

## Integration with Existing Tests

The setup file is automatically loaded via `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    setupFiles: ['./src/setupTests.ts', './tests/setup.ts'],
    // ...
  },
});
```

This means all utilities are available in every test file without additional imports.

## Best Practices

1. **Always use setup utilities**: Don't manually create auth state; use the provided utilities
2. **Prefer role-specific functions**: Use `setupDemoStudent()` instead of `setupDemoUserAuth('student')`
3. **Clean state is automatic**: Don't worry about cleanup; it's handled automatically
4. **Test isolation**: Each test starts with a clean slate
5. **Use test contexts**: For complex scenarios, use context builders to organize test data

## Troubleshooting

### Issue: Tests interfering with each other

**Solution**: The automatic cleanup should prevent this. If it persists, manually call `clearAuth()` in your test.

### Issue: localStorage not persisting

**Solution**: This is expected. localStorage is cleared between tests. If you need persistence within a test, don't call `clearAuth()`.

### Issue: Auth state not updating

**Solution**: Make sure you're using `useAuthStore.setState()` or the provided utilities, not direct mutations.

## Contributing

When adding new test utilities:

1. Add the function to `tests/setup.ts`
2. Document it in this README
3. Add usage examples
4. Ensure it maintains test isolation

## React Component Testing with test-utils.tsx

In addition to the setup utilities, we provide `test-utils.tsx` for testing React components with proper providers and context.

### Render Functions

All render functions automatically wrap components with necessary providers (Router, QueryClient, Theme):

```typescript
import { renderWithDemoStudent, screen } from '../tests/test-utils';

it('should render dashboard', () => {
  renderWithDemoStudent(<StudentDashboard />);
  expect(screen.getByText('Welcome')).toBeInTheDocument();
});
```

Available render functions:

- `renderWithDemoStudent(ui, options?)` - Renders with demo student
- `renderWithDemoTeacher(ui, options?)` - Renders with demo teacher
- `renderWithDemoParent(ui, options?)` - Renders with demo parent
- `renderWithDemoAdmin(ui, options?)` - Renders with demo admin
- `renderWithRegularUser(ui, role?, email?, options?)` - Renders with regular user
- `renderUnauthenticated(ui, options?)` - Renders without auth
- `renderWithProviders(ui, options)` - Generic render with custom auth state

### User Interactions

```typescript
import { renderWithDemoStudent, screen, userEvent } from '../tests/test-utils';

it('should handle form submission', async () => {
  const user = userEvent.setup();
  renderWithDemoStudent(<LoginForm />);

  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.click(screen.getByText('Submit'));
});
```

### Mock Utilities

```typescript
import { createMockFile, createMockChangeEvent } from '../tests/test-utils';

// Create mock files for upload testing
const file = createMockFile('assignment.pdf', 2048, 'application/pdf');

// Create mock events
const event = createMockChangeEvent('new value');
```

### Async Utilities

```typescript
import { waitForCondition, delay } from '../tests/test-utils';

// Wait for a condition
await waitForCondition(() => dataLoaded);

// Add delay
await delay(100);
```

## Related Files

- `src/setupTests.ts` - Main test setup with MSW handlers
- `tests/setup.ts` - Demo user test configuration and auth utilities
- `tests/test-utils.tsx` - React component testing utilities
- `src/data/dummyData.ts` - Demo user data and credentials
- `src/store/useAuthStore.ts` - Auth store implementation
- `src/api/demoDataApi.ts` - Demo data API implementation
