/*
 * Lets a page block in-app navigation while it has unsaved state.
 * The guard returns a promise resolving to true when navigation may proceed.
 */

import { useEffect } from 'react';
import { useDialog } from '../components/Dialogs';

let guard: (() => Promise<boolean>) | null = null;

export function setNavGuard(value: (() => Promise<boolean>) | null) {
  guard = value;
}

export function getNavGuard() {
  return guard;
}

/*
 * Guards in-app navigation and browser unload while dirty is true —
 * navigating away asks the user to confirm discarding the changes.
 */
export function useUnsavedGuard(dirty: boolean, message: string) {
  const { confirm } = useDialog();
  useEffect(() => {
    if (!dirty) {
      setNavGuard(null);
      return;
    }
    setNavGuard(() => confirm({
      title: 'Discard unsaved changes?',
      message,
      confirmText: 'Discard',
      danger: true,
    }));
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      setNavGuard(null);
      window.removeEventListener('beforeunload', beforeUnload);
    };
  }, [dirty, message, confirm]);
}
