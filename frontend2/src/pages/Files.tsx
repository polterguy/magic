import { useEffect, useState } from 'react';
import CodeEditor, { modeForFile } from '../components/CodeEditor';
import {
  createFolder,
  deleteFile,
  deleteFolder,
  evaluate,
  listFiles,
  listFolders,
  loadFile,
  renamePath,
  saveFile,
} from '../lib/api';

interface FolderNode {
  path: string;
  folders: string[] | null;
  files: string[] | null;
  expanded: boolean;
}

export default function Files() {

  // Folder contents keyed by folder path, loaded lazily as folders expand.
  const [nodes, setNodes] = useState<Record<string, FolderNode>>({});
  const [selectedFile, setSelectedFile] = useState('');
  const [content, setContent] = useState('');
  const [dirty, setDirty] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    expand('/');
  }, []);

  function show(text: string, isError = false) {
    setFeedback({ text, isError });
    if (!isError) {
      setTimeout(() => setFeedback(null), 3000);
    }
  }

  async function expand(path: string) {
    const existing = nodes[path];
    if (existing?.folders) {
      setNodes(n => ({ ...n, [path]: { ...n[path], expanded: !n[path].expanded } }));
      return;
    }
    try {
      const [folders, files] = await Promise.all([listFolders(path), listFiles(path)]);
      setNodes(n => ({ ...n, [path]: { path, folders, files, expanded: true } }));
    } catch (err: any) {
      show(err.message, true);
    }
  }

  async function refresh(path: string) {
    try {
      const [folders, files] = await Promise.all([listFolders(path), listFiles(path)]);
      setNodes(n => ({ ...n, [path]: { path, folders, files, expanded: true } }));
    } catch (err: any) {
      show(err.message, true);
    }
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
      show('Executed — result: ' + JSON.stringify(response.result ?? 'OK'));
    } catch (err: any) {
      show(err.message, true);
    }
  }

  function parentOf(path: string) {
    const trimmed = path.endsWith('/') ? path.substring(0, path.length - 1) : path;
    return trimmed.substring(0, trimmed.lastIndexOf('/') + 1);
  }

  async function newFile(folder: string) {
    const name = window.prompt('New file name');
    if (!name) {
      return;
    }
    const path = folder + name;
    try {
      await saveFile(path, '');
      await refresh(folder);
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
      await refresh(folder);
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
      await refresh(parentOf(path));
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
      await refresh(parentOf(path));
    } catch (err: any) {
      show(err.message, true);
    }
  }

  async function rename(path: string, isFolder: boolean) {
    const trimmed = isFolder ? path.substring(0, path.length - 1) : path;
    const oldName = trimmed.substring(trimmed.lastIndexOf('/') + 1);
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
      await refresh(parentOf(path));
    } catch (err: any) {
      show(err.message, true);
    }
  }

  function renderFolder(path: string): JSX.Element | null {
    const node = nodes[path];
    if (!node?.expanded) {
      return null;
    }
    return (
      <div className="tree-children">
        {node.folders!.map(folder => (
          <div className="tree-node" key={folder}>
            <div className="tree-row" onClick={() => expand(folder)}>
              <span>{nodes[folder]?.expanded ? '▾' : '▸'} 🗀</span>
              <span style={{ flex: 1 }}>{folderName(folder)}</span>
              <FolderActions
                onNewFile={() => newFile(folder)}
                onNewFolder={() => newFolder(folder)}
                onRename={() => rename(folder, true)}
                onDelete={() => removeFolder(folder)} />
            </div>
            {renderFolder(folder)}
          </div>
        ))}
        {node.files!.map(file => (
          <div
            className={'tree-row' + (file === selectedFile ? ' selected' : '')}
            key={file}
            onClick={() => openFile(file)}>
            <span>🗎</span>
            <span style={{ flex: 1 }}>{file.substring(file.lastIndexOf('/') + 1)}</span>
            <FileActions
              onRename={e => { e.stopPropagation(); rename(file, false); }}
              onDelete={e => { e.stopPropagation(); removeFile(file); }} />
          </div>
        ))}
      </div>
    );
  }

  function folderName(path: string) {
    const trimmed = path.substring(0, path.length - 1);
    return trimmed.substring(trimmed.lastIndexOf('/') + 1);
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
          <div className="tree-row" onClick={() => refresh('/')}>
            <span>🗀</span>
            <span style={{ flex: 1 }}><strong>/</strong></span>
            <FolderActions
              onNewFile={() => newFile('/')}
              onNewFolder={() => newFolder('/')} />
          </div>
          {renderFolder('/')}
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
