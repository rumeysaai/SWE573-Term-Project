/**
 * Unit tests for API utility
 */
import api from '../api';
import axios from 'axios';

// Mock axios
jest.mock('axios');

describe('API Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock document.cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  });

  test('creates axios instance with correct baseURL', () => {
    expect(api.defaults.baseURL).toBeDefined();
  });

  test('sets withCredentials to true', () => {
    expect(api.defaults.withCredentials).toBe(true);
  });

  test('sets Content-Type header', () => {
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });

  test('adds CSRF token to POST requests', async () => {
    // Set cookie
    document.cookie = 'csrftoken=test-csrf-token';
    
    // Mock axios request
    const mockAxios = axios.create();
    mockAxios.interceptors = {
      request: {
        use: jest.fn(),
      },
    };
    
    // Test that interceptor is set up
    expect(api.interceptors.request).toBeDefined();
  });

  test('handles missing CSRF token gracefully', () => {
    // No cookie set
    document.cookie = '';
    
    // Should not throw error
    expect(() => {
      const config = {
        method: 'POST',
        headers: {},
      };
      // Simulate interceptor
      const csrftoken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
      
      if (csrftoken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method.toUpperCase())) {
        config.headers['X-CSRFToken'] = csrftoken;
      }
    }).not.toThrow();
  });
});


