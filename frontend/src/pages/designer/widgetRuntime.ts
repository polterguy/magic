/*
 * The one place that knows what the shared widget runtime files should
 * contain, so a page can get them created the first time it needs them
 * without ever hand-copying their source anywhere.
 *
 * These are imported straight out of the real files under
 * backend/files/etc/www/assets/ via Vite's `?raw` suffix — Vite reads the
 * actual file at build/dev time and inlines its text, so there is exactly
 * one copy of the source to ever edit. Had this been a pasted-in string
 * constant instead, editing the real file would silently stop updating it,
 * and the two would drift the first time someone touched only one.
 */

import magicWidgetsJs from '../../../../backend/files/etc/www/assets/magic-widgets.js?raw';
import magicWidgetsCss from '../../../../backend/files/etc/www/assets/magic-widgets.css?raw';

// Root-absolute href -> the content a missing file at that path should get.
export const CANONICAL_ASSETS: Record<string, string> = {
  '/assets/magic-widgets.js': magicWidgetsJs,
  '/assets/magic-widgets.css': magicWidgetsCss,
};
