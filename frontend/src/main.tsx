import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './lib/AuthContext';
import { DialogProvider } from './components/Dialogs';
import { initTheme } from './lib/theme';
import { showToast } from './lib/toast';
import './styles.css';

initTheme();

// A promise nobody handled would otherwise fail silently, so show it.
window.addEventListener('unhandledrejection', event => {
  showToast(event.reason?.message ?? 'Something went wrong', true);
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
