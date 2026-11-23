import { useUnsavedGuard } from '@core/navGuard';
import { useAuth } from '@core/useAuth';
import { useDialog } from '@shared/hooks/useDialog';
import { useState } from 'react';

import { useAiFunctions } from '../hooks/useAiFunctions';
import { useDeepLink } from '../hooks/useDeepLink';
import { useExecution } from '../hooks/useExecution';
import { useFileOperations } from '../hooks/useFileOperations';
import { useFileTree, useTreeFilter, useTreeLoad } from '../hooks/useFileTree';
import { useOpenApi } from '../hooks/useOpenApi';
import { useOpenTabs } from '../hooks/useOpenTabs';
import { useTabActions } from '../hooks/useTabActions';
import { useWorkspace } from '../hooks/useWorkspace';
import { parentOf } from '../lib/paths';
import EditorPane from './EditorPane';
import IdeDialogs from './IdeDialogs';
import IdeHeader from './IdeHeader';
import Splitter from './Splitter';
import TreePane from './TreePane';

/*
 * Hyper IDE — the file tree, the open tabs and the editor. The hooks are
 * called in the order their effects have to run: the tree width is
 * remembered first, then the open tabs are restored and remembered, then a
 * deep link is followed, and only then is the tree loaded.
 */
export default function Files() {
  const { backend } = useAuth();
  const { workspaceKey, workspace } = useWorkspace(backend?.url);
  const tree = useFileTree(workspace);
  const tabs = useOpenTabs(workspace, workspaceKey, tree.expanded, tree.systemFiles);
  // Set by clicking a folder; null means "follow whichever file is open".
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  // Slow backend round-trips outside generation — argument retrieval,
  // endpoint meta lookups, OpenAPI specs, evaluation, and tree mutations.
  const [waiting, setWaiting] = useState(false);
  // Repository root the Git panel is open for.
  const [gitTarget, setGitTarget] = useState<string | null>(null);
  const dialog = useDialog();
  const tabActions = useTabActions(tabs, setWaiting, dialog.choice);
  const { selectedFile } = tabs;

  /*
   * The folder that upload, download, new-file and new-folder act on.
   *
   * State rather than something derived from the open file: clicking a folder
   * in the tree has to move it, and deriving it meant expanding a folder left
   * these actions pointing at wherever the open file happened to live - or at
   * the root when nothing was open at all.
   */
  const activeFolder = openFolder ?? (selectedFile ? parentOf(selectedFile) : '/');

  useDeepLink(tabActions.openFile, tree.setExpanded);
  useTreeLoad(tree.systemFiles, tree.setFolders, tree.setFiles);

  // Guard in-app navigation and browser unload while any open file is dirty.
  const dirtyPaths = tabs.dirtyFiles.map(file => file.path).join(', ');
  useUnsavedGuard(!!dirtyPaths, dirtyPaths + ' has unsaved changes.');

  const { query, visibleFiles, visibleFolders } = useTreeFilter(
    tree.filter,
    tree.folders,
    tree.files,
  );
  const openApi = useOpenApi(setWaiting);
  const aiFunctions = useAiFunctions(tree.systemFiles, setWaiting);
  const operations = useFileOperations({
    tabs,
    activeFolder,
    systemFiles: tree.systemFiles,
    loadTree: tree.loadTree,
    openFile: tabActions.openFile,
    setWaiting,
    dialog,
  });
  const execution = useExecution({ tabs, save: tabActions.save, setWaiting, dialog });

  return (
    <>
      <IdeHeader
        selectedFile={selectedFile}
        dirty={tabs.dirty}
        saving={tabActions.saving}
        generating={execution.generating}
        hasSelection={execution.hasSelection}
        onDownload={operations.downloadFile}
        onOpenApi={openApi.showOpenApi}
        onGenerate={execution.generateFromSelection}
        onExecute={execution.execute}
        onSave={tabActions.save}
      />
      <div className="files-layout">
        <TreePane
          tree={tree}
          query={query}
          visibleFiles={visibleFiles}
          visibleFolders={visibleFolders}
          activeFolder={activeFolder}
          selectedFile={selectedFile}
          backendUrl={backend!.url}
          operations={operations}
          onOpenFolder={setOpenFolder}
          onOpenFile={tabActions.openFile}
          onGit={setGitTarget}
          onOpenApi={openApi.showOpenApi}
          onAiFunctions={aiFunctions.setAiFunctionTarget}
        />
        <Splitter treeWidth={tree.treeWidth} setTreeWidth={tree.setTreeWidth} />
        <EditorPane
          tabs={tabs}
          tabActions={tabActions}
          execution={execution}
          operations={operations}
          activeFolder={activeFolder}
        />
      </div>
      <IdeDialogs
        selectedFile={selectedFile}
        waiting={waiting}
        aiFunctions={aiFunctions}
        openApiSpec={openApi.openApiSpec}
        onCloseOpenApi={() => openApi.setOpenApiSpec(null)}
        onOpenApi={openApi.showOpenApi}
        gitTarget={gitTarget}
        onCloseGit={() => setGitTarget(null)}
        onGitChanged={async target => {
          await tree.loadTree(tree.systemFiles);
          await tabActions.reloadOpenFiles(target);
        }}
        execution={execution}
      />
    </>
  );
}
