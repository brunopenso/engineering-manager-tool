import { useEffect, useRef } from 'react';
import { AuthApiError, refreshSession, type AuthUser } from '../services/authApi.js';

const REFRESH_COOLDOWN_MS = 15 * 60 * 1000;

type UseSessionRefreshInput = {
  accessToken: string | null;
  enabled: boolean;
  onSessionRefreshed: (session: { accessToken: string; user: AuthUser }) => void;
  onSessionExpired: () => void;
};

export function useSessionRefresh({
  accessToken,
  enabled,
  onSessionRefreshed,
  onSessionExpired,
}: UseSessionRefreshInput): void {
  const lastRefreshAtRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || !accessToken) {
      return;
    }
    const token = accessToken;

    async function refreshNow(): Promise<void> {
      const now = Date.now();
      if (now - lastRefreshAtRef.current < REFRESH_COOLDOWN_MS) {
        return;
      }

      lastRefreshAtRef.current = now;

      try {
        const nextSession = await refreshSession(token);
        onSessionRefreshed(nextSession);
      } catch (error) {
        if (error instanceof AuthApiError) {
          onSessionExpired();
        }
      }
    }

    function handleVisibilityChange(): void {
      if (document.visibilityState === 'visible') {
        void refreshNow();
      }
    }

    function handleFocus(): void {
      void refreshNow();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [accessToken, enabled, onSessionExpired, onSessionRefreshed]);
}
