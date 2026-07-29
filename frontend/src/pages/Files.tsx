import SearchInput from '../components/SearchInput';
import Select from '../components/Select';
import { copyToClipboard, showToast } from '../lib/toast';
import { explainHyperlambda } from '../lib/support';
import Banner from '../components/Banner';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AiPrompt from '../components/AiPrompt';
import CodeEditor, { modeForFile } from '../components/CodeEditor';
import AiWaiter from '../components/AiWaiter';
import InvokePanel, { InvokeResult } from '../components/InvokePanel';
import ResponseDialog from '../components/ResponseDialog';
import {
  BracesIcon,
  ChevronIcon,
  CopyIcon,
  DownloadIcon,
  EyeIcon,
  ModuleUploadIcon,
  SparkIcon,
  FileIcon,
  FilePlusIcon,
  FolderIcon,
  FolderPlusIcon,
  PencilIcon,
  PlayIcon,
  SaveIcon,
  TrashIcon,
  UploadIcon,
} from '../components/Icons';
import { Modal, useDialog } from '../components/Dialogs';
import OpenApiDialog from '../components/OpenApiDialog';
import { useUnsavedGuard } from '../lib/navGuard';
import { useAuth } from '../lib/AuthContext';
import {
  Endpoint,
  createFolder,
  deleteFile,
  deleteFolder,
  downloadFileRaw,
  downloadFolderRaw,
  evaluateWithArgs,
  getFunctionDeclaration,
  getHyperlambdaArguments,
  getOpenApiSpec,
  aiQuery,
  aiContextForFile,
  installModule,
  listEndpoints,
  listFilesRecursively,
  listFoldersRecursively,
  loadFile,
  mlSnippetCreate,
  mlTypes,
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
 * Lets the user pick which AI model a generated function should be added to,
 * the way the old dashboard's select-model dialog does.
 */
function SelectModelDialog(props: {
  target: string;
  onClose: () => void;
  onSelected: (type: string) => void;
}) {

  const [types, setTypes] = useState<any[]>([]);
  const [type, setType] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    mlTypes()
      .then(list => {
        setTypes(list ?? []);
        setType(list?.[0]?.type ?? '');
      })
      .catch(err => setError(err.message));
  }, []);

  return (
    <Modal width={520} onClose={props.onClose}>
      <h2>Create AI function</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Adds {props.target} as an AI function to the model you select.
      </p>
      {error && <Banner onClose={() => setError('')} style={{ marginBottom: 10 }}>{error}</Banner>}
      <label className="modal-label">
        Model
        <Select value={type} onChange={value => setType(value)}>
          {types.map(candidate => (
            <option key={candidate.type} value={candidate.type}>{candidate.type}</option>
          ))}
        </Select>
      </label>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        <button className="btn" onClick={() => props.onSelected(type)} disabled={!type}>
          Create
        </button>
      </div>
    </Modal>
  );
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

/*
 * Whether a file is served as an HTTP endpoint, mirroring what the backend
 * itself enforces (magic.endpoint's Utilities.IsLegalAPIRequest and
 * ListEndpoints):
 *
 *   - the relative path splits into exactly three dot-separated parts, so
 *     "modules/x/foo.get.hl" qualifies but "modules/x.y/foo.get.hl" does not
 *     — a dot anywhere outside the filename makes the URL unroutable
 *   - the middle part is an HTTP verb (socket files are listed but can't be
 *     invoked over HTTP, so they're excluded here)
 *   - it lives under modules/ or system/; everything else answers 401
 *
 * Its route is the path with ".<verb>.hl" stripped, under "magic/".
 */
const ENDPOINT_VERBS = ['get', 'post', 'put', 'patch', 'delete'];

function endpointOf(path: string): { path: string; verb: string } | null {
  const relative = path.replace(/^\/+/, '');
  if (!relative.startsWith('modules/') && !relative.startsWith('system/')) {
    return null;
  }
  const parts = relative.split('.');
  if (parts.length !== 3 || parts[2] !== 'hl' || !ENDPOINT_VERBS.includes(parts[1])) {
    return null;
  }
  return { path: 'magic/' + parts[0], verb: parts[1] };
}

