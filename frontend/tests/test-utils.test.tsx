import { describe, it, expect } from 'vitest';
import React from 'react';
import { screen } from '@testing-library/react';
import {
  renderWithDemoStudent,
  renderWithDemoTeacher,
  renderWithDemoParent,
  renderWithDemoAdmin,
  renderWithRegularUser,
  renderUnauthenticated,
  renderWithProviders,
  waitForCondition,
  delay,
  createMockFile,
  createMockChangeEvent,
  createTestQueryClient,
  userEvent,
} from './test-utils';
import { getCurrentAuthUser, getAuthState } from './setup';

// Simple test component
function TestComponent() {
  const authUser = getCurrentAuthUser();

  return (
    <div>
      <h1>Test Component</h1>
      {authUser ? (
        <div>
          <p data-testid="user-email">{authUser.email}</p>
          <p data-testid="user-role">{authUser.role}</p>
          <p data-testid="user-name">{authUser.fullName}</p>
        </div>
      ) : (
        <p data-testid="unauthenticated">Please log in</p>
      )}
    </div>
  );
}

// Form test component
function FormTestComponent() {
  const [values, setValues] = React.useState({ name: '', email: '' });
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <form onSubmit={handleSubmit} data-testid="test-form">
      <input
        type="text"
        name="name"
        value={values.name}
        onChange={(e) => setValues({ ...values, name: e.target.value })}
        placeholder="Name"
      />
      <input
        type="email"
        name="email"
        value={values.email}
        onChange={(e) => setValues({ ...values, email: e.target.value })}
        placeholder="Email"
      />
      <button type="submit">Submit</button>
      {submitted && <p data-testid="submitted">Form submitted</p>}
    </form>
  );
}

describe('Test Utils - Render Functions', () => {
  describe('renderWithDemoStudent', () => {
    it('should render component with demo student auth', () => {
      renderWithDemoStudent(<TestComponent />);

      expect(screen.getByTestId('user-email')).toHaveTextContent('demo@example.com');
      expect(screen.getByTestId('user-role')).toHaveTextContent('student');
    });
  });

  describe('renderWithDemoTeacher', () => {
    it('should render component with demo teacher auth', () => {
      renderWithDemoTeacher(<TestComponent />);

      expect(screen.getByTestId('user-email')).toHaveTextContent('demo@example.com');
      expect(screen.getByTestId('user-role')).toHaveTextContent('teacher');
    });
  });

  describe('renderWithDemoParent', () => {
    it('should render component with demo parent auth', () => {
      renderWithDemoParent(<TestComponent />);

      expect(screen.getByTestId('user-email')).toHaveTextContent('demo@example.com');
      expect(screen.getByTestId('user-role')).toHaveTextContent('parent');
    });
  });

  describe('renderWithDemoAdmin', () => {
    it('should render component with demo admin auth', () => {
      renderWithDemoAdmin(<TestComponent />);

      expect(screen.getByTestId('user-role')).toHaveTextContent('admin');

      const state = getAuthState();
      expect(state.user?.isSuperuser).toBe(true);
    });
  });

  describe('renderWithRegularUser', () => {
    it('should render component with regular user auth', () => {
      renderWithRegularUser(<TestComponent />, 'teacher', 'teacher@school.com');

      expect(screen.getByTestId('user-email')).toHaveTextContent('teacher@school.com');
      expect(screen.getByTestId('user-role')).toHaveTextContent('teacher');
    });

    it('should use default values when not specified', () => {
      renderWithRegularUser(<TestComponent />);

      expect(screen.getByTestId('user-email')).toHaveTextContent('user@example.com');
      expect(screen.getByTestId('user-role')).toHaveTextContent('student');
    });
  });

  describe('renderUnauthenticated', () => {
    it('should render component without authentication', () => {
      renderUnauthenticated(<TestComponent />);

      expect(screen.getByTestId('unauthenticated')).toBeInTheDocument();
      expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
    });
  });

  describe('renderWithProviders', () => {
    it('should render with demo-student authState', () => {
      renderWithProviders(<TestComponent />, { authState: 'demo-student' });

      expect(screen.getByTestId('user-role')).toHaveTextContent('student');
      expect(screen.getByTestId('user-email')).toHaveTextContent('demo@example.com');
    });

    it('should render with unauthenticated authState', () => {
      renderWithProviders(<TestComponent />, { authState: 'unauthenticated' });

      expect(screen.getByTestId('unauthenticated')).toBeInTheDocument();
    });

    it('should render with regular authState', () => {
      renderWithProviders(<TestComponent />, {
        authState: 'regular',
        regularUserRole: 'parent',
        regularUserEmail: 'parent@family.com',
      });

      expect(screen.getByTestId('user-email')).toHaveTextContent('parent@family.com');
      expect(screen.getByTestId('user-role')).toHaveTextContent('parent');
    });
  });
});

