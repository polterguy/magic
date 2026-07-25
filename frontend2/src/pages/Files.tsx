import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CodeEditor, { modeForFile } from '../components/CodeEditor';
import ResultViewer, { RawResult } from '../components/ResultViewer';
import {
  ChevronIcon,
  DownloadIcon,
  FileIcon,
  FilePlusIcon,
  FolderIcon,
  FolderPlusIcon,
  PencilIcon,
  TrashIcon,
  UploadIcon,
} from '../components/Icons';
import { Modal, useDialog } from '../components/Dialogs';
import { setNavGuard } from '../lib/navGuard';
import {
  createFolder,
  deleteFile,
  deleteFolder,
  downloadFileRaw,
  downloadFolderRaw,
  evaluateWithArgs,
  getHyperlambdaArguments,
  getOpenApiSpec,
  listFilesRecursively,
  listFoldersRecursively,
  loadFile,
  renamePath,
  saveFile,
  uploadFile,
} from '../lib/api';
import { dispositionFilename, downloadBlob } from '../components/ResultViewer';

/*
 * Paths the backend treats as system content — rename/delete-blocked, and
 * tinted red in the tree, like the old dashboard.
 */
function isSystemPath(path: string) {
  return ['/system/', '/misc/', '/data/', '/config/'].some(prefix =>
    path === prefix || path.startsWith(prefix));
}

const PROTECTED_FOLDERS = ['/', '/system/', '/misc/', '/data/', '/config/', '/etc/', '/modules/'];

/*
 * Converts a form value to the argument type the Hyperlambda expects.
 */
