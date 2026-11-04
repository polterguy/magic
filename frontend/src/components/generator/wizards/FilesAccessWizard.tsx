import { useState } from 'react';

import { showToast } from '../../../lib/toast';
import { FILE_SLOTS, fileSystemPin } from '../slots';

/*
 * Wizard granting file-system access in Read / Write / Delete tiers. File and folder
 * slots take their path as the slot value, so an optional [path] pins every granted
 * operation to that exact path; blank grants the operation for any path.
 */

export default function FilesAccessWizard(
  props: Readonly<{ onAdd: (lines: string[]) => void; onCancel: () => void }>,
) {
  const [path, setPath] = useState('');
  const [extension, setExtension] = useState('');
  const [read, setRead] = useState(true);
  const [write, setWrite] = useState(false);
  const [remove, setRemove] = useState(false);

  function add() {
    const slots: string[] = [];
    if (read) {
      slots.push(...FILE_SLOTS.read);
    }
    if (write) {
      slots.push(...FILE_SLOTS.write);
    }
    if (remove) {
      slots.push(...FILE_SLOTS.delete);
    }
    if (slots.length === 0) {
      showToast('Tick at least one tier', true);
      return;
    }
    const folder = path.trim();
    const lines = slots.map(slot => fileSystemPin(slot, folder, extension));
    if (read) {
      lines.push('io.path.get-folder');
    }
    props.onAdd(lines);
  }

  return (
    <div className="card" style={{ padding: 10, marginBottom: 6 }}>
      <div className="toolbar" style={{ marginBottom: 6 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>File system</div>
        <label
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          title="Load, list, search files and folders"
        >
          <input type="checkbox" checked={read} onChange={e => setRead(e.target.checked)} />
          Read
        </label>
        <label
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          title="Save, copy, move, patch, unzip; create folders"
        >
          <input type="checkbox" checked={write} onChange={e => setWrite(e.target.checked)} />
          Write
        </label>
        <label
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          title="Delete files and folders"
        >
          <input type="checkbox" checked={remove} onChange={e => setRemove(e.target.checked)} />
          Delete
        </label>
        <span className="spacer" />
        <button className="btn btn-small" onClick={add}>
          Add
        </button>
        <button className="btn btn-secondary btn-small" onClick={props.onCancel}>
          Close
        </button>
      </div>
      <div className="toolbar">
        <label
          style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}
          title="Folder operations are pinned to exactly this folder, not its subfolders; file operations are pinned to any file directly inside it"
        >
          Folder
          <input
            type="text"
            placeholder="/etc/data/  (blank = any path)"
            value={path}
            onChange={e => setPath(e.target.value)}
            style={{ flex: 1 }}
          />
        </label>
        <label
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          title="Narrows file operations to this extension only, e.g. conf for *.conf; blank allows any file in the folder"
        >
          Extension
          <input
            type="text"
            placeholder="any"
            value={extension}
            onChange={e => setExtension(e.target.value)}
            style={{ width: 70 }}
          />
        </label>
      </div>
      <span className="muted" style={{ fontSize: 12 }}>
        Folder operations (list, exists, create, delete, copy, move on folders) are pinned to
        exactly this folder — not its subfolders. File operations (load, save, delete, copy, move,
        exists, patch, unzip) are pinned to any file directly inside it; add an extension above to
        narrow that further. For a deeper folder, run this wizard again with that folder; for one
        exact file, edit the list below directly. Leave Folder blank to allow any path.
      </span>
    </div>
  );
}
