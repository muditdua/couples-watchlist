import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './App';
import './lib/install'; // starts listening for the browser's "install app" offer right away
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    <App />
    <Analytics />
  </>
);

// Makes the app installable and quick to open (only on the live site, not while developing)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
}
