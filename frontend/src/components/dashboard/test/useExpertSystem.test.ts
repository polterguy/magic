// @vitest-environment jsdom
/*
 * useExpertSystem: whether anything is served at the root URL (an index.html under
 * /etc/www/), and installing the Expert System plugin and polling until it appears.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import { EXPERT_SYSTEM_PLUGIN, EXPERT_SYSTEM_POLLS } from '../constants';
import { useExpertSystem } from '../hooks/useExpertSystem';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

const toasts: Toast[] = [];
const app = { name: EXPERT_SYSTEM_PLUGIN } as api.BazarApp;

beforeEach(() => {
  toasts.length = 0;
  setToastListener(toast => toasts.push(toast));
});

afterEach(() => {
  vi.useRealTimers();
  setToastListener(null);
  vi.clearAllMocks();
});

describe('root detection', () => {
  it('is unknown until the listing arrives', async () => {
    vi.mocked(api.listFiles).mockResolvedValue([]);
    const { result } = renderHook(() => useExpertSystem());
    expect(result.current.rootServed).toBeNull();
    await waitFor(() => expect(result.current.rootServed).toBe(false));
    expect(api.listFiles).toHaveBeenCalledWith('/etc/www/');
  });

  it('is served when /etc/www/index.html exists', async () => {
    vi.mocked(api.listFiles).mockResolvedValue(['/etc/www/other.html', '/etc/www/index.html']);
    const { result } = renderHook(() => useExpertSystem());
    await waitFor(() => expect(result.current.rootServed).toBe(true));
  });

  it('treats an empty answer as not served', async () => {
    vi.mocked(api.listFiles).mockResolvedValue(undefined as never);
    const { result } = renderHook(() => useExpertSystem());
    await waitFor(() => expect(result.current.rootServed).toBe(false));
  });

  it('stays unknown when the listing fails', async () => {
    vi.mocked(api.listFiles).mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useExpertSystem());
    await waitFor(() => expect(api.listFiles).toHaveBeenCalled());
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.rootServed).toBeNull();
  });
});

describe('installExpertSystem', () => {
  it('fails loudly when the plugin is not in the repository', async () => {
    vi.mocked(api.listFiles).mockResolvedValue([]);
    vi.mocked(api.availablePlugins).mockResolvedValue([{ name: 'something-else' } as api.BazarApp]);
    const { result } = renderHook(() => useExpertSystem());
    await act(() => result.current.installExpertSystem());
    expect(api.installPlugin).not.toHaveBeenCalled();
    expect(toasts[0]).toMatchObject({
      text: 'The AI Expert System is not available in the plugin repository',
      isError: true,
    });
    expect(result.current.installingExpertSystem).toBe(false);
  });

  it('treats an empty repository answer as nothing available', async () => {
    vi.mocked(api.listFiles).mockResolvedValue([]);
    vi.mocked(api.availablePlugins).mockResolvedValue(undefined as never);
    const { result } = renderHook(() => useExpertSystem());
    await act(() => result.current.installExpertSystem());
    expect(toasts[0].isError).toBe(true);
  });

  it('installs, waits for the files and then flips to served', async () => {
    vi.useFakeTimers();
    vi.mocked(api.listFiles)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValue(['/etc/www/index.html']);
    vi.mocked(api.availablePlugins).mockResolvedValue([app]);
    const { result } = renderHook(() => useExpertSystem());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.rootServed).toBe(false);

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.installExpertSystem();
    });
    expect(result.current.installingExpertSystem).toBe(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(api.installPlugin).toHaveBeenCalledWith(app);
    expect(result.current.rootServed).toBe(false);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
      await pending;
    });
    expect(result.current.rootServed).toBe(true);
    expect(result.current.installingExpertSystem).toBe(false);
    expect(toasts.at(-1)).toMatchObject({
      text: 'The AI Expert System is installed',
      isError: false,
    });
  });

  it('gives up with a warning after the allowed number of polls', async () => {
    vi.useFakeTimers();
    vi.mocked(api.listFiles).mockResolvedValue([]);
    vi.mocked(api.availablePlugins).mockResolvedValue([app]);
    const { result } = renderHook(() => useExpertSystem());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    vi.mocked(api.listFiles).mockClear();

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.installExpertSystem();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000 * EXPERT_SYSTEM_POLLS);
      await pending;
    });

    expect(api.listFiles).toHaveBeenCalledTimes(EXPERT_SYSTEM_POLLS);
    expect(result.current.rootServed).toBe(false);
    expect(toasts.at(-1)).toMatchObject({
      text: 'The AI Expert System is taking longer than expected to install — check your log',
      isError: true,
    });
    expect(result.current.installingExpertSystem).toBe(false);
  });

  it('reports an install failure', async () => {
    vi.mocked(api.listFiles).mockResolvedValue([]);
    vi.mocked(api.availablePlugins).mockResolvedValue([app]);
    vi.mocked(api.installPlugin).mockRejectedValue(new Error('bazar down'));
    const { result } = renderHook(() => useExpertSystem());
    await act(() => result.current.installExpertSystem());
    expect(toasts[0]).toMatchObject({ text: 'bazar down', isError: true });
    expect(result.current.installingExpertSystem).toBe(false);
  });
});
