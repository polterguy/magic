/*
 * Shared vitest setup. Tests run in Node by default; component tests opt into a DOM with a
 * `// @vitest-environment jsdom` comment at the top of the file.
 */
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
