/**
 * Unit and Integration tests for Login page
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Login from '../Login';
import * as App from '../../App';

// Mock the useAuth hook
jest.mock('../../App', () => ({
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
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('allows user to type in username and password fields', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Login />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'testpass123');
    
    expect(usernameInput).toHaveValue('testuser');
    expect(passwordInput).toHaveValue('testpass123');
  });

  test('calls login function on form submit with correct data', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(true);
    
    renderWithRouter(<Login />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'testpass123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'testpass123');
    });
  });

  test('navigates to home on successful login', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(true);
    
    renderWithRouter(<Login />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'testpass123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('shows error message on failed login', async () => {
    const user = userEvent.setup();
    const { toast } = require('sonner');
    mockLogin.mockResolvedValue(false);
    
    renderWithRouter(<Login />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'wrongpass');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Login failed. Username or password is incorrect.');
    });
  });

  test('validates empty form submission', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Login />);
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    await user.click(submitButton);
    
    // Form should still be visible (not navigated)
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
  });

  test('has link to signup page', () => {
    renderWithRouter(<Login />);
    
    const signupLink = screen.getByRole('link', { name: /sign up/i });
    expect(signupLink).toBeInTheDocument();
    expect(signupLink).toHaveAttribute('href', '/signup');
  });
});


