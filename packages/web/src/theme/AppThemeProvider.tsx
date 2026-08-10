import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { enUS, ptBR } from '@mui/material/locale';
import CssBaseline from '@mui/material/CssBaseline';
import { useTranslation } from 'react-i18next';
import { createAppTheme, type ThemeMode } from './appTheme.js';
import { getThemeFromCookie, setThemeCookie } from './themeCookie.js';

type AppThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

type AppThemeProviderProps = {
  children: ReactNode;
};

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const { i18n } = useTranslation();
  const [mode, setModeState] = useState<ThemeMode>(() => getThemeFromCookie());

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    setThemeCookie(nextMode);
  }, []);

  const theme = useMemo(() => {
    const baseTheme = createAppTheme(mode);
    const muiLocale = i18n.language === 'pt-BR' ? ptBR : enUS;
    return createTheme(baseTheme, muiLocale);
  }, [i18n.language, mode]);

  const value = useMemo(
    () => ({
      mode,
      setMode,
    }),
    [mode, setMode],
  );

  return (
    <AppThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppThemeContext.Provider>
  );
}

export function useAppTheme(): AppThemeContextValue {
  const context = useContext(AppThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }

  return context;
}
