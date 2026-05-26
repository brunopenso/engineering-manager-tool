import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider.js';
import { isLeader } from './roleGuards.js';
import { DEFAULT_APP_ROUTE } from '../routes/shellOptions.js';

type LeaderRouteProps = {
  children: ReactNode;
};

export function LeaderRoute({ children }: LeaderRouteProps) {
  const { user, sessionStatus } = useAuth();

  if (sessionStatus === 'loading') {
    return null;
  }

  if (!isLeader(user)) {
    return <Navigate to={DEFAULT_APP_ROUTE} replace />;
  }

  return children;
}
