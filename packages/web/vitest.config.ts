import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      globals: true,
      include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
      testTimeout: 10_000,
      pool: 'forks',
    },
  }),
);
