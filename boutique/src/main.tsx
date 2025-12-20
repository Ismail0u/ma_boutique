import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css'
import App from './App.tsx'

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { trackStandaloneLaunch } from './utils/vercelAnalytics';

trackStandaloneLaunch();

// Render l'app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      {/* ✅ Analytics & Speed Insights */}
      <Analytics />
      <SpeedInsights />
    </BrowserRouter>
  </React.StrictMode>
);
