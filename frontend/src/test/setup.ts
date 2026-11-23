/*
 * Shared vitest setup. Tests run in Node by default; component tests opt into a DOM with a
 * `// @vitest-environment jsdom` comment at the top of the file.
 *
 * Every feature in this build is registered, as app/main.tsx does, so links between features
 * render the way they do in the app — and disappear when a feature's folder is removed.
 */
import '@testing-library/jest-dom/vitest';

import { discoverFeatures } from '@app/lib/registry';
import { registerFeatures } from '@shared/shell/features';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

registerFeatures(discoverFeatures());

afterEach(() => {
  cleanup();
});
