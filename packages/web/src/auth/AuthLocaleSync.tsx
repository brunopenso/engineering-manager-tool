import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthProvider.js';

export default function AuthLocaleSync() {
  const { user, sessionStatus } = useAuth();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (sessionStatus !== 'authenticated' || !user) {
      return;
    }

    if (i18n.language !== user.languagePreference) {
      void i18n.changeLanguage(user.languagePreference);
    }
  }, [i18n, sessionStatus, user]);

  return null;
}
