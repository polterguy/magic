/*
 * The calls this feature makes to the backend. The transport they go through — base URL, token,
 * errors — is shared/api.
 */
import { http } from '@shared/api';

/*
 * The cloudlet-wide website configuration (/etc/www/.config) — root-only.
 * Both endpoints touch only spa_enabled/not_found/redirect in that file;
 * everything else already in it (static_files/headers, anything hand-added)
 * is read and written back untouched by the endpoint itself, never even
 * reaching this shape.
 */
export interface WebsiteRedirect {
  from: string;
  to: string;
}

export interface WebsiteConfig {
  spa_enabled: boolean;
  not_found: string;
  // The endpoint returns null, not [], when there are none.
  redirects: WebsiteRedirect[] | null;
}

export function loadWebsiteConfig() {
  return http.get<WebsiteConfig>('/magic/system/www/config');
}

export function saveWebsiteConfig(config: WebsiteConfig) {
  return http.put<{ saved: boolean }>('/magic/system/www/config', config);
}

/*
 * Makes sure the Web Designer's shared widget runtime files (magic-widgets.js/.css)
 * exist under /etc/www/assets/ on this cloudlet, copying them server-side from
 * backend/files/etc/system/web-designer/ when missing — see widgetRuntime.ts.
 */
export function ensureWidgetAssets() {
  return http.post<{ ensured: boolean }>('/magic/system/www/ensure-widget-assets', {});
}
