import { afterEach, describe, expect, it } from 'vitest';

import {
  featureHref,
  type FeatureManifest,
  features,
  hasFeature,
  registerFeatures,
} from '../features';

const real = features();
afterEach(() => registerFeatures([...real]));

const Icon = () => null as unknown as React.JSX.Element;

describe('the feature registry', () => {
  it('orders features by their navigation position, those without one last', () => {
    const list: FeatureManifest[] = [
      { id: 'shell-only' },
      { id: 'second', path: '/b', nav: { label: 'B', Icon, order: 20 } },
      { id: 'first', path: '/a', nav: { label: 'A', Icon, order: 10 } },
    ];
    registerFeatures(list);
    expect(features().map(feature => feature.id)).toEqual(['first', 'second', 'shell-only']);
  });

  it('refuses the same id twice', () => {
    expect(() => registerFeatures([{ id: 'x' }, { id: 'x' }])).toThrow(/registered twice/);
  });

  it('answers whether a feature is part of the build', () => {
    registerFeatures([{ id: 'log', path: '/log' }]);
    expect(hasFeature('log')).toBe(true);
    expect(hasFeature('sql')).toBe(false);
  });
});

describe('featureHref', () => {
  it("builds an address under the feature's path", () => {
    registerFeatures([{ id: 'log', path: '/log' }]);
    expect(featureHref('log')).toBe('/log');
    expect(featureHref('log', '?id=4')).toBe('/log?id=4');
  });

  it('is null for a feature that is missing, or has no page', () => {
    registerFeatures([{ id: 'chat' }]);
    expect(featureHref('log')).toBeNull();
    expect(featureHref('chat')).toBeNull();
  });
});
