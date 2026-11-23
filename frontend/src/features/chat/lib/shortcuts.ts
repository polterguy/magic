/*
 * Chat Ops' shortcut, listed with the ones that work everywhere. It reaches the shortcuts
 * overlay through this feature's manifest.
 */
import type { Shortcut } from '@shared/shell/shortcuts';

export const CHAT_SHORTCUTS: Shortcut[] = [
  {
    group: 'Global',
    display: 'Ctrl + .',
    mac: 'Cmd + .',
    description: 'Toggle Chat Ops — talk to your cloudlet (requires an OpenAI API key)',
  },
];
