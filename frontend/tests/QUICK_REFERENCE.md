# Test Utilities Quick Reference

Quick reference guide for common testing scenarios in the frontend application.

## Common Imports

```typescript
// For unit tests (no React components)
import { setupDemoStudent, setupDemoTeacher, clearAuth, getCurrentAuthUser } from '../tests/setup';

// For component tests
import {
  renderWithDemoStudent,
  renderWithDemoTeacher,
  screen,
  userEvent,
} from '../tests/test-utils';
```

## Quick Recipes

### 1. Test with Demo Student

```typescript
import { setupDemoStudent } from '../tests/setup';

describe('Feature', () => {
  beforeEach(() => {
    setupDemoStudent();
  });

  it('should work', () => {
    // Your test
  });
});
```

### 2. Test React Component with Demo Student

```typescript
import { renderWithDemoStudent, screen } from '../tests/test-utils';

it('should render component', () => {
  renderWithDemoStudent(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### 3. Test Multiple Roles

```typescript
import { setupDemoStudent, setupDemoTeacher } from '../tests/setup';

describe.each([
  { role: 'student', setup: setupDemoStudent },
  { role: 'teacher', setup: setupDemoTeacher },
])('$role role', ({ setup }) => {
  beforeEach(() => {
    setup();
  });

  it('should work', () => {
    // Test works for both roles
  });
});
```

### 4. Test Unauthenticated Flow

```typescript
import { renderUnauthenticated, screen } from '../tests/test-utils';

it('should redirect to login', () => {
  renderUnauthenticated(<ProtectedComponent />);
  expect(screen.getByText('Please log in')).toBeInTheDocument();
});
```

### 5. Test Form Interaction

```typescript
import { renderWithDemoStudent, screen, userEvent } from '../tests/test-utils';

it('should submit form', async () => {
  const user = userEvent.setup();
  renderWithDemoStudent(<MyForm />);

  await user.type(screen.getByLabelText('Name'), 'John Doe');
  await user.click(screen.getByText('Submit'));

  expect(screen.getByText('Success')).toBeInTheDocument();
});
```

### 6. Test with Custom User

```typescript
import { createCustomAuthUser, setupCustomUserAuth } from '../tests/setup';

it('should handle unverified email', () => {
  const user = createCustomAuthUser({ emailVerified: false });
  setupCustomUserAuth(user);

  // Test unverified email scenario
});
```

### 7. Test API Calls with Demo Data

```typescript
import { setupDemoStudent } from '../tests/setup';
import { demoStudentsApi } from '@/api/demoDataApi';

it('should fetch student profile', async () => {
  setupDemoStudent();

  const profile = await demoStudentsApi.getStudentProfile(1001);
  expect(profile.email).toBe('demo@example.com');
});
```

### 8. Test State Changes

```typescript
import { setupDemoStudent, getAuthState, clearAuth } from '../tests/setup';

it('should update auth state', () => {
  setupDemoStudent();
  expect(getAuthState().isAuthenticated).toBe(true);

  clearAuth();
  expect(getAuthState().isAuthenticated).toBe(false);
});
```

### 9. Test with Async Data Loading

```typescript
import { renderWithDemoStudent, screen, waitFor } from '../tests/test-utils';

