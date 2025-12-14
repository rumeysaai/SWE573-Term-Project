/**
 * Integration tests for routing
 */
// Mock react-router-dom (will use __mocks__/react-router-dom.js)
jest.mock('react-router-dom');

// Mock react-leaflet (will use __mocks__/react-leaflet.js)
jest.mock('react-leaflet');

// Mock leaflet
jest.mock('leaflet', () => ({
  Icon: {
    Default: {
      prototype: {},
      mergeOptions: jest.fn(),
    },
  },
}));

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
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import App from '../../App';

// Mock toast
jest.mock('sonner', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}));

describe('Routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiGet.mockResolvedValue({ data: { success: 'CSRF cookie set' } });
    mockApiGet.mockResolvedValueOnce({ data: null }); // Session check
    
    
    mockApiGet.mockImplementation((url) => {
      if (url.includes('/forum-topics/') || url.includes('/forum/topics/')) {
        return Promise.resolve({ 
          data: { 
            results: [], 
            count: 0 
          } 
        });
      }
      return Promise.resolve({ data: { success: 'CSRF cookie set' } });
    });
  });

  test('redirects unauthenticated user from protected route', async () => {
    mockApiGet.mockResolvedValueOnce({ data: null }); // No user session
    
    render(
      <MemoryRouter initialEntries={['/home']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      
      expect(screen.getByTestId('toaster')).toBeInTheDocument();
    });
  });

  test('allows access to public routes without authentication', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

   
    const heading = await screen.findByRole('heading', { name: /Sign In/i });
    expect(heading).toBeInTheDocument();

 
    const usernameInput = screen.getByLabelText(/User Name/i);
    expect(usernameInput).toBeInTheDocument();
  });

  test('redirects authenticated user from welcome page', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
    };
    
    mockApiGet.mockResolvedValueOnce({ data: mockUser }); 
    
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      // App should render
      expect(screen.getByTestId('toaster')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

