# Test Utilities - Complete Index

Welcome to the demo user test configuration and utilities documentation.

## 📚 Documentation Files

### Getting Started

1. **[README.md](./README.md)** - Comprehensive guide to all utilities
2. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick recipes for common scenarios
3. **[TEST_CHECKLIST.md](./TEST_CHECKLIST.md)** - Checklist for writing quality tests

### Implementation Details

4. **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Complete implementation overview

### Examples

5. **[examples/README.md](./examples/README.md)** - Guide to example tests
6. **[examples/integration-example.test.tsx](./examples/integration-example.test.tsx)** - Complete integration test example

## 🔧 Core Files

### Source Files

- **[setup.ts](./setup.ts)** - Core test utilities for auth state management
- **[test-utils.tsx](./test-utils.tsx)** - React component testing utilities
- **[index.ts](./index.ts)** - Central export point
- **[types.d.ts](./types.d.ts)** - TypeScript type definitions

### Test Files

- **[demo-user-setup.test.ts](./demo-user-setup.test.ts)** - Tests for setup utilities
- **[test-utils.test.tsx](./test-utils.test.tsx)** - Tests for test-utils

## 🚀 Quick Start

### For Unit Tests

```typescript
import { setupDemoStudent, getCurrentAuthUser } from '../tests/setup';

describe('My Feature', () => {
  beforeEach(() => {
    setupDemoStudent();
  });

  it('should work', () => {
    const user = getCurrentAuthUser();
    expect(user?.role).toBe('student');
  });
});
```

### For Component Tests

```typescript
import { renderWithDemoStudent, screen, userEvent } from '../tests/test-utils';

it('should render component', async () => {
  const user = userEvent.setup();
  renderWithDemoStudent(<MyComponent />);

  expect(screen.getByText('Hello')).toBeInTheDocument();
  await user.click(screen.getByText('Button'));
});
```

## 📖 Documentation Navigation

### I want to...

**Learn about the system**
→ Start with [README.md](./README.md)

