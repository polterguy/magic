import type { ChangeEvent } from 'react';

import {
  createFolder,
  deleteFile,
  deleteFolder,
  downloadFileRaw,
  downloadFolderRaw,
  installModule,
  moduleNameFromZip,
  renamePath,
  saveFile,
  uploadFile,
} from '../../../lib/api';
import { dispositionFilename, downloadBlob } from '../../../lib/download';
import { showError } from '../../../lib/errors';
import { showToast } from '../../../lib/toast';
import type { useDialog } from '../../../lib/useDialog';
import { PROTECTED_FOLDERS } from '../helpers';
import { nameOf, parentOf } from '../paths';
import type { OpenTabs } from './useOpenTabs';

/*
 * Creating, renaming, deleting, uploading and downloading files and folders.
 */
export function useFileOperations(options: {
  tabs: OpenTabs;
  activeFolder: string;
  systemFiles: boolean;
  loadTree: (sys: boolean) => Promise<void>;
  openFile: (path: string) => Promise<void>;
  setWaiting: (waiting: boolean) => void;
  dialog: ReturnType<typeof useDialog>;
}) {
  const { tabs, activeFolder, systemFiles, loadTree, openFile, setWaiting } = options;
  const { openFiles, setOpenFiles, selectedFile, setSelectedFile } = tabs;
  const { confirm, confirmTyped, prompt } = options.dialog;

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
    } catch (err) {
      showError(err);
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
    } catch (err) {
      showError(err);
    } finally {
      setWaiting(false);
    }
  }

  async function removeFile(path: string) {
    if (
      !(await confirm({
        title: 'Delete file?',
        message: path,
        confirmText: 'Delete',
        danger: true,
      }))
    ) {
      return;
    }
    setWaiting(true);
    try {
      await deleteFile(path);
      const remaining = openFiles.filter(candidate => candidate.path !== path);
      setOpenFiles(remaining);
      if (selectedFile === path) {
        setSelectedFile(remaining.at(-1)?.path ?? '');
      }
      await loadTree(systemFiles);
    } catch (err) {
      showError(err);
    } finally {
      setWaiting(false);
    }
  }

  async function removeFolder(path: string) {
    if (PROTECTED_FOLDERS.has(path)) {
      showToast('You cannot delete the ' + path + ' folder', true);
      return;
    }
    /*
     * Deleting a folder recursively deletes everything inside it, so a plain
     * confirm is too easy to click through — the user types the folder's
     * name back before anything happens.
     */
    if (
      !(await confirmTyped({
        title: 'Delete folder?',
        message: path + ' and everything inside it will be permanently deleted.',
        label: 'Folder name',
        expected: nameOf(path),
        confirmText: 'Delete',
        mismatch: 'Name did not match — nothing deleted',
      }))
    ) {
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
        setSelectedFile(remaining.at(-1)?.path ?? '');
      }
      await loadTree(systemFiles);
    } catch (err) {
      showError(err);
    } finally {
      setWaiting(false);
    }
  }

  async function rename(path: string, isFolder: boolean) {
    if (isFolder && PROTECTED_FOLDERS.has(path)) {
      showToast('You cannot rename the ' + path + ' folder', true);
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
      const remap = (candidate: string) => {
        if (!isFolder) {
          return candidate === path ? newPath : candidate;
        }
        return candidate.startsWith(path) ? newPath + candidate.slice(path.length) : candidate;
      };
      setOpenFiles(files => files.map(file => ({ ...file, path: remap(file.path) })));
      setSelectedFile(remap(selectedFile));
      await loadTree(systemFiles);
    } catch (err) {
      showError(err);
    } finally {
      setWaiting(false);
    }
  }

  // Downloads the open file.
  async function downloadFile() {
    setWaiting(true);
    try {
      const raw = await downloadFileRaw(selectedFile);
      downloadBlob(raw.blob, dispositionFilename(raw.disposition) ?? nameOf(selectedFile));
    } catch (err) {
      showError(err);
    } finally {
      setWaiting(false);
    }
  }

  // Uploads the chosen files into the active folder.
  async function uploadFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    setWaiting(true);
    try {
      for (const file of files) {
        await uploadFile(activeFolder, file);
      }
      showToast('Uploaded ' + files.length + ' file(s) to ' + activeFolder);
      await loadTree(systemFiles);
    } catch (err) {
      showError(err);
    } finally {
      setWaiting(false);
    }
  }

  // Installs the chosen ZIP file as a module.
  async function installModuleZip(e: ChangeEvent<HTMLInputElement>) {
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
      showToast(
        file.name +
          ' cannot be a module name — it must be ' +
          '<name>.zip, using only lowercase letters, digits, ' +
          'hyphens or underscores, and no further dots',
        true,
      );
      return;
    }
    setWaiting(true);
    try {
      await installModule(file);
      showToast('Module ' + moduleName + ' installed');
      await loadTree(systemFiles);
    } catch (err) {
      showError(err);
    } finally {
      setWaiting(false);
    }
  }

  // Downloads the active folder as a ZIP file.
  async function downloadFolder() {
    setWaiting(true);
    try {
      const raw = await downloadFolderRaw(activeFolder);
      downloadBlob(raw.blob, dispositionFilename(raw.disposition) ?? 'folder.zip');
    } catch (err) {
      showError(err);
    } finally {
      setWaiting(false);
    }
  }

  return {
    newFile,
    newFolder,
    removeFile,
    removeFolder,
    rename,
    downloadFile,
    uploadFiles,
    installModuleZip,
    downloadFolder,
  };
}

export type FileOperations = ReturnType<typeof useFileOperations>;
