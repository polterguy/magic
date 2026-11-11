/*
 * The keyboard-shortcut overview — Ctrl/Cmd+/ anywhere, or through the
 * command palette. Renders the shared shortcut registry, which is the same
 * list the editor builds its keymap from, so this dialog cannot go stale.
 */

import { CSSProperties, ReactNode, useState } from 'react';

import { isMac, Shortcut, shortcutDisplay, SHORTCUTS } from '../lib/shortcuts';
import { Modal } from './Dialogs';
import { BoltIcon, CodeFileIcon, FolderIcon, KeyboardIcon, LayoutIcon } from './Icons';
import SearchInput from './SearchInput';

const GROUPS: {
  id: Shortcut['group'];
  title: string;
  note: string;
  Icon: () => React.JSX.Element;
}[] = [
  { id: 'Global', title: 'Everywhere', note: 'Anywhere in the dashboard.', Icon: BoltIcon },
  {
    id: 'Editor',
    title: 'Code editors',
    note: 'With the editor focused — Hyper IDE, Playground, SQL Studio, Web Designer’s code view.',
    Icon: CodeFileIcon,
  },
  {
    id: 'Hyper IDE',
    title: 'Hyper IDE file actions',
    note: 'With the editor focused.',
    Icon: FolderIcon,
  },
  {
    id: 'Web Designer',
    title: 'Web Designer',
    note: 'On the canvas, or with an element selected.',
    Icon: LayoutIcon,
  },
];

// Wraps every occurrence of the filter in <mark>, so a row shows why it matched.
function highlight(text: string, query: string): ReactNode[] {
  if (query === '') {
    return [text];
  }
  const parts: ReactNode[] = [];
  const lower = text.toLowerCase();
  let from = 0;
  let at = lower.indexOf(query, from);
  while (at !== -1) {
    parts.push(text.slice(from, at), <mark key={at}>{text.slice(at, at + query.length)}</mark>);
    from = at + query.length;
    at = lower.indexOf(query, from);
  }
  parts.push(text.slice(from));
  return parts;
}

function Keys(props: Readonly<{ combo: string }>) {
  return (
    <span className="shortcut-keys">
      {props.combo.split(' + ').map((key, index) => (
        <span className="shortcut-key" key={key}>
          {index > 0 && <span className="shortcut-plus">+</span>}
          <kbd>{key}</kbd>
        </span>
      ))}
    </span>
  );
}

export default function ShortcutsDialog(props: Readonly<{ onClose: () => void }>) {
  const [filter, setFilter] = useState('');
  const query = filter.trim().toLowerCase();

  // A row matches on its description, its keys, or the name of its group.
  const groups = GROUPS.map(group => {
    const all = SHORTCUTS.filter(shortcut => shortcut.group === group.id);
    const groupMatches = query !== '' && group.title.toLowerCase().includes(query);
    const shortcuts = all.filter(
      shortcut =>
        query === '' ||
        groupMatches ||
        shortcut.description.toLowerCase().includes(query) ||
        shortcutDisplay(shortcut).toLowerCase().includes(query),
    );
    return { ...group, shortcuts };
  }).filter(group => group.shortcuts.length > 0);

  const shown = groups.reduce((sum, group) => sum + group.shortcuts.length, 0);
  const paletteCombo = isMac ? 'Cmd + /' : 'Ctrl + /';

  return (
    <Modal width={1000} onClose={props.onClose}>
      <div className="shortcuts">
        <header className="shortcuts-header">
          <span className="shortcuts-badge" aria-hidden="true">
            <KeyboardIcon />
          </span>
          <div className="shortcuts-heading">
            <h2>Keyboard shortcuts</h2>
            <div className="shortcuts-subtitle">
              {query === ''
                ? `${SHORTCUTS.length} shortcuts`
                : `${shown} of ${SHORTCUTS.length} shortcuts`}
              {' · '}
              {isMac ? 'macOS keys' : 'Windows & Linux keys'}
            </div>
          </div>
          <SearchInput
            value={filter}
            onChange={setFilter}
            placeholder="Filter shortcuts…"
            label="Filter shortcuts"
            initialFocus
          />
          <button
            type="button"
            className="shortcuts-close"
            title="Close (Esc)"
            aria-label="Close"
            onClick={props.onClose}
          >
            ×
          </button>
        </header>

        {groups.length === 0 ? (
          <div className="shortcuts-empty">
            No shortcut matches <b>“{filter.trim()}”</b>
          </div>
        ) : (
          <div className="shortcuts-grid">
            {groups.map(({ id, title, note, Icon, shortcuts }, index) => (
              <section
                className="shortcuts-card"
                key={id}
                style={{ '--stagger': index } as CSSProperties}
              >
                <div className="shortcuts-card-head">
                  <span className="shortcuts-card-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <h3>{title}</h3>
                  <span className="shortcuts-count">{shortcuts.length}</span>
                </div>
                <div className="shortcuts-note">{note}</div>
                <ul className="shortcuts-list">
                  {shortcuts.map(shortcut => (
                    <li className="shortcut-row" key={shortcut.display + shortcut.description}>
                      <span className="shortcut-description">
                        {highlight(shortcut.description, query)}
                      </span>
                      <Keys combo={shortcutDisplay(shortcut)} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        <footer className="shortcuts-footer">
          <span>
            <Keys combo={paletteCombo} /> opens this anywhere
          </span>
          <span>
            <Keys combo="Esc" /> closes it
          </span>
        </footer>
      </div>
    </Modal>
  );
}
