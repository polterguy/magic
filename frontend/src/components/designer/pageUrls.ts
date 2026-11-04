/*
 * The URL rules behind making a new page (NewPage.tsx): what a typed address
 * becomes, which file it lands in, and the blank page written there.
 */

import { withoutTrailingSlashes } from '../../lib/backend';

export const WEB_ROOT = '/etc/www';

/*
 * The URL as it will be served, tidied. A leading slash is added, a trailing
 * one dropped — "/pricing/" and "/pricing" are the same page, and the trailing
 * form would otherwise turn into a file called "pricing/.html".
 *
 * Only the ends are trimmed. A space in the MIDDLE is refused rather than
 * quietly removed: turning "/pri cing" into "/pricing" behind someone's back
 * is deciding what they meant, and they may well have meant to fix the typo
 * themselves.
 */
export function tidyUrl(input: string) {
  const trimmed = input.trim();
  const withSlash = trimmed.startsWith('/') ? trimmed : '/' + trimmed;
  return withSlash.length > 1 ? withoutTrailingSlashes(withSlash) : withSlash;
}

/*
 * The file a URL becomes. Flat: "/pricing" is "pricing.html", never
 * "pricing/index.html" — both serve the same URL, and the flat form is one
 * file instead of a file and a folder.
 *
 * "/" itself is the one exception, because there is no "/.html" to be flat
 * about — the site's own home page is "index.html" at the web root, which is
 * the one filename the backend already resolves "/" to on its own (see
 * GetHtmlFilename in HttpFileExecutorAsync.cs), with no special config
 * needed.
 */
export function fileForUrl(url: string) {
  const tidy = tidyUrl(url);
  return tidy === '/' ? WEB_ROOT + '/index.html' : WEB_ROOT + tidy + '.html';
}

/*
 * Why this URL cannot be used, or null when it can. Everything here is a
 * refusal the backend or the file system would make anyway — better said
 * before the file is written than after.
 *
 * An empty field and an explicit "/" used to be the same case, both treated
 * as "nothing typed yet" — which also meant there was no way to actually ASK
 * for the site's home page, since typing the one character that means it was
 * indistinguishable from not having typed anything. They are told apart here
 * by the raw, untidied text: nothing yet is the empty string, "/" is "/".
 */
export function urlProblem(url: string, taken: string[]): string | null {
  if (url.trim() === '') {
    return 'Give the page a name.';
  }
  const tidy = tidyUrl(url);
  if (tidy === '/') {
    return taken.includes('/') ? 'There is already a page at /.' : null;
  }
  const segments = tidy.slice(1).split('/');
  if (segments.includes('')) {
    return 'That has an empty step in it — check the slashes.';
  }
  if (segments.some(segment => segment.startsWith('.'))) {
    return 'A name starting with a dot is never served.';
  }
  if (!/^[a-zA-Z0-9\-_/]+$/.test(tidy.slice(1))) {
    return 'Letters, numbers, dashes and underscores only.';
  }
  if (taken.includes(tidy)) {
    return 'There is already a page at ' + tidy + '.';
  }
  return null;
}

// A readable title from the last step of the URL: "/docs/api-keys" → "Api keys".
function titleFor(url: string) {
  const last = tidyUrl(url).split('/').findLast(Boolean) ?? 'Home';
  const words = last.replaceAll(/[-_]+/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/*
 * A page with nothing in it but the things every page needs, and the two
 * optional companion files asked for — no stylesheet and no script unless
 * asked, blank still means blank by default. The companion files share the
 * page's own basename ("/pricing" gets "pricing.css"/"pricing.js"), so where
 * they are is never a separate thing to remember.
 */
export function blankPage(url: string, companions: { css?: boolean; js?: boolean } = {}) {
  const title = titleFor(url);
  // Same folder as the page itself, not the site root — "/docs/pricing" gets
  // "/docs/pricing.css", a true sibling, the same way fileForUrl() places it.
  const base = tidyUrl(url);
  return (
    '<!doctype html>\n' +
    '<html lang="en">\n' +
    '<head>\n' +
    '<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>' +
    title +
    '</title>\n' +
    (companions.css ? '<link rel="stylesheet" href="' + base + '.css">\n' : '') +
    '</head>\n' +
    '<body>\n' +
    '<h1>' +
    title +
    '</h1>\n' +
    (companions.js ? '<script src="' + base + '.js"></script>\n' : '') +
    '</body>\n' +
    '</html>\n'
  );
}
