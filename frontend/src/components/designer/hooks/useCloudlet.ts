/*
 * What the Web Designer knows about the cloudlet it is designing for: where
 * its pages are served from, and the per-cloudlet keys it remembers things by.
 */

import { useState } from 'react';

import { useAuth } from '../../../lib/useAuth';

export function useCloudlet() {
  const { backend } = useAuth();

  const origin = backend ? new URL(backend.url).origin : '';
  // Per backend — every cloudlet has its own pages.
  const pageKey = 'magic2.designer.page.' + (backend?.url ?? '');
  /*
   * True on the all-in-one image, where the dashboard is served from the same
   * cloudlet whose pages are being edited. Everywhere else the two are on
   * different origins and the browser keeps them apart for us; here it cannot,
   * because they ARE the same origin — so Live is sandboxed harder and the
   * trade-off is said out loud once.
   */
  const sameOrigin = origin !== '' && origin === window.location.origin;
  const warnedKey = 'magic2.designer.live-warning.' + (backend?.url ?? '');
  const [liveWarned, setLiveWarned] = useState(() => localStorage.getItem(warnedKey) === 'seen');

  /*
   * Copy, cut and paste, through localStorage rather than the system
   * clipboard.
   *
   * What is copied is markup, and markup is what the tool already speaks —
   * no sanitising, no permission prompt, no guessing what a word processor
   * meant by its inline styles. localStorage rather than a variable because
   * the case that matters is copying from one page and pasting into another,
   * which survives the reload in between and works across dashboard tabs.
   */
  const clipKey = 'magic2.designer.clipboard.' + (backend?.url ?? '');

  return { origin, pageKey, sameOrigin, warnedKey, liveWarned, setLiveWarned, clipKey };
}

export type Cloudlet = ReturnType<typeof useCloudlet>;
