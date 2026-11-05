// @vitest-environment jsdom
/*
 * useExecution: running the open file (as an endpoint over HTTP, or through the evaluator with
 * a parametrise form), recording a debug run, generating code from a selection, and the
 * save-before-invoke guard.
 */
import type { EditorView } from '@codemirror/view';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import { useExecution } from '../hooks/useExecution';
import type { OpenTabs } from '../hooks/useOpenTabs';

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

function setup(options: { selectedFile?: string; content?: string; saved?: string } = {}) {
  const selectedFile = options.selectedFile ?? '/scripts/script.hl';
  const content = options.content ?? 'log.info:hi';
  const saved = options.saved ?? content;
  const updateContent = vi.fn();
  const tabs = {
    selectedFile,
    content,
    current: { path: selectedFile, content, saved },
    updateContent,
  } as unknown as OpenTabs;
  const save = vi.fn<() => Promise<boolean>>().mockResolvedValue(true);
  const setWaiting = vi.fn();
  const dialog = {
    confirm: vi.fn<() => Promise<boolean>>().mockResolvedValue(true),
    confirmTyped: vi.fn(),
    prompt: vi.fn(),
    form: vi.fn(),
    choice: vi.fn(),
  };
  const hook = renderHook(() => useExecution({ tabs, save, setWaiting, dialog }));
  return { updateContent, save, setWaiting, dialog, ...hook };
}

// The slice of a CodeMirror view the hook reads: the main selection and the text under it.
function selectionOf(text: string) {
  return {
    state: { selection: { main: { from: 0, to: text.length } }, sliceDoc: () => text },
  } as unknown as EditorView;
}

describe('execute', () => {
  it('ignores a file that is not Hyperlambda', async () => {
    const { result } = setup({ selectedFile: '/scripts/readme.md' });
    await act(() => result.current.execute());
    expect(api.getHyperlambdaArguments).not.toHaveBeenCalled();
    expect(api.evaluateWithArgs).not.toHaveBeenCalled();
  });

  it('evaluates the editor content directly when it takes no arguments', async () => {
    vi.mocked(api.getHyperlambdaArguments).mockResolvedValue({});
    vi.mocked(api.evaluateWithArgs).mockResolvedValue({ result: 'ok' } as never);
    const { result, setWaiting, dialog } = setup({ content: 'return:x' });
    await act(() => result.current.execute());
    expect(api.getHyperlambdaArguments).toHaveBeenCalledWith('return:x');
    expect(dialog.form).not.toHaveBeenCalled();
    expect(api.evaluateWithArgs).toHaveBeenCalledWith('return:x', null);
    expect(result.current.executeResult).toEqual({ result: 'ok' });
    expect(result.current.resultWasHttp).toBe(false);
    expect(setWaiting).toHaveBeenLastCalledWith(false);
  });

  it('treats a missing argument description as no arguments', async () => {
    vi.mocked(api.getHyperlambdaArguments).mockResolvedValue(undefined as never);
    const { result } = setup();
    await act(() => result.current.execute());
    expect(api.evaluateWithArgs).toHaveBeenCalledWith('log.info:hi', null);
  });

  it('runs only the selected code when something is selected', async () => {
    vi.mocked(api.getHyperlambdaArguments).mockResolvedValue({});
    const { result } = setup({ content: 'whole file' });
    result.current.editorRef.current = selectionOf('just this');
    await act(() => result.current.execute());
    expect(api.getHyperlambdaArguments).toHaveBeenCalledWith('just this');
    expect(api.evaluateWithArgs).toHaveBeenCalledWith('just this', null);
  });

  it('asks for the arguments and converts them to their declared types', async () => {
    vi.mocked(api.getHyperlambdaArguments).mockResolvedValue({
      count: { type: 'int', mandatory: true },
      active: { type: 'bool', mandatory: false },
      label: { type: 'string', mandatory: false },
      skipped: { type: 'string', mandatory: false },
      empty: { type: 'string', mandatory: false },
    });
    const { result, dialog } = setup();
    dialog.form.mockResolvedValue({ count: '5', active: 'yes', label: 'hi', empty: '' });
    await act(() => result.current.execute());
    expect(dialog.form).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Parametrise invocation',
        message: '/scripts/script.hl',
        fields: [
          { name: 'count', type: 'int', mandatory: true },
          { name: 'active', type: 'bool', mandatory: false },
          { name: 'label', type: 'string', mandatory: false },
          { name: 'skipped', type: 'string', mandatory: false },
          { name: 'empty', type: 'string', mandatory: false },
        ],
      }),
    );
    expect(api.evaluateWithArgs).toHaveBeenCalledWith('log.info:hi', {
      count: 5,
      active: true,
      label: 'hi',
    });
  });

  it('does not run anything when the parametrise form is cancelled', async () => {
    vi.mocked(api.getHyperlambdaArguments).mockResolvedValue({
      a: { type: 'string', mandatory: false },
    });
    const { result, dialog, setWaiting } = setup();
    dialog.form.mockResolvedValue(null);
    await act(() => result.current.execute());
    expect(api.evaluateWithArgs).not.toHaveBeenCalled();
    expect(setWaiting).toHaveBeenLastCalledWith(false);
  });

  it('reports an evaluation failure', async () => {
    vi.mocked(api.getHyperlambdaArguments).mockResolvedValue({});
    vi.mocked(api.evaluateWithArgs).mockRejectedValue(new Error('syntax error'));
    const { result } = setup();
    await act(() => result.current.execute());
    expect(result.current.executeResult).toBeNull();
    expect(toasts[0]).toMatchObject({ text: 'syntax error', isError: true });
  });
});

