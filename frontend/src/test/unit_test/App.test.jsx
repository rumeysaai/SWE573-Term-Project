/**
 * Integration tests for App component
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
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';
import api from '../../api';

// Mock toast
jest.mock('sonner', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}));

const renderApp = () => {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiGet.mockResolvedValue({ data: { success: 'CSRF cookie set' } });
  });

  test('renders app without crashing', () => {
    mockApiGet.mockResolvedValueOnce({ data: null }); // Session check
    
    renderApp();
    
    // App should render
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
  });

  test('fetches CSRF token on mount', async () => {
    mockApiGet.mockResolvedValueOnce({ data: null }); // Session check
    
    renderApp();
    
    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith('/csrf/');
    });
  });

  test('checks session on mount', async () => {
    mockApiGet.mockResolvedValueOnce({ data: null }); // Session check
    
    renderApp();
    
    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith('/session/');
    });
  });

  test('handles session check failure gracefully', async () => {
    mockApiGet.mockRejectedValueOnce(new Error('Network error'));
    mockApiGet.mockRejectedValueOnce(new Error('Network error'));
    
    renderApp();
    
    // Should not crash
    await waitFor(() => {
      expect(screen.getByTestId('toaster')).toBeInTheDocument();
    });
  });
});

