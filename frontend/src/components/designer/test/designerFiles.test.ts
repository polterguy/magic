/*
 * Unit tests for where the Web Designer's pages live and the addresses they
 * are served at. Node environment: the file listing is mocked, nothing else
 * touches the network.
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../lib/api', () => ({
  listFilesRecursively: vi.fn(),
}));

import { listFilesRecursively } from '../../../lib/api';
import {
  canonicalUrl,
  companionFile,
  isServed,
  listPages,
  SHARED_ASSET_FILES,
  WEB_ROOT,
} from '../designerFiles';

describe('canonicalUrl', () => {
  it('serves the root index at /', () => {
    expect(canonicalUrl('/etc/www/index.html')).toBe('/');
  });

  it('serves a folder index at the folder, without a trailing slash', () => {
    expect(canonicalUrl('/etc/www/docs/index.html')).toBe('/docs');
  });

  it('drops the extension from any other page, whatever its case', () => {
    expect(canonicalUrl('/etc/www/pricing.html')).toBe('/pricing');
    expect(canonicalUrl('/etc/www/docs/api.HTM')).toBe('/docs/api');
  });

  it('treats index.htm as an ordinary page rather than a folder index', () => {
    expect(canonicalUrl('/etc/www/index.htm')).toBe('/index');
  });
});

describe('companionFile', () => {
  it('swaps the page extension for the companion kind', () => {
    expect(companionFile('/etc/www/index.html', 'js')).toBe('/etc/www/index.js');
    expect(companionFile('/etc/www/docs/pricing.htm', 'css')).toBe('/etc/www/docs/pricing.css');
  });

  it('leaves a file that is not a page untouched', () => {
    expect(companionFile('/etc/www/readme.txt', 'js')).toBe('/etc/www/readme.txt');
  });
});

describe('isServed', () => {
  it('is true for ordinary pages', () => {
    expect(isServed('/etc/www/index.html')).toBe(true);
    expect(isServed('/etc/www/docs/api.html')).toBe(true);
  });

  it('is false for anything inside or named like a hidden folder', () => {
    expect(isServed('/etc/www/.drafts/index.html')).toBe(false);
    expect(isServed('/etc/www/docs/.secret.html')).toBe(false);
  });
});

describe('SHARED_ASSET_FILES', () => {
  it('holds the widget runtime files under the web root', () => {
    expect(WEB_ROOT).toBe('/etc/www');
    expect(SHARED_ASSET_FILES.has('/etc/www/assets/magic-widgets.js')).toBe(true);
    expect(SHARED_ASSET_FILES.has('/etc/www/assets/magic-widgets.css')).toBe(true);
  });
});

describe('listPages', () => {
  it('keeps served pages only, sorted by the URL they are served at', async () => {
    vi.mocked(listFilesRecursively).mockResolvedValueOnce([
      '/etc/www/zebra.html',
      '/etc/www/index.html',
      '/etc/www/site.css',
      '/etc/www/.drafts/draft.html',
      '/etc/www/about.htm',
    ]);
    expect(await listPages()).toEqual([
      '/etc/www/index.html',
      '/etc/www/about.htm',
      '/etc/www/zebra.html',
    ]);
    expect(listFilesRecursively).toHaveBeenCalledWith('/etc/www', false);
  });

  it('is empty when the listing comes back empty', async () => {
    vi.mocked(listFilesRecursively).mockResolvedValueOnce(undefined as unknown as string[]);
    expect(await listPages()).toEqual([]);
  });
});