describe('execute on an endpoint file', () => {
  const ENDPOINT_FILE = '/modules/app/hello.get.hl';
  const meta = { path: 'magic/modules/app/hello', verb: 'get' };

  it('opens the invoker for the endpoint the server lists', async () => {
    vi.mocked(api.listEndpoints).mockResolvedValue([
      { path: 'magic/modules/app/other', verb: 'get' },
      { ...meta, verb: 'GET' },
    ] as never);
    const { result, dialog } = setup({ selectedFile: ENDPOINT_FILE });
    await act(() => result.current.execute());
    expect(dialog.confirm).not.toHaveBeenCalled();
    expect(api.evaluateWithArgs).not.toHaveBeenCalled();
    expect(result.current.invokeTarget).toEqual({ ...meta, verb: 'GET' });
  });

  it('warns when the server does not list the endpoint', async () => {
    vi.mocked(api.listEndpoints).mockResolvedValue([]);
    const { result } = setup({ selectedFile: ENDPOINT_FILE });
    await act(() => result.current.execute());
    expect(result.current.invokeTarget).toBeNull();
    expect(toasts[0]).toMatchObject({
      text: 'The server does not list GET magic/modules/app/hello as an endpoint',
      isError: true,
    });
  });

  it('reports a failure to list endpoints', async () => {
    vi.mocked(api.listEndpoints).mockRejectedValue(new Error('offline'));
    const { result, setWaiting } = setup({ selectedFile: ENDPOINT_FILE });
    await act(() => result.current.execute());
    expect(toasts[0].text).toBe('offline');
    expect(setWaiting).toHaveBeenLastCalledWith(false);
  });

  it('offers to save unsaved changes first, and invokes after a successful save', async () => {
    vi.mocked(api.listEndpoints).mockResolvedValue([meta] as never);
    const { result, dialog, save } = setup({
      selectedFile: ENDPOINT_FILE,
      content: 'new',
      saved: 'old',
    });
    await act(() => result.current.execute());
    expect(dialog.confirm).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Save before invoking?', confirmText: 'Save and invoke' }),
    );
    expect(save).toHaveBeenCalledTimes(1);
    expect(result.current.invokeTarget).toEqual(meta);
  });

  it('does not invoke when the save offer is declined', async () => {
    const { result, dialog, save } = setup({
      selectedFile: ENDPOINT_FILE,
      content: 'new',
      saved: 'old',
    });
    dialog.confirm.mockResolvedValue(false);
    await act(() => result.current.execute());
    expect(save).not.toHaveBeenCalled();
    expect(api.listEndpoints).not.toHaveBeenCalled();
  });

  it('does not invoke stale server code when the save fails', async () => {
    const { result, save, setWaiting } = setup({
      selectedFile: ENDPOINT_FILE,
      content: 'new',
      saved: 'old',
    });
    save.mockResolvedValue(false);
    await act(() => result.current.execute());
    expect(api.listEndpoints).not.toHaveBeenCalled();
    expect(result.current.invokeTarget).toBeNull();
    expect(setWaiting).toHaveBeenLastCalledWith(false);
  });
});

