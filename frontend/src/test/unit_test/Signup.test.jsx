/**
 * Unit and Integration tests for Signup page
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Signup from '../../pages/Signup';
import * as App from '../../App';
import api from '../../api';

// Mock the useAuth hook
jest.mock('../../App', () => ({
  useAuth: jest.fn(),
}));

// Mock API
jest.mock('../../api', () => ({
  post: jest.fn(),
  get: jest.fn(),
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

describe('Signup Page', () => {
  const mockSetUser = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    App.useAuth.mockReturnValue({
      setUser: mockSetUser,
    });
  });

  test('renders signup form with all fields', () => {
    renderWithRouter(<Signup />);
    
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  test('allows user to fill in all form fields', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Signup />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    
    await user.type(usernameInput, 'newuser');
    await user.type(emailInput, 'newuser@example.com');
    await user.type(passwordInput, 'newpass123');
    await user.type(confirmPasswordInput, 'newpass123');
    
    expect(usernameInput).toHaveValue('newuser');
    expect(emailInput).toHaveValue('newuser@example.com');
    expect(passwordInput).toHaveValue('newpass123');
    expect(confirmPasswordInput).toHaveValue('newpass123');
  });

  test('validates password mismatch', async () => {
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

  test('submits form with valid data', async () => {
    const user = userEvent.setup();
    const { toast } = require('sonner');
    
    api.post.mockResolvedValue({
      data: {
        id: 1,
        username: 'newuser',
        email: 'newuser@example.com',
      },
    });
    
    renderWithRouter(<Signup />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    
    await user.type(usernameInput, 'newuser');
    await user.type(emailInput, 'newuser@example.com');
    await user.type(passwordInput, 'newpass123');
    await user.type(confirmPasswordInput, 'newpass123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/register/', expect.objectContaining({
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'newpass123',
        password2: 'newpass123',
      }));
    });
  });

  test('handles API errors on signup', async () => {
    const user = userEvent.setup();
    const { toast } = require('sonner');
    
    api.post.mockRejectedValue({
      response: {
        data: { error: 'Username already taken' },
      },
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

  test('has link to login page', () => {
    renderWithRouter(<Signup />);
    
    const loginLink = screen.getByRole('link', { name: /log in/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});

