// @vitest-environment jsdom
/*
 * useTabActions: opening files into tabs, re-reading them after git changes the disk, saving
 * with its re-submit guard, and closing with the unsaved-changes choice.
 */
import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import { useOpenTabs } from '../hooks/useOpenTabs';
import { useTabActions } from '../hooks/useTabActions';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

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

function setup(initial: File[] = [], selected = '') {
  const setWaiting = vi.fn();
  const choice = vi.fn<() => Promise<string | null>>();
  const hook = renderHook(() => {
    const [openFiles, setOpenFiles] = useState<File[]>(initial);
    const [selectedFile, setSelectedFile] = useState(selected);
    const tabs = {
      openFiles,
      setOpenFiles,
      selectedFile,
      setSelectedFile,
    } as unknown as ReturnType<typeof useOpenTabs>;
    return { openFiles, selectedFile, actions: useTabActions(tabs, setWaiting, choice) };
  });
  return { setWaiting, choice, ...hook };
}

const file = (path: string, content = 'c', saved = content): File => ({ path, content, saved });

describe('openFile', () => {
  it('loads a file into a new selected tab', async () => {
    vi.mocked(api.loadFile).mockResolvedValue('hello');
    const { result, setWaiting } = setup();
    await act(() => result.current.actions.openFile('/a.hl'));
    expect(api.loadFile).toHaveBeenCalledWith('/a.hl');
    expect(result.current.openFiles).toEqual([file('/a.hl', 'hello')]);
    expect(result.current.selectedFile).toBe('/a.hl');
    expect(setWaiting.mock.calls).toEqual([[true], [false]]);
  });

  it('just selects a file that is already open, without loading it', async () => {
    const { result } = setup([file('/a.hl'), file('/b.hl')], '/a.hl');
    await act(() => result.current.actions.openFile('/b.hl'));
    expect(api.loadFile).not.toHaveBeenCalled();
    expect(result.current.selectedFile).toBe('/b.hl');
    expect(result.current.openFiles).toHaveLength(2);
  });

  it('never makes two tabs of one file opened concurrently', async () => {
    vi.mocked(api.loadFile).mockResolvedValue('x');
    const { result } = setup();
    await act(async () => {
      await Promise.all([
        result.current.actions.openFile('/a.hl'),
        result.current.actions.openFile('/a.hl'),
      ]);
    });
    expect(result.current.openFiles).toHaveLength(1);
  });

  it('reports a load failure and opens nothing', async () => {
    vi.mocked(api.loadFile).mockRejectedValue(new Error('cannot read'));
    const { result, setWaiting } = setup();
    await act(() => result.current.actions.openFile('/a.hl'));
    expect(result.current.openFiles).toEqual([]);
    expect(toasts[0]).toMatchObject({ text: 'cannot read', isError: true });
    expect(setWaiting).toHaveBeenLastCalledWith(false);
  });
});

describe('reloadOpenFiles', () => {
  it('does nothing when no open file is under the folder', async () => {
    const { result } = setup([file('/a/x.hl')], '/a/x.hl');
    await act(() => result.current.actions.reloadOpenFiles('/b/'));
    expect(api.loadFile).not.toHaveBeenCalled();
  });

  it('re-reads affected files and moves their saved baseline with them', async () => {
    vi.mocked(api.loadFile).mockResolvedValue('on disk');
    const { result } = setup(
      [file('/a/x.hl', 'edited', 'old'), file('/b/y.hl', 'keep')],
      '/a/x.hl',
    );
    await act(() => result.current.actions.reloadOpenFiles('/a/'));
    expect(api.loadFile).toHaveBeenCalledTimes(1);
    expect(result.current.openFiles).toEqual([file('/a/x.hl', 'on disk'), file('/b/y.hl', 'keep')]);
  });

  it('drops a file that no longer exists and moves the selection to the first remaining tab', async () => {
    vi.mocked(api.loadFile).mockRejectedValue(new Error('404'));
    const { result } = setup([file('/b/y.hl'), file('/a/x.hl')], '/a/x.hl');
    await act(() => result.current.actions.reloadOpenFiles('/a/'));
    expect(result.current.openFiles.map(f => f.path)).toEqual(['/b/y.hl']);
    expect(result.current.selectedFile).toBe('/b/y.hl');
  });

  it('keeps the selection when the gone file was not selected', async () => {
    vi.mocked(api.loadFile).mockRejectedValue(new Error('404'));
    const { result } = setup([file('/b/y.hl'), file('/a/x.hl')], '/b/y.hl');
    await act(() => result.current.actions.reloadOpenFiles('/a/'));
    expect(result.current.selectedFile).toBe('/b/y.hl');
  });

  it('clears the selection when every tab is gone', async () => {
    vi.mocked(api.loadFile).mockRejectedValue(new Error('404'));
    const { result } = setup([file('/a/x.hl')], '/a/x.hl');
    await act(() => result.current.actions.reloadOpenFiles('/a/'));
    expect(result.current.openFiles).toEqual([]);
    expect(result.current.selectedFile).toBe('');
  });
});

