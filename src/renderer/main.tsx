/**
 * Main Renderer Entry Point
 * AI-25: Main window layout
 *
 * Entry point for the main application window.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './components/App';
import './styles/main.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
