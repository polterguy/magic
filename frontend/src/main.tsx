// Self-hosted UI fonts for the Profile font picker. Each only registers @font-face rules, so a
// font's file is downloaded only once something is drawn in it.
import '@fontsource-variable/inter';
import '@fontsource-variable/roboto';
import '@fontsource-variable/ibm-plex-sans';
import './styles.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { DialogProvider } from './components/Dialogs';
import { AuthProvider } from './lib/AuthContext';
import { showError } from './lib/errors';
import { initFont } from './lib/font';
import { initTheme } from './lib/theme';

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