**Get started quickly**
→ Check [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

**See examples**
→ Look at [examples/integration-example.test.tsx](./examples/integration-example.test.tsx)

**Write quality tests**
→ Use [TEST_CHECKLIST.md](./TEST_CHECKLIST.md)

**Understand implementation**
→ Read [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

**Find specific utilities**
→ Search in [README.md](./README.md#available-utilities)

## 🎯 Common Use Cases

### 1. Test with Demo User

```typescript
setupDemoStudent();
// or
renderWithDemoStudent(<Component />);
```

### 2. Test with Different Roles

```typescript
setupDemoTeacher();
setupDemoParent();
setupDemoAdmin();
```

### 3. Test Unauthenticated

```typescript
setupUnauthenticatedState();
// or
renderUnauthenticated(<Component />);
```

### 4. Test with Custom User

```typescript
const user = createCustomAuthUser({ role: 'admin', isSuperuser: true });
setupCustomUserAuth(user);
```

### 5. Test User Interactions

```typescript
const user = userEvent.setup();
await user.type(input, 'text');
await user.click(button);
```

## 🛠️ Available Utilities

### Setup Utilities (from `setup.ts`)

**User Setup**

- `setupDemoStudent()` - Quick demo student setup
- `setupDemoTeacher()` - Quick demo teacher setup
- `setupDemoParent()` - Quick demo parent setup
- `setupDemoAdmin()` - Quick demo admin setup
- `setupRegularUserAuth(role?, email?)` - Regular user setup
- `setupCustomUserAuth(user, tokens?)` - Custom user setup
- `setupUnauthenticatedState()` - Clear auth state

**User Creation**

- `createDemoUser(role?)` - Create demo user object
- `createDemoTokens()` - Create demo tokens
- `createCustomAuthUser(overrides)` - Create custom user

**State Query**

- `getCurrentAuthUser()` - Get current user
- `getAuthState()` - Get complete auth state
- `isDemoUserInStore()` - Check if demo user

**Helpers**

- `clearAuth()` - Clear all auth state
- `createMockResponse(data, delay?)` - Mock API response
- `createMockError(message, code?)` - Mock error

### Test Utils (from `test-utils.tsx`)

**Render Functions**

- `renderWithDemoStudent(ui, options?)` - Render with demo student
- `renderWithDemoTeacher(ui, options?)` - Render with demo teacher
- `renderWithDemoParent(ui, options?)` - Render with demo parent
- `renderWithDemoAdmin(ui, options?)` - Render with demo admin
- `renderWithRegularUser(ui, role?, email?, options?)` - Render with regular user
- `renderUnauthenticated(ui, options?)` - Render without auth
- `renderWithProviders(ui, options)` - Generic render with providers

**Utilities**

- `screen` - Query utilities from Testing Library
- `userEvent` - User interaction utilities
- `waitFor` - Async waiting
- `waitForCondition(condition, timeout?, interval?)` - Wait for custom condition
- `delay(ms)` - Add delay
- `createMockFile(name?, size?, type?)` - Create mock file
- `createTestQueryClient()` - Create test query client

## 📋 File Organization

```
frontend/tests/
├── README.md                          # Main documentation
├── QUICK_REFERENCE.md                 # Quick recipes
├── TEST_CHECKLIST.md                  # Testing checklist
├── IMPLEMENTATION_SUMMARY.md          # Implementation details
├── INDEX.md                           # This file
├── setup.ts                           # Core utilities
├── test-utils.tsx                     # React utilities
├── index.ts                           # Central exports
├── types.d.ts                         # Type definitions
├── demo-user-setup.test.ts            # Setup tests
├── test-utils.test.tsx                # Test-utils tests
└── examples/
    ├── README.md                      # Examples guide
    └── integration-example.test.tsx   # Integration example
```

## 🎓 Learning Path

1. **Read** [README.md](./README.md) - Understand the system
2. **Review** [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Learn common patterns
3. **Study** [examples/integration-example.test.tsx](./examples/integration-example.test.tsx) - See it in action
4. **Practice** - Write your own tests using the utilities
5. **Reference** [TEST_CHECKLIST.md](./TEST_CHECKLIST.md) - Ensure quality

## ⚡ Key Features

- ✅ **Test Isolation** - Each test starts with clean state
- ✅ **Automatic Cleanup** - No manual cleanup needed
- ✅ **Type Safety** - Full TypeScript support
- ✅ **Easy Setup** - One-line setup for common scenarios
- ✅ **Comprehensive** - Covers all testing needs
- ✅ **Well Documented** - Clear examples and guides
- ✅ **Battle Tested** - Includes own test suite

## 🔍 Finding What You Need

### By Task

| Task            | File                                                                             |
| --------------- | -------------------------------------------------------------------------------- |
| Learn basics    | [README.md](./README.md)                                                         |
| Quick recipe    | [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)                                       |
| See example     | [examples/integration-example.test.tsx](./examples/integration-example.test.tsx) |
| Write test      | [TEST_CHECKLIST.md](./TEST_CHECKLIST.md)                                         |
| Understand code | [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)                         |

### By Role

| Role          | Documentation                                                 |
| ------------- | ------------------------------------------------------------- |
| New developer | Start with [README.md](./README.md)                           |
| Writing tests | Use [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)                |
| Code reviewer | Check [TEST_CHECKLIST.md](./TEST_CHECKLIST.md)                |
| Maintainer    | Read [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) |

### By Question

| Question                      | Answer                                           |
| ----------------------------- | ------------------------------------------------ |
| How do I test with demo user? | [README.md#demo-user-setup](./README.md)         |
| How do I render components?   | [README.md#react-component-testing](./README.md) |
| What utilities are available? | [README.md#available-utilities](./README.md)     |
| How do I write quality tests? | [TEST_CHECKLIST.md](./TEST_CHECKLIST.md)         |
| Where are the examples?       | [examples/](./examples/)                         |

## 🤝 Contributing

When adding new utilities:

1. Add to `setup.ts` or `test-utils.tsx`
2. Add types to `types.d.ts`
3. Write tests
4. Document in `README.md`
5. Add to `QUICK_REFERENCE.md`
6. Update this index if needed

## 📞 Getting Help

1. Search this documentation
2. Check examples in `examples/`
3. Review existing tests in `src/`
4. Ask team members

## 🎉 Success Criteria

You're successfully using the utilities when:

- ✅ Tests run in isolation
- ✅ No manual cleanup needed
- ✅ Auth state setup is one line
- ✅ Component rendering is easy
- ✅ Tests are readable
- ✅ Tests are maintainable

---

**Happy Testing! 🧪**
