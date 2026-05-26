import { beforeEach, describe, expect, it } from 'vitest';
import {
  AUTH_STORAGE_KEY,
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
} from '../auth/sessionStorage.js';

describe('auth session storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('writes and reads stored access token', () => {
    writeStoredSession({ accessToken: 'token-123' });

    expect(readStoredSession()).toEqual({ accessToken: 'token-123' });
  });

  it('returns null for malformed stored payloads', () => {
    window.localStorage.setItem(AUTH_STORAGE_KEY, '{invalid-json');

    expect(readStoredSession()).toBeNull();
  });

  it('clears stored session', () => {
    writeStoredSession({ accessToken: 'token-123' });
    clearStoredSession();

    expect(readStoredSession()).toBeNull();
  });
});
