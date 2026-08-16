import SearchInput from '../components/SearchInput';
import { useSearchParams } from 'react-router-dom';
import { copyToClipboard, showToast } from '../lib/toast';
import { explainHyperlambda } from '../lib/support';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AiPrompt from '../components/AiPrompt';
import CodeEditor, { modeForFile } from '../components/CodeEditor';
import AiWaiter from '../components/AiWaiter';
import InvokePanel, { InvokeResult } from '../components/InvokePanel';
import ResponseDialog from '../components/ResponseDialog';
import DebugDialog from '../components/DebugDialog';
import type { DebugRecording } from '../lib/api';
import { BracesIcon, CopyIcon, DownloadIcon, FilePlusIcon, FolderPlusIcon, ModuleUploadIcon, PlayIcon, SaveIcon, SparkIcon, UploadIcon } from '../components/Icons';
import { Modal, useDialog } from '../components/Dialogs';
import OpenApiDialog from '../components/OpenApiDialog';
import GitPanel from '../components/GitPanel';
import { useUnsavedGuard } from '../lib/navGuard';
import { useAuth } from '../lib/AuthContext';
import {
  Endpoint,
  createFolder,
  deleteFile,
  deleteFolder,
  downloadFileRaw,
  downloadFolderRaw,
  debugHyperlambda,
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
  moduleNameFromZip,
  renamePath,
  saveFile,
  uploadFile,
} from '../lib/api';
import { dispositionFilename, downloadBlob } from '../components/ResultViewer';
import FileTabs from './files/FileTabs';
import FileTree from './files/FileTree';
import SelectModelDialog from './files/SelectModelDialog';
import { nameOf, parentOf } from './files/paths';

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

