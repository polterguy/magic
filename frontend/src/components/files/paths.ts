/*
 * Path helpers shared between the Hyper IDE page and its file tree.
 */

export function parentOf(path: string) {
  const trimmed = path.endsWith('/') ? path.substring(0, path.length - 1) : path;
  return trimmed.substring(0, trimmed.lastIndexOf('/') + 1);
}

export function nameOf(path: string) {
  const trimmed = path.endsWith('/') ? path.substring(0, path.length - 1) : path;
  return trimmed.substring(trimmed.lastIndexOf('/') + 1);
}
