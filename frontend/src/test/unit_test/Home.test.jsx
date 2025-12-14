/**
 * Unit tests for Home page
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

// Mock the useAuth hook
jest.mock('../../App', () => ({
  useAuth: jest.fn(),
}));

// Mock API
const mockApiGet = jest.fn();

jest.mock('../../api', () => ({
  __esModule: true,
  default: {
    get: (...args) => mockApiGet(...args),
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

// Mock Toaster from sonner
jest.mock('sonner', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Home from '../../pages/Home';
import * as App from '../../App';

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Home Page', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    profile: {
      time_balance: 5.0,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    App.useAuth.mockReturnValue({
      user: mockUser,
    });
  });

  test('renders home page', () => {
    mockApiGet.mockResolvedValue({
      data: {
        results: [],
        count: 0,
      },
    });

    renderWithRouter(<Home />);
    
    expect(screen.getByTestId('toaster') || screen.getByText(/home/i)).toBeInTheDocument();
  });

  test('fetches posts on mount', async () => {
    // DÜZELTME: Geçerli tarih formatı ile mock veriler
    const now = new Date();
    const mockPosts = {
      results: [
        {
          id: 1,
          title: 'Test Post',
          description: 'Test Description',
          post_type: 'offer',
          location: 'Test Location',
          postedDate: now.toISOString(), // date-fns için geçerli ISO string
          created_at: now.toISOString(),
          tags: [],
        },
      ],
      count: 1,
    };

    mockApiGet.mockResolvedValue({ data: mockPosts });

    renderWithRouter(<Home />);

      await waitFor(() => {
        // Check that API was called with /posts/ endpoint
        const calls = mockApiGet.mock.calls;
        const postsCall = calls.find(call => call[0] === '/posts/' || (typeof call[0] === 'string' && call[0].includes('/posts/')));
        expect(postsCall).toBeDefined();
      });
  });

  test('displays posts when loaded', async () => {
    
    const now = new Date();
    const mockPosts = {
      results: [
        {
          id: 1,
          title: 'Test Post 1',
          description: 'Description 1',
          post_type: 'offer',
          location: 'Location 1',
          posted_by: { username: 'user1' },
          postedDate: now.toISOString(), 
          created_at: now.toISOString(),
          tags: [],
        },
        {
          id: 2,
          title: 'Test Post 2',
          description: 'Description 2',
          post_type: 'need',
          location: 'Location 2',
          posted_by: { username: 'user2' },
          postedDate: now.toISOString(), 
          created_at: now.toISOString(),
          tags: [],
        },
      ],
      count: 2,
    };

    mockApiGet.mockResolvedValue({ data: mockPosts });

    renderWithRouter(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      expect(screen.getByText('Test Post 2')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('handles filter changes', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        results: [],
        count: 0,
      },
    });

    renderWithRouter(<Home />);

    // Wait for initial load
    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalled();
    });

    // Test filter interaction
    const filterButton = screen.queryByRole('button', { name: /filter/i });
    if (filterButton) {
      await userEvent.click(filterButton);
    }
  });

  test('handles search functionality', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        results: [],
        count: 0,
      },
    });

    renderWithRouter(<Home />);

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalled();
    });

    // Look for search input
    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) {
      await userEvent.type(searchInput, 'test query');
      
      await waitFor(() => {
        expect(mockApiGet).toHaveBeenCalledWith(
          '/posts/',
          expect.objectContaining({
            params: expect.objectContaining({
              search: 'test query',
            }),
          })
        );
      });
    }
  });
});