it('should load data', async () => {
  renderWithDemoStudent(<DataComponent />);

  expect(screen.getByText('Loading...')).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

### 10. Test File Upload

```typescript
import { renderWithDemoStudent, screen, userEvent, createMockFile } from '../tests/test-utils';

it('should upload file', async () => {
  const user = userEvent.setup();
  renderWithDemoStudent(<FileUpload />);

  const file = createMockFile('document.pdf');
  const input = screen.getByLabelText('Upload');

  await user.upload(input, file);
  expect(screen.getByText('document.pdf')).toBeInTheDocument();
});
```

### 11. Test with localStorage

```typescript
it('should persist data in localStorage', () => {
  localStorage.setItem('key', 'value');
  expect(localStorage.getItem('key')).toBe('value');

  // localStorage is automatically cleared between tests
});
```

### 12. Test Role-Based Rendering

```typescript
import { renderWithDemoStudent, renderWithDemoTeacher, screen } from '../tests/test-utils';

it('should show student view', () => {
  renderWithDemoStudent(<Dashboard />);
  expect(screen.getByText('Student Dashboard')).toBeInTheDocument();
});

it('should show teacher view', () => {
  renderWithDemoTeacher(<Dashboard />);
  expect(screen.getByText('Teacher Dashboard')).toBeInTheDocument();
});
```

### 13. Test Error Handling

```typescript
import { renderWithDemoStudent, screen } from '../tests/test-utils';
import { server } from '@/setupTests';
import { http, HttpResponse } from 'msw';

it('should handle API error', async () => {
  server.use(
    http.get('/api/data', () => {
      return HttpResponse.json({ error: 'Failed' }, { status: 500 });
    })
  );

  renderWithDemoStudent(<DataComponent />);

  await screen.findByText('Error loading data');
});
```

### 14. Test with Regular User

```typescript
import { renderWithRegularUser, screen } from '../tests/test-utils';

it('should work with regular user', () => {
  renderWithRegularUser(<MyComponent />, 'teacher', 'teacher@school.com');
  expect(screen.getByText('teacher@school.com')).toBeInTheDocument();
});
```

### 15. Test Component Cleanup

```typescript
import { renderWithDemoStudent, cleanup } from '../tests/test-utils';

it('should cleanup properly', () => {
  const { unmount } = renderWithDemoStudent(<MyComponent />);

  // Do something

  unmount();
  cleanup();

  // Component is cleaned up
});
```

## Common Patterns

### Testing Protected Routes

```typescript
describe('Protected Route', () => {
  it('should allow authenticated access', () => {
    renderWithDemoStudent(<ProtectedRoute><Dashboard /></ProtectedRoute>);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should redirect unauthenticated users', () => {
    renderUnauthenticated(<ProtectedRoute><Dashboard /></ProtectedRoute>);
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });
});
```

### Testing Role-Based Access

```typescript
describe('Admin Panel', () => {
  it('should allow admin access', () => {
    renderWithDemoAdmin(<AdminPanel />);
    expect(screen.getByText('Admin Controls')).toBeInTheDocument();
  });

  it('should deny student access', () => {
    renderWithDemoStudent(<AdminPanel />);
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });
});
```

### Testing Demo vs Regular User

```typescript
describe('Feature Availability', () => {
  it('should use demo data for demo user', () => {
    renderWithDemoStudent(<DataList />);
    expect(screen.getByText('Demo Data')).toBeInTheDocument();
  });

  it('should use real API for regular user', () => {
    renderWithRegularUser(<DataList />);
    expect(screen.getByText('Real Data')).toBeInTheDocument();
  });
});
```

## Anti-Patterns to Avoid

❌ **Don't manually create auth state**

```typescript
// BAD
useAuthStore.setState({ user: {...}, isAuthenticated: true });

// GOOD
setupDemoStudent();
```

❌ **Don't forget to clean up**

```typescript
// BAD - relies on global state
let user;
beforeAll(() => {
  user = createDemoUser();
});

// GOOD - uses automatic cleanup
beforeEach(() => {
  setupDemoStudent();
});
```

❌ **Don't test implementation details**

```typescript
// BAD
expect(component.state.loading).toBe(false);

// GOOD
expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
```

❌ **Don't use hardcoded delays**

```typescript
// BAD
await new Promise((resolve) => setTimeout(resolve, 1000));

// GOOD
await waitFor(() => expect(screen.getByText('Loaded')).toBeInTheDocument());
```

## Debugging Tips

1. **Use screen.debug()** to see current DOM

   ```typescript
   screen.debug();
   ```

2. **Use logRoles()** to see available ARIA roles

   ```typescript
   import { logRoles } from '@testing-library/react';
   logRoles(container);
   ```

3. **Check current auth state**

   ```typescript
   console.log(getAuthState());
   console.log(getCurrentAuthUser());
   ```

4. **Inspect localStorage**
   ```typescript
   console.log(localStorage.getItem('accessToken'));
   ```

## Need More Help?

- See [README.md](./README.md) for detailed documentation
- Check existing tests for examples
- Review [Testing Library documentation](https://testing-library.com/)
