import React from 'react';
import ReactDOM from 'react-dom/client';
import { FloatingRecorder } from './components/FloatingRecorder';
import './styles/floating-recorder.css';

// Mount the FloatingRecorder component
const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <FloatingRecorder />
    </React.StrictMode>
  );
}
