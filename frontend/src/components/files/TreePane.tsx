import { DownloadIcon, FilePlusIcon, FolderPlusIcon, ModuleUploadIcon, UploadIcon } from '../Icons';
import SearchInput from '../SearchInput';
import FileTree from './FileTree';
import type { FileOperations } from './hooks/useFileOperations';
import type { FileTreeState } from './hooks/useFileTree';

/*
 * The pane left of the editor — the filter, the system-files toggle, the
 * folder actions and the file tree itself.
 */
export default function TreePane(
  props: Readonly<{
    tree: FileTreeState;
    query: string;
    visibleFiles: string[];
    visibleFolders: Set<string> | null;
    activeFolder: string;
    selectedFile: string;
    backendUrl: string;
    operations: FileOperations;
    onOpenFolder: (folder: string | null) => void;
    onOpenFile: (path: string) => Promise<void>;
    onGit: (path: string) => void;
    onOpenApi: (target: string) => Promise<void>;
    onAiFunctions: (target: string) => void;
  }>,
) {
  const { tree, activeFolder, operations } = props;
  const { newFile, newFolder } = operations;
  return (
    <div className="file-tree" style={{ width: tree.treeWidth }}>
      <SearchInput
        placeholder="Filter files…"
        value={tree.filter}
        onChange={tree.setFilter}
        style={{ width: '100%', marginBottom: 8 }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 4px 8px' }}>
        <label
          style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}
          title="Also show /system/, /misc/, /data/ and /config/ — be careful!"
        >
          <input
            type="checkbox"
            checked={tree.systemFiles}
            onChange={e => tree.setSystemFiles(e.target.checked)}
          />
          System files
        </label>
        <button
          className="icon-btn"
          title={'New file in ' + activeFolder}
          onClick={() => newFile(activeFolder)}
        >
          <FilePlusIcon />
        </button>
        <button
          className="icon-btn"
          title={'New folder in ' + activeFolder}
          onClick={() => newFolder(activeFolder)}
        >
          <FolderPlusIcon />
        </button>
        <label className="icon-btn" title={'Upload files to ' + activeFolder}>
          <UploadIcon />
          <input
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={operations.uploadFiles}
          />
        </label>
        <label className="icon-btn" title="Install module from a ZIP file…">
          <ModuleUploadIcon />
          <input
            type="file"
            accept=".zip"
            style={{ display: 'none' }}
            onChange={operations.installModuleZip}
          />
        </label>
        <button
          className="icon-btn"
          title={'Download ' + activeFolder + ' as zip'}
          onClick={operations.downloadFolder}
        >
          <DownloadIcon />
        </button>
      </div>
      <FileTree
        folders={tree.folders}
        visibleFiles={props.visibleFiles}
        visibleFolders={props.visibleFolders}
        query={props.query}
        expanded={tree.expanded}
        activeFolder={activeFolder}
        selectedFile={props.selectedFile}
        backendUrl={props.backendUrl}
        onToggleFolder={folder => {
          tree.toggle(folder);
          props.onOpenFolder(folder);
        }}
        onOpenFile={file => {
          props.onOpenFolder(null);
          void props.onOpenFile(file);
        }}
        onNewFile={newFile}
        onNewFolder={newFolder}
        onGit={props.onGit}
        onOpenApi={props.onOpenApi}
        onAiFunctions={props.onAiFunctions}
        onRename={operations.rename}
        onDeleteFolder={operations.removeFolder}
        onDeleteFile={operations.removeFile}
      />
    </div>
  );
}
