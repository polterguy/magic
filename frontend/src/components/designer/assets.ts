/*
 * The links a page carries to its stylesheets and scripts: adding the ones a
 * dropped block needs, and keeping the cache-busting versions on them honest.
 */

import { WEB_ROOT } from './designerFiles';
import type { Block } from './palette';
import { CANONICAL_VERSIONS } from './widgetRuntime';

/*
 * Makes sure a file a block cannot work without is actually linked on the
 * page, adding it when it is missing. Returns whether anything was
 * actually added — false means every required href was linked already,
 * which is what insert() uses to fire ensureWidgetAssets() only for
 * the first block on a page that ever needed one of these files, never
 * for the second one that finds its own link already sitting there.
 *
 * Compared by path rather than by the raw attribute text, the same way
 * bumpAsset() below does it — a page one folder deep would otherwise see
 * "/assets/magic-widgets.js" and "../assets/magic-widgets.js" as two
 * different scripts and link the thing twice.
 */
export function ensureRequiredAssets(doc: Document, requires: Block['requires']) {
  let addedAny = false;
  (requires?.stylesheets ?? []).forEach(href => {
    const linked = Array.from(doc.querySelectorAll('link[rel~="stylesheet"][href]')).some(
      link => new URL(link.getAttribute('href') ?? '', doc.baseURI).pathname === href,
    );
    if (!linked) {
      const link = doc.createElement('link');
      link.setAttribute('rel', 'stylesheet');
      // Versioned from the start where there is a known version to start
      // at, so a brand new link is never a save behind the shared file it
      // already points at.
      link.setAttribute(
        'href',
        href + (CANONICAL_VERSIONS[href] ? '?v=' + CANONICAL_VERSIONS[href] : ''),
      );
      doc.head.appendChild(link);
      addedAny = true;
    }
  });
  (requires?.scripts ?? []).forEach(src => {
    const linked = Array.from(doc.querySelectorAll('script[src]')).some(
      script => new URL(script.getAttribute('src') ?? '', doc.baseURI).pathname === src,
    );
    if (!linked) {
      const script = doc.createElement('script');
      script.setAttribute(
        'src',
        src + (CANONICAL_VERSIONS[src] ? '?v=' + CANONICAL_VERSIONS[src] : ''),
      );
      doc.body.appendChild(script);
      addedAny = true;
    }
  });
  return addedAny;
}

/*
 * Bumps the cache-busting "v" on exactly the one linked file this save
 * actually rewrote — never on a sibling link this save left untouched.
 * The cloudlet serves these files with a one-year cache, so without this a
 * style or script edit would reach nobody: any browser that already loaded
 * the page keeps the copy it has, which is exactly why an edit shows in
 * the canvas, where the designer injects it live, and not in Live, not in
 * a new tab, and not for a visitor. The page asking for a different URL is
 * what makes the browser fetch it.
 *
 * [file] is matched by path, not by the link's raw attribute text, the
 * same way ensureRequiredAssets() does — a page one folder deep would
 * otherwise see "/assets/magic-widgets.js" and "../assets/magic-widgets.js"
 * as two different scripts and bump neither.
 *
 * What this does NOT catch: a shared file like /assets/magic-widgets.js
 * edited from entirely outside the designer — by hand in the repo. Saving
 * a page that merely links it has no way to know that happened by itself;
 * see syncSharedAssetVersions() just below for the other half of that.
 */
export function bumpAsset(current: Document, file: string) {
  const elements: [Element, string][] = [
    ...Array.from(current.querySelectorAll('link[rel~="stylesheet"][href]')).map(
      element => [element, 'href'] as [Element, string],
    ),
    ...Array.from(current.querySelectorAll('script[src]')).map(
      element => [element, 'src'] as [Element, string],
    ),
  ];
  const here = new URL(current.baseURI).origin;
  for (const [element, attribute] of elements) {
    const url = new URL(element.getAttribute(attribute) ?? '', current.baseURI);
    if (url.origin !== here || WEB_ROOT + url.pathname !== file) {
      continue;
    }
    const version = Number(url.searchParams.get('v'));
    url.searchParams.set('v', String(Number.isFinite(version) && version > 0 ? version + 1 : 1));
    element.setAttribute(attribute, url.pathname + url.search);
  }
}

/*
 * The other half of cache-busting: a shared file like magic-widgets.js is
 * never edited through this designer, so no save anywhere can know its
 * content just changed the way bumpAsset() knows about a file THIS session
 * just wrote. What it can know is CANONICAL_VERSIONS — bumped by hand, in
 * the same change, by whoever edits one of these files on disk.
 *
 * Every save checks every local link against that table and corrects only
 * the ones that are behind — never a page's own, unrelated files, and
 * never a page that already carries the current version, so most saves
 * touch nothing here at all.
 */
export function syncSharedAssetVersions(current: Document) {
  const elements: [Element, string][] = [
    ...Array.from(current.querySelectorAll('link[rel~="stylesheet"][href]')).map(
      element => [element, 'href'] as [Element, string],
    ),
    ...Array.from(current.querySelectorAll('script[src]')).map(
      element => [element, 'src'] as [Element, string],
    ),
  ];
  const here = new URL(current.baseURI).origin;
  for (const [element, attribute] of elements) {
    const url = new URL(element.getAttribute(attribute) ?? '', current.baseURI);
    const version = CANONICAL_VERSIONS[url.pathname];
    if (
      url.origin !== here ||
      version === undefined ||
      url.searchParams.get('v') === String(version)
    ) {
      continue;
    }
    url.searchParams.set('v', String(version));
    element.setAttribute(attribute, url.pathname + url.search);
  }
}
