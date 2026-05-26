import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, type AuthUser } from '../auth/AuthProvider.js';
import { AppThemeProvider } from '../theme/AppThemeProvider.js';

export const testUser: AuthUser = {
  id: 'user-1',
  email: 'manager@example.com',
  fullName: 'Engineering Manager',
  firstLoginAt: '2026-01-01T00:00:00.000Z',
  lastLoginAt: '2026-01-01T00:00:00.000Z',
  roles: ['COLLABORATOR'],
};

export const testAdminUser: AuthUser = {
  ...testUser,
  id: 'admin-1',
  email: 'admin@example.com',
  fullName: 'System Admin',
  roles: ['COLLABORATOR', 'ADMINISTRATOR'],
};

type RenderOptions = {
  initialPath?: string;
  isAuthenticated?: boolean;
  user?: AuthUser;
  enableSessionBootstrap?: boolean;
};

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
    <AppThemeProvider>
      <GoogleOAuthProvider clientId="test-client-id">
        <MemoryRouter initialEntries={[initialPath]}>
          <AuthProvider
            initialSession={initialSession}
            enableSessionBootstrap={enableSessionBootstrap}
          >
            {ui}
          </AuthProvider>
        </MemoryRouter>
      </GoogleOAuthProvider>
    </AppThemeProvider>,
  );
}