describe('runDebug', () => {
  it('records the editor content with the given arguments', async () => {
    const recording = { steps: [] };
    vi.mocked(api.debugHyperlambda).mockResolvedValue(recording);
    const { result } = setup({ content: 'the code' });
    await act(() => result.current.runDebug({ a: 1 }));
    expect(api.debugHyperlambda).toHaveBeenCalledWith('the code', { a: 1 });
    expect(result.current.recording).toBe(recording);
  });

  it('prefers explicit code over the editor content', async () => {
    const { result } = setup({ content: 'the code' });
    await act(() => result.current.runDebug(null, 'other code'));
    expect(api.debugHyperlambda).toHaveBeenCalledWith('other code', null);
  });

  it('reports a failed recording and releases the waiter', async () => {
    vi.mocked(api.debugHyperlambda).mockRejectedValue(new Error('crashed'));
    const { result, setWaiting } = setup();
    await act(() => result.current.runDebug({}));
    expect(result.current.recording).toBeNull();
    expect(toasts[0].text).toBe('crashed');
    expect(setWaiting).toHaveBeenLastCalledWith(false);
  });
});

describe('generateFromSelection', () => {
  it('does nothing without a selection', async () => {
    const { result, updateContent } = setup();
    await act(() => result.current.generateFromSelection());
    result.current.editorRef.current = selectionOf('   ');
    await act(() => result.current.generateFromSelection());
    expect(api.aiQuery).not.toHaveBeenCalled();
    expect(updateContent).not.toHaveBeenCalled();
  });

  it('sends only the selection and replaces the whole file with the answer', async () => {
    vi.mocked(api.aiQuery).mockResolvedValue({ result: 'generated code' });
    const { result, updateContent } = setup({ content: 'surrounding code' });
    result.current.editorRef.current = selectionOf('write a loop');
    await act(() => result.current.generateFromSelection());
    expect(api.aiQuery).toHaveBeenCalledWith('write a loop', 'hl');
    expect(updateContent).toHaveBeenCalledWith('generated code');
    expect(result.current.generating).toBe(false);
  });

  it('reports a generator failure and leaves the file alone', async () => {
    vi.mocked(api.aiQuery).mockRejectedValue(new Error('quota'));
    const { result, updateContent } = setup();
    result.current.editorRef.current = selectionOf('spec');
    await act(() => result.current.generateFromSelection());
    expect(updateContent).not.toHaveBeenCalled();
    expect(toasts[0].text).toBe('quota');
    expect(result.current.generating).toBe(false);
  });
});

describe('state setters', () => {
  it('lets the page clear results and toggle the selection flag', () => {
    const { result } = setup();
    act(() => {
      result.current.setHasSelection(true);
      result.current.setResultWasHttp(true);
      result.current.setExecuteResult({ result: 1 } as never);
    });
    expect(result.current.hasSelection).toBe(true);
    expect(result.current.resultWasHttp).toBe(true);
    expect(result.current.executeResult).toEqual({ result: 1 });
    act(() => result.current.setExecuteResult(null));
    expect(result.current.executeResult).toBeNull();
  });
});
