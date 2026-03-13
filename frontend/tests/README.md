# Test Documentation

Comprehensive guide to testing the Student Portal frontend application, including unit tests, integration tests, E2E tests, and manual testing procedures.

---

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
  - [Unit Tests](#unit-tests)
  - [Integration Tests](#integration-tests)
  - [E2E Tests](#e2e-tests)
  - [Coverage Reports](#coverage-reports)
- [Demo User Test Credentials](#demo-user-test-credentials)
- [Test Utilities](#test-utilities)
- [Expected Behaviors](#expected-behaviors)
- [Known Limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)

---

## Overview

The Student Portal frontend uses a comprehensive testing strategy:

- **Unit Tests**: Test individual components and functions in isolation
- **Integration Tests**: Test component interactions and API integrations
- **E2E Tests**: Test complete user journeys through the application
- **Manual Tests**: Human verification of UX, accessibility, and responsive design

### Testing Stack

- **Test Runner**: [Vitest](https://vitest.dev/) - Fast, Vite-native test runner
- **Component Testing**: [React Testing Library](https://testing-library.com/react)
- **E2E Testing**: [Playwright](https://playwright.dev/)
- **Mocking**: [MSW](https://mswjs.io/) (Mock Service Worker)
- **Assertions**: [Jest DOM](https://github.com/testing-library/jest-dom)

---

## Test Structure

```
frontend/
├── tests/                          # Test utilities and setup
│   ├── README.md                   # This file
│   ├── setup.ts                    # Core test utilities & auth state management
│   ├── test-utils.tsx              # React component testing utilities
│   ├── index.ts                    # Central export point
│   ├── types.d.ts                  # TypeScript type definitions
│   ├── demo-user-setup.test.ts     # Tests for setup utilities
│   ├── test-utils.test.tsx         # Tests for test-utils
│   ├── e2e/                        # E2E test specifications
│   │   └── demo-user-flow.spec.ts  # Demo user journey tests
│   ├── examples/                   # Example test patterns
│   │   └── integration-example.test.tsx
│   └── manual/                     # Manual testing scripts
│       └── demo-user-test-script.md
├── src/
│   ├── **/*.test.tsx               # Component unit tests (co-located)
│   ├── api/**/*.test.ts            # API unit tests
│   └── setupTests.ts               # Test setup with MSW handlers
├── vitest.config.ts                # Vitest configuration
└── package.json                    # Test scripts
```

### Test File Naming Conventions

- **Unit Tests**: `*.test.tsx` or `*.test.ts` (co-located with source files)
- **E2E Tests**: `*.spec.ts` (in `tests/e2e/` directory)
- **Integration Tests**: `integration-*.test.tsx` (in `tests/examples/`)

---

## Running Tests

### Unit Tests

Unit tests run in watch mode by default, re-running when files change.

**Run in watch mode (interactive):**

```bash
npm test
```

**Run once (non-interactive):**

```bash
npm test -- --run
```

**Run specific test file:**

```bash
npm test -- LoginPage.test.tsx
```

**Run tests matching pattern:**

```bash
npm test -- --grep "authentication"
```

**Run with UI:**

```bash
npm run test:ui
```

Opens an interactive browser-based UI for exploring and debugging tests.

### Integration Tests

Integration tests use the same runner as unit tests but test component interactions and API integrations.

**Run all integration tests:**

```bash
npm test -- integration
```

**Run specific integration test:**

```bash
npm test -- tests/examples/integration-example.test.tsx
```

### E2E Tests

End-to-end tests use Playwright to test complete user journeys in a real browser.

**Run all E2E tests (headless):**

```bash
npm run test:e2e
```

**Run with interactive UI:**

```bash
npm run test:e2e:ui
```

**Run specific E2E test:**

```bash
npm run test:e2e -- demo-user-flow.spec.ts
```

**Run in specific browser:**

```bash
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit
```

**Run in headed mode (see the browser):**

```bash
npm run test:e2e -- --headed
```

**Debug mode (pause on failure):**

```bash
npm run test:e2e -- --debug
```

### Coverage Reports

**Generate coverage report:**

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory and include:

- HTML report: `coverage/index.html`
- Text summary in terminal
- LCOV format for CI tools

**Coverage Thresholds:**

- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

---

## Demo User Test Credentials

### Primary Demo User (Student)

```
Email:     demo@example.com
Password:  Demo@123
Name:      Alex Johnson
Role:      Student
```

### Demo User Data

The demo user has pre-populated data for testing:

| Data Type             | Value                            |
| --------------------- | -------------------------------- |
| **Attendance**        | 80%                              |
| **Points**            | 2,450                            |
| **Performance Score** | 86-89%                           |
| **Institution**       | Demo University                  |
| **Email Verified**    | Yes                              |
| **Is Demo User**      | Yes (identified by email domain) |

### Expected Dashboard Data

**Upcoming Assignments:**

- Multiple assignments with various due dates
- Different subjects (Mathematics, Physics, etc.)
- Mix of pending and submitted statuses

**Recent Grades:**

- Graded submissions showing A, B, C ratings
- Subject-specific performance data

**Badges:**

- Multiple earned badges (First Login, Assignment Master, etc.)
- Badge icons/images displayed

**Goals:**

- Academic goals with progress tracking
- Different goal types (grade, skill, attendance)

**AI Predictions:**

- Topic probability rankings
- Topics include: Quadratic, Trigonometric, Circle, Probability, Calculus
- Probability percentages for each topic

---

## Test Utilities

### Setup Utilities (`tests/setup.ts`)

Utilities for managing authentication state and user context.

#### Quick User Setup

```typescript
import { setupDemoStudent, setupDemoTeacher, setupUnauthenticatedState } from '@/tests/setup';

// Setup demo student
setupDemoStudent();

// Setup demo teacher
setupDemoTeacher();

// Setup unauthenticated state
setupUnauthenticatedState();
```

#### Available Setup Functions

| Function                              | Description                       |
| ------------------------------------- | --------------------------------- |
| `setupDemoStudent()`                  | Setup demo user with student role |
| `setupDemoTeacher()`                  | Setup demo user with teacher role |
| `setupDemoParent()`                   | Setup demo user with parent role  |
| `setupDemoAdmin()`                    | Setup demo user with admin role   |
| `setupRegularUserAuth(role?, email?)` | Setup non-demo user               |
| `setupCustomUserAuth(user, tokens?)`  | Setup custom user                 |
| `setupUnauthenticatedState()`         | Clear all auth state              |
| `clearAuth()`                         | Clear authentication state        |

#### User Creation Functions

```typescript
import { createDemoUser, createCustomAuthUser } from '@/tests/setup';

// Create demo user
const demoUser = createDemoUser('student');

// Create custom user
const customUser = createCustomAuthUser({
  role: 'teacher',
  email: 'custom@example.com',
  firstName: 'Custom',
  lastName: 'Teacher',
});
```

#### State Query Functions

```typescript
import { getCurrentAuthUser, isDemoUserInStore, getAuthState } from '@/tests/setup';

// Get current user
const user = getCurrentAuthUser();

// Check if demo user
const isDemo = isDemoUserInStore();

// Get complete auth state
const state = getAuthState();
```

### React Testing Utilities (`tests/test-utils.tsx`)

Utilities for rendering React components with necessary providers.

#### Render Functions

```typescript
import { renderWithDemoStudent, screen, userEvent } from '@/tests/test-utils';

it('should render component', async () => {
  const user = userEvent.setup();

  renderWithDemoStudent(<MyComponent />);

  expect(screen.getByText('Welcome')).toBeInTheDocument();
  await user.click(screen.getByRole('button'));
});
```

#### Available Render Functions

| Function                                             | Description                          |
| ---------------------------------------------------- | ------------------------------------ |
| `renderWithDemoStudent(ui, options?)`                | Render with demo student context     |
| `renderWithDemoTeacher(ui, options?)`                | Render with demo teacher context     |
| `renderWithDemoParent(ui, options?)`                 | Render with demo parent context      |
| `renderWithDemoAdmin(ui, options?)`                  | Render with demo admin context       |
| `renderWithRegularUser(ui, role?, email?, options?)` | Render with regular user             |
| `renderUnauthenticated(ui, options?)`                | Render without authentication        |
| `renderWithProviders(ui, options)`                   | Generic render with custom providers |

#### Helper Functions

```typescript
import { waitForCondition, delay, createMockFile, createMockChangeEvent } from '@/tests/test-utils';

// Wait for condition
await waitForCondition(() => dataLoaded, 5000);

// Add delay
await delay(100);

// Create mock file
const file = createMockFile('test.pdf', 2048, 'application/pdf');

// Create mock event
const event = createMockChangeEvent('new value');
```

---

## Expected Behaviors

### Authentication Flow

**Valid Login:**

1. User enters `demo@example.com` and `Demo@123`
2. Form submits successfully
3. User redirects to `/student/dashboard`
4. Dashboard loads with user data
5. Welcome message shows "Alex Johnson"

**Invalid Login:**

1. User enters incorrect credentials
2. Error message displays
3. User remains on login page
4. No redirect occurs

**Session Persistence:**

1. User logs in successfully
2. Page refresh maintains logged-in state
3. User data persists across refreshes
4. Tokens stored in localStorage

### Dashboard Behavior

**Data Loading:**

1. Dashboard shows loading state initially
2. Data loads within 5-10 seconds
3. All widgets populate with data
4. No error states displayed

**Navigation:**

1. Navigation menu accessible
2. All student routes clickable
3. Page transitions smooth (< 1 second)
4. URL updates correctly

**Interactive Elements:**

1. Buttons respond to clicks
2. Forms accept input
3. Charts/graphs render
4. Tooltips appear on hover

### Analytics Page

**Performance Display:**

1. Performance score shows 86-89%
2. Charts render correctly
3. Subject breakdown visible
4. Historical data displayed

**Chart Interactions:**

1. Hover shows tooltips
2. Data points clickable (if implemented)
3. Legends interactive
4. Responsive to viewport size

### AI Prediction Dashboard

**Topic Rankings:**

1. Table/list of topics displayed
2. Topics include: Quadratic, Trigonometric, Circle, Probability, Calculus
3. Probability percentages shown
4. Ranking order visible

---

## Known Limitations

### Demo User Limitations

1. **Read-Only Data**: Demo user data is mocked and doesn't persist changes
2. **No Real API**: All API calls are intercepted by MSW
3. **Limited Scope**: Only student role fully implemented for demo
4. **No File Uploads**: File upload features may be mocked
5. **Fixed Data**: Same data returned on every request

### Test Environment Limitations

1. **No Real Backend**: Tests run against mocked API responses
2. **Timing Issues**: Async operations may occasionally timeout
3. **Browser Compatibility**: E2E tests limited to Chromium/Firefox/WebKit
4. **Network Conditions**: Offline testing requires manual DevTools setup
5. **External Services**: Third-party integrations (Sentry, etc.) mocked

### Known Test Flakiness

1. **Race Conditions**: Occasional failures in async tests
2. **Timing Sensitive**: Tests depending on exact timing may fail
3. **Animation Issues**: Tests may fail during CSS animations
4. **Network Delays**: MSW response delays may cause timeouts

### Coverage Gaps

1. **Edge Cases**: Some error scenarios not fully covered
2. **Complex Flows**: Multi-step processes partially tested
3. **Accessibility**: A11y testing not comprehensive
4. **Performance**: Limited performance testing

---

## Troubleshooting

### Common Test Failures

#### "Element not found" errors

**Problem**: `screen.getByText()` or similar query fails

**Solutions:**

1. Check if element rendered asynchronously:

   ```typescript
   await waitFor(() => {
     expect(screen.getByText('Text')).toBeInTheDocument();
   });
   ```

2. Use more flexible query:

   ```typescript
   screen.getByText(/text/i); // Case-insensitive regex
   ```

3. Check the component actually renders:
   ```typescript
   screen.debug(); // Print rendered output
   ```

#### Timeout errors in async tests

**Problem**: Test times out waiting for async operation

**Solutions:**

1. Increase timeout:

   ```typescript
   await waitFor(
     () => {
       /* ... */
     },
     { timeout: 10000 }
   );
   ```

2. Check if promises resolve:

   ```typescript
   await waitForCondition(() => dataLoaded);
   ```

3. Verify MSW handlers are registered:
   ```typescript
   // Check src/setupTests.ts has handlers
   ```

#### "localStorage is not defined"

**Problem**: Tests fail accessing localStorage

**Solution**: Already mocked in `tests/setup.ts`, ensure it's imported:

```typescript
import '@/tests/setup';
```

#### Authentication state not persisting

**Problem**: User logged out between tests

**Solutions:**

1. Setup auth in `beforeEach`:

   ```typescript
   beforeEach(() => {
     setupDemoStudent();
   });
   ```

2. Check for automatic cleanup:
   ```typescript
   // Cleanup runs automatically via setup.ts
   ```

#### MSW handlers not intercepting requests

**Problem**: Real API requests made instead of mocked

**Solutions:**

1. Verify MSW setup in `src/setupTests.ts`
2. Check handler patterns match request URLs:
   ```typescript
   http.get('/api/students/:id', () => {
     /* ... */
   });
   ```
3. Start MSW server explicitly if needed

#### E2E tests failing on CI

**Problem**: Playwright tests pass locally but fail on CI

**Solutions:**

1. Install Playwright browsers on CI:

   ```bash
   npx playwright install --with-deps
   ```

2. Use `waitForNetworkIdle` for async operations:

   ```typescript
   await waitForNetworkIdle(page);
   ```

3. Increase timeouts for slower CI environments:
   ```typescript
   test.setTimeout(60000);
   ```

#### Test isolation issues

**Problem**: Tests pass individually but fail when run together

**Solutions:**

1. Verify cleanup in `afterEach`:

   ```typescript
   afterEach(() => {
     vi.clearAllMocks();
     clearAuth();
   });
   ```

2. Don't share mutable state between tests
3. Use `beforeEach` to reset state

#### Chart/canvas tests failing

**Problem**: Tests involving charts or canvas elements fail

**Solutions:**

1. Mock the chart library:

   ```typescript
   vi.mock('react-chartjs-2', () => ({
     Line: () => <div>Chart</div>
   }));
   ```

2. Query by test ID instead of visual elements:
   ```typescript
   <canvas data-testid="chart" />
   expect(screen.getByTestId('chart')).toBeInTheDocument();
   ```

### Performance Issues

#### Tests running slowly

**Solutions:**

1. Run specific test file instead of all tests:

   ```bash
   npm test -- specific-file.test.tsx
   ```

2. Disable coverage when not needed:

   ```bash
   npm test -- --coverage=false
   ```

3. Use `test.concurrent` for independent tests:
   ```typescript
   test.concurrent('test 1', async () => {
     /* ... */
   });
   ```

#### Out of memory errors

**Solutions:**

1. Increase Node memory:

   ```bash
   NODE_OPTIONS=--max-old-space-size=4096 npm test
   ```

2. Run tests in smaller batches
3. Clear caches between runs

### Debug Strategies

#### Enable verbose logging

```bash
npm test -- --reporter=verbose
```

#### Use debug tools

```typescript
// React Testing Library
screen.debug(); // Print DOM
screen.logTestingPlaygroundURL(); // Get selector suggestions

// Vitest
await vi.waitFor(
  () => {
    /* ... */
  },
  {
    onTimeout: () => {
      console.log('Timeout - current state:', getCurrentAuthUser());
    },
  }
);
```

#### Run single test

```typescript
it.only('should test specific case', () => {
  // Only this test runs
});
```

#### Skip failing test temporarily

```typescript
it.skip('should test broken case', () => {
  // This test is skipped
});
```

---

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderWithDemoStudent, screen, userEvent } from '@/tests/test-utils';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  beforeEach(() => {
    // Setup runs before each test
  });

  it('should render correctly', () => {
    renderWithDemoStudent(<MyComponent />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();

    renderWithDemoStudent(<MyComponent />);

    await user.click(screen.getByRole('button'));

    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderWithDemoStudent, screen, waitFor } from '@/tests/test-utils';
import { Dashboard } from './Dashboard';

describe('Dashboard Integration', () => {
  it('should load user data and display dashboard', async () => {
    renderWithDemoStudent(<Dashboard />);

    // Wait for async data loading
    await waitFor(() => {
      expect(screen.getByText(/Alex Johnson/)).toBeInTheDocument();
    });

    // Verify all sections loaded
    expect(screen.getByText(/Attendance/)).toBeInTheDocument();
    expect(screen.getByText(/Assignments/)).toBeInTheDocument();
    expect(screen.getByText(/Grades/)).toBeInTheDocument();
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('should complete login flow', async ({ page }) => {
  await page.goto('/login');

  await page.fill('[name="email"]', 'demo@example.com');
  await page.fill('[name="password"]', 'Demo@123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/dashboard/);
  await expect(page.locator('text=Alex Johnson')).toBeVisible();
});
```

---

## Best Practices

### Test Organization

1. **Use descriptive test names**:

   ```typescript
   // Good
   it('should display error message when login fails');

   // Bad
   it('works');
   ```

2. **Group related tests**:

   ```typescript
   describe('Authentication', () => {
     describe('Login', () => {
       it('should succeed with valid credentials');
       it('should fail with invalid credentials');
     });

     describe('Logout', () => {
       it('should clear session');
     });
   });
   ```

3. **One assertion concept per test**: Test one behavior at a time

### Test Quality

1. **Arrange-Act-Assert pattern**:

   ```typescript
   it('should update count', async () => {
     // Arrange
     const user = userEvent.setup();
     renderWithDemoStudent(<Counter />);

     // Act
     await user.click(screen.getByText('Increment'));

     // Assert
     expect(screen.getByText('Count: 1')).toBeInTheDocument();
   });
   ```

2. **Avoid implementation details**: Test behavior, not implementation

   ```typescript
   // Good - test what user sees
   expect(screen.getByText('Welcome')).toBeInTheDocument();

   // Bad - test implementation
   expect(component.state.isWelcome).toBe(true);
   ```

3. **Use semantic queries**:

   ```typescript
   // Good - semantic
   screen.getByRole('button', { name: /submit/i });

   // Acceptable - accessible
   screen.getByLabelText('Email');

   // Last resort
   screen.getByTestId('submit-button');
   ```

### Performance

1. **Use `beforeEach` for common setup**:

   ```typescript
   beforeEach(() => {
     setupDemoStudent();
   });
   ```

2. **Clean up after tests**:

   ```typescript
   afterEach(() => {
     vi.clearAllMocks();
   });
   ```

3. **Mock expensive operations**:
   ```typescript
   vi.mock('./expensiveModule', () => ({
     expensiveFunction: vi.fn(),
   }));
   ```

### Maintainability

1. **Extract test utilities**: Create reusable helpers
2. **Use constants for test data**: Don't repeat magic values
3. **Keep tests simple**: If complex, refactor the code
4. **Document edge cases**: Add comments for tricky scenarios

---

## Manual Tests

For manual testing procedures, see [manual/demo-user-test-script.md](./manual/demo-user-test-script.md).

Manual tests cover:

- Login flows (valid/invalid credentials)
- Dashboard navigation
- Data consistency across pages
- Interactive features (charts, forms, etc.)
- Responsive design (desktop, tablet, mobile)
- Offline mode behavior
- Cross-browser compatibility
- Accessibility (keyboard navigation, screen readers)
- Performance testing

---

## Related Documentation

- **[INDEX.md](./INDEX.md)** - Complete index of test documentation
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick recipes for common scenarios
- **[TEST_CHECKLIST.md](./TEST_CHECKLIST.md)** - Checklist for writing quality tests
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Implementation details
- **[examples/integration-example.test.tsx](./examples/integration-example.test.tsx)** - Complete integration test example
- **[manual/demo-user-test-script.md](./manual/demo-user-test-script.md)** - Manual testing procedures

---

## Getting Help

1. **Check this documentation** for common patterns
2. **Review example tests** in `tests/examples/`
3. **Search existing tests** in `src/` for similar scenarios
4. **Enable debug mode** to inspect failing tests
5. **Ask team members** for guidance

---

## Contributing

When adding new test utilities:

1. Add function to `setup.ts` or `test-utils.tsx`
2. Add TypeScript types to `types.d.ts`
3. Write tests for the utility
4. Document in this README
5. Add examples to QUICK_REFERENCE.md
6. Ensure test isolation is maintained

---

## Summary

This testing infrastructure provides:

- ✅ **Fast feedback**: Vitest runs tests quickly with watch mode
- ✅ **Comprehensive coverage**: Unit, integration, and E2E tests
- ✅ **Easy setup**: One-line setup for common scenarios
- ✅ **Type safety**: Full TypeScript support
- ✅ **Test isolation**: Each test starts with clean state
- ✅ **Rich utilities**: Extensive helpers for common operations
- ✅ **Well documented**: Clear examples and guides

**Happy Testing! 🧪**
