import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import App from './App.js';
import { AuthProvider } from './auth/AuthProvider.js';
import { AppThemeProvider } from './theme/AppThemeProvider.js';
import i18n from './i18n/config.js';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <AppThemeProvider>
        <GoogleOAuthProvider clientId={googleClientId}>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </GoogleOAuthProvider>
      </AppThemeProvider>
    </I18nextProvider>
  </StrictMode>,
);
