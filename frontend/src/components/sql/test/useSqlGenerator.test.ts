// @vitest-environment jsdom
/*
 * useSqlGenerator: the Generate button only shows when OpenAI is configured, and turns the
 * selected text into the whole buffer.
 */
import type { EditorView } from '@codemirror/view';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { RefObject } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { showToast } from '../../../lib/toast';
import { useSqlGenerator } from '../hooks/useSqlGenerator';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

vi.mock('../../../lib/toast', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  showToast: vi.fn(),
}));

const setSql = vi.fn();
const bumpSqlEditId = vi.fn();
const createAiContext = vi.fn();

function editorSelecting(text: string) {
  return {
    current: {
      state: {
        selection: { main: { from: 0, to: text.length } },
        sliceDoc: () => text,
      },
    },
  } as unknown as RefObject<EditorView | null>;
}

function setup(editorRef: RefObject<EditorView | null>) {
  return renderHook(() => useSqlGenerator({ editorRef, createAiContext, setSql, bumpSqlEditId }));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.openaiIsConfigured).mockResolvedValue({ result: true });
  vi.mocked(api.aiQuery).mockResolvedValue({ result: 'select count(*) from orders' });
  createAiContext.mockResolvedValue('schema context');
});

describe('useSqlGenerator', () => {
  it('knows whether OpenAI is configured', async () => {
    const { result } = setup({ current: null });
    expect(result.current.aiConfigured).toBe(false);

    await waitFor(() => expect(result.current.aiConfigured).toBe(true));
  });

  it('hides the button when OpenAI is not configured or the check fails', async () => {
    vi.mocked(api.openaiIsConfigured).mockResolvedValue({ result: false });
    const first = setup({ current: null });
    await waitFor(() => expect(api.openaiIsConfigured).toHaveBeenCalled());
    expect(first.result.current.aiConfigured).toBe(false);

    vi.mocked(api.openaiIsConfigured).mockRejectedValue(new Error('x'));
    const second = setup({ current: null });
    await waitFor(() => expect(api.openaiIsConfigured).toHaveBeenCalledTimes(2));
    expect(second.result.current.aiConfigured).toBe(false);
  });

  it('tracks whether there is a selection', () => {
    const { result } = setup({ current: null });

    act(() => result.current.setHasSelection(true));

    expect(result.current.hasSelection).toBe(true);
  });

  it('does nothing without selected text', async () => {
    const { result } = setup(editorSelecting('   '));

    await act(() => result.current.generateFromSelection());

    expect(api.aiQuery).not.toHaveBeenCalled();
    expect(setSql).not.toHaveBeenCalled();
  });

  it('sends the selection as the specification and replaces the whole buffer', async () => {
    const { result } = setup(editorSelecting('count the orders'));

    await act(() => result.current.generateFromSelection());

    expect(api.aiQuery).toHaveBeenCalledWith(
      'count the orders',
      'sql',
      'schema context',
      'sql-studio.editor',
    );
    expect(setSql).toHaveBeenCalledWith('select count(*) from orders');
    expect(bumpSqlEditId).toHaveBeenCalled();
    expect(result.current.generating).toBe(false);
  });

  it('shows the error and leaves the buffer alone when generation fails', async () => {
    vi.mocked(api.aiQuery).mockRejectedValue(new Error('quota'));
    const { result } = setup(editorSelecting('count the orders'));

    await act(() => result.current.generateFromSelection());

    expect(showToast).toHaveBeenCalledWith('quota', true, undefined);
    expect(setSql).not.toHaveBeenCalled();
    expect(result.current.generating).toBe(false);
  });
});
