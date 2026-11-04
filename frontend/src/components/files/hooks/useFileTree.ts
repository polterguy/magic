import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { listFilesRecursively, listFoldersRecursively } from '../../../lib/api';
import { showError } from '../../../lib/errors';
import { useDebounced } from '../../../lib/usePagedList';
import type { Workspace } from '../helpers';
import { parentOf } from '../paths';

// The entire tree, folders and files, as the backend lists it recursively.
function fetchTree(sys: boolean) {
  return Promise.all([listFoldersRecursively('/', sys), listFilesRecursively('/', sys)]);
}

/*
 * The tree's state — its folders and files, the system-files toggle, which
 * folders are expanded, the filter and the pane's width.
 */
export function useFileTree(workspace: Workspace) {
  // The entire tree, loaded recursively the way the old dashboard does it —
  // the backend excludes /system/, /misc/, /data/ and /config/ unless sys is true.
  const [folders, setFolders] = useState<string[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [systemFiles, setSystemFiles] = useState(!!workspace.sys);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(workspace.expanded ?? []));
  const [filter, setFilter] = useState('');
  const [treeWidth, setTreeWidth] = useState(
    () => Number(localStorage.getItem('magic2.treeWidth')) || 340,
  );

  useEffect(() => {
    localStorage.setItem('magic2.treeWidth', String(treeWidth));
  }, [treeWidth]);

  const loadTree = useCallback(async (sys: boolean) => {
    try {
      const [folderList, fileList] = await fetchTree(sys);
      setFolders(folderList ?? []);
      setFiles(fileList ?? []);
    } catch (err) {
      showError(err);
    }
  }, []);

  function toggle(path: string) {
    const next = new Set(expanded);
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    setExpanded(next);
  }

  return {
    folders,
    setFolders,
    files,
    setFiles,
    systemFiles,
    setSystemFiles,
    expanded,
    setExpanded,
    filter,
    setFilter,
    treeWidth,
    setTreeWidth,
    loadTree,
    toggle,
  };
}

export type FileTreeState = ReturnType<typeof useFileTree>;

// (Re)loads the tree whenever the system-files toggle changes.
export function useTreeLoad(
  systemFiles: boolean,
  setFolders: Dispatch<SetStateAction<string[]>>,
  setFiles: Dispatch<SetStateAction<string[]>>,
) {
  useEffect(() => {
    fetchTree(systemFiles)
      .then(([folderList, fileList]) => {
        setFolders(folderList ?? []);
        setFiles(fileList ?? []);
      })
      .catch((err: unknown) => showError(err));
  }, [systemFiles, setFolders, setFiles]);
}

/*
 * When a filter is active, anything whose full path contains it shows —
 * matching on the path rather than the name alone, so filtering on a folder
 * ("file-system") also brings up everything inside it. Folders additionally
 * show when they have a visible descendant, and every visible folder is
 * force-expanded.
 */
export function useTreeFilter(filter: string, folders: string[], files: string[]) {
  const query = useDebounced(filter, 250).trim().toLowerCase();

  const visibleFiles = useMemo(
    () => (query ? files.filter(file => file.toLowerCase().includes(query)) : files),
    [files, query],
  );

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

  return { query, visibleFiles, visibleFolders };
}
