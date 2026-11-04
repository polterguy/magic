import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useEffectEvent, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ancestorsOf } from '../helpers';

/*
 * "?open=/path/file.hl" deep-links straight into a file — how the Endpoints
 * screen and the command palette jump to source. Consumed and cleared each
 * time it appears, so a second jump while already here works too, and the
 * tree expands down to the file so it is visible where it lives.
 */
export function useDeepLink(
  openFile: (path: string) => Promise<void>,
  setExpanded: Dispatch<SetStateAction<Set<string>>>,
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLink = searchParams.get('open');
  // The deep link the tree was last expanded for, so it is expanded once per link.
  const [expandedFor, setExpandedFor] = useState<string | null>(null);
  if (deepLink !== expandedFor) {
    setExpandedFor(deepLink);
    if (deepLink) {
      const ancestors = ancestorsOf(deepLink);
      setExpanded(current => new Set([...current, ...ancestors]));
    }
  }
  const openDeepLink = useEffectEvent((target: string) => {
    void openFile(target);
    setSearchParams({}, { replace: true });
  });
  useEffect(() => {
    if (deepLink) {
      openDeepLink(deepLink);
    }
  }, [deepLink]);
}
