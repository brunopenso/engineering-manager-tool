import { createTheme } from '@mui/material/styles';

export type ThemeMode = 'light' | 'dark';

const sharedPalette = {
  primary: {
    main: '#1976d2',
  },
  secondary: {
    main: '#009688',
  },
};

const sharedTypography = {
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
};

/** Hairline under field labels — distinct in each theme. */
export const fieldLabelLineColor: Record<ThemeMode, string> = {
  light: sharedPalette.primary.main,
  dark: sharedPalette.secondary.main,
};

export function createAppTheme(mode: ThemeMode) {
  if (mode === 'dark') {
    return createTheme({
      palette: {
        mode: 'dark',
        ...sharedPalette,
      },
      typography: sharedTypography,
    });
  }

  return createTheme({
    palette: {
      mode: 'light',
      ...sharedPalette,
      background: {
        default: '#fafafa',
        paper: '#ffffff',
      },
    },
    typography: sharedTypography,
  });
}
