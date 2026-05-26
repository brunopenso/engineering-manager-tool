const AUTH_STORAGE_KEY = 'em_tool_auth';

type StoredSession = {
  accessToken: string;
};

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readStoredSession(): StoredSession | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  const serialized = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!serialized) {
    return null;
  }

  try {
    const parsed = JSON.parse(serialized) as Partial<StoredSession>;
    if (typeof parsed.accessToken === 'string' && parsed.accessToken.trim().length > 0) {
      return { accessToken: parsed.accessToken };
    }
  } catch {
    // Ignore malformed storage and treat it as no session.
  }

  return null;
}

export function writeStoredSession(session: StoredSession): void {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession(): void {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export { AUTH_STORAGE_KEY };
