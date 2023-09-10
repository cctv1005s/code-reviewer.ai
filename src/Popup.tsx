import React from 'react';
import ReactDOM from 'react-dom/client';
import { Popup } from '@/components/popup/Popup';
import { Toaster } from '@/components/ui/toaster';
import './i18n/i18n';

import './index.css';
import './style/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Toaster />
    <Popup />
  </React.StrictMode>,
);
