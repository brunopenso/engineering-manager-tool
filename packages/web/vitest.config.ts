import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

// Node 25+ enables experimental Web Storage by default. Without a
// --localstorage-file path, globalThis.localStorage is an incomplete stub that
// shadows jsdom's Storage and breaks window.localStorage in tests.
// See https://github.com/vitest-dev/vitest/issues/8757
const nodeMajor = Number.parseInt(process.versions.node.split('.')[0] ?? '0', 10);
const execArgv =
  nodeMajor >= 25
    ? [
        '--localstorage-file',
        path.resolve(os.tmpdir(), `em-tool-web-vitest-${process.pid}.localstorage`),
      ]
    : [];

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
      execArgv,
    },
  }),
);
