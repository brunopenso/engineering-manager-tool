import type { AuthUser } from './AuthProvider.js';

export function hasAuthToken(accessToken: string | null): boolean {
  return Boolean(accessToken);
}

export function hasUserEmail(user: AuthUser | null): boolean {
  return Boolean(user?.email?.trim());
}

export function hasValidShellSession(accessToken: string | null, user: AuthUser | null): boolean {
  return hasAuthToken(accessToken) && hasUserEmail(user);
}
