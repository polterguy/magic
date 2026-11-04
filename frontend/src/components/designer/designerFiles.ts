/*
 * Where the pages the Web Designer edits live, and the addresses they are
 * served at. Shared by the page and its hooks, and pure apart from listPages().
 */

import { listFilesRecursively } from '../../lib/api';
import { WEB_ROOT } from './pageUrls';
import { WIDGET_ASSET_HREFS } from './widgetRuntime';

/*
 * The shared widget runtime (magic-widgets.js/.css) is not this page's own
 * file — every page that drops an App block links it, so editing it from one
 * page's Code view would mean quietly rewriting what every OTHER page on the
 * cloudlet runs too. It is excluded wherever [sheets]/[scripts] stand in for
 * "the file this page owns": the Code view's file switcher, and the Page
 * menu's "already has one of these" check.
 */
export const SHARED_ASSET_FILES = new Set(WIDGET_ASSET_HREFS.map(href => WEB_ROOT + href));

/*
 * The URL a file is served at. Pages here are reachable only at their
 * canonical, extension-less address — every other spelling 301s to it — so the
 * live preview has to ask for exactly this or it spends a redirect finding out.
 */
export function canonicalUrl(file: string) {
  const relative = file.slice(WEB_ROOT.length);
  if (relative.endsWith('/index.html')) {
    const parent = relative.slice(0, -'/index.html'.length);
    return parent === '' ? '/' : parent;
  }
  return relative.replace(/\.html?$/i, '');
}

/*
 * The script/stylesheet a page's OWN file implies, e.g. index.html's is
 * index.js. Built off the file path, not canonicalUrl() — the home page's
 * canonical URL is "/", and "/" + ".js" is "/.js", a file with no name.
 */
export function companionFile(file: string, kind: 'js' | 'css') {
  return file.replace(/\.html?$/i, '.' + kind);
}

/*
 * Hidden folders are never served, so a page inside one could not be looked at
 * even if it could be edited.
 */
export function isServed(file: string) {
  return !file
    .slice(WEB_ROOT.length)
    .split('/')
    .some(part => part.startsWith('.'));
}

// Every page under the web root, sorted by the URL it is served at, which is how the picker lists them.
export async function listPages() {
  const files = (await listFilesRecursively(WEB_ROOT, false)) ?? [];
  return files
    .filter(file => /\.html?$/i.test(file) && isServed(file))
    .sort((left, right) => canonicalUrl(left).localeCompare(canonicalUrl(right)));
}

export { WEB_ROOT } from './pageUrls';
