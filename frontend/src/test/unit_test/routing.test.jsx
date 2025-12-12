/**
 * Integration tests for routing
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import App from '../../App';
import api from '../../api';

// Mock API
jest.mock('../api', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

// Mock toast
jest.mock('sonner', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}));

describe('Routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockResolvedValue({ data: { success: 'CSRF cookie set' } });
    api.get.mockResolvedValueOnce({ data: null }); // Session check
  });

  test('redirects unauthenticated user from protected route', async () => {
    api.get.mockResolvedValue({ data: null }); // No user session
    
    render(
      <MemoryRouter initialEntries={['/home']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Should redirect to welcome page
      expect(window.location.pathname).toBe('/');
    });
  });

  test('allows access to public routes without authentication', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/login/i)).toBeInTheDocument();
    });
  });

  test('redirects authenticated user from welcome page', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
    };
    
    api.get.mockResolvedValue({ data: mockUser }); // User is authenticated
    
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Should redirect to home
      expect(window.location.pathname).toBe('/home');
    }, { timeout: 3000 });
  });
});

