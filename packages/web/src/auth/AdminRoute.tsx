import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider.js';
import { isAdministrator } from './roleGuards.js';
import { DEFAULT_APP_ROUTE } from '../routes/shellOptions.js';

type AdminRouteProps = {
  children: ReactNode;
};

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, sessionStatus } = useAuth();

  if (sessionStatus === 'loading') {
    return null;
  }

  if (!isAdministrator(user)) {
    return <Navigate to={DEFAULT_APP_ROUTE} replace />;
  }

  return children;
}
