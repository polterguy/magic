import Banner from '../components/Banner';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AiPrompt from '../components/AiPrompt';
import CodeEditor, { modeForFile } from '../components/CodeEditor';
import ResultViewer, { RawResult } from '../components/ResultViewer';
import {
  BracesIcon,
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
import OpenApiDialog from '../components/OpenApiDialog';
import { useUnsavedGuard } from '../lib/navGuard';
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
 * AI context for the prompt bar, same rules as the old ide-editor: an empty
 * file gets a return-only-code system message, a non-empty file asks the AI
 * to modify the existing code.
 */
function aiContextForFile(path: string, content: string) {
  if (content.length > 0) {
    return '\n\nChange or modify this code according to instructions in the next message:\n\n' +
      content;
  }
  if (path.endsWith('.hl')) {
    return 'You are a Hyperlambda software developer AI assistant and you will return ONLY ' +
      'CODE! No ``` characters, or explanations, ONLY the code! In the next message you will ' +
      'be given a natural language query being a request from the user. Return only the RAW ' +
      "code that solves the user' problem";
  }
  return 'You are a software developer AI assistant and you will return ONLY CODE! No ``` ' +
    'characters, or explanations, ONLY the code! In the next message you will be given a ' +
    'natural language query being a request from the user. Return only the RAW code that ' +
    "solves the user' problem";
}

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
  /*
   * Every open file, in the order they were opened. A file is dirty when its
   * content differs from what was last loaded or saved.
   */
  const [openFiles, setOpenFiles] = useState<{ path: string; content: string; saved: string }[]>([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);
  const [executeResult, setExecuteResult] = useState<RawResult | null>(null);
  const [openApiSpec, setOpenApiSpec] = useState<{ json: string; target: string } | null>(null);
  const editorRef = useRef<import('codemirror').Editor | null>(null);
  const { confirm, prompt, form, choice } = useDialog();

  const current = openFiles.find(file => file.path === selectedFile) ?? null;
  const content = current?.content ?? '';
  const dirty = !!current && current.content !== current.saved;
  const dirtyFiles = openFiles.filter(file => file.content !== file.saved);

  // The folder that upload/new-file shortcuts operate on.
  const activeFolder = selectedFile ? parentOf(selectedFile) : '/';

  // Keeps the active tab visible when many files are open.
  useEffect(() => {
    document.querySelector('.file-tab.active')?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }, [selectedFile]);

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

  // Guard in-app navigation and browser unload while any open file is dirty.
  const dirtyPaths = dirtyFiles.map(file => file.path).join(', ');
  useUnsavedGuard(!!dirtyPaths, dirtyPaths + ' has unsaved changes.');

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
    if (openFiles.some(file => file.path === path)) {
      setSelectedFile(path);
      return;
    }
    try {
      const text = await loadFile(path);
      setOpenFiles(current => [...current, { path, content: text, saved: text }]);
      setSelectedFile(path);
    } catch (err: any) {
      show(err.message, true);
    }
  }

  function updateContent(value: string) {
    setOpenFiles(files => files.map(file =>
      file.path === selectedFile ? { ...file, content: value } : file));
  }

  async function save() {
    const file = openFiles.find(candidate => candidate.path === selectedFile);
    if (!file) {
      return;
    }
    try {
      await saveFile(file.path, file.content);
      setOpenFiles(files => files.map(candidate =>
        candidate.path === file.path ? { ...candidate, saved: file.content } : candidate));
      show('Saved ' + file.path);
    } catch (err: any) {
      show(err.message, true);
    }
  }

  /*
   * Closes an open file — if it has unsaved changes the user chooses between
   * saving it, closing without saving, or aborting the close.
   */
  async function closeFile(path: string) {
    const file = openFiles.find(candidate => candidate.path === path);
    if (!file) {
      return;
    }
    if (file.content !== file.saved) {
      const answer = await choice({
        title: 'Unsaved changes',
        message: path + ' has unsaved changes.',
        buttons: [
          { label: 'Save and close', value: 'save', kind: 'primary' },
          { label: 'Close without saving', value: 'discard', kind: 'danger' },
          { label: 'Cancel', value: 'cancel' },
        ],
      });
      if (!answer || answer === 'cancel') {
        return;
      }
      if (answer === 'save') {
        try {
          await saveFile(path, file.content);
        } catch (err: any) {
          show(err.message, true);
          return;
        }
      }
    }
    const remaining = openFiles.filter(candidate => candidate.path !== path);
    setOpenFiles(remaining);
    if (selectedFile === path) {
      setSelectedFile(remaining.length > 0 ? remaining[remaining.length - 1].path : '');
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
      const remaining = openFiles.filter(candidate => candidate.path !== path);
      setOpenFiles(remaining);
      if (selectedFile === path) {
        setSelectedFile(remaining.length > 0 ? remaining[remaining.length - 1].path : '');
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
      // Remap open files affected by the rename — the file itself, or
      // everything inside a renamed folder.
      const remap = (candidate: string) => isFolder
        ? (candidate.startsWith(path) ? newPath + candidate.substring(path.length) : candidate)
        : (candidate === path ? newPath : candidate);
      setOpenFiles(files => files.map(file => ({ ...file, path: remap(file.path) })));
      setSelectedFile(remap(selectedFile));
      await loadTree(systemFiles);
    } catch (err: any) {
      show(err.message, true);
    }
  }

  // Shows the OpenAPI specification for a file (single endpoint) or folder (all endpoints inside it).
  async function showOpenApi(target: string) {
    try {
      const spec = await getOpenApiSpec(target);
      setOpenApiSpec({ json: JSON.stringify(spec, null, 2), target });
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
                onOpenApi={() => showOpenApi(folder)}
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
            title="OpenAPI specification for this endpoint"
            onClick={() => showOpenApi(selectedFile)}>
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
        <Banner
          isError={feedback.isError}
          onClose={() => setFeedback(null)}
          style={{ marginBottom: 12 }}>
          {feedback.text}
        </Banner>
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
          {openFiles.length > 0 && (
            <div className="file-tabs">
              {openFiles.map(file => (
                <div
                  key={file.path}
                  className={'file-tab' + (file.path === selectedFile ? ' active' : '')}
                  title={file.path}
                  onClick={() => setSelectedFile(file.path)}>
                  <span className="file-tab-name">
                    {nameOf(file.path)}
                    {file.content !== file.saved && <span className="file-tab-dirty" />}
                  </span>
                  <button
                    className="file-tab-close"
                    title="Close"
                    onClick={event => { event.stopPropagation(); closeFile(file.path); }}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {current ? (
            <CodeEditor
              key={selectedFile}
              value={content}
              onChange={updateContent}
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
                  case 'close': closeFile(selectedFile); break;
                }
              }} />
          ) : (
            <div className="card muted" style={{ flex: 1 }}>
              Select a file in the tree to start editing.
            </div>
          )}
          {current && (
            <AiPrompt
              fileType={selectedFile.substring(selectedFile.lastIndexOf('.') + 1)}
              getContext={() => aiContextForFile(selectedFile, content)}
              session={selectedFile}
              onResult={updateContent}
              onError={message => show(message, true)}
              style={{ marginTop: 8 }} />
          )}
        </div>
      </div>
      {openApiSpec !== null && (
        <OpenApiDialog
          json={openApiSpec.json}
          target={openApiSpec.target}
          onClose={() => setOpenApiSpec(null)}
          onNotify={show} />
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
  onOpenApi?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
}) {
  return (
    <span className="row-actions" onClick={e => e.stopPropagation()}>
      <button className="icon-btn" title="New file" onClick={props.onNewFile}><FilePlusIcon /></button>
      <button className="icon-btn" title="New folder" onClick={props.onNewFolder}><FolderPlusIcon /></button>
      {props.onOpenApi &&
        <button className="icon-btn" title="OpenAPI specification" onClick={props.onOpenApi}><BracesIcon /></button>}
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
