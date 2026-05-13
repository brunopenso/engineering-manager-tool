import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  firstLoginAt: string;
  lastLoginAt: string;
};

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  setSession: (session: { accessToken: string; user: AuthUser }) => void;
  clearSession: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const value = useMemo<AuthState>(
    () => ({
      accessToken,
      user,
      setSession: ({ accessToken: nextToken, user: nextUser }) => {
        setAccessToken(nextToken);
        setUser(nextUser);
      },
      clearSession: () => {
        setAccessToken(null);
        setUser(null);
      },
    }),
    [accessToken, user],
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
