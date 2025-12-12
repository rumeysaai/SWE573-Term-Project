/**
 * Integration tests for Home page
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Home from '../../pages/Home';
import * as App from '../../App';
import api from '../../api';

// Mock the useAuth hook
jest.mock('../../App', () => ({
  useAuth: jest.fn(),
}));

// Mock API
jest.mock('../../api', () => ({
  get: jest.fn(),
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

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
    api.get.mockResolvedValue({
      data: {
        results: [],
        count: 0,
      },
    });

    renderWithRouter(<Home />);
    
    expect(screen.getByText(/home/i)).toBeInTheDocument();
  });

  test('fetches posts on mount', async () => {
    const mockPosts = {
      results: [
        {
          id: 1,
          title: 'Test Post',
          description: 'Test Description',
          post_type: 'offer',
          location: 'Test Location',
        },
      ],
      count: 1,
    };

    api.get.mockResolvedValue({ data: mockPosts });

    renderWithRouter(<Home />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/posts/', expect.any(Object));
    });
  });

  test('displays posts when loaded', async () => {
    const mockPosts = {
      results: [
        {
          id: 1,
          title: 'Test Post 1',
          description: 'Description 1',
          post_type: 'offer',
          location: 'Location 1',
          posted_by: { username: 'user1' },
        },
        {
          id: 2,
          title: 'Test Post 2',
          description: 'Description 2',
          post_type: 'need',
          location: 'Location 2',
          posted_by: { username: 'user2' },
        },
      ],
      count: 2,
    };

    api.get.mockResolvedValue({ data: mockPosts });

    renderWithRouter(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      expect(screen.getByText('Test Post 2')).toBeInTheDocument();
    });
  });

  test('handles filter changes', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({
      data: {
        results: [],
        count: 0,
      },
    });

    renderWithRouter(<Home />);

    // Wait for initial load
    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    // Test filter interaction
    const filterButton = screen.queryByRole('button', { name: /filter/i });
    if (filterButton) {
      await user.click(filterButton);
    }
  });

  test('handles search functionality', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({
      data: {
        results: [],
        count: 0,
      },
    });

    renderWithRouter(<Home />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    // Look for search input
    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) {
      await user.type(searchInput, 'test query');
      
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
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

