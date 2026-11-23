/*
 * Finds every feature in src/features/ by its index.ts manifest. The only place that knows
 * features exist: delete a feature's folder and it is gone from the build, with nothing else to
 * edit. The manifests are small — pages, palette sources and shells load lazily — so reading
 * them all up front costs the first paint next to nothing.
 */
import type { FeatureManifest } from '@shared/shell/features';

const modules = import.meta.glob<{ default: FeatureManifest }>('../features/*/index.ts', {
  eager: true,
});

export function discoverFeatures(): FeatureManifest[] {
  return Object.entries(modules).map(([file, module]) => {
    const folder = /features\/([^/]+)\/index\.ts$/.exec(file)?.[1];
    if (module.default.id !== folder) {
      throw new Error(`The manifest in ${file} must have the id "${folder}"`);
    }
    return module.default;
  });
}
