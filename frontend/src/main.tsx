import './styles.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { DialogProvider } from './components/Dialogs';
import { AuthProvider } from './lib/AuthContext';
import { showError } from './lib/errors';
import { initTheme } from './lib/theme';

initTheme();

// A promise nobody handled would otherwise fail silently, so show it.
window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  showError(event.reason);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
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
