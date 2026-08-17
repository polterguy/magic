import { useMemo } from 'react';
import {
  BracesIcon,
  ChevronIcon,
  EyeIcon,
  FileIcon,
  FilePlusIcon,
  FolderIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  GitBranchIcon,
  PencilIcon,
  SparkIcon,
  TrashIcon,
} from '../../components/Icons';
import { nameOf, parentOf } from './paths';

/*
 * Paths the backend treats as system content — rename/delete-blocked, and
 * tinted red in the tree, like the old dashboard.
 */
function isSystemPath(path: string) {
  return ['/system/', '/misc/', '/data/', '/config/'].some(prefix =>
    path === prefix || path.startsWith(prefix));
}

/*
 * Resolves the Git repository root for a path — the top-level folder under
 * /modules/ or /etc/, since that's where repos live and modules each carry
 * their own repository.
 */
function gitRootOf(path: string): string | null {
  const match = path.match(/^\/(modules|etc)\/([^/]+)\//);
  return match ? '/' + match[1] + '/' + match[2] + '/' : null;
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

/*
 * The recursive folder/file tree of the Hyper IDE. All state lives in the
 * page — the tree only renders it and reports clicks back through callbacks.
 */
export default function FileTree(props: {
  folders: string[];
  visibleFiles: string[];
  // Null when no filter is active — every folder shows.
  visibleFolders: Set<string> | null;
  query: string;
  expanded: Set<string>;
  activeFolder: string;
  selectedFile: string;
  // For opening /etc/www previews in a browser tab.
  backendUrl: string;
  onToggleFolder: (folder: string) => void;
  onOpenFile: (file: string) => void;
  onNewFile: (folder: string) => void;
  onNewFolder: (folder: string) => void;
  onGit: (folder: string) => void;
  onOpenApi: (target: string) => void;
  onAiFunctions: (target: string) => void;
  onRename: (path: string, isFolder: boolean) => void;
  onDeleteFolder: (folder: string) => void;
  onDeleteFile: (file: string) => void;
}) {

  const { folders, visibleFiles, visibleFolders, query, expanded } = props;

  /*
   * Parent-path → children map, so each node finds its children with one
   * lookup instead of filtering the full folder and file arrays per node per
   * render. Array order is preserved, so the rendering output is unchanged.
   */
  const childrenOf = useMemo(() => {
    const map = new Map<string, { folders: string[]; files: string[] }>();
    const childrenFor = (parent: string) => {
      let children = map.get(parent);
      if (!children) {
        children = { folders: [], files: [] };
        map.set(parent, children);
      }
      return children;
    };
    for (const folder of folders) {
      if (!visibleFolders || visibleFolders.has(folder)) {
        childrenFor(parentOf(folder)).folders.push(folder);
      }
    }
    for (const file of visibleFiles) {
      childrenFor(parentOf(file)).files.push(file);
    }
    return map;
  }, [folders, visibleFiles, visibleFolders]);

  /*
   * Enter and Space activate a row the way a click does. Key events from the
   * row's action buttons bubble up here too, so only keys pressed on the row
   * itself count — and Space's default is cancelled so the page doesn't
   * scroll.
   */
  function keyActivate(action: () => void) {
    return (event: React.KeyboardEvent) => {
      if (event.target !== event.currentTarget ||
          (event.key !== 'Enter' && event.key !== ' ')) {
        return;
      }
      event.preventDefault();
      action();
    };
  }

  function renderChildren(path: string): JSX.Element {
    const { folders: childFolders, files: childFiles } =
      childrenOf.get(path) ?? { folders: [], files: [] };
    const isOpen = (folder: string) => query ? true : expanded.has(folder);
    return (
      <div className={'tree-children' + (path === '/' ? ' root' : '')}>
        {childFolders.map(folder => (
          <div className="tree-node" key={folder}>
            <div
              className={'tree-row'
                + (isSystemPath(folder) ? ' system' : '')
                + (folder === props.activeFolder ? ' active-folder' : '')}
              title={folder}
              tabIndex={0}
              role="treeitem"
              onClick={() => props.onToggleFolder(folder)}
              onKeyDown={keyActivate(() => props.onToggleFolder(folder))}>
              <span className="tree-chevron">
                <ChevronIcon open={isOpen(folder)} />
              </span>
              <span className="tree-icon folder">
                {isOpen(folder) ? <FolderOpenIcon /> : <FolderIcon />}
              </span>
              <span className="tree-name">{nameOf(folder)}</span>
              <FolderActions
                onNewFile={() => props.onNewFile(folder)}
                onNewFolder={() => props.onNewFolder(folder)}
                // Git operates on repo roots, i.e. top-level folders under /modules/ and /etc/.
                onGit={gitRootOf(folder) === folder
                  ? () => props.onGit(folder)
                  : undefined}
                onOpenApi={() => props.onOpenApi(folder)}
                // Only modules hold endpoints worth exposing as AI functions.
                onAiFunctions={folder.startsWith('/modules/')
                  ? () => props.onAiFunctions(folder)
                  : undefined}
                onRename={() => props.onRename(folder, true)}
                onDelete={() => props.onDeleteFolder(folder)} />
            </div>
            {isOpen(folder) && renderChildren(folder)}
          </div>
        ))}
        {childFiles.map(file => (
          <div
            className={'tree-row' + (file === props.selectedFile ? ' selected' : '')}
            key={file}
            title={file}
            tabIndex={0}
            role="treeitem"
            onClick={() => props.onOpenFile(file)}
            onKeyDown={keyActivate(() => props.onOpenFile(file))}>
            <span className="tree-chevron" />
            <span className="tree-icon"><FileIcon /></span>
            <span className="tree-name">{nameOf(file)}</span>
            <FileActions
              onPreview={previewUrl(file)
                ? e => {
                    e.stopPropagation();
                    window.open(props.backendUrl + previewUrl(file), '_blank', 'noopener');
                  }
                : undefined}
              onAiFunction={file.endsWith('.hl')
                ? e => { e.stopPropagation(); props.onAiFunctions(file); }
                : undefined}
              onRename={e => { e.stopPropagation(); props.onRename(file, false); }}
              onDelete={e => { e.stopPropagation(); props.onDeleteFile(file); }} />
          </div>
        ))}
      </div>
    );
  }

  return renderChildren('/');
}

function FolderActions(props: {
  onNewFile: () => void;
  onNewFolder: () => void;
  onGit?: () => void;
  onOpenApi?: () => void;
  onAiFunctions?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
}) {
  return (
    <span className="row-actions" onClick={e => e.stopPropagation()}>
      <button className="icon-btn" title="New file" onClick={props.onNewFile}><FilePlusIcon /></button>
      <button className="icon-btn" title="New folder" onClick={props.onNewFolder}><FolderPlusIcon /></button>
      {props.onGit &&
        <button className="icon-btn" title="Git" onClick={props.onGit}><GitBranchIcon /></button>}
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
      <button className="icon-btn" title="Delete" onClick={props.onDelete}><TrashIcon /></button>
    </span>
  );
}
