# Test Implementation Checklist

Use this checklist to ensure your tests follow best practices and use the demo user test configuration correctly.

## Before Writing Tests

- [ ] Read `tests/README.md` for overview
- [ ] Review `tests/QUICK_REFERENCE.md` for common patterns
- [ ] Check `tests/examples/` for similar test scenarios
- [ ] Understand which utilities you need (setup vs test-utils)

## For Unit Tests (No React Components)

- [ ] Import utilities from `../tests/setup`
- [ ] Use appropriate setup function in `beforeEach`
- [ ] Don't manually create auth state
- [ ] Don't manually manipulate localStorage
- [ ] Verify test isolation (each test starts clean)

### Example Unit Test Structure

```typescript
import { setupDemoStudent, getCurrentAuthUser } from '../tests/setup';

describe('My Feature', () => {
  beforeEach(() => {
    setupDemoStudent();
  });

  it('should do something', () => {
    // Test logic
  });
});
```

## For Component Tests

- [ ] Import utilities from `../tests/test-utils`
- [ ] Use appropriate render function
- [ ] Use `screen` for queries
- [ ] Use `userEvent` for interactions
- [ ] Use `waitFor` for async operations
- [ ] Test user interactions, not implementation

### Example Component Test Structure

```typescript
import { renderWithDemoStudent, screen, userEvent } from '../tests/test-utils';

describe('MyComponent', () => {
  it('should render', () => {
    renderWithDemoStudent(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Test Quality Checklist

### Naming

- [ ] Test names describe what is being tested
- [ ] Test names are clear and specific
- [ ] Use "should" pattern: "should render X when Y"

### Structure

- [ ] Each test has a single, clear purpose
- [ ] Tests are organized in logical describe blocks
- [ ] Related tests are grouped together

### Assertions

- [ ] Use semantic queries (getByRole, getByLabelText)
- [ ] Avoid testing implementation details
- [ ] Test user-visible behavior
- [ ] Use appropriate matchers (toBeInTheDocument, toHaveValue, etc.)

### Async Handling

- [ ] Use `waitFor` for async operations
- [ ] Use `await` with userEvent methods
- [ ] Don't use hardcoded delays
- [ ] Handle loading states properly

### Cleanup

- [ ] Don't manually cleanup (it's automatic)
- [ ] Don't leave timers running
- [ ] Don't mock without clearing

## Role-Based Testing Checklist

- [ ] Test with appropriate role (student, teacher, parent, admin)
- [ ] Test unauthorized access if applicable
- [ ] Test unauthenticated state if applicable
- [ ] Test demo vs regular user differences if applicable

## Accessibility Checklist

- [ ] Use semantic queries (getByRole, getByLabelText)
- [ ] Test keyboard navigation if applicable
- [ ] Test ARIA attributes if applicable
- [ ] Ensure components are accessible

## Common Scenarios Checklist

### Testing Forms

- [ ] Test empty form submission
- [ ] Test valid form submission
- [ ] Test validation errors
- [ ] Test input changes
- [ ] Use `userEvent` for interactions

### Testing Loading States

- [ ] Test initial loading state
- [ ] Test loaded state
- [ ] Test error state
- [ ] Use `waitFor` for transitions

### Testing Navigation

- [ ] Test route access for different roles
- [ ] Test redirects for unauthorized access
- [ ] Test protected routes

### Testing API Calls

- [ ] Mock API responses using MSW
- [ ] Test success scenarios
- [ ] Test error scenarios
- [ ] Test loading states

## Anti-Patterns to Avoid

### ❌ Don't Do This

```typescript
// Manual auth state creation
useAuthStore.setState({ user: {...}, isAuthenticated: true });

// Manual localStorage manipulation
localStorage.setItem('auth-storage', JSON.stringify({...}));

// Testing implementation details
expect(component.state.count).toBe(5);

// Hardcoded delays
await new Promise(resolve => setTimeout(resolve, 1000));

// Querying by class or id
const element = container.querySelector('.my-class');
```

### ✅ Do This Instead

```typescript
// Use setup utilities
setupDemoStudent();

// Use provided utilities
// (localStorage is already mocked)

// Test user-visible behavior
expect(screen.getByText('Count: 5')).toBeInTheDocument();

// Use waitFor
await waitFor(() => expect(screen.getByText('Loaded')).toBeInTheDocument());

// Use semantic queries
const element = screen.getByRole('button', { name: 'Submit' });
```

## Code Review Checklist

Before submitting for review:

- [ ] All tests pass locally
- [ ] Tests are isolated (don't depend on order)
- [ ] Tests are readable and maintainable
- [ ] Tests follow established patterns
- [ ] Documentation is updated if needed
- [ ] No console errors or warnings
- [ ] Coverage is adequate

## Performance Checklist

- [ ] Tests run quickly (< 1 second per test ideally)
- [ ] No unnecessary delays
- [ ] Mocks are efficient
- [ ] No memory leaks

## Documentation Checklist

If adding new test utilities:

- [ ] Add to `tests/setup.ts` or `tests/test-utils.tsx`
- [ ] Document in `tests/README.md`
- [ ] Add to `tests/QUICK_REFERENCE.md`
- [ ] Add usage example
- [ ] Add TypeScript types to `tests/types.d.ts`
- [ ] Write tests for the utility
- [ ] Update this checklist if needed

## Final Verification

Before considering tests complete:

- [ ] Run `npm test` - all tests pass
- [ ] Run `npm run test:coverage` - coverage meets thresholds
- [ ] Tests are deterministic (pass every time)
- [ ] Tests provide value (test real functionality)
- [ ] Tests are maintainable (easy to update)
- [ ] Tests are documented (clear purpose)

## Common Issues and Solutions

### Issue: Tests fail intermittently

**Solution**: Ensure proper use of `waitFor` for async operations, check for race conditions

### Issue: Tests affect each other

**Solution**: Verify cleanup is working, don't use global state

### Issue: Can't query elements

**Solution**: Use `screen.debug()` to see DOM, use semantic queries

### Issue: Auth state not working

**Solution**: Use setup utilities, don't manually set state

### Issue: Tests are slow

**Solution**: Reduce unnecessary delays, mock external calls, optimize setup

## Resources

- [Testing Library Docs](https://testing-library.com/)
- [Vitest Docs](https://vitest.dev/)
- [tests/README.md](./README.md) - Detailed documentation
- [tests/QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Quick recipes
- [tests/examples/](./examples/) - Example tests

## Getting Help

1. Check this checklist
2. Review documentation in `tests/`
3. Look at existing tests for patterns
4. Check `tests/examples/` for similar scenarios
5. Ask team members

---

**Remember**: Good tests are:

- ✅ Isolated (independent)
- ✅ Readable (clear purpose)
- ✅ Maintainable (easy to update)
- ✅ Fast (quick to run)
- ✅ Reliable (pass consistently)
- ✅ Valuable (test real functionality)
