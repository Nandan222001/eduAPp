# Test Examples

This directory contains complete, real-world test examples demonstrating how to use the demo user test configuration.

## Available Examples

### 1. `integration-example.test.tsx`

A comprehensive integration test example that demonstrates:

- **Dashboard Component Testing**
  - Rendering with different user roles
  - Role-based content display
  - Demo user banner
  - Loading states
  - Unauthenticated access

- **Login Form Testing**
  - Form validation
  - Error handling
  - Successful login flow
  - User interactions with `userEvent`

- **Complete User Journeys**
  - Full authentication flow
  - Role switching
  - State transitions

- **Test Isolation**
  - Verification that tests don't interfere with each other
  - Clean state between tests

## How to Use These Examples

### 1. Read the Code

Each example is heavily commented to explain what's happening and why.

### 2. Run the Tests

```bash
npm test tests/examples/
```

### 3. Modify and Experiment

Copy an example and modify it to match your use case.

### 4. Use as Templates

Use these examples as templates for your own tests.

## Key Patterns Demonstrated

### Pattern 1: Testing with Different Roles

```typescript
it('should show student content', async () => {
  renderWithDemoStudent(<Dashboard />);
  await waitFor(() => {
    expect(screen.getByTestId('student-section')).toBeInTheDocument();
  });
});

it('should show teacher content', async () => {
  renderWithDemoTeacher(<Dashboard />);
  await waitFor(() => {
    expect(screen.getByTestId('teacher-section')).toBeInTheDocument();
  });
});
```

### Pattern 2: Testing User Interactions

```typescript
it('should handle form submission', async () => {
  const user = userEvent.setup();
  renderUnauthenticated(<LoginForm onLogin={mockLogin} />);

  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.type(screen.getByLabelText('Password'), 'password');
  await user.click(screen.getByText('Login'));

  expect(mockLogin).toHaveBeenCalled();
});
```

### Pattern 3: Testing Loading States

```typescript
it('should transition from loading to loaded', async () => {
  renderWithDemoStudent(<Dashboard />);

  // Initially loading
  expect(screen.getByText('Loading...')).toBeInTheDocument();

  // Wait for loaded state
  await waitFor(() => {
    expect(screen.getByText('Welcome')).toBeInTheDocument();
  });
});
```

### Pattern 4: Testing Unauthenticated Access

```typescript
it('should show login prompt', () => {
  renderUnauthenticated(<Dashboard />);
  expect(screen.getByText('Please log in')).toBeInTheDocument();
});
```

### Pattern 5: Testing with Mock Functions

```typescript
it('should call callback on logout', async () => {
  const user = userEvent.setup();
  const mockLogout = vi.fn();

  renderWithDemoStudent(<Dashboard onLogout={mockLogout} />);

  await user.click(screen.getByText('Logout'));
  expect(mockLogout).toHaveBeenCalledTimes(1);
});
```

## Adding Your Own Examples

When adding new examples to this directory:

1. **Create a new file**: `your-feature-example.test.tsx`

2. **Include comprehensive comments**:

   ```typescript
   /**
    * Example: Feature Name
    *
    * This example demonstrates:
    * - What it tests
    * - Why it's useful
    * - Key patterns used
    */
   ```

3. **Cover multiple scenarios**:
   - Happy path
   - Error cases
   - Edge cases
   - Different user roles

4. **Document patterns used**:
   - Explain why you chose specific utilities
   - Show best practices
   - Highlight common pitfalls to avoid

5. **Update this README**:
   - Add your example to the list
   - Describe what it demonstrates
   - Add key patterns if applicable

## Running Individual Examples

Run a specific example file:

```bash
npm test tests/examples/integration-example.test.tsx
```

Run in watch mode:

```bash
npm test tests/examples/integration-example.test.tsx -- --watch
```

Run with coverage:

```bash
npm run test:coverage tests/examples/integration-example.test.tsx
```

## Learning Path

1. **Start here**: `integration-example.test.tsx`
   - See all utilities in action
   - Learn basic patterns
   - Understand test structure

2. **Review parent directory tests**:
   - `demo-user-setup.test.ts` - Unit test utilities
   - `test-utils.test.tsx` - Component test utilities

3. **Check existing app tests**:
   - `src/api/demoDataApi.test.ts` - API testing
   - Other `.test.ts(x)` files in src/

4. **Write your own tests**:
   - Use examples as templates
   - Follow patterns shown
   - Reference documentation

## Tips for Understanding Examples

1. **Read from top to bottom**: Examples are structured to build understanding progressively

2. **Run tests in debug mode**: Use `screen.debug()` to see component output

3. **Modify and experiment**: Change values, add assertions, break things to learn

4. **Compare with documentation**: Cross-reference with `tests/README.md` and `tests/QUICK_REFERENCE.md`

## Common Questions

**Q: Why use `waitFor`?**  
A: React components update asynchronously. `waitFor` ensures tests wait for updates before asserting.

**Q: Why `userEvent` instead of `fireEvent`?**  
A: `userEvent` simulates real user interactions more accurately.

**Q: When to use `renderWithProviders` vs specific renders?**  
A: Use specific renders (`renderWithDemoStudent`) for clarity. Use `renderWithProviders` when you need custom configuration.

**Q: How to test protected routes?**  
A: Render with different auth states and verify route access.

## Next Steps

After understanding these examples:

1. Write tests for your features using these patterns
2. Refer to `tests/QUICK_REFERENCE.md` for quick recipes
3. Check `tests/TEST_CHECKLIST.md` before submitting
4. Share your own examples with the team

## Feedback

If you find these examples helpful or have suggestions:

- Add more examples to this directory
- Improve existing examples
- Update documentation
- Share learnings with the team
