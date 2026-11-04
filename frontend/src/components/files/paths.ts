/*
 * Path helpers shared between the Hyper IDE page and its file tree.
 */

export function parentOf(path: string) {
  const trimmed = path.endsWith('/') ? path.slice(0, -1) : path;
  return trimmed.slice(0, trimmed.lastIndexOf('/') + 1);
}

export function nameOf(path: string) {
  const trimmed = path.endsWith('/') ? path.slice(0, -1) : path;
  return trimmed.slice(trimmed.lastIndexOf('/') + 1);
}
