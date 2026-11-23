/*
 * The calls this feature makes to the backend. The transport they go through — base URL, token,
 * errors — is shared/api.
 */
import { type BazarApp, http } from '@shared/api';

export function installedPlugins() {
  return http.get<BazarApp[]>('/magic/system/bazar/app-manifests');
}
