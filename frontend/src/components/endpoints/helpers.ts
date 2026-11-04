import type { Endpoint } from '../../lib/api';

/*
 * Pure helpers behind the Endpoints page — which module an endpoint belongs
 * to, the file backing it, and grouping the visible endpoints by module.
 */

/*
 * The module an endpoint belongs to — magic/system/<module>/… is a system
 * module, magic/modules/<module>/… and magic/<module>/… are user modules.
 */
export function moduleOf(endpoint: Endpoint): { name: string; system: boolean } {
  const parts = endpoint.path.split('/');
  if (parts[1] === 'system') {
    return { name: parts[2] ?? 'system', system: true };
  }
  if (parts[1] === 'modules') {
    return { name: parts[2] ?? 'modules', system: false };
  }
  return { name: parts[1] ?? endpoint.path, system: false };
}

/*
 * The Hyperlambda file backing an endpoint — "magic/modules/foo/bar" invoked
 * as GET is "/modules/foo/bar.get.hl" on disk.
 */
export function sourceFile(endpoint: Endpoint) {
  return '/' + endpoint.path.slice('magic/'.length) + '.' + endpoint.verb.toLowerCase() + '.hl';
}

export interface ModuleGroup {
  key: string;
  name: string;
  system: boolean;
  folder: string;
  endpoints: Endpoint[];
}

// Whether an endpoint passes the filters the page has been given.
export function isVisible(
  endpoint: Endpoint,
  module: { name: string; system: boolean },
  query: string,
  showSystem: boolean,
  publicOnly: boolean,
) {
  if (module.system && !showSystem) {
    return false;
  }
  if (publicOnly && (endpoint.auth?.length ?? 0) > 0) {
    return false;
  }
  return (
    !query ||
    endpoint.path.toLowerCase().includes(query) ||
    endpoint.verb.toLowerCase().includes(query) ||
    module.name.toLowerCase().includes(query)
  );
}

// The visible endpoints, grouped by module, user modules first and system modules last.
export function groupEndpoints(
  endpoints: Endpoint[],
  query: string,
  showSystem: boolean,
  publicOnly: boolean,
) {
  const map = new Map<string, ModuleGroup>();
  for (const endpoint of endpoints) {
    const module = moduleOf(endpoint);
    if (!isVisible(endpoint, module, query, showSystem, publicOnly)) {
      continue;
    }
    const key = (module.system ? 'system:' : 'user:') + module.name;
    if (!map.has(key)) {
      map.set(key, {
        key,
        name: module.name,
        system: module.system,
        folder: (module.system ? '/system/' : '/modules/') + module.name + '/',
        endpoints: [],
      });
    }
    map.get(key)!.endpoints.push(endpoint);
  }
  const list = [...map.values()];
  for (const group of list) {
    group.endpoints.sort(
      (left, right) => left.path.localeCompare(right.path) || left.verb.localeCompare(right.verb),
    );
  }
  // Alphabetical within each.
  return list.sort(
    (left, right) =>
      Number(left.system) - Number(right.system) || left.name.localeCompare(right.name),
  );
}
