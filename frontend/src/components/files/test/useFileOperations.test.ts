// @vitest-environment jsdom
/*
 * useFileOperations: creating, renaming, deleting, uploading and downloading files and
 * folders, with the dialogs that guard them and the open tabs kept in step.
 */
import { act, renderHook } from '@testing-library/react';
import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import * as download from '../../../lib/download';
import { setToastListener, type Toast } from '../../../lib/toast';
import { useFileOperations } from '../hooks/useFileOperations';
import type { OpenTabs } from '../hooks/useOpenTabs';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);
vi.mock('../../../lib/download', async importOriginal => ({
  ...(await importOriginal<typeof import('../../../lib/download')>()),
  downloadBlob: vi.fn(),
}));

type File = { path: string; content: string; saved: string };
const toasts: Toast[] = [];

beforeEach(() => {
  toasts.length = 0;
  setToastListener(toast => toasts.push(toast));
});

afterEach(() => {
  setToastListener(null);
  vi.clearAllMocks();
});

const file = (path: string): File => ({ path, content: 'c', saved: 'c' });

function setup(initial: File[] = [], selected = '', activeFolder = '/etc/') {
  const dialog = {
    confirm: vi.fn<() => Promise<boolean>>().mockResolvedValue(true),
    confirmTyped: vi.fn<() => Promise<boolean>>().mockResolvedValue(true),
    prompt: vi.fn<() => Promise<string | null>>(),
    form: vi.fn(),
    choice: vi.fn(),
  };
  const loadTree = vi.fn().mockResolvedValue(undefined);
  const openFile = vi.fn().mockResolvedValue(undefined);
  const setWaiting = vi.fn();
  const hook = renderHook(() => {
    const [openFiles, setOpenFiles] = useState<File[]>(initial);
    const [selectedFile, setSelectedFile] = useState(selected);
    const tabs = { openFiles, setOpenFiles, selectedFile, setSelectedFile } as unknown as OpenTabs;
    return {
      openFiles,
      selectedFile,
      ops: useFileOperations({
        tabs,
        activeFolder,
        systemFiles: true,
        loadTree,
        openFile,
        setWaiting,
        dialog,
      }),
    };
  });
  return { dialog, loadTree, openFile, setWaiting, ...hook };
}

function raw(blob: Blob, disposition: string) {
  return { blob, disposition, contentType: '', headers: {}, status: 200, elapsed: 0 };
}

function pick(files: unknown[]) {
  const target = { files, value: 'C:\\fake' };
  return { event: { target } as unknown as ChangeEvent<HTMLInputElement>, target };
}

describe('newFile and newFolder', () => {
  it('does nothing when the name prompt is dismissed', async () => {
    const { result, dialog } = setup();
    dialog.prompt.mockResolvedValue(null);
    await act(() => result.current.ops.newFile('/etc/'));
    await act(() => result.current.ops.newFolder('/etc/'));
    expect(api.saveFile).not.toHaveBeenCalled();
    expect(api.createFolder).not.toHaveBeenCalled();
  });

  it('creates an empty file, reloads the tree and opens it', async () => {
    const { result, dialog, loadTree, openFile } = setup();
    dialog.prompt.mockResolvedValue('a.hl');
    await act(() => result.current.ops.newFile('/modules/'));
    expect(api.saveFile).toHaveBeenCalledWith('/modules/a.hl', '');
    expect(loadTree).toHaveBeenCalledWith(true);
    expect(openFile).toHaveBeenCalledWith('/modules/a.hl');
  });

  it('reports a file creation failure and does not open the file', async () => {
    const { result, dialog, openFile, setWaiting } = setup();
    dialog.prompt.mockResolvedValue('a.hl');
    vi.mocked(api.saveFile).mockRejectedValue(new Error('exists'));
    await act(() => result.current.ops.newFile('/modules/'));
    expect(openFile).not.toHaveBeenCalled();
    expect(toasts[0]).toMatchObject({ text: 'exists', isError: true });
    expect(setWaiting).toHaveBeenLastCalledWith(false);
  });

  it('creates a folder with a trailing slash and reloads the tree', async () => {
    const { result, dialog, loadTree } = setup();
    dialog.prompt.mockResolvedValue('sub');
    await act(() => result.current.ops.newFolder('/modules/'));
    expect(api.createFolder).toHaveBeenCalledWith('/modules/sub/');
    expect(loadTree).toHaveBeenCalledWith(true);
  });

  it('reports a folder creation failure', async () => {
    const { result, dialog, loadTree } = setup();
    dialog.prompt.mockResolvedValue('sub');
    vi.mocked(api.createFolder).mockRejectedValue(new Error('nope'));
    await act(() => result.current.ops.newFolder('/modules/'));
    expect(loadTree).not.toHaveBeenCalled();
    expect(toasts[0].text).toBe('nope');
  });
});

