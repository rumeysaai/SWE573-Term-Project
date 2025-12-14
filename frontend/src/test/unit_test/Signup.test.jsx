/**
 * Unit and Integration tests for Signup page
 */
// Mock react-router-dom (will use __mocks__/react-router-dom.js)
jest.mock('react-router-dom');

// Mock the useAuth hook
jest.mock('../../App', () => ({
  useAuth: jest.fn(),
}));

// 2. ve 6. HATA ÇÖZÜMÜ: TagSelector Mock
// Gerçek TagSelector yerine basit bir input render et
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

// Mock API
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

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Signup from '../../pages/Signup';
import * as App from '../../App';

// Setup default API mocks
beforeEach(() => {
  mockApiGet.mockResolvedValue({ data: [] }); // For TagSelector
});

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
    mockApiGet.mockResolvedValue({ data: [] }); // For TagSelector
    App.useAuth.mockReturnValue({
      setUser: mockSetUser,
    });
  });

  test('renders signup form with all fields', () => {
    renderWithRouter(<Signup />);
    
    expect(screen.getByLabelText(/User Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  test('allows user to fill in all form fields', async () => {
    renderWithRouter(<Signup />);
    
    // Wait for form to render
    await waitFor(() => {
      expect(screen.getByLabelText(/User Name/i)).toBeInTheDocument();
    });
    
    const usernameInput = screen.getByLabelText(/User Name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    
    await userEvent.type(usernameInput, 'newuser');
    await userEvent.type(emailInput, 'newuser@example.com');
    await userEvent.type(passwordInput, 'newpass123');
    await userEvent.type(confirmPasswordInput, 'newpass123');
    
    expect(usernameInput).toHaveValue('newuser');
    expect(emailInput).toHaveValue('newuser@example.com');
    expect(passwordInput).toHaveValue('newpass123');
    expect(confirmPasswordInput).toHaveValue('newpass123');
  });

  test('validates password mismatch', async () => {
    const { toast } = require('sonner');
    renderWithRouter(<Signup />);
    
    // Wait for form to render
    await waitFor(() => {
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });
    
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

  test('submits form with valid data', async () => {
    const { toast } = require('sonner');
    
    mockApiPost.mockResolvedValue({
      data: {
        id: 1,
        username: 'newuser',
        email: 'newuser@example.com',
      },
    });
    
    renderWithRouter(<Signup />);
    
    // Wait for form to render
    await waitFor(() => {
      expect(screen.getByLabelText(/User Name/i)).toBeInTheDocument();
    });
    
    const usernameInput = screen.getByLabelText(/User Name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    
    await userEvent.type(usernameInput, 'newuser');
    await userEvent.type(emailInput, 'newuser@example.com');
    await userEvent.type(passwordInput, 'newpass123');
    await userEvent.type(confirmPasswordInput, 'newpass123');
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/register/', expect.objectContaining({
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'newpass123',
        password2: 'newpass123',
      }));
    });
  });

  test('handles API errors on signup', async () => {
    const { toast } = require('sonner');
    
    mockApiPost.mockRejectedValue({
      response: {
        data: { error: 'Username already taken' },
      },
    });
    
    renderWithRouter(<Signup />);
    
    // Wait for form to render
    await waitFor(() => {
      expect(screen.getByLabelText(/User Name/i)).toBeInTheDocument();
    });
    
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

  test('has link to login page', () => {
    renderWithRouter(<Signup />);
    
    const loginLink = screen.getByRole('link', { name: /Sign In/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});