export default function Files() {

  const { backend } = useAuth();

  /*
   * The remembered workspace shape — open-file paths in tab order, the
   * selection, expanded folders and the sys toggle — kept per backend, since
   * every cloudlet has its own files. Read once at mount; the persist effect
   * below keeps it current. File CONTENTS are deliberately not remembered:
   * restored tabs re-load fresh from the server, so a restored workspace
   * never resurrects stale edits, and a file deleted server-side simply
   * doesn't come back.
   */
  const workspaceKey = 'magic2.ide.workspace.' + (backend?.url ?? '');
  const [workspace] = useState<{
    open?: string[];
    selected?: string;
    expanded?: string[];
    sys?: boolean;
  }>(() => {
    try {
      return JSON.parse(localStorage.getItem(workspaceKey) ?? '{}');
    } catch {
      return {};
    }
  });

  // The entire tree, loaded recursively the way the old dashboard does it —
  // the backend excludes /system/, /misc/, /data/ and /config/ unless sys is true.
  const [folders, setFolders] = useState<string[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [systemFiles, setSystemFiles] = useState(!!workspace.sys);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(workspace.expanded ?? []));
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
  const [recording, setRecording] = useState<DebugRecording | null>(null);
  // Set when the result came from invoking an endpoint rather than evaluating.
  const [resultWasHttp, setResultWasHttp] = useState(false);
  const [generating, setGenerating] = useState(false);
  // Slow backend round-trips outside generation — argument retrieval,
  // endpoint meta lookups, OpenAPI specs, evaluation, and tree mutations.
  const [waiting, setWaiting] = useState(false);
  // Save-in-flight — guards the Save button and Ctrl-S against re-submits.
  const [saving, setSaving] = useState(false);
  // Generating needs something selected to send, so the button follows it.
  const [hasSelection, setHasSelection] = useState(false);
  const [openApiSpec, setOpenApiSpec] = useState<{ json: string; target: string } | null>(null);
  // The endpoint whose invoker dialog is open, when executing an endpoint file.
  const [invokeTarget, setInvokeTarget] = useState<Endpoint | null>(null);
  // File or folder awaiting a model choice for AI-function generation.
  const [aiFunctionTarget, setAiFunctionTarget] = useState<string | null>(null);
  // Repository root the Git panel is open for.
  const [gitTarget, setGitTarget] = useState<string | null>(null);
  const editorRef = useRef<import('codemirror').Editor | null>(null);
  const { confirm, confirmTyped, prompt, form, choice } = useDialog();

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

  /*
   * Restores the remembered tabs by loading every file fresh off the server.
   * A file that no longer loads is silently dropped, and anything the user
   * opened while the restore was in flight keeps its place.
   */
  const restoredTabs = useRef(false);
  useEffect(() => {
    if (restoredTabs.current) {
      return;
    }
    restoredTabs.current = true;
    const paths = workspace.open ?? [];
    if (paths.length === 0) {
      return;
    }
    Promise.all(paths.map(path =>
      loadFile(path)
        .then(text => ({ path, content: text, saved: text }))
        .catch(() => null)))
      .then(loaded => {
        const tabs = loaded.filter(Boolean) as { path: string; content: string; saved: string }[];
        if (tabs.length === 0) {
          return;
        }
        setOpenFiles(current => [
          ...tabs.filter(tab => !current.some(file => file.path === tab.path)),
          ...current,
        ]);
        setSelectedFile(current => current !== ''
          ? current
          : tabs.some(tab => tab.path === workspace.selected)
            ? workspace.selected!
            : tabs[tabs.length - 1].path);
      });
  }, []);

  // Remembers the workspace shape — file contents deliberately excluded.
  useEffect(() => {
    localStorage.setItem(workspaceKey, JSON.stringify({
      open: openFiles.map(file => file.path),
      selected: selectedFile,
      expanded: [...expanded],
      sys: systemFiles,
    }));
  }, [workspaceKey, openFiles, selectedFile, expanded, systemFiles]);

  /*
   * "?open=/path/file.hl" deep-links straight into a file — how the Endpoints
   * screen and the command palette jump to source. Consumed and cleared each
   * time it appears, so a second jump while already here works too, and the
   * tree expands down to the file so it is visible where it lives.
   */
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const target = searchParams.get('open');
    if (!target) {
      return;
    }
    const ancestors: string[] = [];
    let ancestor = '/';
    for (const part of target.split('/').filter(part => part !== '').slice(0, -1)) {
      ancestor += part + '/';
      ancestors.push(ancestor);
    }
    setExpanded(current => new Set([...current, ...ancestors]));
    openFile(target);
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const loadTree = useCallback(async (sys: boolean) => {
    try {
      const [folderList, fileList] = await Promise.all([
        listFoldersRecursively('/', sys),
        listFilesRecursively('/', sys),
      ]);
      setFolders(folderList ?? []);
      setFiles(fileList ?? []);
    } catch (err: any) {
      showToast(err.message, true, err.logId);
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

  /*
   * Cycles the open tabs, wrapping at both ends. Bound to Ctrl+Tab through
   * the editor's keymap, so it only fires while the editor has focus.
   */
  function switchTab(delta: number) {
    if (openFiles.length < 2) {
      return;
    }
    const index = openFiles.findIndex(file => file.path === selectedFile);
    const next = (index + delta + openFiles.length) % openFiles.length;
    setSelectedFile(openFiles[next].path);
  }

  async function openFile(path: string) {
    if (openFiles.some(file => file.path === path)) {
      setSelectedFile(path);
      return;
    }
    setWaiting(true);
    try {
      const text = await loadFile(path);
      // Two concurrent opens of the same file must not become two tabs.
      setOpenFiles(current => current.some(file => file.path === path)
        ? current
        : [...current, { path, content: text, saved: text }]);
      setSelectedFile(path);
    } catch (err: any) {
      show(err.message, true);
    } finally {
      setWaiting(false);
    }
  }

  function updateContent(value: string) {
    setOpenFiles(files => files.map(file =>
      file.path === selectedFile ? { ...file, content: value } : file));
  }

  // Returns whether the save actually happened, for callers whose next step
  // only makes sense against the saved file.
  async function save() {
    const file = openFiles.find(candidate => candidate.path === selectedFile);
    if (!file || saving) {
      return false;
    }
    setSaving(true);
    try {
      await saveFile(file.path, file.content);
      setOpenFiles(files => files.map(candidate =>
        candidate.path === file.path ? { ...candidate, saved: file.content } : candidate));
      show('Saved ' + file.path);
      return true;
    } catch (err: any) {
      show(err.message, true);
      return false;
    } finally {
      setSaving(false);
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
        setWaiting(true);
        try {
          await saveFile(path, file.content);
        } catch (err: any) {
          show(err.message, true);
          return;
        } finally {
          setWaiting(false);
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
      setWaiting(true);
      const argSpec = await getHyperlambdaArguments(code) ?? {};
      // Waiter off while the parametrise form awaits the user.
      setWaiting(false);
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
      setWaiting(true);
      setExecuteResult(await evaluateWithArgs(code, args));
    } catch (err: any) {
      show(err.message, true);
    } finally {
      setWaiting(false);
    }
  }

  /*
   * Records an execution of the open file. The code defaults to the editor's
   * content, so the invoke panel can trigger it knowing only the arguments.
   */
  async function runDebug(args: any, code?: string) {
    setWaiting(true);
    try {
      setRecording(await debugHyperlambda(code ?? content, args));
    } catch (err: any) {
      show(err.message, true);
    } finally {
      setWaiting(false);
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
      setWaiting(true);
      // A failed save means the server still runs yesterday's code — the
      // exact situation this dialog exists to prevent, so stop here.
      if (!await save()) {
        setWaiting(false);
        return;
      }
    }
    setWaiting(true);
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
    } finally {
      setWaiting(false);
    }
  }

  async function newFile(folder: string) {
    const name = await prompt({ title: 'New file', message: folder, label: 'File name' });
    if (!name) {
      return;
    }
    const path = folder + name;
    setWaiting(true);
    try {
      await saveFile(path, '');
      await loadTree(systemFiles);
      await openFile(path);
    } catch (err: any) {
      show(err.message, true);
    } finally {
      setWaiting(false);
    }
  }

  async function newFolder(folder: string) {
    const name = await prompt({ title: 'New folder', message: folder, label: 'Folder name' });
    if (!name) {
      return;
    }
    setWaiting(true);
    try {
      await createFolder(folder + name + '/');
      await loadTree(systemFiles);
    } catch (err: any) {
      show(err.message, true);
    } finally {
      setWaiting(false);
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
    setWaiting(true);
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
    } finally {
      setWaiting(false);
    }
  }

  async function removeFolder(path: string) {
    if (PROTECTED_FOLDERS.includes(path)) {
      show('You cannot delete the ' + path + ' folder', true);
      return;
    }
    /*
     * Deleting a folder recursively deletes everything inside it, so a plain
     * confirm is too easy to click through — the user types the folder's
     * name back before anything happens.
     */
    if (!await confirmTyped({
      title: 'Delete folder?',
      message: path + ' and everything inside it will be permanently deleted.',
      label: 'Folder name',
      expected: nameOf(path),
      confirmText: 'Delete',
      mismatch: 'Name did not match — nothing deleted',
    })) {
      return;
    }
    setWaiting(true);
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
    } finally {
      setWaiting(false);
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
    setWaiting(true);
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
    } finally {
      setWaiting(false);
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
    setWaiting(true);
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
    } finally {
      setWaiting(false);
    }
  }

  // Shows the OpenAPI specification for a file (single endpoint) or folder (all endpoints inside it).
  async function showOpenApi(target: string) {
    setWaiting(true);
    try {
      const spec = await getOpenApiSpec(target);
      setOpenApiSpec({ json: JSON.stringify(spec, null, 2), target });
    } catch (err: any) {
      show(err.message, true);
    } finally {
      setWaiting(false);
    }
  }

  return (
    <>
      <div className="page-header ide-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="page-title ide-title">
          <h1>Hyper IDE</h1>
          {/*
            * The subtitle is guidance for an empty IDE, and once a file is open
            * it only competes with the toolbar for horizontal space — which is
            * what used to wrap the header onto extra lines.
            */}
          {!selectedFile && <p>Browse and edit any file on your server</p>}
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
                setWaiting(true);
                try {
                  const raw = await downloadFileRaw(selectedFile);
                  downloadBlob(
                    raw.blob,
                    dispositionFilename(raw.disposition) ?? nameOf(selectedFile));
                } catch (err: any) {
                  show(err.message, true);
                } finally {
                  setWaiting(false);
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
        <button className="btn btn-small" onClick={save} disabled={!selectedFile || !dirty || saving}>
          <SaveIcon />
          {saving ? 'Saving…' : 'Save'}
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
                  setWaiting(true);
                  try {
                    for (const file of files) {
                      await uploadFile(activeFolder, file);
                    }
                    show('Uploaded ' + files.length + ' file(s) to ' + activeFolder);
                    await loadTree(systemFiles);
                  } catch (err: any) {
                    show(err.message, true);
                  } finally {
                    setWaiting(false);
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
                  const moduleName = moduleNameFromZip(file);
                  if (!moduleName) {
                    show(
                      file.name + ' cannot be a module name — it must be ' +
                      '<name>.zip, using only lowercase letters, digits, ' +
                      'hyphens or underscores, and no further dots',
                      true);
                    return;
                  }
                  setWaiting(true);
                  try {
                    await installModule(file);
                    show('Module ' + moduleName + ' installed');
                    await loadTree(systemFiles);
                  } catch (err: any) {
                    show(err.message, true);
                  } finally {
                    setWaiting(false);
                  }
                }} />
            </label>
            <button
              className="icon-btn"
              title={'Download ' + activeFolder + ' as zip'}
              onClick={async () => {
                setWaiting(true);
                try {
                  const raw = await downloadFolderRaw(activeFolder);
                  downloadBlob(
                    raw.blob,
                    dispositionFilename(raw.disposition) ?? 'folder.zip');
                } catch (err: any) {
                  show(err.message, true);
                } finally {
                  setWaiting(false);
                }
              }}>
              <DownloadIcon />
            </button>
          </div>
          <FileTree
            folders={folders}
            visibleFiles={visibleFiles}
            visibleFolders={visibleFolders}
            query={query}
            expanded={expanded}
            activeFolder={activeFolder}
            selectedFile={selectedFile}
            backendUrl={backend!.url}
            onToggleFolder={folder => { toggle(folder); setOpenFolder(folder); }}
            onOpenFile={file => { setOpenFolder(null); openFile(file); }}
            onNewFile={newFile}
            onNewFolder={newFolder}
            onGit={setGitTarget}
            onOpenApi={showOpenApi}
            onAiFunctions={setAiFunctionTarget}
            onRename={rename}
            onDeleteFolder={removeFolder}
            onDeleteFile={removeFile} />
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
            <FileTabs
              openFiles={openFiles}
              selectedFile={selectedFile}
              onSelect={setSelectedFile}
              onClose={closeFile} />
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
                /*
                 * The editor is keyed on the open file, so this runs for every
                 * open, tab switch and restored workspace — the moments where
                 * the editor becomes the thing you are looking at. Focusing it
                 * makes Ctrl+S, Ctrl+Space and F5 work without a click first.
                 */
                instance.focus();
              }}
              onAction={action => {
                switch (action) {
                  case 'newFile': newFile(activeFolder); break;
                  case 'newFolder': newFolder(activeFolder); break;
                  case 'renameFile': rename(selectedFile, false); break;
                  case 'deleteFile': removeFile(selectedFile); break;
                  case 'deleteFolder': removeFolder(activeFolder); break;
                  case 'close': closeFile(selectedFile); break;
                  case 'nextTab': switchTab(1); break;
                  case 'previousTab': switchTab(-1); break;
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
      {gitTarget !== null && (
        <GitPanel
          path={gitTarget}
          onClose={() => setGitTarget(null)}
          onChanged={() => loadTree(systemFiles)} />
      )}
      {(generating || waiting) && <AiWaiter />}
      {invokeTarget && (
        <Modal width={860} closeOnEscape={false} onClose={() => setInvokeTarget(null)}>
          <h2 style={{ marginTop: 0 }}>
            {invokeTarget.verb.toUpperCase()} {invokeTarget.path}
          </h2>
          <InvokePanel
            endpoint={invokeTarget}
            /*
             * The invoker stays mounted behind the recording, exactly as it does
             * behind a response — so closing the recording returns to the same
             * form with its arguments still filled in.
             */
            onDebug={args => runDebug(args)}
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
      {recording !== null && (
        <DebugDialog
          filename={selectedFile}
          recording={recording}
          onClose={() => setRecording(null)} />
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