describe('save', () => {
  it('returns false when nothing is selected', async () => {
    const { result } = setup([file('/a.hl')], '');
    let saved = true;
    await act(async () => {
      saved = await result.current.actions.save();
    });
    expect(saved).toBe(false);
    expect(api.saveFile).not.toHaveBeenCalled();
  });

  it('saves the selected file, moves its baseline and announces it', async () => {
    vi.mocked(api.saveFile).mockResolvedValue(undefined as never);
    const { result } = setup([file('/a.hl', 'new', 'old'), file('/b.hl', 'b', 'b2')], '/a.hl');
    let saved = false;
    await act(async () => {
      saved = await result.current.actions.save();
    });
    expect(saved).toBe(true);
    expect(api.saveFile).toHaveBeenCalledWith('/a.hl', 'new');
    expect(result.current.openFiles).toEqual([file('/a.hl', 'new'), file('/b.hl', 'b', 'b2')]);
    expect(toasts[0]).toMatchObject({ text: 'Saved /a.hl', isError: false });
    expect(result.current.actions.saving).toBe(false);
  });

  it('reports a failed save as false and leaves the file dirty', async () => {
    vi.mocked(api.saveFile).mockRejectedValue(new Error('disk full'));
    const { result } = setup([file('/a.hl', 'new', 'old')], '/a.hl');
    let saved = true;
    await act(async () => {
      saved = await result.current.actions.save();
    });
    expect(saved).toBe(false);
    expect(result.current.openFiles[0].saved).toBe('old');
    expect(toasts[0]).toMatchObject({ text: 'disk full', isError: true });
    expect(result.current.actions.saving).toBe(false);
  });

  it('refuses a second save while one is in flight', async () => {
    let finish: () => void = () => {
      // replaced once the save is in flight
    };
    vi.mocked(api.saveFile).mockImplementation(
      () =>
        new Promise<never>(resolve => {
          finish = () => resolve(undefined as never);
        }),
    );
    const { result } = setup([file('/a.hl', 'new', 'old')], '/a.hl');
    let first: Promise<boolean> = Promise.resolve(false);
    act(() => {
      first = result.current.actions.save();
    });
    expect(result.current.actions.saving).toBe(true);
    let second = true;
    await act(async () => {
      second = await result.current.actions.save();
    });
    expect(second).toBe(false);
    expect(api.saveFile).toHaveBeenCalledTimes(1);
    await act(async () => {
      finish();
      await first;
    });
    expect(result.current.actions.saving).toBe(false);
  });
});

describe('closeFile', () => {
  it('ignores a path that is not open', async () => {
    const { result, choice } = setup([file('/a.hl')], '/a.hl');
    await act(() => result.current.actions.closeFile('/zzz.hl'));
    expect(result.current.openFiles).toHaveLength(1);
    expect(choice).not.toHaveBeenCalled();
  });

  it('closes a clean file without asking and selects the last remaining tab', async () => {
    const { result, choice } = setup([file('/a.hl'), file('/b.hl'), file('/c.hl')], '/c.hl');
    await act(() => result.current.actions.closeFile('/c.hl'));
    expect(choice).not.toHaveBeenCalled();
    expect(result.current.openFiles.map(f => f.path)).toEqual(['/a.hl', '/b.hl']);
    expect(result.current.selectedFile).toBe('/b.hl');
  });

  it('keeps the selection when a different tab is closed', async () => {
    const { result } = setup([file('/a.hl'), file('/b.hl')], '/a.hl');
    await act(() => result.current.actions.closeFile('/b.hl'));
    expect(result.current.selectedFile).toBe('/a.hl');
  });

  it('clears the selection when the last tab closes', async () => {
    const { result } = setup([file('/a.hl')], '/a.hl');
    await act(() => result.current.actions.closeFile('/a.hl'));
    expect(result.current.selectedFile).toBe('');
  });

  it('keeps a dirty file open when the choice is cancelled or dismissed', async () => {
    const { result, choice } = setup([file('/a.hl', 'new', 'old')], '/a.hl');
    choice.mockResolvedValueOnce('cancel').mockResolvedValueOnce(null);
    await act(() => result.current.actions.closeFile('/a.hl'));
    await act(() => result.current.actions.closeFile('/a.hl'));
    expect(result.current.openFiles).toHaveLength(1);
    expect(api.saveFile).not.toHaveBeenCalled();
  });

  it('closes a dirty file without saving when asked to discard', async () => {
    const { result, choice } = setup([file('/a.hl', 'new', 'old')], '/a.hl');
    choice.mockResolvedValue('discard');
    await act(() => result.current.actions.closeFile('/a.hl'));
    expect(api.saveFile).not.toHaveBeenCalled();
    expect(result.current.openFiles).toEqual([]);
  });

  it('saves a dirty file before closing it', async () => {
    vi.mocked(api.saveFile).mockResolvedValue(undefined as never);
    const { result, choice, setWaiting } = setup([file('/a.hl', 'new', 'old')], '/a.hl');
    choice.mockResolvedValue('save');
    await act(() => result.current.actions.closeFile('/a.hl'));
    expect(api.saveFile).toHaveBeenCalledWith('/a.hl', 'new');
    expect(result.current.openFiles).toEqual([]);
    expect(setWaiting.mock.calls).toEqual([[true], [false]]);
  });

  it('keeps the tab open when saving before closing fails', async () => {
    vi.mocked(api.saveFile).mockRejectedValue(new Error('read-only'));
    const { result, choice, setWaiting } = setup([file('/a.hl', 'new', 'old')], '/a.hl');
    choice.mockResolvedValue('save');
    await act(() => result.current.actions.closeFile('/a.hl'));
    expect(result.current.openFiles).toHaveLength(1);
    expect(toasts[0]).toMatchObject({ text: 'read-only', isError: true });
    expect(setWaiting).toHaveBeenLastCalledWith(false);
  });
});
