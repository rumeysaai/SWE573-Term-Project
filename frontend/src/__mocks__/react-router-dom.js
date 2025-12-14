// Mock for react-router-dom
import React from 'react';

export const BrowserRouter = ({ children }) => React.createElement('div', { 'data-testid': 'browser-router' }, children);
export const MemoryRouter = ({ children }) => React.createElement('div', { 'data-testid': 'memory-router' }, children);
export const Routes = ({ children }) => React.createElement('div', null, children);
export const Route = ({ element }) => element;
export const Navigate = ({ to }) => React.createElement('div', { 'data-testid': 'navigate' }, to);
export const Link = ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children);

export const useNavigate = () => jest.fn();
export const useParams = () => ({});
export const useLocation = () => ({ pathname: '/', search: '', hash: '', state: null });
export const useSearchParams = () => [new URLSearchParams(), jest.fn()];
