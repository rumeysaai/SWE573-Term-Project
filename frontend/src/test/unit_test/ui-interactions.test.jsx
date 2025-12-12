/**
 * UI interaction tests
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Login from '../../pages/Login';
import Signup from '../../pages/Signup';
import * as App from '../../App';

// Mock the useAuth hook
jest.mock('../App', () => ({
  useAuth: jest.fn(),
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('UI Interactions', () => {
  describe('Login Form Interactions', () => {
    const mockLogin = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
      App.useAuth.mockReturnValue({
        login: mockLogin,
      });
    });

    test('user can fill and submit login form', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue(true);

      renderWithRouter(<Login />);

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      // Fill form
      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'password123');

      // Submit form
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
      });
    });

    test('form validation prevents empty submission', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Login />);

      const submitButton = screen.getByRole('button', { name: /login/i });
      await user.click(submitButton);

      // Form should still be visible (validation prevents submission)
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    test('user can navigate to signup from login', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Login />);

      const signupLink = screen.getByRole('link', { name: /sign up/i });
      await user.click(signupLink);

      expect(signupLink).toHaveAttribute('href', '/signup');
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
      const user = userEvent.setup();
      const api = require('../../api').default;
      api.post = jest.fn().mockResolvedValue({
        data: {
          id: 1,
          username: 'newuser',
        },
      });

      renderWithRouter(<Signup />);

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      // Fill form
      await user.type(usernameInput, 'newuser');
      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');

      // Submit form
      await user.click(submitButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalled();
      });
    });

    test('password mismatch shows error', async () => {
      const user = userEvent.setup();
      const { toast } = require('sonner');

      renderWithRouter(<Signup />);

      const passwordInput = screen.getByLabelText(/password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'differentpass');
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    test('user can navigate to login from signup', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Signup />);

      const loginLink = screen.getByRole('link', { name: /log in/i });
      await user.click(loginLink);

      expect(loginLink).toHaveAttribute('href', '/login');
    });
  });

  describe('Form Error Handling', () => {
    test('displays error message on login failure', async () => {
      const user = userEvent.setup();
      const mockLogin = jest.fn().mockResolvedValue(false);
      const { toast } = require('sonner');

      App.useAuth.mockReturnValue({
        login: mockLogin,
      });

      renderWithRouter(<Login />);

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(usernameInput, 'wronguser');
      await user.type(passwordInput, 'wrongpass');
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Login failed. Username or password is incorrect.'
        );
      });
    });

    test('displays error message on signup failure', async () => {
      const user = userEvent.setup();
      const api = require('../../api').default;
      const { toast } = require('sonner');

      api.post = jest.fn().mockRejectedValue({
        response: {
          data: { error: 'Username already taken' },
        },
      });

      App.useAuth.mockReturnValue({
        setUser: jest.fn(),
      });

      renderWithRouter(<Signup />);

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      await user.type(usernameInput, 'existinguser');
      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'pass123');
      await user.type(confirmPasswordInput, 'pass123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });
});

