import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/ota-api': {
        target: 'https://zubitechnologies.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ota-api/, '/ota_server/api'),
      },
    },
  },
});