describe('removeFile', () => {
  it('does nothing when the confirmation is declined', async () => {
    const { result, dialog } = setup([file('/a.hl')], '/a.hl');
    dialog.confirm.mockResolvedValue(false);
    await act(() => result.current.ops.removeFile('/a.hl'));
    expect(api.deleteFile).not.toHaveBeenCalled();
    expect(result.current.openFiles).toHaveLength(1);
  });

  it('deletes the file, closes its tab and selects the last remaining one', async () => {
    const { result, loadTree } = setup([file('/a.hl'), file('/b.hl'), file('/c.hl')], '/c.hl');
    await act(() => result.current.ops.removeFile('/c.hl'));
    expect(api.deleteFile).toHaveBeenCalledWith('/c.hl');
    expect(result.current.openFiles.map(f => f.path)).toEqual(['/a.hl', '/b.hl']);
    expect(result.current.selectedFile).toBe('/b.hl');
    expect(loadTree).toHaveBeenCalled();
  });

  it('leaves the selection alone when another file is deleted', async () => {
    const { result } = setup([file('/a.hl'), file('/b.hl')], '/a.hl');
    await act(() => result.current.ops.removeFile('/b.hl'));
    expect(result.current.selectedFile).toBe('/a.hl');
  });

  it('keeps the tabs when the delete fails', async () => {
    vi.mocked(api.deleteFile).mockRejectedValue(new Error('locked'));
    const { result } = setup([file('/a.hl')], '/a.hl');
    await act(() => result.current.ops.removeFile('/a.hl'));
    expect(result.current.openFiles).toHaveLength(1);
    expect(toasts[0].text).toBe('locked');
  });
});

describe('removeFolder', () => {
  it('refuses a protected folder without asking', async () => {
    const { result, dialog } = setup();
    await act(() => result.current.ops.removeFolder('/modules/'));
    expect(dialog.confirmTyped).not.toHaveBeenCalled();
    expect(api.deleteFolder).not.toHaveBeenCalled();
    expect(toasts[0]).toMatchObject({
      text: 'You cannot delete the /modules/ folder',
      isError: true,
    });
  });

  it('requires the folder name to be typed back', async () => {
    const { result, dialog } = setup();
    dialog.confirmTyped.mockResolvedValue(false);
    await act(() => result.current.ops.removeFolder('/modules/app/'));
    expect(dialog.confirmTyped).toHaveBeenCalledWith(
      expect.objectContaining({ expected: 'app', title: 'Delete folder?' }),
    );
    expect(api.deleteFolder).not.toHaveBeenCalled();
  });

  it('deletes the folder and closes every tab inside it, dirty or not', async () => {
    const { result, loadTree } = setup(
      [file('/modules/app/a.hl'), file('/etc/b.txt'), file('/modules/app/sub/c.hl')],
      '/modules/app/sub/c.hl',
    );
    await act(() => result.current.ops.removeFolder('/modules/app/'));
    expect(api.deleteFolder).toHaveBeenCalledWith('/modules/app/');
    expect(result.current.openFiles.map(f => f.path)).toEqual(['/etc/b.txt']);
    expect(result.current.selectedFile).toBe('/etc/b.txt');
    expect(loadTree).toHaveBeenCalled();
  });

  it('keeps an unrelated selection', async () => {
    const { result } = setup([file('/modules/app/a.hl'), file('/etc/b.txt')], '/etc/b.txt');
    await act(() => result.current.ops.removeFolder('/modules/app/'));
    expect(result.current.selectedFile).toBe('/etc/b.txt');
  });

  it('reports a failed folder delete', async () => {
    vi.mocked(api.deleteFolder).mockRejectedValue(new Error('busy'));
    const { result } = setup([file('/modules/app/a.hl')], '/modules/app/a.hl');
    await act(() => result.current.ops.removeFolder('/modules/app/'));
    expect(result.current.openFiles).toHaveLength(1);
    expect(toasts[0].text).toBe('busy');
  });
});

