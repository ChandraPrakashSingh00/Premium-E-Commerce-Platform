import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['./tests/globalSetup.js'],
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.js'],
    testTimeout: 30_000,
    hookTimeout: 120_000,
    fileParallelism: false,
    env: { NODE_ENV: 'test' },
  },
});
