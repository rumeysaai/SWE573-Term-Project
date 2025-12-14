/**
 * Unit tests for API service
 */
import api from '../../api';

describe('API Service', () => {
  test('should have correct base configuration', () => {
    
    expect(api).toBeDefined();
    expect(api.defaults).toBeDefined();
    expect(api.defaults.withCredentials).toBe(true);
    expect(api.defaults.baseURL).toBeDefined();
  });

  test('should have request interceptor configured', () => {
    
    expect(api.interceptors).toBeDefined();
    expect(api.interceptors.request).toBeDefined();
    expect(api.interceptors.request.use).toBeDefined();
  });

  test('should have response interceptor configured', () => {
    
    expect(api.interceptors).toBeDefined();
    expect(api.interceptors.response).toBeDefined();
  });

  test('should have get method', () => {
  
    expect(typeof api.get).toBe('function');
  });

  test('should have post method', () => {
    
    expect(typeof api.post).toBe('function');
  });

  test('should have correct headers configuration', () => {
   
    expect(api.defaults.headers).toBeDefined();
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });
});