describe('rename', () => {
  it('refuses to rename a protected folder', async () => {
    const { result, dialog } = setup();
    await act(() => result.current.ops.rename('/etc/', true));
    expect(dialog.prompt).not.toHaveBeenCalled();
    expect(toasts[0].text).toBe('You cannot rename the /etc/ folder');
  });

  it('offers the current name and ignores a dismissed or unchanged answer', async () => {
    const { result, dialog } = setup();
    dialog.prompt.mockResolvedValueOnce(null).mockResolvedValueOnce('a.hl');
    await act(() => result.current.ops.rename('/modules/a.hl', false));
    await act(() => result.current.ops.rename('/modules/a.hl', false));
    expect(dialog.prompt).toHaveBeenCalledWith(expect.objectContaining({ initial: 'a.hl' }));
    expect(api.renamePath).not.toHaveBeenCalled();
  });

  it('passes only the bare new name for a file and remaps its tab', async () => {
    const { result, dialog, loadTree } = setup(
      [file('/modules/a.hl'), file('/b.hl')],
      '/modules/a.hl',
    );
    dialog.prompt.mockResolvedValue('z.hl');
    await act(() => result.current.ops.rename('/modules/a.hl', false));
    expect(api.renamePath).toHaveBeenCalledWith('/modules/a.hl', 'z.hl');
    expect(result.current.openFiles.map(f => f.path)).toEqual(['/modules/z.hl', '/b.hl']);
    expect(result.current.selectedFile).toBe('/modules/z.hl');
    expect(loadTree).toHaveBeenCalled();
  });

  it('passes the full new path for a folder and remaps everything inside it', async () => {
    const { result, dialog } = setup(
      [file('/modules/app/a.hl'), file('/modules/app2/b.hl'), file('/etc/c.txt')],
      '/modules/app/a.hl',
    );
    dialog.prompt.mockResolvedValue('renamed');
    await act(() => result.current.ops.rename('/modules/app/', true));
    expect(api.renamePath).toHaveBeenCalledWith('/modules/app/', '/modules/renamed/');
    expect(result.current.openFiles.map(f => f.path)).toEqual([
      '/modules/renamed/a.hl',
      '/modules/app2/b.hl',
      '/etc/c.txt',
    ]);
    expect(result.current.selectedFile).toBe('/modules/renamed/a.hl');
  });

  it('keeps the tabs when the rename fails', async () => {
    const { result, dialog } = setup([file('/a.hl')], '/a.hl');
    dialog.prompt.mockResolvedValue('b.hl');
    vi.mocked(api.renamePath).mockRejectedValue(new Error('taken'));
    await act(() => result.current.ops.rename('/a.hl', false));
    expect(result.current.openFiles[0].path).toBe('/a.hl');
    expect(toasts[0].text).toBe('taken');
  });
});

