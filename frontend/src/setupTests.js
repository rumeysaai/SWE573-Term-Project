// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';


global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const mockDefaults = {
  baseURL: '',
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
};

const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() },
  },
  defaults: mockDefaults,
};

jest.mock('axios', () => {
  const mockAxios = jest.fn(() => mockAxiosInstance);
  mockAxios.create = jest.fn(() => mockAxiosInstance);
  // Make defaults writable so api.js can set withCredentials
  Object.defineProperty(mockAxios, 'defaults', {
    value: mockDefaults,
    writable: true,
    configurable: true,
  });
  
  return {
    default: mockAxios,
    create: mockAxios.create,
    get: jest.fn(),
    post: jest.fn(),
  };
});
