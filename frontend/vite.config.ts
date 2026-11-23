/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// One alias per layer, mirrored in tsconfig.json's paths. Imports that cross a layer use them.
const layer = (name: string) => fileURLToPath(new URL(`./src/${name}`, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@app': layer('app'),
      '@shared': layer('shared'),
      '@features': layer('features'),
    },
  },
  server: {
    port: 4201,
  },
  test: {
    // Node by default; component tests opt into jsdom per file.
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      // Every source file counts, tested or not, so the figure SonarCloud shows is the real one.
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.*', 'src/**/test/**', 'src/test/**', 'src/**/*.d.ts'],
      // lcovonly: the plain lcov reporter also writes an HTML report, which nothing reads.
      reporter: ['text-summary', 'lcovonly'],
    },
  },
});
