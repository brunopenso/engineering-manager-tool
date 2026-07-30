import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Plain object config (not a callback) so vitest.config.ts can mergeConfig it.
const env = loadEnv(process.env.MODE ?? process.env.NODE_ENV ?? 'development', process.cwd(), '');
const apiProxyTarget = env.VITE_API_PROXY_TARGET;

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 3000,
    ...(apiProxyTarget
      ? {
          proxy: {
            '/api': {
              target: apiProxyTarget,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api/, ''),
            },
          },
        }
      : {}),
  },
});
