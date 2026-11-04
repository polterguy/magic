/*
 * Unit tests for the links a page carries to its stylesheets and scripts.
 * Node environment: the document is a small stand-in with just the calls
 * these functions make.
 */

import { describe, expect, it } from 'vitest';

import { bumpAsset, ensureRequiredAssets, syncSharedAssetVersions } from '../assets';

interface FakeElement {
  tag: string;
  attributes: Record<string, string>;
  getAttribute: (name: string) => string | null;
  setAttribute: (name: string, value: string) => void;
}

function element(tag: string, attributes: Record<string, string>): FakeElement {
  return {
    tag,
    attributes,
    getAttribute: name => attributes[name] ?? null,
    setAttribute: (name, value) => {
      attributes[name] = value;
    },
  };
}

// A document holding the given links and scripts, served from [baseURI].
function fakeDoc(baseURI: string, links: string[], scripts: string[]) {
  const head: FakeElement[] = links.map(href => element('link', { rel: 'stylesheet', href }));
  const body: FakeElement[] = scripts.map(src => element('script', { src }));
  const doc = {
    baseURI,
    head: { append: (child: FakeElement) => head.push(child) },
    body: { append: (child: FakeElement) => body.push(child) },
    createElement: (tag: string) => element(tag, {}),
    querySelectorAll: (selector: string) =>
      selector === 'script[src]' ? body.filter(one => one.tag === 'script') : head,
  };
  return { doc: doc as unknown as Document, head, body };
}

describe('ensureRequiredAssets', () => {
  it('links what is missing, versioned when a version is known', () => {
    const { doc, head, body } = fakeDoc('https://site.test/page', [], []);
    const added = ensureRequiredAssets(doc, {
      stylesheets: ['/assets/magic-widgets.css'],
      scripts: ['/assets/magic-widgets.js', '/local.js'],
    });
    expect(added).toBe(true);
    expect(head.map(one => one.attributes)).toEqual([
      { rel: 'stylesheet', href: '/assets/magic-widgets.css?v=2' },
    ]);
    expect(body.map(one => one.attributes.src)).toEqual([
      '/assets/magic-widgets.js?v=3',
      '/local.js',
    ]);
  });

  it('matches existing links by path, so a relative spelling counts', () => {
    const { doc, head, body } = fakeDoc(
      'https://site.test/docs/page',
      ['../assets/magic-widgets.css?v=1'],
      ['../assets/magic-widgets.js'],
    );
    const added = ensureRequiredAssets(doc, {
      stylesheets: ['/assets/magic-widgets.css'],
      scripts: ['/assets/magic-widgets.js'],
    });
    expect(added).toBe(false);
    expect(head).toHaveLength(1);
    expect(body).toHaveLength(1);
  });

  it('does nothing for a block that requires nothing', () => {
    const { doc } = fakeDoc('https://site.test/page', [], []);
    expect(ensureRequiredAssets(doc, undefined)).toBe(false);
  });
});

describe('bumpAsset', () => {
  it('bumps the version on the one file that was written, rooting its address', () => {
    const { doc, head, body } = fakeDoc(
      'https://site.test/docs/page',
      ['../site.css?v=2', 'other.css'],
      ['/site.css'],
    );
    bumpAsset(doc, '/etc/www/site.css');
    expect(head[0].attributes.href).toBe('/site.css?v=3');
    expect(head[1].attributes.href).toBe('other.css');
    // A script with the same path is the same file, as far as the path goes.
    expect(body[0].attributes.src).toBe('/site.css?v=1');
  });

  it('starts at 1 when there is no usable version', () => {
    const { doc, head } = fakeDoc('https://site.test/', ['a.css', 'a.css?v=abc', 'a.css?v=0'], []);
    bumpAsset(doc, '/etc/www/a.css');
    expect(head.map(one => one.attributes.href)).toEqual([
      '/a.css?v=1',
      '/a.css?v=1',
      '/a.css?v=1',
    ]);
  });

  it('leaves links on other origins alone', () => {
    const { doc, head } = fakeDoc('https://site.test/', ['https://cdn.test/a.css'], []);
    bumpAsset(doc, '/etc/www/a.css');
    expect(head[0].attributes.href).toBe('https://cdn.test/a.css');
  });
});

describe('syncSharedAssetVersions', () => {
  it('moves shared files onto their canonical version', () => {
    const { doc, head, body } = fakeDoc(
      'https://site.test/',
      ['/assets/magic-widgets.css'],
      ['/assets/magic-widgets.js?v=1'],
    );
    syncSharedAssetVersions(doc);
    expect(head[0].attributes.href).toBe('/assets/magic-widgets.css?v=2');
    expect(body[0].attributes.src).toBe('/assets/magic-widgets.js?v=3');
  });

  it('leaves current shared links and the page own files untouched', () => {
    const { doc, head, body } = fakeDoc(
      'https://site.test/',
      ['../assets/magic-widgets.css?v=2', 'site.css?v=7'],
      [],
    );
    syncSharedAssetVersions(doc);
    expect(head.map(one => one.attributes.href)).toEqual([
      '../assets/magic-widgets.css?v=2',
      'site.css?v=7',
    ]);
    expect(body).toHaveLength(0);
  });

  it('also moves a link that is AHEAD of the canonical version back to it', () => {
    const { doc, body } = fakeDoc('https://site.test/', [], ['/assets/magic-widgets.js?v=9']);
    syncSharedAssetVersions(doc);
    expect(body[0].attributes.src).toBe('/assets/magic-widgets.js?v=3');
  });
});