function convertArgument(value: string, type: string) {
  if (/^(u?int|u?long|u?short|decimal|double|float)$/.test(type)) {
    return Number(value);
  }
  if (type === 'bool') {
    return value === 'true' || value === '1' || value === 'yes';
  }
  return value;
}

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
  const [filter, setFilter] = useState('');
  const [treeWidth, setTreeWidth] = useState(
    () => Number(localStorage.getItem('magic2.treeWidth')) || 340);

  useEffect(() => {
    localStorage.setItem('magic2.treeWidth', String(treeWidth));
  }, [treeWidth]);
  const [selectedFile, setSelectedFile] = useState('');
  const [content, setContent] = useState('');
  const [dirty, setDirty] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);
  const [executeResult, setExecuteResult] = useState<RawResult | null>(null);
  const [openApiSpec, setOpenApiSpec] = useState<string | null>(null);
  const editorRef = useRef<import('codemirror').Editor | null>(null);
  const { confirm, prompt, form } = useDialog();

  // The folder that upload/new-file shortcuts operate on.
  const activeFolder = selectedFile ? parentOf(selectedFile) : '/';

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

  /*
   * Guard in-app navigation and browser unload while the file is dirty.
   */
  useEffect(() => {
    if (!dirty) {
      setNavGuard(null);
      return;
    }
    setNavGuard(() => confirm({
      title: 'Discard unsaved changes?',
      message: selectedFile + ' has unsaved changes.',
      confirmText: 'Discard',
      danger: true,
    }));
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      setNavGuard(null);
      window.removeEventListener('beforeunload', beforeUnload);
    };
  }, [dirty, selectedFile, confirm]);

  /*
   * When a filter is active, a file shows if its name matches, and a folder
   * shows if its name matches or it has a visible descendant — with every
   * visible folder force-expanded.
   */
  const query = filter.trim().toLowerCase();

  const visibleFiles = useMemo(() =>
    query ? files.filter(file => nameOf(file).toLowerCase().includes(query)) : files,
    [files, query]);

  const visibleFolders = useMemo(() => {
    if (!query) {
      return null;
    }
    const set = new Set<string>();
    const addWithAncestors = (folder: string) => {
      while (folder !== '/' && folder !== '') {
        set.add(folder);
        folder = parentOf(folder);
      }
    };
    for (const folder of folders) {
      if (nameOf(folder).toLowerCase().includes(query)) {
        addWithAncestors(folder);
      }
    }
    for (const file of visibleFiles) {
      addWithAncestors(parentOf(file));
    }
    return set;
  }, [folders, visibleFiles, query]);

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
    if (dirty && !await confirm({
      title: 'Discard unsaved changes?',
      message: selectedFile + ' has unsaved changes.',
      confirmText: 'Discard',
      danger: true,
    })) {
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

  /*
   * Executes the open file the way the old Hyper IDE does: extract its
   * [.arguments] collection, let the user parametrise the invocation, then
   * run it through evaluate-with-args — which also handles endpoint files.
   */
  async function execute() {
    if (!selectedFile.endsWith('.hl')) {
      return;
    }
    try {
      // Executing a selection runs just the selected code, like the old IDE.
      const selection = editorRef.current?.getSelection() ?? '';
      const code = selection !== '' ? selection : content;
      const argSpec = await getHyperlambdaArguments(code) ?? {};
      const names = Object.keys(argSpec);
      let args: any = null;
      if (names.length > 0) {
        const values = await form({
          title: 'Parametrise invocation',
          message: selectedFile,
          confirmText: 'Execute',
          fields: names.map(name => ({
            name,
            type: argSpec[name].type,
            mandatory: argSpec[name].mandatory,
          })),
        });
        if (!values) {
          return;
        }
        args = {};
        for (const name of names) {
          const value = values[name];
          if (value === undefined || value === '') {
            continue;
          }
          args[name] = convertArgument(value, argSpec[name].type);
        }
      }
      setExecuteResult(await evaluateWithArgs(code, args));
    } catch (err: any) {
      show(err.message, true);
    }
  }

  async function newFile(folder: string) {
    const name = await prompt({ title: 'New file', message: folder, label: 'File name' });
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
    const name = await prompt({ title: 'New folder', message: folder, label: 'Folder name' });
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
    if (!await confirm({
      title: 'Delete file?',
      message: path,
      confirmText: 'Delete',
      danger: true,
    })) {
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
    if (PROTECTED_FOLDERS.includes(path)) {
      show('You cannot delete the ' + path + ' folder', true);
      return;
    }
    if (!await confirm({
      title: 'Delete folder?',
      message: path + ' and everything in it will be deleted.',
      confirmText: 'Delete',
      danger: true,
    })) {
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
    if (isFolder && PROTECTED_FOLDERS.includes(path)) {
      show('You cannot rename the ' + path + ' folder', true);
      return;
    }
    const oldName = nameOf(path);
    const name = await prompt({
      title: 'Rename',
      message: path,
      label: 'New name',
      initial: oldName,
    });
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
    const childFolders = folders.filter(folder =>
      parentOf(folder) === path && (!visibleFolders || visibleFolders.has(folder)));
    const childFiles = visibleFiles.filter(file => parentOf(file) === path);
    const isOpen = (folder: string) => query ? true : expanded.has(folder);
    return (
      <div className={'tree-children' + (path === '/' ? ' root' : '')}>
        {childFolders.map(folder => (
          <div className="tree-node" key={folder}>
            <div
              className={'tree-row' + (isSystemPath(folder) ? ' system' : '')}
              title={folder}
              onClick={() => toggle(folder)}>
              <span className="tree-chevron">
                <ChevronIcon open={isOpen(folder)} />
              </span>
              <span className="tree-icon folder"><FolderIcon /></span>
              <span className="tree-name">{nameOf(folder)}</span>
              <FolderActions
                onNewFile={() => newFile(folder)}
                onNewFolder={() => newFolder(folder)}
                onRename={() => rename(folder, true)}
                onDelete={() => removeFolder(folder)} />
            </div>
            {isOpen(folder) && renderChildren(folder)}
          </div>
        ))}
        {childFiles.map(file => (
          <div
            className={'tree-row' + (file === selectedFile ? ' selected' : '')}
            key={file}
            title={file}
            onClick={() => openFile(file)}>
            <span className="tree-chevron" />
            <span className="tree-icon"><FileIcon /></span>
            <span className="tree-name">{nameOf(file)}</span>
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
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div>
          <h1>Hyper IDE</h1>
          <p>Browse and edit any file on your server</p>
        </div>
        <span className="spacer" style={{ flex: 1 }} />
        <span className="mono">
          {selectedFile || 'No file open'}{dirty ? ' •' : ''}
        </span>
        {selectedFile && (
          <>
            <button
              className="btn btn-secondary btn-small"
              title="Copy path"
              onClick={() => {
                navigator.clipboard.writeText(selectedFile);
                show('Path copied to clipboard');
              }}>
              Copy path
            </button>
            <button
              className="btn btn-secondary btn-small"
              title="Download file"
              onClick={async () => {
                try {
                  const raw = await downloadFileRaw(selectedFile);
                  downloadBlob(
                    raw.blob,
                    dispositionFilename(raw.disposition) ?? nameOf(selectedFile));
                } catch (err: any) {
                  show(err.message, true);
                }
              }}>
              Download
            </button>
          </>
        )}
        {/\.(get|post|put|delete|patch)\.hl$/.test(selectedFile) && (
          <button
            className="btn btn-secondary btn-small"
            onClick={async () => {
              try {
                const spec = await getOpenApiSpec(activeFolder);
                setOpenApiSpec(JSON.stringify(spec, null, 2));
              } catch (err: any) {
                show(err.message, true);
              }
            }}>
            OpenAPI
          </button>
        )}
        {selectedFile.endsWith('.hl') &&
          <button className="btn btn-secondary btn-small" onClick={execute}>▷ Execute</button>}
        <button className="btn btn-small" onClick={save} disabled={!selectedFile || !dirty}>
          Save
        </button>
      </div>
      {feedback && (
        <div
          className={feedback.isError ? 'error-box' : 'success-box'}
          style={{ marginBottom: 12 }}>
          {feedback.text}
        </div>
      )}
      <div className="files-layout">
        <div className="file-tree" style={{ width: treeWidth }}>
          <input
            type="text"
            className="tree-filter"
            placeholder="Filter files…"
            value={filter}
            onChange={e => setFilter(e.target.value)} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 4px 8px' }}>
            <label
              style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}
              title="Also show /system/, /misc/, /data/ and /config/ — be careful!">
              <input
                type="checkbox"
                checked={systemFiles}
                onChange={e => setSystemFiles(e.target.checked)} />
              Show system files
            </label>
            <button className="icon-btn" title="New file in /" onClick={() => newFile('/')}>
              <FilePlusIcon />
            </button>
            <button className="icon-btn" title="New folder in /" onClick={() => newFolder('/')}>
              <FolderPlusIcon />
            </button>
            <label className="icon-btn" title={'Upload files to ' + activeFolder}>
              <UploadIcon />
              <input
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={async e => {
                  const files = Array.from(e.target.files ?? []);
                  e.target.value = '';
                  try {
                    for (const file of files) {
                      await uploadFile(activeFolder, file);
                    }
                    show('Uploaded ' + files.length + ' file(s) to ' + activeFolder);
                    await loadTree(systemFiles);
                  } catch (err: any) {
                    show(err.message, true);
                  }
                }} />
            </label>
            <button
              className="icon-btn"
              title={'Download ' + activeFolder + ' as zip'}
              onClick={async () => {
                try {
                  const raw = await downloadFolderRaw(activeFolder);
                  downloadBlob(
                    raw.blob,
                    dispositionFilename(raw.disposition) ?? 'folder.zip');
                } catch (err: any) {
                  show(err.message, true);
                }
              }}>
              <DownloadIcon />
            </button>
          </div>
          {renderChildren('/')}
        </div>
        <div
          className="splitter"
          onMouseDown={event => {
            event.preventDefault();
            const startX = event.clientX;
            const startWidth = treeWidth;
            const move = (ev: MouseEvent) =>
              setTreeWidth(Math.max(220, Math.min(640, startWidth + ev.clientX - startX)));
            const up = () => {
              window.removeEventListener('mousemove', move);
              window.removeEventListener('mouseup', up);
            };
            window.addEventListener('mousemove', move);
            window.addEventListener('mouseup', up);
          }} />
        <div className="file-editor">
          {selectedFile ? (
            <CodeEditor
              value={content}
              onChange={value => { setContent(value); setDirty(true); }}
              mode={modeForFile(selectedFile)}
              onSave={save}
              onExecute={execute}
              onInstance={instance => { editorRef.current = instance; }}
              onAction={action => {
                switch (action) {
                  case 'newFile': newFile(activeFolder); break;
                  case 'newFolder': newFolder(activeFolder); break;
                  case 'renameFile': rename(selectedFile, false); break;
                  case 'deleteFile': removeFile(selectedFile); break;
                  case 'deleteFolder': removeFolder(activeFolder); break;
                  case 'close':
                    if (!dirty) {
                      setSelectedFile('');
                      setContent('');
                    }
                    break;
                }
              }} />
          ) : (
            <div className="card muted" style={{ flex: 1 }}>
              Select a file in the tree to start editing.
            </div>
          )}
        </div>
      </div>
      {openApiSpec !== null && (
        <Modal width={800} onClose={() => setOpenApiSpec(null)}>
          <h2>OpenAPI specification — {activeFolder}</h2>
          <div style={{ height: '55vh', display: 'flex', flexDirection: 'column' }}>
            <CodeEditor value={openApiSpec} mode="application/json" readOnly />
          </div>
          <div className="modal-actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                navigator.clipboard.writeText(openApiSpec);
                show('Specification copied to clipboard');
              }}>
              Copy JSON
            </button>
            <button className="btn" onClick={() => setOpenApiSpec(null)}>Close</button>
          </div>
        </Modal>
      )}
      {executeResult !== null && (
        <Modal width={860} onClose={() => setExecuteResult(null)}>
          <h2>Execution result</h2>
          <ResultViewer result={executeResult} />
          <div className="modal-actions">
            <button className="btn" onClick={() => setExecuteResult(null)}>Close</button>
          </div>
        </Modal>
      )}
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
    <span className="row-actions" onClick={e => e.stopPropagation()}>
      <button className="icon-btn" title="New file" onClick={props.onNewFile}><FilePlusIcon /></button>
      <button className="icon-btn" title="New folder" onClick={props.onNewFolder}><FolderPlusIcon /></button>
      {props.onRename &&
        <button className="icon-btn" title="Rename" onClick={props.onRename}><PencilIcon /></button>}
      {props.onDelete &&
        <button className="icon-btn danger" title="Delete" onClick={props.onDelete}><TrashIcon /></button>}
    </span>
  );
}

function FileActions(props: {
  onRename: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  return (
    <span className="row-actions">
      <button className="icon-btn" title="Rename" onClick={props.onRename}><PencilIcon /></button>
      <button className="icon-btn danger" title="Delete" onClick={props.onDelete}><TrashIcon /></button>
    </span>
  );
}
