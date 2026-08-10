/*
 * useState that survives leaving the page — the value mirrors into
 * sessionStorage, so navigating away and back restores it instead of a
 * "discard unsaved changes?" dialog having to interrogate the user. Scoped
 * to the browser tab and gone when it closes, deliberately: this is a
 * scratch buffer, not a save mechanism.
 */

import { Dispatch, SetStateAction, useEffect, useState } from 'react';

export function useSessionState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const stored = sessionStorage.getItem(key);
    if (stored === null) {
      return initial;
    }
    try {
      return JSON.parse(stored) as T;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    sessionStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
