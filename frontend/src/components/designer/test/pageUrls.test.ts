/*
 * Unit tests for the URL rules behind making a new page. Pure string work.
 */

import { describe, it, expect } from 'vitest';
import { blankPage, fileForUrl, tidyUrl, urlProblem } from '../pageUrls';

describe('tidyUrl', () => {
  it('adds a leading slash and drops trailing ones', () => {
    expect(tidyUrl('pricing')).toBe('/pricing');
    expect(tidyUrl('/pricing/')).toBe('/pricing');
    expect(tidyUrl('  docs/api//  ')).toBe('/docs/api');
  });

  it('keeps / as /, and turns nothing into /', () => {
    expect(tidyUrl('/')).toBe('/');
    expect(tidyUrl('')).toBe('/');
  });

  it('leaves a space in the middle alone', () => {
    expect(tidyUrl('/pri cing')).toBe('/pri cing');
  });

  it('turns a run of slashes alone into the empty string', () => {
    expect(tidyUrl('//')).toBe('');
  });
});

describe('fileForUrl', () => {
  it('maps a URL onto a flat file', () => {
    expect(fileForUrl('/pricing')).toBe('/etc/www/pricing.html');
    expect(fileForUrl('docs/api/')).toBe('/etc/www/docs/api.html');
  });

  it('maps / onto the index page', () => {
    expect(fileForUrl('/')).toBe('/etc/www/index.html');
    expect(fileForUrl('')).toBe('/etc/www/index.html');
  });
});

describe('urlProblem', () => {
  it('asks for a name when nothing is typed', () => {
    expect(urlProblem('', [])).toBe('Give the page a name.');
    expect(urlProblem('   ', [])).toBe('Give the page a name.');
  });

  it('accepts / unless the home page exists', () => {
    expect(urlProblem('/', [])).toBeNull();
    expect(urlProblem('/', ['/'])).toBe('There is already a page at /.');
  });

  it('refuses empty steps', () => {
    expect(urlProblem('/a//b', [])).toBe('That has an empty step in it — check the slashes.');
    expect(urlProblem('//', [])).toBe('That has an empty step in it — check the slashes.');
  });

  it('refuses steps starting with a dot', () => {
    expect(urlProblem('/docs/.hidden', [])).toBe('A name starting with a dot is never served.');
  });

  it('refuses characters outside letters, numbers, dashes and underscores', () => {
    expect(urlProblem('/pri cing', [])).toBe('Letters, numbers, dashes and underscores only.');
    expect(urlProblem('/page.html', [])).toBe('Letters, numbers, dashes and underscores only.');
  });

  it('refuses a URL that is taken, compared after tidying', () => {
    expect(urlProblem('pricing/', ['/pricing'])).toBe('There is already a page at /pricing.');
  });

  it('accepts a good URL', () => {
    expect(urlProblem('/docs/api-keys_2', ['/pricing'])).toBeNull();
  });
});

describe('blankPage', () => {
  it('titles the page from the last step of the URL', () => {
    const html = blankPage('/docs/api-keys');
    expect(html).toContain('<title>Api keys</title>');
    expect(html).toContain('<h1>Api keys</h1>');
  });

  it('titles the home page Home', () => {
    expect(blankPage('/')).toContain('<title>Home</title>');
  });

  it('links no companions unless asked', () => {
    const html = blankPage('/pricing');
    expect(html).not.toContain('<link rel="stylesheet"');
    expect(html).not.toContain('<script');
  });

  it('links companions next to the page when asked', () => {
    const html = blankPage('/docs/pricing', { css: true, js: true });
    expect(html).toContain('<link rel="stylesheet" href="/docs/pricing.css">');
    expect(html).toContain('<script src="/docs/pricing.js"></script>');
  });
});
