/*
 * Chat Ops' presence in the layout: the drawer, its footer button, its palette entry and its
 * Ctrl/Cmd+. shortcut. Mounted by the layout through this feature's manifest, so a build
 * without Chat Ops has none of them.
 *
 * The drawer only exists when the backend has an OpenAI API key — without one the "default"
 * model cannot answer, so the whole surface stays hidden.
 */
import { openaiIsConfigured } from '@shared/api';
import { useAuth } from '@shared/auth/useAuth';
import { addFooterAction, addPaletteAction, registerShellAction } from '@shared/shell/shellActions';
import { RobotIcon } from '@shared/ui/Icons';
import { useCallback, useEffect, useState } from 'react';

import ChatDrawer from './ChatDrawer';

export default function ChatShell() {
  const { backend } = useAuth();
  const [available, setAvailable] = useState(false);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(() => {
    openaiIsConfigured()
      .then(response => setAvailable(!!response.result))
      .catch(() => {});
  }, []);
  useEffect(refresh, [refresh]);

  // Whoever changes the OpenAI key asks for a refresh, whether or not the drawer is offered yet.
  useEffect(() => registerShellAction('refreshChat', refresh), [refresh]);

  useEffect(() => {
    if (!available) {
      return;
    }
    const removers = [
      registerShellAction('openChatOps', () => setOpen(true)),
      addFooterAction({
        id: 'chat',
        title: 'Chat Ops — talk to your cloudlet (Ctrl+. / Cmd+.)',
        Icon: RobotIcon,
        onClick: () => setOpen(current => !current),
      }),
      addPaletteAction({ label: 'Chat with your cloudlet', action: () => setOpen(true) }),
    ];
    /*
     * Captured at window level in the CAPTURE phase, like the palette's shortcut, so it fires
     * even while CodeMirror has focus.
     */
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === '.') {
        event.preventDefault();
        event.stopPropagation();
        setOpen(current => !current);
      }
    }
    globalThis.addEventListener('keydown', onKey, true);
    return () => {
      removers.forEach(remove => remove());
      globalThis.removeEventListener('keydown', onKey, true);
    };
  }, [available]);

  if (!available) {
    return null;
  }
  // Mounted while closed too — the conversation survives closing it.
  return (
    <ChatDrawer open={open} userId={backend?.username ?? 'root'} onClose={() => setOpen(false)} />
  );
}