describe('Test Utils - Async Utilities', () => {
  describe('waitForCondition', () => {
    it('should wait for condition to be true', async () => {
      let condition = false;
      setTimeout(() => {
        condition = true;
      }, 100);

      await waitForCondition(() => condition);
      expect(condition).toBe(true);
    });

    it('should timeout if condition never becomes true', async () => {
      await expect(waitForCondition(() => false, 100)).rejects.toThrow(
        'Timeout waiting for condition'
      );
    });
  });

  describe('delay', () => {
    it('should delay execution', async () => {
      const startTime = Date.now();
      await delay(100);
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });
  });
});

describe('Test Utils - Mock Creators', () => {
  describe('createMockFile', () => {
    it('should create a mock file with default values', () => {
      const file = createMockFile();

      expect(file.name).toBe('test.pdf');
      expect(file.type).toBe('application/pdf');
      expect(file.size).toBeGreaterThan(0);
    });

    it('should create a mock file with custom values', () => {
      const file = createMockFile('document.docx', 2048, 'application/docx');

      expect(file.name).toBe('document.docx');
      expect(file.type).toBe('application/docx');
    });
  });

  describe('createMockChangeEvent', () => {
    it('should create a change event with value', () => {
      const event = createMockChangeEvent('test value');

      expect(event.target.value).toBe('test value');
    });
  });
});

describe('Test Utils - Query Client', () => {
  describe('createTestQueryClient', () => {
    it('should create a query client with test defaults', () => {
      const queryClient = createTestQueryClient();

      expect(queryClient).toBeDefined();
      expect(queryClient.getDefaultOptions().queries?.retry).toBe(false);
      expect(queryClient.getDefaultOptions().queries?.gcTime).toBe(0);
    });
  });
});

describe('Test Utils - User Interactions', () => {
  describe('userEvent', () => {
    it('should allow typing in input fields', async () => {
      const user = userEvent.setup();
      renderWithDemoStudent(<FormTestComponent />);

      const nameInput = screen.getByPlaceholderText('Name');
      const emailInput = screen.getByPlaceholderText('Email');

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');

      expect(nameInput).toHaveValue('John Doe');
      expect(emailInput).toHaveValue('john@example.com');
    });

    it('should allow form submission', async () => {
      const user = userEvent.setup();
      renderWithDemoStudent(<FormTestComponent />);

      const nameInput = screen.getByPlaceholderText('Name');
      const submitButton = screen.getByText('Submit');

      await user.type(nameInput, 'Test User');
      await user.click(submitButton);

      expect(screen.getByTestId('submitted')).toBeInTheDocument();
    });
  });
});

describe('Test Utils - Component Isolation', () => {
  it('should render components in isolation - test 1', () => {
    renderWithDemoStudent(<TestComponent />);
    expect(screen.getByTestId('user-role')).toHaveTextContent('student');
  });

  it('should render components in isolation - test 2', () => {
    renderWithDemoTeacher(<TestComponent />);
    expect(screen.getByTestId('user-role')).toHaveTextContent('teacher');
  });

  it('should render components in isolation - test 3', () => {
    renderUnauthenticated(<TestComponent />);
    expect(screen.getByTestId('unauthenticated')).toBeInTheDocument();
  });
});
