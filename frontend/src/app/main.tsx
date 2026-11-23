// Self-hosted UI fonts for the Profile font picker. Each only registers @font-face rules, so a
// font's file is downloaded only once something is drawn in it.
import '@fontsource-variable/inter';
import '@fontsource-variable/roboto';
import '@fontsource-variable/ibm-plex-sans';
import './styles.css';

import { AuthProvider } from '@core/AuthContext';
import { showError } from '@core/errors';
import { registerFeatures } from '@core/features';
import { initFont } from '@core/font';
import { initTheme } from '@core/theme';
import { DialogProvider } from '@shared/ui/Dialogs';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { discoverFeatures } from './registry';

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
          <App />
        </DialogProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
