import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { refreshSession, type AuthUser as ApiAuthUser } from '../services/authApi.js';
import { clearStoredSession, readStoredSession, writeStoredSession } from './sessionStorage.js';
import { useSessionRefresh } from './useSessionRefresh.js';
import i18n from '../i18n/index.js';
import {
  DEFAULT_DATE_FORMAT_PREFERENCE,
  DEFAULT_LANGUAGE_PREFERENCE,
} from '../types/profilePreferences.js';

export type UserRoleType = 'COLLABORATOR' | 'LEADER' | 'ADMINISTRATOR';

import type { DateFormatPreference, LanguagePreference } from '../types/profilePreferences.js';

type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  firstLoginAt: string;
  lastLoginAt: string;
  roles: UserRoleType[];
  themePreference: 'light' | 'dark';
  githubLogin: string | null;
  languagePreference: LanguagePreference;
  dateFormatPreference: DateFormatPreference;
  leader: { id: string; fullName: string } | null;
};

export type { AuthUser };

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  sessionStatus: 'loading' | 'authenticated' | 'anonymous';
  setSession: (session: { accessToken: string; user: AuthUser }) => void;
  clearSession: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

type AuthProviderProps = {
  children: ReactNode;
  initialSession?: {
    accessToken: string;
    user: AuthUser;
  };
  enableSessionBootstrap?: boolean;
};

export function AuthProvider({
  children,
  initialSession,
  enableSessionBootstrap = true,
}: AuthProviderProps) {
  const [accessToken, setAccessToken] = useState<string | null>(
    initialSession?.accessToken ?? null,
  );
  const [user, setUser] = useState<AuthUser | null>(initialSession?.user ?? null);
  const [sessionStatus, setSessionStatus] = useState<'loading' | 'authenticated' | 'anonymous'>(
    initialSession ? 'authenticated' : 'loading',
  );

  useEffect(() => {
    if (!enableSessionBootstrap) {
      setSessionStatus(accessToken && user ? 'authenticated' : 'anonymous');
      return;
    }

    if (initialSession) {
      setSessionStatus('authenticated');
      return;
    }

    const storedSession = readStoredSession();
    if (!storedSession) {
      setSessionStatus('anonymous');
      return;
    }

    let isMounted = true;

    void refreshSession(storedSession.accessToken)
      .then((nextSession) => {
        if (!isMounted) {
          return;
        }

        setAccessToken(nextSession.accessToken);
        setUser(nextSession.user);
        writeStoredSession({ accessToken: nextSession.accessToken });
        void i18n.changeLanguage(
          nextSession.user.languagePreference ?? DEFAULT_LANGUAGE_PREFERENCE,
        );
        setSessionStatus('authenticated');
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        clearStoredSession();
        setAccessToken(null);
        setUser(null);
        setSessionStatus('anonymous');
      });

    return () => {
      isMounted = false;
    };
  }, [enableSessionBootstrap, initialSession]);

  useSessionRefresh({
    accessToken,
    enabled: enableSessionBootstrap && sessionStatus === 'authenticated',
    onSessionRefreshed: (nextSession: { accessToken: string; user: ApiAuthUser }) => {
      setAccessToken(nextSession.accessToken);
      setUser(nextSession.user);
      writeStoredSession({ accessToken: nextSession.accessToken });
      void i18n.changeLanguage(nextSession.user.languagePreference ?? DEFAULT_LANGUAGE_PREFERENCE);
    },
    onSessionExpired: () => {
      clearStoredSession();
      setAccessToken(null);
      setUser(null);
      setSessionStatus('anonymous');
    },
  });

  const value = useMemo<AuthState>(
    () => ({
      accessToken,
      user,
      sessionStatus,
      setSession: ({ accessToken: nextToken, user: nextUser }) => {
        setAccessToken(nextToken);
        setUser(nextUser);
        writeStoredSession({ accessToken: nextToken });
        void i18n.changeLanguage(nextUser.languagePreference ?? DEFAULT_LANGUAGE_PREFERENCE);
        setSessionStatus('authenticated');
      },
      clearSession: () => {
        setAccessToken(null);
        setUser(null);
        clearStoredSession();
        setSessionStatus('anonymous');
      },
    }),
    [accessToken, sessionStatus, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
