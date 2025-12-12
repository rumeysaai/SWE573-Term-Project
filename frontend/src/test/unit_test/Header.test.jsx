/**
 * Unit tests for Header component
 */
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
jest.mock('../../api', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

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
    App.useAuth.mockReturnValue({
      user: mockUser,
      logout: mockLogout,
    });

    // Mock useNavigate
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    }));
  });

  test('renders header with user menu when authenticated', () => {
    renderWithRouter(<Header />);
    
    // Check if username is displayed
    expect(screen.getByText(/testuser/i)).toBeInTheDocument();
  });

  test('renders navigation links', () => {
    renderWithRouter(<Header />);
    
    // Check for navigation links
    expect(screen.getByText(/home/i)).toBeInTheDocument();
  });

  test('shows admin link when user is admin', () => {
    const adminUser = { ...mockUser, is_staff: true };
    App.useAuth.mockReturnValue({
      user: adminUser,
      logout: mockLogout,
    });

    renderWithRouter(<Header />);
    
    // Admin panel link should be visible
    expect(screen.getByText(/admin/i)).toBeInTheDocument();
  });

  test('does not show admin link when user is not admin', () => {
    renderWithRouter(<Header />);
    
    // Admin panel link should not be visible for non-admin users
    const adminLink = screen.queryByText(/admin panel/i);
    expect(adminLink).not.toBeInTheDocument();
  });

  test('handles logout when logout button is clicked', async () => {
    renderWithRouter(<Header />);
    
    // Find and click logout button
    const menuButton = screen.getByRole('button', { name: /testuser/i });
    fireEvent.click(menuButton);
    
    await waitFor(() => {
      const logoutButton = screen.getByText(/logout/i);
      fireEvent.click(logoutButton);
    });

    expect(mockLogout).toHaveBeenCalled();
  });
});

