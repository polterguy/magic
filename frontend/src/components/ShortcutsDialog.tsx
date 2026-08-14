/*
 * The keyboard-shortcut overview — Ctrl/Cmd+/ anywhere, or through the
 * command palette. Renders the shared shortcut registry, which is the same
 * list the editor builds its keymap from, so this dialog cannot go stale.
 */

import { Modal } from './Dialogs';
import { SHORTCUTS, shortcutDisplay } from '../lib/shortcuts';

const GROUPS: { id: string; title: string; note?: string }[] = [
  { id: 'Global', title: 'Everywhere' },
  { id: 'Editor', title: 'Code editors', note: 'With the editor focused — Hyper IDE, Playground, SQL Studio.' },
  { id: 'Hyper IDE', title: 'Hyper IDE file actions', note: 'With the editor focused.' },
];

export default function ShortcutsDialog(props: { onClose: () => void }) {
  return (
    <Modal width={1040} onClose={props.onClose}>
      <h2 style={{ marginTop: 0 }}>Keyboard shortcuts</h2>
      {/* One column per group — the list is short enough to read without scrolling. */}
      <div className="shortcuts-columns">
        {GROUPS.map(group => (
          <div key={group.id}>
            <div className="shortcuts-group">
              {group.title}
              {group.note && <span className="muted"> — {group.note}</span>}
            </div>
            <div className="shortcuts-list">
              {SHORTCUTS.filter(shortcut => shortcut.group === group.id).map(shortcut => (
                <div className="shortcut-row" key={group.id + shortcut.display}>
                  <span className="shortcut-keys">
                    {shortcutDisplay(shortcut).split(' + ').map((key, index) => (
                      <span key={index}>
                        {index > 0 && <span className="muted"> + </span>}
                        <kbd>{key}</kbd>
                      </span>
                    ))}
                  </span>
                  <span className="muted">{shortcut.description}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="modal-actions" style={{ marginBottom: 10 }}>
        <button className="btn" onClick={props.onClose}>Close</button>
      </div>
    </Modal>
  );
}
