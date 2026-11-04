/*
 * The only wire between the Web Designer and Chat Ops: when a Chat Ops turn
 * finishes having done something, the canvas picks the file up again.
 */

import { useEffect, useEffectEvent } from 'react';

import { onChatOpsDone } from '../../../lib/chatOps';
import { showToast } from '../../../lib/toast';

export function useChatOpsReload(o: {
  dirty: boolean;
  path: string;
  setStale: (stale: boolean) => void;
  openPage: (file: string, force?: boolean) => Promise<void>;
  loadPages: () => Promise<string[]>;
}) {
  const { dirty, path, setStale, openPage, loadPages } = o;

  /*
   * A Chat Ops turn has finished doing something on the server. With nothing
   * unsaved here the canvas simply picks the file up again; with unsaved work
   * it says so and waits, because the alternative is silently throwing away
   * what the user just did.
   */
  const onChatOpsTurn = useEffectEvent(() => {
    if (dirty) {
      setStale(true);
      showToast('Chat Ops changed files on the server — reload when you are ready');
      return;
    }
    if (path) {
      void openPage(path, true);
    }
    loadPages().catch(() => {});
  });
  useEffect(() => onChatOpsDone(() => onChatOpsTurn()), []);
}
