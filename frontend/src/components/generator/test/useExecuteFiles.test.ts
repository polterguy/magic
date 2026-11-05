// @vitest-environment jsdom
/*
 * useExecuteFiles: lists the module .hl files, filters and picks them, builds the slot lines,
 * and resolves a file's description tooltip from the endpoint list or from the file itself.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import type { MouseEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { showToast } from '../../../lib/toast';
import { TOOLTIP_WIDTH } from '../endpointMeta';
import { useExecuteFiles } from '../hooks/useExecuteFiles';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

vi.mock('../../../lib/toast', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  showToast: vi.fn(),
}));

const onAdd = vi.fn();
const onCancel = vi.fn();

const FILES = ['/modules/a/one.get.hl', '/modules/a/two.hl', '/modules/b/Three.post.hl', '/x.txt'];

const preventDefault = vi.fn();
const stopPropagation = vi.fn();

function clickEvent(rect: Partial<DOMRect>) {
  return {
    preventDefault,
    stopPropagation,
    currentTarget: { getBoundingClientRect: () => ({ right: 0, bottom: 0, ...rect }) },
  } as unknown as MouseEvent;
}

async function loaded() {
  const hook = renderHook(() => useExecuteFiles({ onAdd, onCancel }));
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.listFilesRecursively).mockResolvedValue(FILES);
  vi.mocked(api.listEndpointsDetailed).mockResolvedValue([
    { path: 'magic/a/one', verb: 'get', description: 'Reads one', input: [] },
  ] as never);
});

describe('useExecuteFiles', () => {
  it('lists only .hl files and stops loading', async () => {
    const { result } = await loaded();

    expect(api.listFilesRecursively).toHaveBeenCalledWith('/modules/', true);
    expect(result.current.shown).toEqual(FILES.slice(0, 3));
  });

  it('tells the user when the files cannot be loaded', async () => {
    vi.mocked(api.listFilesRecursively).mockRejectedValue(new Error('x'));
    const { result } = await loaded();

    expect(showToast).toHaveBeenCalledWith('Could not load module files', true);
    expect(result.current.shown).toEqual([]);
  });

  it('filters case-insensitively', async () => {
    const { result } = await loaded();

    act(() => result.current.setFilter('THREE'));

    expect(result.current.shown).toEqual(['/modules/b/Three.post.hl']);
  });

  it('ticks and unticks every shown file and leaves other picks alone', async () => {
    const { result } = await loaded();
    act(() => result.current.setChosen({ '/modules/b/Three.post.hl': true }));
    act(() => result.current.setFilter('/a/'));

    act(() => result.current.toggleShown(true));

    expect(result.current.count).toBe(3);
    expect(result.current.allShownChosen).toBe(true);

    act(() => result.current.toggleShown(false));

    expect(result.current.count).toBe(1);
    expect(result.current.chosen['/modules/b/Three.post.hl']).toBe(true);
    expect(result.current.allShownChosen).toBe(false);
  });

  it('refuses to add with nothing picked', async () => {
    const { result } = await loaded();

    act(() => result.current.add());

    expect(showToast).toHaveBeenCalledWith('Pick at least one file', true);
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('adds three slot lines per picked file', async () => {
    const { result } = await loaded();
    act(() => result.current.setChosen({ '/modules/a/one.get.hl': true, '/x': false }));

    act(() => result.current.add());

    expect(onAdd).toHaveBeenCalledWith([
      'execute-file:/modules/a/one.get.hl',
      'io.file.execute:/modules/a/one.get.hl',
      'io.file.load:/modules/a/one.get.hl',
    ]);
  });

  it('describes an endpoint file from the endpoint list, anchored inside the viewport', async () => {
    const { result } = await loaded();
    await waitFor(() => expect(api.listEndpointsDetailed).toHaveBeenCalled());
    const event = clickEvent({ right: 2000, bottom: 40 });

    await act(() => result.current.toggleDescription('/modules/a/one.get.hl', event));

    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
    expect(api.loadFile).not.toHaveBeenCalled();
    expect(result.current.tooltip).toEqual({
      path: '/modules/a/one.get.hl',
      text: 'Reads one',
      x: window.innerWidth - TOOLTIP_WIDTH - 8,
      y: 44,
    });
  });

  it('clamps the tooltip to the left edge and toggles it off on a second click', async () => {
    const { result } = await loaded();
    await act(() => result.current.toggleDescription('/modules/a/one.get.hl', clickEvent({})));
    expect(result.current.tooltip?.x).toBe(8);

    await act(() => result.current.toggleDescription('/modules/a/one.get.hl', clickEvent({})));

    expect(result.current.tooltip).toBeNull();
  });

  it('serves a repeated request from the cache', async () => {
    vi.mocked(api.loadFile).mockResolvedValue('// A startup script\n');
    vi.mocked(api.getHyperlambdaArguments).mockResolvedValue(null);
    const { result } = await loaded();

    await act(() => result.current.toggleDescription('/modules/a/two.hl', clickEvent({})));
    act(() => result.current.setTooltip(null));
    await act(() => result.current.toggleDescription('/modules/a/two.hl', clickEvent({})));

    expect(api.loadFile).toHaveBeenCalledTimes(1);
    expect(result.current.tooltip?.text).toBe('A startup script');
  });

  it('falls back to the file comment and its arguments for a non-endpoint file', async () => {
    vi.mocked(api.loadFile).mockResolvedValue('/*\n * Does work\n */\n');
    vi.mocked(api.getHyperlambdaArguments).mockResolvedValue({
      name: { type: 'string', mandatory: true },
    });
    const { result } = await loaded();

    await act(() => result.current.toggleDescription('/modules/a/two.hl', clickEvent({})));

    expect(api.getHyperlambdaArguments).toHaveBeenCalledWith('/*\n * Does work\n */\n');
    expect(result.current.tooltip?.text).toBe(
      'Does work\n\nArguments:\n  name: string (mandatory)',
    );
    expect(result.current.descLoading).toBeNull();
  });

  it('says so when a fallback file has no comment', async () => {
    vi.mocked(api.loadFile).mockResolvedValue('log.info:x\n');
    vi.mocked(api.getHyperlambdaArguments).mockResolvedValue(null);
    const { result } = await loaded();

    await act(() => result.current.toggleDescription('/modules/a/two.hl', clickEvent({})));

    expect(result.current.tooltip?.text).toBe('No file-level comment.');
  });

  it('reports a file that cannot be loaded and clears the loading marker', async () => {
    vi.mocked(api.loadFile).mockRejectedValue(new Error('gone'));
    const { result } = await loaded();

    await act(() => result.current.toggleDescription('/modules/a/two.hl', clickEvent({})));

    expect(showToast).toHaveBeenCalledWith('Could not load /modules/a/two.hl', true);
    expect(result.current.tooltip).toBeNull();
    expect(result.current.descLoading).toBeNull();
  });

  it('still works when the endpoint list cannot be fetched', async () => {
    vi.mocked(api.listEndpointsDetailed).mockRejectedValue(new Error('x'));
    vi.mocked(api.loadFile).mockResolvedValue('// Hello\n');
    vi.mocked(api.getHyperlambdaArguments).mockResolvedValue(null);
    const { result } = await loaded();

    await act(() => result.current.toggleDescription('/modules/a/one.get.hl', clickEvent({})));

    expect(result.current.tooltip?.text).toBe('Hello');
  });
});
