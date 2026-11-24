/*
 * The registry must find every folder in src/features/. A glob that matches nothing is no error to
 * Vite, so a wrong path would otherwise start the app with no pages and no navigation.
 */
import { describe, expect, it } from 'vitest';

import { discoverFeatures } from '../lib/registry';

// Every file of every feature, unloaded: only the paths are read.
const featureFiles = Object.keys(import.meta.glob('../../features/*/**'));

describe('discoverFeatures', () => {
  it('finds a manifest for every feature folder', () => {
    const folders = [
      ...new Set(featureFiles.map(file => /features\/([^/]+)\//.exec(file)?.[1] ?? '')),
    ].sort((a, b) => a.localeCompare(b));
    const ids = discoverFeatures()
      .map(feature => feature.id)
      .sort((a, b) => a.localeCompare(b));
    expect(folders.length).toBeGreaterThan(0);
    expect(ids).toEqual(folders);
  });
});
