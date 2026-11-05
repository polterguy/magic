// @vitest-environment jsdom
/*
 * Unit tests for reading and writing the head values the Meta panel edits:
 * title, language, canonical link and name/property meta tags.
 */

import { beforeEach, describe, expect, it } from 'vitest';

import { type Home, readMeta, writeMeta } from '../metaTags';

let doc: Document;

beforeEach(() => {
  doc = new DOMParser().parseFromString(
    '<html lang="en"><head><title>Old</title>' +
      '<link rel="canonical" href="https://a.test/">' +
      '<meta name="description" content="Desc">' +
      '<meta property="og:title" content="OG"></head><body></body></html>',
    'text/html',
  );
});

const bare = () =>
  new DOMParser().parseFromString('<html><head></head><body></body></html>', 'text/html');

describe('readMeta', () => {
  it('reads each kind of home', () => {
    expect(readMeta(doc, { at: 'title' })).toBe('Old');
    expect(readMeta(doc, { at: 'lang' })).toBe('en');
    expect(readMeta(doc, { at: 'canonical' })).toBe('https://a.test/');
    expect(readMeta(doc, { at: 'name', key: 'description' })).toBe('Desc');
    expect(readMeta(doc, { at: 'property', key: 'og:title' })).toBe('OG');
  });

  it('answers empty for everything that is missing', () => {
    const empty = bare();
    const homes: Home[] = [
      { at: 'title' },
      { at: 'lang' },
      { at: 'canonical' },
      { at: 'name', key: 'description' },
      { at: 'property', key: 'og:title' },
    ];
    homes.forEach(home => expect(readMeta(empty, home)).toBe(''));
  });

  it('does not confuse name with property', () => {
    expect(readMeta(doc, { at: 'name', key: 'og:title' })).toBe('');
    expect(readMeta(doc, { at: 'property', key: 'description' })).toBe('');
  });

  it('answers empty for a meta tag with no content attribute', () => {
    const odd = new DOMParser().parseFromString(
      '<html><head><meta name="x"></head></html>',
      'text/html',
    );
    expect(readMeta(odd, { at: 'name', key: 'x' })).toBe('');
  });
});

describe('writeMeta', () => {
  it('updates existing values in place', () => {
    writeMeta(doc, { at: 'title' }, 'New');
    writeMeta(doc, { at: 'canonical' }, 'https://b.test/');
    writeMeta(doc, { at: 'name', key: 'description' }, 'Other');
    writeMeta(doc, { at: 'property', key: 'og:title' }, 'OG2');
    expect(doc.title).toBe('New');
    expect(doc.querySelectorAll('title')).toHaveLength(1);
    expect(readMeta(doc, { at: 'canonical' })).toBe('https://b.test/');
    expect(readMeta(doc, { at: 'name', key: 'description' })).toBe('Other');
    expect(readMeta(doc, { at: 'property', key: 'og:title' })).toBe('OG2');
    expect(doc.querySelectorAll('meta')).toHaveLength(2);
  });

  it('trims the value it stores', () => {
    writeMeta(doc, { at: 'title' }, '  Spaced  ');
    expect(doc.title).toBe('Spaced');
  });

  it('creates the tag when it is not there yet', () => {
    const empty = bare();
    writeMeta(empty, { at: 'title' }, 'T');
    writeMeta(empty, { at: 'canonical' }, '/c');
    writeMeta(empty, { at: 'name', key: 'robots' }, 'noindex');
    writeMeta(empty, { at: 'property', key: 'og:type' }, 'website');
    expect(empty.title).toBe('T');
    expect(empty.querySelector('link[rel="canonical"]')!.getAttribute('href')).toBe('/c');
    expect(empty.querySelector('meta[name="robots"]')!.getAttribute('content')).toBe('noindex');
    expect(empty.querySelector('meta[property="og:type"]')!.getAttribute('content')).toBe(
      'website',
    );
    expect(empty.head.children).toHaveLength(4);
  });

  it('removes the tag when the field is emptied', () => {
    writeMeta(doc, { at: 'title' }, '');
    writeMeta(doc, { at: 'canonical' }, '   ');
    writeMeta(doc, { at: 'name', key: 'description' }, '');
    writeMeta(doc, { at: 'property', key: 'og:title' }, '');
    expect(doc.head.children).toHaveLength(0);
  });

  it('does nothing when emptying a tag that is not there', () => {
    const empty = bare();
    writeMeta(empty, { at: 'name', key: 'robots' }, '');
    expect(empty.head.children).toHaveLength(0);
  });

  it('sets and clears the language as an attribute, never removing <html>', () => {
    writeMeta(doc, { at: 'lang' }, ' da ');
    expect(doc.documentElement.getAttribute('lang')).toBe('da');
    writeMeta(doc, { at: 'lang' }, '');
    expect(doc.documentElement.hasAttribute('lang')).toBe(false);
    expect(doc.documentElement).not.toBeNull();
  });

  it('creates nothing when there is no head to put it in', () => {
    const headless = bare();
    headless.head.remove();
    writeMeta(headless, { at: 'title' }, 'T');
    expect(headless.querySelector('title')).toBeNull();
  });
});
