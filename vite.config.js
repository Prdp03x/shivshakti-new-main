import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The React app calls /api/*; in dev and preview that is proxied to the Express server.
const proxy = { '/api': { target: 'http://localhost:4000', changeOrigin: true } };

export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
});
