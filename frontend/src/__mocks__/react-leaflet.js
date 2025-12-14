// Mock for react-leaflet
const React = require('react');

const MapContainer = ({ children, ...props }) => 
  React.createElement('div', { 'data-testid': 'map-container', ...props }, children);

const TileLayer = (props) => 
  React.createElement('div', { 'data-testid': 'tile-layer' });

const Marker = ({ children, ...props }) => 
  React.createElement('div', { 'data-testid': 'marker', ...props }, children);

const Popup = ({ children, ...props }) => 
  React.createElement('div', { 'data-testid': 'popup', ...props }, children);

const useMap = () => ({
  setView: jest.fn(),
  getZoom: () => 10,
  getCenter: () => [0, 0],
});

const useMapEvent = () => jest.fn();
const useMapEvents = () => ({});

module.exports = {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvent,
  useMapEvents,
};

