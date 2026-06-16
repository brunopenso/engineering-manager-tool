import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import type { ReactElement } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, type AuthUser } from '../auth/AuthProvider.js';
import AuthLocaleSync from '../auth/AuthLocaleSync.js';
import { AppThemeProvider } from '../theme/AppThemeProvider.js';
import i18n from '../i18n/index.js';
import {
  DEFAULT_DATE_FORMAT_PREFERENCE,
  DEFAULT_LANGUAGE_PREFERENCE,
} from '../types/profilePreferences.js';

export const testUser: AuthUser = {
  id: 'user-1',
  email: 'manager@example.com',
  fullName: 'Engineering Manager',
  firstLoginAt: '2026-01-01T00:00:00.000Z',
  lastLoginAt: '2026-01-01T00:00:00.000Z',
  roles: ['COLLABORATOR'],
  themePreference: 'light',
  githubLogin: null,
  languagePreference: DEFAULT_LANGUAGE_PREFERENCE,
  dateFormatPreference: DEFAULT_DATE_FORMAT_PREFERENCE,
};

export const testAdminUser: AuthUser = {
  ...testUser,
  id: 'admin-1',
  email: 'admin@example.com',
  fullName: 'System Admin',
  roles: ['COLLABORATOR', 'ADMINISTRATOR'],
};

export const testLeaderUser: AuthUser = {
  ...testUser,
  id: 'leader-1',
  email: 'leader@example.com',
  fullName: 'Team Leader',
  roles: ['COLLABORATOR', 'LEADER'],
};

type RenderOptions = {
  initialPath?: string;
  isAuthenticated?: boolean;
  user?: AuthUser;
  enableSessionBootstrap?: boolean;
};

export function renderWithI18n(ui: ReactElement) {
  return render(
    <I18nextProvider i18n={i18n}>
      <AppThemeProvider>{ui}</AppThemeProvider>
    </I18nextProvider>,
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions,
) {
  const initialPath = options?.initialPath ?? '/';
  const isAuthenticated = options?.isAuthenticated ?? false;
  const user = options?.user ?? testUser;
  const enableSessionBootstrap = options?.enableSessionBootstrap ?? false;

  const initialSession = isAuthenticated
    ? {
        accessToken: 'token-123',
        user,
      }
    : undefined;

  return render(
    <I18nextProvider i18n={i18n}>
      <AppThemeProvider>
        <GoogleOAuthProvider clientId="test-client-id">
          <MemoryRouter initialEntries={[initialPath]}>
            <AuthProvider
              initialSession={initialSession}
              enableSessionBootstrap={enableSessionBootstrap}
            >
              <AuthLocaleSync />
              {ui}
            </AuthProvider>
          </MemoryRouter>
        </GoogleOAuthProvider>
      </AppThemeProvider>
    </I18nextProvider>,
  );
}
