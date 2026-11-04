/*
 * Pure helpers and constants behind the Hyper IDE page.
 */

export const PROTECTED_FOLDERS = new Set([
  '/',
  '/system/',
  '/misc/',
  '/data/',
  '/config/',
  '/etc/',
  '/modules/',
]);

/*
 * Converts a form value to the argument type the Hyperlambda expects.
 */
export function convertArgument(value: string, type: string) {
  if (/^(u?int|u?long|u?short|decimal|double|float)$/.test(type)) {
    return Number(value);
  }
  if (type === 'bool') {
    return value === 'true' || value === '1' || value === 'yes';
  }
  return value;
}

/*
 * Whether a file is served as an HTTP endpoint, mirroring what the backend
 * itself enforces (magic.endpoint's Utilities.IsLegalAPIRequest and
 * ListEndpoints):
 *
 *   - the relative path splits into exactly three dot-separated parts, so
 *     "modules/x/foo.get.hl" qualifies but "modules/x.y/foo.get.hl" does not
 *     — a dot anywhere outside the filename makes the URL unroutable
 *   - the middle part is an HTTP verb (socket files are listed but can't be
 *     invoked over HTTP, so they're excluded here)
 *   - it lives under modules/ or system/; everything else answers 401
 *
 * Its route is the path with ".<verb>.hl" stripped, under "magic/".
 */
export const ENDPOINT_VERBS = new Set(['get', 'post', 'put', 'patch', 'delete']);

export function endpointOf(path: string): { path: string; verb: string } | null {
  const relative = path.replace(/^\/+/, '');
  if (!relative.startsWith('modules/') && !relative.startsWith('system/')) {
    return null;
  }
  const parts = relative.split('.');
  if (parts.length !== 3 || parts[2] !== 'hl' || !ENDPOINT_VERBS.has(parts[1])) {
    return null;
  }
  return { path: 'magic/' + parts[0], verb: parts[1] };
}

// Every folder above a file, outermost first: "/a/b/c.hl" gives "/a/" and "/a/b/".
export function ancestorsOf(file: string) {
  const ancestors: string[] = [];
  let ancestor = '/';
  for (const part of file
    .split('/')
    .filter(part => part !== '')
    .slice(0, -1)) {
    ancestor += part + '/';
    ancestors.push(ancestor);
  }
  return ancestors;
}

// The workspace shape remembered in localStorage, per backend.
export interface Workspace {
  open?: string[];
  selected?: string;
  expanded?: string[];
  sys?: boolean;
}

export interface OpenTab {
  path: string;
  content: string;
  saved: string;
}

// The open files with the restored ones in front, except those that are already open.
export function withRestored(current: OpenTab[], restored: OpenTab[]) {
  return [...restored.filter(tab => !current.some(file => file.path === tab.path)), ...current];
}

// The file that was selected, if it was restored, and otherwise the last one that was.
export function restoredSelection(restored: OpenTab[], selected: string | undefined) {
  return restored.some(tab => tab.path === selected) ? selected! : restored.at(-1)!.path;
}
