import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider.js';
import type { ReactNode } from 'react';
import { hasValidShellSession } from './sessionGuards';

type ProtectedRouteProps = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { accessToken, user } = useAuth();

  if (!hasValidShellSession(accessToken, user)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
