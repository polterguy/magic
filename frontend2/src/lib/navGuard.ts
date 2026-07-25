/*
 * Lets a page block in-app navigation while it has unsaved state.
 * The guard returns a promise resolving to true when navigation may proceed.
 */

let guard: (() => Promise<boolean>) | null = null;

export function setNavGuard(value: (() => Promise<boolean>) | null) {
  guard = value;
}

export function getNavGuard() {
  return guard;
}
