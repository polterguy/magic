// @vitest-environment jsdom
/*
 * useOpenAiConfigured: null while unknown, then whether an OpenAI key is configured; a failed
 * check goes back to unknown rather than claiming either answer.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { useOpenAiConfigured } from '../hooks/useOpenAiConfigured';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

afterEach(() => {
  vi.clearAllMocks();
});

describe('useOpenAiConfigured', () => {
  it('is unknown until the answer arrives', async () => {
    vi.mocked(api.openaiIsConfigured).mockResolvedValue({ result: true });
    const { result } = renderHook(() => useOpenAiConfigured());
    expect(result.current.openaiConfigured).toBeNull();
    await waitFor(() => expect(result.current.openaiConfigured).toBe(true));
  });

  it('reports a missing key', async () => {
    vi.mocked(api.openaiIsConfigured).mockResolvedValue({ result: false });
    const { result } = renderHook(() => useOpenAiConfigured());
    await waitFor(() => expect(result.current.openaiConfigured).toBe(false));
  });

  it('stays unknown when the check fails', async () => {
    vi.mocked(api.openaiIsConfigured).mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useOpenAiConfigured());
    await waitFor(() => expect(api.openaiIsConfigured).toHaveBeenCalled());
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.openaiConfigured).toBeNull();
  });

  it('lets the page flip the flag and toggle the key dialog', async () => {
    vi.mocked(api.openaiIsConfigured).mockResolvedValue({ result: false });
    const { result } = renderHook(() => useOpenAiConfigured());
    await waitFor(() => expect(result.current.openaiConfigured).toBe(false));
    expect(result.current.configuringOpenai).toBe(false);
    act(() => {
      result.current.setConfiguringOpenai(true);
      result.current.setOpenaiConfigured(true);
    });
    expect(result.current.configuringOpenai).toBe(true);
    expect(result.current.openaiConfigured).toBe(true);
  });
});
