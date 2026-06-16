import '@testing-library/jest-dom/vitest';
import { beforeEach, vi } from 'vitest';
import i18n from '../i18n/config.js';
import { DEFAULT_LANGUAGE_PREFERENCE } from '../types/profilePreferences.js';

beforeEach(async () => {
  await i18n.changeLanguage(DEFAULT_LANGUAGE_PREFERENCE);
});

vi.mock('@mui/material', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@mui/material')>();

  return {
    ...actual,
    useMediaQuery: () => false,
  };
});
