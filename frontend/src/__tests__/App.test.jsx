/**
 * Integration tests for App component
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import api from '../api';

// Mock API
jest.mock('../api', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

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
  });

  test('renders app without crashing', () => {
    api.get.mockResolvedValue({ data: { success: 'CSRF cookie set' } });
    api.get.mockResolvedValueOnce({ data: null }); // Session check
    
    renderApp();
    
    // App should render
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
  });

  test('fetches CSRF token on mount', async () => {
    api.get.mockResolvedValue({ data: { success: 'CSRF cookie set' } });
    api.get.mockResolvedValueOnce({ data: null }); // Session check
    
    renderApp();
    
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/csrf/');
    });
  });

  test('checks session on mount', async () => {
    api.get.mockResolvedValue({ data: { success: 'CSRF cookie set' } });
    api.get.mockResolvedValueOnce({ data: null }); // Session check
    
    renderApp();
    
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/session/');
    });
  });

  test('handles session check failure gracefully', async () => {
    api.get.mockRejectedValueOnce(new Error('Network error'));
    api.get.mockRejectedValueOnce(new Error('Network error'));
    
    renderApp();
    
    // Should not crash
    await waitFor(() => {
      expect(screen.getByTestId('toaster')).toBeInTheDocument();
    });
  });
});


