// Self-hosted UI fonts for the Profile font picker. Each only registers @font-face rules, so a
// font's file is downloaded only once something is drawn in it.
import '@fontsource-variable/inter';
import '@fontsource-variable/roboto';
import '@fontsource-variable/ibm-plex-sans';
import './styles/app.css';

import { AuthProvider } from '@shared/auth/AuthContext';
import { showError } from '@shared/lib/errors';
import { initFont } from '@shared/lib/font';
import { initTheme } from '@shared/lib/theme';
import { registerFeatures } from '@shared/shell/features';
import { DialogProvider } from '@shared/ui/Dialogs';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { discoverFeatures } from './lib/registry';
import AppRoutes from './routes/AppRoutes';

registerFeatures(discoverFeatures());
initTheme();
initFont();

// A promise nobody handled would otherwise fail silently, so show it.
globalThis.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  showError(event.reason);
});

ReactDOM.createRoot(document.querySelector('#root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DialogProvider>
          <AppRoutes />
        </DialogProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
