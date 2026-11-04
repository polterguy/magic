import { useState } from 'react';
import type { Workspace } from '../helpers';

/*
 * The remembered workspace shape — open-file paths in tab order, the
 * selection, expanded folders and the sys toggle — kept per backend, since
 * every cloudlet has its own files. Read once at mount; the persist effect
 * in useOpenTabs keeps it current. File CONTENTS are deliberately not
 * remembered: restored tabs re-load fresh from the server, so a restored
 * workspace never resurrects stale edits, and a file deleted server-side
 * simply doesn't come back.
 */
export function useWorkspace(backendUrl: string | undefined) {
  const workspaceKey = 'magic2.ide.workspace.' + (backendUrl ?? '');
  const [workspace] = useState<Workspace>(() => {
    try {
      return JSON.parse(localStorage.getItem(workspaceKey) ?? '{}') as Workspace;
    } catch {
      return {};
    }
  });
  return { workspaceKey, workspace };
}
