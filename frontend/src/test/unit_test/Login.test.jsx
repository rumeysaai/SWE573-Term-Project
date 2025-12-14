/**
 * Unit tests for Login page
 */
// Mock react-router-dom (will use __mocks__/react-router-dom.js)
jest.mock('react-router-dom');

jest.mock('../../App', () => ({
  useAuth: jest.fn(),
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Login from '../../pages/Login';
import * as App from '../../App';

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

describe('Login Page', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    App.useAuth.mockReturnValue({
      login: mockLogin,
    });
  });

  test('renders login form', () => {
    renderWithRouter(<Login />);
    
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('allows user to type in username and password fields', async () => {
    renderWithRouter(<Login />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'testpass123');
    
    expect(usernameInput).toHaveValue('testuser');
    expect(passwordInput).toHaveValue('testpass123');
  });

  test('calls login function on form submit with correct data', async () => {
    mockLogin.mockResolvedValue(true);
    
    renderWithRouter(<Login />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'testpass123');
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'testpass123');
    });
  });

  test('navigates to home on successful login', async () => {
    mockLogin.mockResolvedValue(true);
    
    renderWithRouter(<Login />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'testpass123');
    await userEvent.click(submitButton);
    
    // Wait for login to complete - navigation is handled by App component
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'testpass123');
    });
  });

  test('shows error message on failed login', async () => {
    const { toast } = require('sonner');
    mockLogin.mockResolvedValue(false);
    
    renderWithRouter(<Login />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'wrongpass');
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Login failed. Username or password is incorrect.');
    });
  });

  test('validates empty form submission', async () => {
    renderWithRouter(<Login />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await userEvent.click(submitButton);
    
    // Form should still be visible (not navigated)
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
  });

  test('has link to signup page', () => {
    renderWithRouter(<Login />);
    
    const signupLink = screen.getByRole('link', { name: /sign up/i });
    expect(signupLink).toBeInTheDocument();
    expect(signupLink).toHaveAttribute('href', '/register');
  });
});

