import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
    proxy: {
      '/api/home-ai': {
        target: 'http://127.0.0.1:17321',
        changeOrigin: false,
        rewrite: (path) => path.replace(/^\/api\/home-ai/, '/api'),
        configure(proxy) {
          proxy.on('error', (_error, _request, response) => {
            if (!('writeHead' in response) || response.headersSent) return;
            const body = JSON.stringify({ error: { code: 'gateway-unavailable', message: 'Home AI gateway is not running.' } });
            response.writeHead(503, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
            response.end(body);
          });
        },
      },
    },
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
