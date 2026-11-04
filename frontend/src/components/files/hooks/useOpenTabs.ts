import { useEffect, useRef, useState } from 'react';
import { showError } from '../../../lib/errors';
import { loadFile } from '../../../lib/api';
import { useEditToken } from '../../../lib/editor';
import { restoredSelection, withRestored } from '../helpers';
import type { OpenTab, Workspace } from '../helpers';

/*
 * The open tabs — which files are open and which one is selected — restored
 * from the remembered workspace at mount and remembered as they change.
 */
export function useOpenTabs(
  workspace: Workspace,
  workspaceKey: string,
  expanded: Set<string>,
  systemFiles: boolean,
) {
  /*
   * Every open file, in the order they were opened. A file is dirty when its
   * content differs from what was last loaded or saved.
   */
  const [openFiles, setOpenFiles] = useState<{ path: string; content: string; saved: string }[]>(
    [],
  );
  const [selectedFile, setSelectedFile] = useState('');
  // Bumped whenever updateContent runs, so an AI-generated replacement of the
  // open file becomes one undo step — harmless on ordinary keystrokes, which
  // never reach the editor's compare-and-dispatch branch in the first place.
  const [contentEditId, bumpContentEditId] = useEditToken();

  const current = openFiles.find(file => file.path === selectedFile) ?? null;
  const content = current?.content ?? '';
  const dirty = !!current && current.content !== current.saved;
  const dirtyFiles = openFiles.filter(file => file.content !== file.saved);

  // Keeps the active tab visible when many files are open.
  useEffect(() => {
    document
      .querySelector('.file-tab.active')
      ?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
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
    Promise.all(
      paths.map(path =>
        loadFile(path)
          .then(text => ({ path, content: text, saved: text }))
          .catch(() => null),
      ),
    )
      .then(loaded => {
        const tabs = loaded.filter(Boolean) as OpenTab[];
        if (tabs.length === 0) {
          return;
        }
        setOpenFiles(current => withRestored(current, tabs));
        setSelectedFile(current =>
          current !== '' ? current : restoredSelection(tabs, workspace.selected),
        );
      })
      .catch((err: unknown) => showError(err, 'Could not restore open files: '));
  }, [workspace.open, workspace.selected]);

  // Remembers the workspace shape — file contents deliberately excluded.
  useEffect(() => {
    localStorage.setItem(
      workspaceKey,
      JSON.stringify({
        open: openFiles.map(file => file.path),
        selected: selectedFile,
        expanded: [...expanded],
        sys: systemFiles,
      }),
    );
  }, [workspaceKey, openFiles, selectedFile, expanded, systemFiles]);

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

  function updateContent(value: string) {
    setOpenFiles(files =>
      files.map(file => (file.path === selectedFile ? { ...file, content: value } : file)),
    );
    bumpContentEditId();
  }

  return {
    openFiles,
    setOpenFiles,
    selectedFile,
    setSelectedFile,
    contentEditId,
    current,
    content,
    dirty,
    dirtyFiles,
    switchTab,
    updateContent,
  };
}

export type OpenTabs = ReturnType<typeof useOpenTabs>;
