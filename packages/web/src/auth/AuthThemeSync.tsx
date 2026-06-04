import { useEffect } from 'react';
import { useAuth } from './AuthProvider.js';
import { useAppTheme } from '../theme/AppThemeProvider.js';
import { setThemeCookie } from '../theme/themeCookie.js';

export default function AuthThemeSync() {
  const { user, sessionStatus } = useAuth();
  const { setMode } = useAppTheme();

  useEffect(() => {
    if (sessionStatus !== 'authenticated' || !user) {
      return;
    }

    setMode(user.themePreference);
    setThemeCookie(user.themePreference);
  }, [sessionStatus, setMode, user]);

  return null;
}
