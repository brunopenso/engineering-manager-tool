import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.mock('@mui/material', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@mui/material')>();

  return {
    ...actual,
    useMediaQuery: () => false,
  };
});
