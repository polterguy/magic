/*
 * The one place that knows which shared widget runtime files a dropped App
 * block can depend on, so a page can link them without ever hand-copying
 * their source anywhere.
 *
 * The actual source lives on the SERVER now, not in this bundle: canonical
 * copies sit at backend/files/etc/system/web-designer/ (tracked in git,
 * shipped with every backend deployment), and POST
 * /magic/system/www/ensure-widget-assets (see ensureWidgetAssets() in
 * lib/api.ts) copies them into /etc/www/assets/ — gitignored, per-cloudlet
 * deployment state — the first time a page needs them. This dashboard used
 * to carry its own embedded copy of that source instead, which meant two
 * places could drift; the backend copying from its own single file removes
 * the second one entirely.
 */

// Root-absolute hrefs an App block's [requires] may point at.
export const WIDGET_ASSET_HREFS = ['/assets/magic-widgets.js', '/assets/magic-widgets.css'];

/*
 * Root-absolute href -> the version this source is currently at.
 *
 * These files are edited directly under backend/files/etc/system/web-designer/,
 * not through the Designer's own Code view, so no save anywhere can see that
 * one of them just changed - the Designer only ever bumps the one file ITS
 * OWN session just wrote (see bumpAsset() in WebDesigner.tsx). This is the
 * other half of that: WHOEVER edits one of these files bumps its number
 * here, in the same change, and every page's next save then notices its own
 * link is behind and corrects just that one link - never a page's other,
 * unrelated files, and never every page at once.
 *
 * Bump only the file you actually touched. Editing the .js and leaving the
 * .css alone bumps only '/assets/magic-widgets.js'.
 */
export const CANONICAL_VERSIONS: Record<string, number> = {
  '/assets/magic-widgets.js': 3,
  '/assets/magic-widgets.css': 2,
};