/*
 * Everything under /etc/www is served as the cloudlet's public website, so
 * those files can be opened in a browser exactly as a visitor sees them —
 * HTML through its Hyperlambda codebehind if it has one, images and the rest
 * statically. Hyperlambda files and hidden paths are never served, matching
 * the backend's own guard, so they get no preview.
 */
const WWW_ROOT = '/etc/www';

function previewUrl(path: string): string | null {
  if (!path.startsWith(WWW_ROOT + '/') || path.endsWith('.hl')) {
    return null;
  }
  const relative = path.substring(WWW_ROOT.length);
  /*
   * Hidden paths are not served — except .well-known, which the backend
   * exempts because discovery documents have to be publicly reachable.
   */
  if (relative.split('/').some(entity =>
      entity.startsWith('.') && entity !== '.well-known')) {
    return null;
  }
  return relative;
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
  // Set by clicking a folder; null means "follow whichever file is open".
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [executeResult, setExecuteResult] = useState<InvokeResult | null>(null);
  // Set when the result came from invoking an endpoint rather than evaluating.
  const [resultWasHttp, setResultWasHttp] = useState(false);
  const [generating, setGenerating] = useState(false);
  // Generating needs something selected to send, so the button follows it.
  const [hasSelection, setHasSelection] = useState(false);
  const [openApiSpec, setOpenApiSpec] = useState<{ json: string; target: string } | null>(null);
  // The endpoint whose invoker dialog is open, when executing an endpoint file.
  const [invokeTarget, setInvokeTarget] = useState<Endpoint | null>(null);
  // File or folder awaiting a model choice for AI-function generation.
  const [aiFunctionTarget, setAiFunctionTarget] = useState<string | null>(null);
  const editorRef = useRef<import('codemirror').Editor | null>(null);
  const { confirm, prompt, form, choice } = useDialog();
  const { backend } = useAuth();

  const current = openFiles.find(file => file.path === selectedFile) ?? null;
  const content = current?.content ?? '';
  const dirty = !!current && current.content !== current.saved;
  const dirtyFiles = openFiles.filter(file => file.content !== file.saved);

  /*
   * The folder that upload, download, new-file and new-folder act on.
   *
   * State rather than something derived from the open file: clicking a folder
   * in the tree has to move it, and deriving it meant expanding a folder left
   * these actions pointing at wherever the open file happened to live - or at
   * the root when nothing was open at all.
   */
  const activeFolder = openFolder ?? (selectedFile ? parentOf(selectedFile) : '/');

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
      showToast(err.message, true);
    }
  }, []);

  useEffect(() => {
    loadTree(systemFiles);
  }, [loadTree, systemFiles]);

  // Guard in-app navigation and browser unload while any open file is dirty.
  const dirtyPaths = dirtyFiles.map(file => file.path).join(', ');
  useUnsavedGuard(!!dirtyPaths, dirtyPaths + ' has unsaved changes.');

  /*
   * When a filter is active, anything whose full path contains it shows —
   * matching on the path rather than the name alone, so filtering on a folder
   * ("file-system") also brings up everything inside it. Folders additionally
   * show when they have a visible descendant, and every visible folder is
   * force-expanded.
   */
  const query = filter.trim().toLowerCase();

  const visibleFiles = useMemo(() =>
    query ? files.filter(file => file.toLowerCase().includes(query)) : files,
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
      if (folder.toLowerCase().includes(query)) {
        addWithAncestors(folder);
      }
    }
    for (const file of visibleFiles) {
      addWithAncestors(parentOf(file));
    }
    return set;
  }, [folders, visibleFiles, query]);

  /*
   * Toasts rather than an inline banner: a banner is part of the layout, so
   * showing one pushed the editor down and made it jump under the cursor.
   * Toasts float over the page and leave the editor where it is.
   */
  function show(text: string, isError = false) {
    showToast(text, isError);
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
   * Executes the open file. An endpoint file is invoked as the endpoint it
   * is, through real HTTP — that's the only way to reach one that takes
   * files or returns them, since the evaluator's body is JSON. Everything
   * else runs through evaluate-with-args on the editor's current text.
   */
  async function execute() {
    if (!selectedFile.endsWith('.hl')) {
      return;
    }
    const endpoint = endpointOf(selectedFile);
    if (endpoint) {
      await invokeAsEndpoint(endpoint);
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
      setResultWasHttp(false);
      setExecuteResult(await evaluateWithArgs(code, args));
    } catch (err: any) {
      show(err.message, true);
    }
  }

  /*
   * Whatever is selected is the specification, and nothing else is sent —
   * no surrounding code, no arguments. The generator answers with a whole
   * file, so its answer becomes the whole file: replacing only the selection
   * would leave the old code sitting around it, duplicated.
   */
  async function generateFromSelection() {
    const selection = editorRef.current?.getSelection() ?? '';
    if (selection.trim() === '') {
      return;
    }
    setGenerating(true);
    try {
      const response = await aiQuery(selection, 'hl');
      updateContent(response.result);
    } catch (err: any) {
      show(err.message, true);
    } finally {
      setGenerating(false);
    }
  }

  /*
   * Invoking hits the server, which knows only what was last saved — so an
   * unsaved buffer would be silently ignored. Offer to save first rather
   * than testing yesterday's code.
   */
  async function invokeAsEndpoint(endpoint: { path: string; verb: string }) {
    if (current && current.content !== current.saved) {
      const answer = await confirm({
        title: 'Save before invoking?',
        message: selectedFile + ' has unsaved changes. Invoking runs the file ' +
          'as it is on the server, so unsaved changes are not included.',
        confirmText: 'Save and invoke',
      });
      if (!answer) {
        return;
      }
      await save();
    }
    try {
      const all = await listEndpoints();
      const meta = all.find((candidate: Endpoint) =>
        candidate.path === endpoint.path &&
        candidate.verb.toLowerCase() === endpoint.verb);
      if (!meta) {
        show('The server does not list ' + endpoint.verb.toUpperCase() + ' ' +
          endpoint.path + ' as an endpoint', true);
        return;
      }
      setInvokeTarget(meta);
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
      /*
       * Close every file open from the deleted folder — including any with
       * unsaved changes. Deleting the folder already throws its contents away,
       * so asking per dirty file would be nonsensical; the folder-level
       * confirmation above is the one and only "are you sure".
       */
      const remaining = openFiles.filter(file => !file.path.startsWith(path));
      setOpenFiles(remaining);
      if (selectedFile.startsWith(path)) {
        setSelectedFile(remaining.length > 0 ? remaining[remaining.length - 1].path : '');
      }
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
      /*
       * The rename endpoint is asymmetric: for a folder it moves to [newName]
       * verbatim (needs the full path), but for a file it rebuilds the target as
       * folder(oldName) + [newName] — so a file must pass ONLY its new bare name,
       * or the old folder gets concatenated twice into a non-existent path.
       */
      await renamePath(path, isFolder ? newPath : name);
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

  /*
   * Turns a single Hyperlambda file, or every Hyperlambda file inside a
   * folder, into AI functions on the chosen model. Files without an
   * [.arguments] collection can't be invoked as functions, so they're
   * skipped — the count reports what was actually generated.
   */
  async function createAiFunctions(target: string, type: string) {
    setAiFunctionTarget(null);
    try {
      const targets = target.endsWith('.hl')
        ? [target]
        : (await listFilesRecursively(target, systemFiles) ?? [])
            .filter(file => file.endsWith('.hl'));
      let generated = 0;
      for (const file of targets) {
        const declaration = await getFunctionDeclaration(file);
        if (!declaration) {
          continue;
        }
        const lines = declaration.split('\n');
        await mlSnippetCreate({
          prompt: lines[0].trim(),
          completion: lines.slice(1).join('\n').trim(),
          type,
          meta: 'FUNCTION_INVOCATION ==> ' + file,
        });
        generated++;
      }
      show(generated + ' AI function(s) generated on ' + type +
        (generated < targets.length
          ? ' — ' + (targets.length - generated) + ' file(s) skipped, no [.arguments]'
          : ''));
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
              className={'tree-row'
                + (isSystemPath(folder) ? ' system' : '')
                + (folder === activeFolder ? ' active-folder' : '')}
              title={folder}
              onClick={() => { toggle(folder); setOpenFolder(folder); }}>
              <span className="tree-chevron">
                <ChevronIcon open={isOpen(folder)} />
              </span>
              <span className="tree-icon folder"><FolderIcon /></span>
              <span className="tree-name">{nameOf(folder)}</span>
              <FolderActions
                onNewFile={() => newFile(folder)}
                onNewFolder={() => newFolder(folder)}
                onOpenApi={() => showOpenApi(folder)}
                // Only modules hold endpoints worth exposing as AI functions.
                onAiFunctions={folder.startsWith('/modules/')
                  ? () => setAiFunctionTarget(folder)
                  : undefined}
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
            onClick={() => { setOpenFolder(null); openFile(file); }}>
            <span className="tree-chevron" />
            <span className="tree-icon"><FileIcon /></span>
            <span className="tree-name">{nameOf(file)}</span>
            <FileActions
              onPreview={previewUrl(file)
                ? e => {
                    e.stopPropagation();
                    window.open(backend!.url + previewUrl(file), '_blank', 'noopener');
                  }
                : undefined}
              onAiFunction={file.endsWith('.hl')
                ? e => { e.stopPropagation(); setAiFunctionTarget(file); }
                : undefined}
              onRename={e => { e.stopPropagation(); rename(file, false); }}
              onDelete={e => { e.stopPropagation(); removeFile(file); }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="page-header ide-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div>
          <h1>Hyper IDE</h1>
          <p>Browse and edit any file on your server</p>
        </div>
        <span className="spacer" style={{ flex: 1 }} />
        <span className="mono ide-path">
          {selectedFile || 'No file open'}{dirty ? ' •' : ''}
        </span>
        {selectedFile && (
          <>
            <button
              className="btn btn-secondary btn-small"
              title="Copy path"
              onClick={() => {
                copyToClipboard(selectedFile, 'The path');
              }}>
              <CopyIcon />
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
              <DownloadIcon />
              Download
            </button>
          </>
        )}
        {endpointOf(selectedFile) && (
          <button
            className="btn btn-secondary btn-small"
            title="OpenAPI specification for this endpoint"
            onClick={() => showOpenApi(selectedFile)}>
            <BracesIcon />
            OpenAPI
          </button>
        )}
        {selectedFile.endsWith('.hl') && (
          <button
            className="btn btn-secondary btn-small"
            title="Run the selected text through the Hyperlambda generator"
            onClick={generateFromSelection}
            disabled={generating || !hasSelection}>
            <SparkIcon />
            {generating ? 'Generating…' : 'Generate'}
          </button>
        )}
        {selectedFile.endsWith('.hl') && (
          <button className="btn btn-secondary btn-small" onClick={execute}>
            <PlayIcon />
            Execute
          </button>
        )}
        <button className="btn btn-small" onClick={save} disabled={!selectedFile || !dirty}>
          <SaveIcon />
          Save
        </button>
      </div>
      <div className="files-layout">
        <div className="file-tree" style={{ width: treeWidth }}>
          <SearchInput
            placeholder="Filter files…"
            value={filter}
            onChange={setFilter}
            style={{ width: '100%', marginBottom: 8 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 4px 8px' }}>
            <label
              style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}
              title="Also show /system/, /misc/, /data/ and /config/ — be careful!">
              <input
                type="checkbox"
                checked={systemFiles}
                onChange={e => setSystemFiles(e.target.checked)} />
              System files
            </label>
            <button
              className="icon-btn"
              title={'New file in ' + activeFolder}
              onClick={() => newFile(activeFolder)}>
              <FilePlusIcon />
            </button>
            <button
              className="icon-btn"
              title={'New folder in ' + activeFolder}
              onClick={() => newFolder(activeFolder)}>
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
            <label className="icon-btn" title="Install module from a ZIP file…">
              <ModuleUploadIcon />
              <input
                type="file"
                accept=".zip"
                style={{ display: 'none' }}
                onChange={async e => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) {
                    return;
                  }
                  /*
                   * The archive's name becomes the module's folder name, so
                   * the backend rejects anything but "<name>.zip".
                   */
                  if (!/^[a-z0-9_-]+\.zip$/.test(file.name)) {
                    show(
                      file.name + ' cannot be a module name — it must be ' +
                      '<name>.zip, using only lowercase letters, digits, ' +
                      'hyphens or underscores, and no further dots',
                      true);
                    return;
                  }
                  try {
                    await installModule(file);
                    show('Module ' + file.name.replace(/\.zip$/, '') + ' installed');
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
              // Only Hyperlambda — the support bot answers about that.
              onHelp={selectedFile.endsWith('.hl') ? explainHyperlambda : undefined}
              onInstance={instance => {
                if (editorRef.current === instance) {
                  return;
                }
                editorRef.current = instance;
                setHasSelection(instance.somethingSelected());
                instance.on('cursorActivity', () =>
                  setHasSelection(instance.somethingSelected()));
              }}
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
      {aiFunctionTarget !== null && (
        <SelectModelDialog
          target={aiFunctionTarget}
          onClose={() => setAiFunctionTarget(null)}
          onSelected={type => createAiFunctions(aiFunctionTarget, type)} />
      )}
      {openApiSpec !== null && (
        <OpenApiDialog
          json={openApiSpec.json}
          target={openApiSpec.target}
          onClose={() => setOpenApiSpec(null)}
          onNotify={show} />
      )}
      {generating && <AiWaiter />}
      {invokeTarget && (
        <Modal width={860} onClose={() => setInvokeTarget(null)}>
          <h2 style={{ marginTop: 0 }}>
            {invokeTarget.verb.toUpperCase()} {invokeTarget.path}
          </h2>
          <InvokePanel
            endpoint={invokeTarget}
            /*
             * The invoker stays mounted behind the response, so closing the
             * response returns to the same form with its arguments still
             * filled in — tweak one and invoke again.
             */
            onResult={result => {
              setResultWasHttp(true);
              setExecuteResult(result);
            }}
            onOpenApi={() => showOpenApi(selectedFile)} />
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setInvokeTarget(null)}>
              Close
            </button>
          </div>
        </Modal>
      )}
      {executeResult !== null && (
        <ResponseDialog
          result={executeResult}
          httpInvocation={resultWasHttp}
          onClose={() => setExecuteResult(null)} />
      )}
    </>
  );
}

function FolderActions(props: {
  onNewFile: () => void;
  onNewFolder: () => void;
  onOpenApi?: () => void;
  onAiFunctions?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
}) {
  return (
    <span className="row-actions" onClick={e => e.stopPropagation()}>
      <button className="icon-btn" title="New file" onClick={props.onNewFile}><FilePlusIcon /></button>
      <button className="icon-btn" title="New folder" onClick={props.onNewFolder}><FolderPlusIcon /></button>
      {props.onOpenApi &&
        <button className="icon-btn" title="OpenAPI specification" onClick={props.onOpenApi}><BracesIcon /></button>}
      {props.onAiFunctions && (
        <button
          className="icon-btn"
          title="Create AI functions for all Hyperlambda files in folder…"
          onClick={props.onAiFunctions}>
          <SparkIcon />
        </button>
      )}
      {props.onRename &&
        <button className="icon-btn" title="Rename" onClick={props.onRename}><PencilIcon /></button>}
      {props.onDelete &&
        <button className="icon-btn danger" title="Delete" onClick={props.onDelete}><TrashIcon /></button>}
    </span>
  );
}

function FileActions(props: {
  onPreview?: (e: React.MouseEvent) => void;
  onAiFunction?: (e: React.MouseEvent) => void;
  onRename: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  return (
    <span className="row-actions">
      {props.onPreview && (
        <button
          className="icon-btn"
          title="Open in a browser, as a visitor sees it"
          onClick={props.onPreview}>
          <EyeIcon />
        </button>
      )}
      {props.onAiFunction && (
        <button
          className="icon-btn"
          title="Create AI function for this file…"
          onClick={props.onAiFunction}>
          <SparkIcon />
        </button>
      )}
      <button className="icon-btn" title="Rename" onClick={props.onRename}><PencilIcon /></button>
      <button className="icon-btn danger" title="Delete" onClick={props.onDelete}><TrashIcon /></button>
    </span>
  );
}
