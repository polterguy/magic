import { useState } from 'react';

import { FILE_SLOTS, fileSystemPin } from '../slots';

/*
 * Wizard granting read access to the file system. File and folder slots take their path
 * as the slot value, so an optional [path] pins every granted operation to that exact
 * path; blank grants the operation for any path. Slots that change the file system can
 * never be granted to a sandbox, so they are not offered.
 */

export default function FilesAccessWizard(
  props: Readonly<{ onAdd: (lines: string[]) => void; onCancel: () => void }>,
) {
  const [path, setPath] = useState('');
  const [extension, setExtension] = useState('');

  function add() {
    const folder = path.trim();
    const lines = FILE_SLOTS.read.map(slot => fileSystemPin(slot, folder, extension));
    lines.push('io.path.get-folder');
    props.onAdd(lines);
  }

  return (
    <div className="card" style={{ padding: 10, marginBottom: 6 }}>
      <div className="toolbar" style={{ marginBottom: 6 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>File system</div>
        <span className="muted" style={{ fontSize: 12 }}>
          read only
        </span>
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
          Folder{' '}
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
          Extension{' '}
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
        Folder operations (list, exists, search) are pinned to exactly this folder — not its
        subfolders. File operations (load, exists) are pinned to any file directly inside it; add an
        extension above to narrow that further. For a deeper folder, run this wizard again with that
        folder; for one exact file, edit the list below directly. Leave Folder blank to allow any
        path. A sandbox cannot be granted slots that save, copy, move, patch, unzip or delete files
        or create folders: put that in a file and grant [execute-file] on it by name.
      </span>
    </div>
  );
}
