/**
 * UI interaction tests
 */
// Mock react-router-dom (will use __mocks__/react-router-dom.js)
jest.mock('react-router-dom');

// Mock the useAuth hook
jest.mock('../../App', () => ({
  useAuth: jest.fn(),
}));

// HATA ÇÖZÜMÜ: TagSelector Mock
jest.mock('../../components/TagSelector', () => {
  const React = require('react');
  return function DummyTagSelector({ value, onChange, placeholder, isMulti, isDisabled, showAllTagsOnOpen }) {
    return React.createElement('input', {
      'data-testid': 'tag-selector',
      placeholder: placeholder,
      value: Array.isArray(value) ? value.map(v => v.label || v.name).join(', ') : '',
      onChange: (e) => {
        if (onChange) {
          onChange([{ value: e.target.value, label: e.target.value }]);
        }
      },
      disabled: isDisabled,
    });
  };
});

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Login from '../../pages/Login';
import Signup from '../../pages/Signup';
import * as App from '../../App';


// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock API for TagSelector
const mockApiGet = jest.fn();
const mockApiPost = jest.fn();

jest.mock('../../api', () => ({
  __esModule: true,
  default: {
    get: (...args) => mockApiGet(...args),
    post: (...args) => mockApiPost(...args),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    defaults: {
      baseURL: 'http://localhost:8000/api',
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    },
  },
}));

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('UI Interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiGet.mockResolvedValue({ data: [] }); // For TagSelector
  });

  describe('Login Form Interactions', () => {
    const mockLogin = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
      App.useAuth.mockReturnValue({
        login: mockLogin,
      });
    });

    test('user can fill and submit login form', async () => {
      mockLogin.mockResolvedValue(true);

      renderWithRouter(<Login />);

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Fill form
      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'password123');

      // Submit form
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
      });
    });

    test('form validation prevents empty submission', async () => {
      renderWithRouter(<Login />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);

      // Form should still be visible (validation prevents submission)
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    test('user can navigate to signup from login', async () => {
      renderWithRouter(<Login />);

      const signupLink = screen.getByRole('link', { name: /sign up/i });
      await userEvent.click(signupLink);

      expect(signupLink).toHaveAttribute('href', '/register');
    });
  });

  describe('Signup Form Interactions', () => {
    const mockSetUser = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
      App.useAuth.mockReturnValue({
        setUser: mockSetUser,
      });
    });

    test('user can fill and submit signup form', async () => {
      mockApiPost.mockResolvedValue({
        data: {
          id: 1,
          username: 'newuser',
        },
      });

      renderWithRouter(<Signup />);
      
      // Wait for form to be ready
      await waitFor(() => {
        expect(screen.getByLabelText(/User Name/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      const usernameInput = screen.getByLabelText(/User Name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      // Fill form
      await userEvent.type(usernameInput, 'newuser');
      await userEvent.type(emailInput, 'newuser@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.type(confirmPasswordInput, 'password123');

      // Submit form
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockApiPost).toHaveBeenCalled();
      });
    });

    test('password mismatch shows error', async () => {
      const { toast } = require('sonner');

      renderWithRouter(<Signup />);

      const passwordInput = screen.getByLabelText(/password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      await userEvent.type(passwordInput, 'password123');
      await userEvent.type(confirmPasswordInput, 'differentpass');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    test('user can navigate to login from signup', async () => {
      renderWithRouter(<Signup />);

      const loginLink = screen.getByRole('link', { name: /Sign In/i });
      await userEvent.click(loginLink);

      expect(loginLink).toHaveAttribute('href', '/login');
    });
  });

  describe('Form Error Handling', () => {
    test('displays error message on login failure', async () => {
      const mockLogin = jest.fn().mockResolvedValue(false);
      const { toast } = require('sonner');

      App.useAuth.mockReturnValue({
        login: mockLogin,
      });

      renderWithRouter(<Login />);

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await userEvent.type(usernameInput, 'wronguser');
      await userEvent.type(passwordInput, 'wrongpass');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Login failed. Username or password is incorrect.'
        );
      });
    });

    test('displays error message on signup failure', async () => {
      const { toast } = require('sonner');

      mockApiPost.mockRejectedValue({
        response: {
          data: { error: 'Username already taken' },
        },
      });

      App.useAuth.mockReturnValue({
        setUser: jest.fn(),
      });

      renderWithRouter(<Signup />);
      
      // Wait for form to be ready
      await waitFor(() => {
        expect(screen.getByLabelText(/User Name/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      const usernameInput = screen.getByLabelText(/User Name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      await userEvent.type(usernameInput, 'existinguser');
      await userEvent.type(emailInput, 'existing@example.com');
      await userEvent.type(passwordInput, 'pass123');
      await userEvent.type(confirmPasswordInput, 'pass123');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });
});

