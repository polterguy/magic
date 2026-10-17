/*
 * The one place that knows what the shared widget runtime files should
 * contain, so a page can get them created the first time it needs them
 * without ever hand-copying their source anywhere.
 *
 * These are imported straight out of ./assets/ (tracked in this repo) via
 * Vite's `?raw` suffix — Vite reads the actual file at build/dev time and
 * inlines its text, so there is exactly one copy of the source to ever edit.
 * Had this been a pasted-in string constant instead, editing the real file
 * would silently stop updating it, and the two would drift the first time
 * someone touched only one.
 *
 * This source lives here, inside frontend/, rather than at the deployed
 * runtime path (backend/files/etc/www/assets/) it gets copied TO — that path
 * is gitignored, per-cloudlet deployment state (see ensureAssetFilesExist()
 * in WebDesigner.tsx), not something a fresh checkout or the frontend's own
 * Docker build stage (which COPYs only frontend/) ever has. Importing from
 * there used to make the build depend on a file that, outside Thomas's own
 * machine, simply never exists.
 */

import magicWidgetsJs from './assets/magic-widgets.js?raw';
import magicWidgetsCss from './assets/magic-widgets.css?raw';

// Root-absolute href -> the content a missing file at that path should get.
export const CANONICAL_ASSETS: Record<string, string> = {
  '/assets/magic-widgets.js': magicWidgetsJs,
  '/assets/magic-widgets.css': magicWidgetsCss,
};

/*
 * Root-absolute href -> the version this source is currently at.
 *
 * These files are edited directly here, not through the Designer's own Code
 * view, so no save anywhere can see that one of them just changed - the
 * Designer only ever bumps the one file ITS OWN session just wrote (see
 * bumpAsset() in WebDesigner.tsx). This is the other half of that: WHOEVER
 * edits one of these files bumps its number here, in the same change, and
 * every page's next save then notices its own link is behind and corrects
 * just that one link - never a page's other, unrelated files, and never
 * every page at once.
 *
 * Bump only the file you actually touched. Editing the .js and leaving the
 * .css alone bumps only '/assets/magic-widgets.js'.
 */
export const CANONICAL_VERSIONS: Record<string, number> = {
  '/assets/magic-widgets.js': 2,
  '/assets/magic-widgets.css': 2,
};
