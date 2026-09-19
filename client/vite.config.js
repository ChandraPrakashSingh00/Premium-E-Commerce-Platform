import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ command }) => {
  // A globally exported NODE_ENV=development would otherwise make `vite build`
  // bundle React's development build.
  if (command === 'build') process.env.NODE_ENV = 'production';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: { port: 5173 },
    preview: { port: 4173 },
    build: {
      target: 'es2022',
      sourcemap: false,
      chunkSizeWarningLimit: 700,
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.js'],
      css: false,
      include: ['src/**/*.test.{js,jsx}'],
    },
  };
});
