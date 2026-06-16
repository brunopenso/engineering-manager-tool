import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';
import { vi } from 'vitest';

configure({ asyncUtilTimeout: 10_000 });

vi.mock('@mui/material', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@mui/material')>();

  return {
    ...actual,
    useMediaQuery: () => false,
  };
});
