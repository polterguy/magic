import { useCallback, useEffect, useState } from 'react';
import CodeEditor, { modeForFile } from '../components/CodeEditor';
import {
  createFolder,
  deleteFile,
  deleteFolder,
  evaluate,
  listFilesRecursively,
  listFoldersRecursively,
  loadFile,
  renamePath,
  saveFile,
} from '../lib/api';

function parentOf(path: string) {
  const trimmed = path.endsWith('/') ? path.substring(0, path.length - 1) : path;
  return trimmed.substring(0, trimmed.lastIndexOf('/') + 1);
}

function nameOf(path: string) {
  const trimmed = path.endsWith('/') ? path.substring(0, path.length - 1) : path;
  return trimmed.substring(trimmed.lastIndexOf('/') + 1);
}

export default function Files() {

  // The entire tree, loaded recursively the way the old dashboard does it —
  // the backend excludes /system/, /misc/, /data/ and /config/ unless sys is true.
  const [folders, setFolders] = useState<string[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [systemFiles, setSystemFiles] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState('');
  const [content, setContent] = useState('');
  const [dirty, setDirty] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  const loadTree = useCallback(async (sys: boolean) => {
    try {
      const [folderList, fileList] = await Promise.all([
        listFoldersRecursively('/', sys),
        listFilesRecursively('/', sys),
      ]);
      setFolders(folderList ?? []);
      setFiles(fileList ?? []);
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    }
  }, []);

  useEffect(() => {
    loadTree(systemFiles);
  }, [loadTree, systemFiles]);

  function show(text: string, isError = false) {
    setFeedback({ text, isError });
    if (!isError) {
      setTimeout(() => setFeedback(null), 3000);
    }
  }

  function toggle(path: string) {
    const next = new Set(expanded);
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    setExpanded(next);
  }

  async function openFile(path: string) {
    if (dirty && !window.confirm('Discard unsaved changes?')) {
      return;
    }
    try {
      const text = await loadFile(path);
      setSelectedFile(path);
      setContent(text);
      setDirty(false);
    } catch (err: any) {
      show(err.message, true);
    }
  }

  async function save() {
    if (!selectedFile) {
      return;
    }
    try {
      await saveFile(selectedFile, content);
      setDirty(false);
      show('Saved ' + selectedFile);
    } catch (err: any) {
      show(err.message, true);
    }
  }

  async function execute() {
    if (!selectedFile.endsWith('.hl')) {
      return;
    }
    try {
      const response = await evaluate(content);
      show('Executed — result: ' + (response === '' ? 'OK' : response));
    } catch (err: any) {
      show(err.message, true);
    }
  }

  async function newFile(folder: string) {
    const name = window.prompt('New file name');
    if (!name) {
      return;
    }
    const path = folder + name;
    try {
      await saveFile(path, '');
      await loadTree(systemFiles);
      await openFile(path);
    } catch (err: any) {
      show(err.message, true);
    }
  }

  async function newFolder(folder: string) {
    const name = window.prompt('New folder name');
    if (!name) {
      return;
    }
    try {
      await createFolder(folder + name + '/');
      await loadTree(systemFiles);
    } catch (err: any) {
      show(err.message, true);
    }
  }

  async function removeFile(path: string) {
    if (!window.confirm('Delete ' + path + '?')) {
      return;
    }
    try {
      await deleteFile(path);
      if (selectedFile === path) {
        setSelectedFile('');
        setContent('');
        setDirty(false);
      }
      await loadTree(systemFiles);
    } catch (err: any) {
      show(err.message, true);
    }
  }

  async function removeFolder(path: string) {
    if (!window.confirm('Delete folder ' + path + ' and everything in it?')) {
      return;
    }
    try {
      await deleteFolder(path);
      await loadTree(systemFiles);
    } catch (err: any) {
      show(err.message, true);
    }
  }

  async function rename(path: string, isFolder: boolean) {
    const oldName = nameOf(path);
    const name = window.prompt('New name', oldName);
    if (!name || name === oldName) {
      return;
    }
    const newPath = parentOf(path) + name + (isFolder ? '/' : '');
    try {
      await renamePath(path, newPath);
      if (selectedFile === path) {
        setSelectedFile(newPath);
      }
      await loadTree(systemFiles);
    } catch (err: any) {
      show(err.message, true);
    }
  }

  function renderChildren(path: string): JSX.Element {
    const childFolders = folders.filter(folder => parentOf(folder) === path);
    const childFiles = files.filter(file => parentOf(file) === path);
    return (
      <div className="tree-children">
        {childFolders.map(folder => (
          <div className="tree-node" key={folder}>
            <div className="tree-row" onClick={() => toggle(folder)}>
              <span>{expanded.has(folder) ? '▾' : '▸'} 🗀</span>
              <span style={{ flex: 1 }}>{nameOf(folder)}</span>
              <FolderActions
                onNewFile={() => newFile(folder)}
                onNewFolder={() => newFolder(folder)}
                onRename={() => rename(folder, true)}
                onDelete={() => removeFolder(folder)} />
            </div>
            {expanded.has(folder) && renderChildren(folder)}
          </div>
        ))}
        {childFiles.map(file => (
          <div
            className={'tree-row' + (file === selectedFile ? ' selected' : '')}
            key={file}
            onClick={() => openFile(file)}>
            <span>🗎</span>
            <span style={{ flex: 1 }}>{nameOf(file)}</span>
            <FileActions
              onRename={e => { e.stopPropagation(); rename(file, false); }}
              onDelete={e => { e.stopPropagation(); removeFile(file); }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1>Files</h1>
        <p>Browse and edit any file on your server</p>
      </div>
      {feedback && (
        <div
          className={feedback.isError ? 'error-box' : 'success-box'}
          style={{ marginBottom: 12 }}>
          {feedback.text}
        </div>
      )}
      <div className="files-layout">
        <div className="file-tree">
          <label
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 6px 10px' }}
            title="Also show /system/, /misc/, /data/ and /config/ — be careful!">
            <input
              type="checkbox"
              checked={systemFiles}
              onChange={e => setSystemFiles(e.target.checked)} />
            Show system files
          </label>
          <div className="tree-row">
            <span>🗀</span>
            <span style={{ flex: 1 }}><strong>/</strong></span>
            <FolderActions
              onNewFile={() => newFile('/')}
              onNewFolder={() => newFolder('/')} />
          </div>
          {renderChildren('/')}
        </div>
        <div className="file-editor">
          <div className="toolbar">
            <span className="mono" style={{ flex: 1 }}>
              {selectedFile || 'No file open'}{dirty ? ' •' : ''}
            </span>
            {selectedFile.endsWith('.hl') &&
              <button className="btn btn-secondary btn-small" onClick={execute}>▷ Execute</button>}
            <button className="btn btn-small" onClick={save} disabled={!selectedFile || !dirty}>
              Save
            </button>
          </div>
          {selectedFile ? (
            <CodeEditor
              value={content}
              onChange={value => { setContent(value); setDirty(true); }}
              mode={modeForFile(selectedFile)}
              onSave={save}
              onExecute={execute} />
          ) : (
            <div className="card muted" style={{ flex: 1 }}>
              Select a file in the tree to start editing.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function FolderActions(props: {
  onNewFile: () => void;
  onNewFolder: () => void;
  onRename?: () => void;
  onDelete?: () => void;
}) {
  return (
    <span onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 4 }}>
      <button className="btn btn-secondary btn-small" title="New file" onClick={props.onNewFile}>+🗎</button>
      <button className="btn btn-secondary btn-small" title="New folder" onClick={props.onNewFolder}>+🗀</button>
      {props.onRename &&
        <button className="btn btn-secondary btn-small" title="Rename" onClick={props.onRename}>✎</button>}
      {props.onDelete &&
        <button className="btn btn-danger btn-small" title="Delete" onClick={props.onDelete}>✕</button>}
    </span>
  );
}

function FileActions(props: {
  onRename: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  return (
    <span style={{ display: 'flex', gap: 4 }}>
      <button className="btn btn-secondary btn-small" title="Rename" onClick={props.onRename}>✎</button>
      <button className="btn btn-danger btn-small" title="Delete" onClick={props.onDelete}>✕</button>
    </span>
  );
}