describe('downloads', () => {
  it('downloads the open file under the name the server suggests', async () => {
    const blob = new Blob(['x']);
    vi.mocked(api.downloadFileRaw).mockResolvedValue(
      raw(blob, 'attachment; filename="server.txt"'),
    );
    const { result } = setup([], '/etc/local.txt');
    await act(() => result.current.ops.downloadFile());
    expect(api.downloadFileRaw).toHaveBeenCalledWith('/etc/local.txt');
    expect(download.downloadBlob).toHaveBeenCalledWith(blob, 'server.txt');
  });

  it('falls back to the file name when there is no disposition filename', async () => {
    const blob = new Blob(['x']);
    vi.mocked(api.downloadFileRaw).mockResolvedValue(raw(blob, ''));
    const { result } = setup([], '/etc/local.txt');
    await act(() => result.current.ops.downloadFile());
    expect(download.downloadBlob).toHaveBeenCalledWith(blob, 'local.txt');
  });

  it('reports a failed file download', async () => {
    vi.mocked(api.downloadFileRaw).mockRejectedValue(new Error('gone'));
    const { result, setWaiting } = setup([], '/x');
    await act(() => result.current.ops.downloadFile());
    expect(download.downloadBlob).not.toHaveBeenCalled();
    expect(toasts[0].text).toBe('gone');
    expect(setWaiting).toHaveBeenLastCalledWith(false);
  });

  it('downloads the active folder as a zip, defaulting its name', async () => {
    const blob = new Blob(['z']);
    vi.mocked(api.downloadFolderRaw).mockResolvedValue(raw(blob, ''));
    const { result } = setup([], '', '/modules/app/');
    await act(() => result.current.ops.downloadFolder());
    expect(api.downloadFolderRaw).toHaveBeenCalledWith('/modules/app/');
    expect(download.downloadBlob).toHaveBeenCalledWith(blob, 'folder.zip');
  });

  it('reports a failed folder download', async () => {
    vi.mocked(api.downloadFolderRaw).mockRejectedValue(new Error('too big'));
    const { result } = setup();
    await act(() => result.current.ops.downloadFolder());
    expect(toasts[0].text).toBe('too big');
  });
});

describe('uploadFiles', () => {
  it('uploads every chosen file into the active folder, one by one, and resets the input', async () => {
    const a = new globalThis.File(['a'], 'a.txt');
    const b = new globalThis.File(['b'], 'b.txt');
    const { result, loadTree } = setup([], '', '/etc/www/');
    const { event, target } = pick([a, b]);
    await act(() => result.current.ops.uploadFiles(event));
    expect(target.value).toBe('');
    expect(vi.mocked(api.uploadFile).mock.calls).toEqual([
      ['/etc/www/', a],
      ['/etc/www/', b],
    ]);
    expect(toasts[0]).toMatchObject({ text: 'Uploaded 2 file(s) to /etc/www/', isError: false });
    expect(loadTree).toHaveBeenCalledWith(true);
  });

  it('stops at the first failed upload', async () => {
    vi.mocked(api.uploadFile).mockRejectedValueOnce(new Error('too large'));
    const { result, loadTree } = setup();
    const { event } = pick([
      new globalThis.File(['a'], 'a.txt'),
      new globalThis.File(['b'], 'b.txt'),
    ]);
    await act(() => result.current.ops.uploadFiles(event));
    expect(api.uploadFile).toHaveBeenCalledTimes(1);
    expect(loadTree).not.toHaveBeenCalled();
    expect(toasts[0]).toMatchObject({ text: 'too large', isError: true });
  });
});

describe('installModuleZip', () => {
  it('does nothing when no file was chosen', async () => {
    const { result } = setup();
    const { event } = pick([]);
    await act(() => result.current.ops.installModuleZip(event));
    expect(api.installModule).not.toHaveBeenCalled();
    expect(toasts).toHaveLength(0);
  });

  it('rejects an archive whose name cannot be a module name', async () => {
    const { result } = setup();
    const { event, target } = pick([new globalThis.File(['z'], 'My.Module.zip')]);
    await act(() => result.current.ops.installModuleZip(event));
    expect(target.value).toBe('');
    expect(api.installModule).not.toHaveBeenCalled();
    expect(toasts[0].isError).toBe(true);
    expect(toasts[0].text).toContain('My.Module.zip cannot be a module name');
  });

  it('installs a well-named archive and reloads the tree', async () => {
    const zip = new globalThis.File(['z'], 'my-module.zip');
    const { result, loadTree } = setup();
    const { event } = pick([zip]);
    await act(() => result.current.ops.installModuleZip(event));
    expect(api.installModule).toHaveBeenCalledWith(zip);
    expect(toasts[0]).toMatchObject({ text: 'Module my-module installed', isError: false });
    expect(loadTree).toHaveBeenCalledWith(true);
  });

  it('reports a failed install', async () => {
    vi.mocked(api.installModule).mockRejectedValue(new Error('corrupt zip'));
    const { result, setWaiting } = setup();
    const { event } = pick([new globalThis.File(['z'], 'mod.zip')]);
    await act(() => result.current.ops.installModuleZip(event));
    expect(toasts[0].text).toBe('corrupt zip');
    expect(setWaiting).toHaveBeenLastCalledWith(false);
  });
});
