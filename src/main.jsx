import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { initFacebookPixel } from './services/pixelService';
import { Analytics } from '@vercel/analytics/react';

// Initialize Meta Pixel for Facebook Ads conversion tracking
initFacebookPixel();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>
);

