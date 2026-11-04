import { useState } from 'react';

import { loadFile, saveFile } from '../../../lib/api';
import { showError } from '../../../lib/errors';
import { showToast } from '../../../lib/toast';
import type { useDialog } from '../../../lib/useDialog';
import type { OpenTabs } from './useOpenTabs';

/*
 * Opening, re-reading, saving and closing the files in the open tabs.
 */
export function useTabActions(
  tabs: OpenTabs,
  setWaiting: (waiting: boolean) => void,
  choice: ReturnType<typeof useDialog>['choice'],
) {
  const { openFiles, setOpenFiles, selectedFile, setSelectedFile } = tabs;
  // Save-in-flight — guards the Save button and Ctrl-S against re-submits.
  const [saving, setSaving] = useState(false);

  async function openFile(path: string) {
    if (openFiles.some(file => file.path === path)) {
      setSelectedFile(path);
      return;
    }
    setWaiting(true);
    try {
      const text = await loadFile(path);
      // Two concurrent opens of the same file must not become two tabs.
      setOpenFiles(current =>
        current.some(file => file.path === path)
          ? current
          : [...current, { path, content: text, saved: text }],
      );
      setSelectedFile(path);
    } catch (err) {
      showError(err);
    } finally {
      setWaiting(false);
    }
  }

  /*
   * Git operations rewrite files behind the editor's back. Every open tab under
   * the folder is re-read so it shows what is on disk, and its saved baseline
   * follows — otherwise a Save would put the discarded content straight back.
   * A file that no longer exists loses its tab.
   */
  async function reloadOpenFiles(folder: string) {
    const affected = openFiles.filter(file => file.path.startsWith(folder));
    if (affected.length === 0) {
      return;
    }
    const loaded = await Promise.all(
      affected.map(file =>
        loadFile(file.path)
          .then(text => ({ path: file.path, text }))
          .catch(() => ({ path: file.path, text: null })),
      ),
    );
    const gone = new Set(loaded.filter(file => file.text === null).map(file => file.path));
    const remaining = openFiles
      .filter(file => !gone.has(file.path))
      .map(file => {
        const fresh = loaded.find(candidate => candidate.path === file.path);
        return fresh && fresh.text !== null
          ? { ...file, content: fresh.text, saved: fresh.text }
          : file;
      });
    setOpenFiles(remaining);
    if (gone.has(selectedFile)) {
      setSelectedFile(remaining[0]?.path ?? '');
    }
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
      setOpenFiles(files =>
        files.map(candidate =>
          candidate.path === file.path ? { ...candidate, saved: file.content } : candidate,
        ),
      );
      showToast('Saved ' + file.path);
      return true;
    } catch (err) {
      showError(err);
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
        } catch (err) {
          showError(err);
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

  return { saving, openFile, reloadOpenFiles, save, closeFile };
}

export type TabActions = ReturnType<typeof useTabActions>;
