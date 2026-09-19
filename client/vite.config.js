import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';

/**
 * public/ is copied verbatim, so the build rewrites robots.txt's `Sitemap:` line
 * to VITE_SITE_URL. Without an absolute, non-local site URL the line is dropped
 * rather than shipping the localhost development value.
 */
const LOCAL_HOST = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/i;

const robotsSitemap = (siteUrl) => {
  let outDir;
  return {
    name: 'robots-sitemap',
    apply: 'build',
    configResolved(resolved) {
      outDir = path.resolve(resolved.root, resolved.build.outDir);
    },
    closeBundle() {
      const file = path.join(outDir, 'robots.txt');
      if (!existsSync(file)) return;
      const base = /^https?:\/\/[^/]+/i.test(siteUrl) && !LOCAL_HOST.test(siteUrl) ? siteUrl.replace(/\/+$/, '') : '';
      const robots = readFileSync(file, 'utf8').replace(/^Sitemap:.*(\r?\n)?/m, base ? `Sitemap: ${base}/sitemap.xml$1` : '');
      writeFileSync(file, robots);
      if (!base) console.warn('[robots-sitemap] VITE_SITE_URL is not a public absolute URL: removed the Sitemap line from robots.txt');
    },
  };
};

export default defineConfig(({ command, mode }) => {
  // A globally exported NODE_ENV=development would otherwise make `vite build`
  // bundle React's development build.
  if (command === 'build') process.env.NODE_ENV = 'production';
  const { VITE_SITE_URL = '' } = loadEnv(mode, fileURLToPath(new URL('.', import.meta.url)), 'VITE_');

  return {
    plugins: [react(), tailwindcss(), robotsSitemap(VITE_SITE_URL)],
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
