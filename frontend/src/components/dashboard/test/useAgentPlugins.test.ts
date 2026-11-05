// @vitest-environment jsdom
/*
 * useAgentPlugins: which of the MCP and OAuth plugins are missing (judged by their module
 * folders), and installing the missing ones.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import { AGENT_PLUGINS } from '../constants';
import { useAgentPlugins } from '../hooks/useAgentPlugins';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

const toasts: Toast[] = [];

beforeEach(() => {
  toasts.length = 0;
  setToastListener(toast => toasts.push(toast));
});

afterEach(() => {
  setToastListener(null);
  vi.clearAllMocks();
});

const plugin = (name: string) => ({ name }) as api.BazarApp;

describe('detection', () => {
  it('lists every agent plugin as missing when no module folder exists', async () => {
    vi.mocked(api.listFolders).mockResolvedValue([]);
    const { result } = renderHook(() => useAgentPlugins());
    await waitFor(() => expect(result.current.missingPlugins).toEqual([...AGENT_PLUGINS]));
    expect(api.listFolders).toHaveBeenCalledWith('/modules/');
  });

  it('lists none when every module folder exists', async () => {
    vi.mocked(api.listFolders).mockResolvedValue(
      AGENT_PLUGINS.map(name => '/modules/' + name + '/'),
    );
    const { result } = renderHook(() => useAgentPlugins());
    await waitFor(() => expect(api.listFolders).toHaveBeenCalled());
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.missingPlugins).toEqual([]);
  });

  it('lists only the ones whose folder is absent', async () => {
    vi.mocked(api.listFolders).mockResolvedValue(['/modules/' + AGENT_PLUGINS[0] + '/']);
    const { result } = renderHook(() => useAgentPlugins());
    await waitFor(() => expect(result.current.missingPlugins).toEqual(AGENT_PLUGINS.slice(1)));
  });

  it('says nothing when the folders cannot be listed', async () => {
    vi.mocked(api.listFolders).mockRejectedValue(new Error('denied'));
    const { result } = renderHook(() => useAgentPlugins());
    await waitFor(() => expect(api.listFolders).toHaveBeenCalled());
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.missingPlugins).toEqual([]);
    expect(toasts).toHaveLength(0);
  });
});

describe('installAgentPlugins', () => {
  async function missingAll() {
    vi.mocked(api.listFolders).mockResolvedValue([]);
    const hook = renderHook(() => useAgentPlugins());
    await waitFor(() =>
      expect(hook.result.current.missingPlugins).toHaveLength(AGENT_PLUGINS.length),
    );
    return hook;
  }

  it('installs each missing plugin in order, announces it and clears the list', async () => {
    vi.mocked(api.availablePlugins).mockResolvedValue([
      plugin('unrelated'),
      ...AGENT_PLUGINS.map(plugin),
    ]);
    const { result } = await missingAll();
    await act(() => result.current.installAgentPlugins());
    expect(vi.mocked(api.installPlugin).mock.calls.map(call => call[0].name)).toEqual([
      ...AGENT_PLUGINS,
    ]);
    expect(toasts[0].isError).toBe(false);
    expect(toasts[0].text).toContain('Installing ' + AGENT_PLUGINS.join(' and '));
    expect(result.current.missingPlugins).toEqual([]);
    expect(result.current.installing).toBe(false);
  });

  it('fails loudly when a plugin is not in the repository, keeping the list', async () => {
    vi.mocked(api.availablePlugins).mockResolvedValue([plugin(AGENT_PLUGINS[0])]);
    const { result } = await missingAll();
    await act(() => result.current.installAgentPlugins());
    expect(api.installPlugin).toHaveBeenCalledTimes(1);
    expect(toasts[0]).toMatchObject({
      text: AGENT_PLUGINS[1] + ' is not available in the plugin repository',
      isError: true,
    });
    expect(result.current.missingPlugins).toHaveLength(AGENT_PLUGINS.length);
    expect(result.current.installing).toBe(false);
  });

  it('treats an empty repository answer as nothing available', async () => {
    vi.mocked(api.availablePlugins).mockResolvedValue(undefined as never);
    const { result } = await missingAll();
    await act(() => result.current.installAgentPlugins());
    expect(api.installPlugin).not.toHaveBeenCalled();
    expect(toasts[0].isError).toBe(true);
  });

  it('reports an install failure', async () => {
    vi.mocked(api.availablePlugins).mockResolvedValue(AGENT_PLUGINS.map(plugin));
    vi.mocked(api.installPlugin).mockRejectedValue(new Error('download failed'));
    const { result } = await missingAll();
    await act(() => result.current.installAgentPlugins());
    expect(toasts[0].text).toBe('download failed');
    expect(result.current.missingPlugins).toHaveLength(AGENT_PLUGINS.length);
  });
});
