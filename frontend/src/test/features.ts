/*
 * For a test of one feature that links to another: registers a stand-in for each linked feature
 * this build lacks, for the duration of the test file, so the test holds whether or not those
 * features are present. Call it at the top level of the test file.
 */
import { type FeatureManifest, features, registerFeatures } from '@core/features';
import { afterAll, beforeAll } from 'vitest';

export function withStandInFeatures(standIns: { id: string; path: string }[]) {
  let real: readonly FeatureManifest[] = [];
  beforeAll(() => {
    real = features();
    const missing = standIns.filter(standIn => !real.some(feature => feature.id === standIn.id));
    registerFeatures([...real, ...missing]);
  });
  afterAll(() => registerFeatures([...real]));
}
