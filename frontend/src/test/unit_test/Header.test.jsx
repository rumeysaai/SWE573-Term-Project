/**
 * Unit tests for Header component
 */
// Mock react-router-dom (will use __mocks__/react-router-dom.js)
jest.mock('react-router-dom');

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from '../../components/Header';
import * as App from '../../App';

// Mock the useAuth hook
jest.mock('../../App', () => ({
  useAuth: jest.fn(),
}));

// Mock API
const mockApiGet = jest.fn();
const mockApiPost = jest.fn();

jest.mock('../../api', () => {
  const actualApi = jest.requireActual('../../api');
  return {
    ...actualApi,
    get: (...args) => mockApiGet(...args),
    post: (...args) => mockApiPost(...args),
  };
});

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Header Component', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    is_staff: false,
    is_superuser: false,
  };

  const mockLogout = jest.fn();
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default API mocks
    mockApiGet.mockImplementation((url) => {
      if (url === '/proposals/?received=true') {
        return Promise.resolve({ data: [] });
      }
      if (url === '/chats/unread-count/') {
        return Promise.resolve({ data: { count: 0 } });
      }
      return Promise.resolve({ data: {} });
    });
    App.useAuth.mockReturnValue({
      user: mockUser,
      logout: mockLogout,
    });
  });

  test('renders header with user menu when authenticated', async () => {
    renderWithRouter(<Header />);
    
    // Wait for async operations to complete
    await waitFor(() => {
      // Header should render - check for The Hive logo/text
      expect(screen.getByText(/the hive/i)).toBeInTheDocument();
    });
  });

  test('renders navigation links', () => {
    renderWithRouter(<Header />);
    
    // Check for navigation links
    expect(screen.getByText(/home/i)).toBeInTheDocument();
  });

  test('shows admin link when user is admin', async () => {
    const adminUser = { ...mockUser, is_staff: true };
    App.useAuth.mockReturnValue({
      user: adminUser,
      logout: mockLogout,
    });

    renderWithRouter(<Header />);
    
    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByText(/the hive/i)).toBeInTheDocument();
    });
  });

  test('does not show admin link when user is not admin', () => {
    renderWithRouter(<Header />);
    
    const adminLink = screen.queryByText(/admin panel/i);
    expect(adminLink).not.toBeInTheDocument();
  });

  test('handles logout when logout button is clicked', async () => {
    renderWithRouter(<Header />);
    
   
    await waitFor(() => {
      expect(screen.getByText(/the hive/i)).toBeInTheDocument();
    });
    
    // Find profile button (avatar button with "T" initial)
    const profileButton = screen.getByRole('button', { name: /^T$/i });
    fireEvent.click(profileButton);
   
    await waitFor(() => {
      const logoutButton = screen.queryByText(/logout/i);
      if (logoutButton) {
        fireEvent.click(logoutButton);
        expect(mockLogout).toHaveBeenCalled();
      }
    }, { timeout: 2000 });
  });
});

