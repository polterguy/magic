/*
 * Unit tests for the path helpers shared by the Hyper IDE page and its tree.
 *
 * Run with `npm run test`. Node environment only.
 */

import { describe, expect, it } from 'vitest';

import { nameOf, parentOf } from '../paths';

describe('parentOf', () => {
  it('gives the folder a file lives in', () => {
    expect(parentOf('/modules/foo/bar.hl')).toBe('/modules/foo/');
    expect(parentOf('/bar.hl')).toBe('/');
  });

  it('gives the folder above a folder', () => {
    expect(parentOf('/modules/foo/')).toBe('/modules/');
    expect(parentOf('/modules/')).toBe('/');
  });

  it('gives the empty string for the root and for paths without a slash', () => {
    expect(parentOf('/')).toBe('');
    expect(parentOf('bar.hl')).toBe('');
    expect(parentOf('')).toBe('');
  });
});

describe('nameOf', () => {
  it('gives the name of a file', () => {
    expect(nameOf('/modules/foo/bar.hl')).toBe('bar.hl');
  });

  it('gives the name of a folder without its trailing slash', () => {
    expect(nameOf('/modules/foo/')).toBe('foo');
  });

  it('gives the whole string for a path without a slash', () => {
    expect(nameOf('bar.hl')).toBe('bar.hl');
  });

  it('gives the empty string for the root', () => {
    expect(nameOf('/')).toBe('');
    expect(nameOf('')).toBe('');
  });
});
