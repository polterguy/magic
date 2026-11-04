/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4201,
  },
  test: {
    // Node by default; component tests opt into jsdom per file.
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
  },
});
