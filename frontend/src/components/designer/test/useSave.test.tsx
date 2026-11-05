// @vitest-environment jsdom
/*
 * Saving the open page: nothing without a document, the design view writing the page and a
 * changed stylesheet (with its link version bumped), the code view writing the text as typed,
 * a linked file in the code view, the saved revision and dirty flag, and errors surfaced.
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import { joinCss, splitCss } from '../css';
import { useCodeDraft } from '../hooks/useCodeDraft';
import { useDocumentState } from '../hooks/useDocumentState';
import { useSave } from '../hooks/useSave';
import { useStylesheetState } from '../hooks/useStylesheetState';
import { useUndoHistory } from '../hooks/useUndoHistory';

vi.mock('../../../lib/api', async importOriginal => ({
  ...(await importOriginal<typeof import('../../../lib/api')>()),
  saveFile: vi.fn(),
}));

const PAGE =
  '<!doctype html><html><head><base href="https://cloud.example/"><link rel="stylesheet" href="/site.css"><script src="/app.js"></script></head><body><p>Hi</p></body></html>';
const PATH = '/etc/www/index.html';
const CSS = '/etc/www/site.css';

let toasts: Toast[];

beforeEach(() => {
  toasts = [];
  setToastListener(t => toasts.push(t));
  vi.mocked(api.saveFile).mockResolvedValue(undefined as never);
});

afterEach(() => {
  setToastListener(null);
  vi.clearAllMocks();
});

function setup(view = 'design', open = true) {
  const doc = new DOMParser().parseFromString(PAGE, 'text/html');
  const rig = renderHook(
    ({ current }: { current: string }) => {
      const documentState = useDocumentState();
      const codeDraft = useCodeDraft();
      const stylesheet = useStylesheetState();
      const undoHistory = useUndoHistory(documentState, stylesheet);
      const save = useSave({ view: current, documentState, codeDraft, stylesheet, undoHistory });
      return { documentState, codeDraft, stylesheet, undoHistory, save };
    },
    { initialProps: { current: view } },
  );
  if (open) {
    rig.result.current.documentState.docRef.current = doc;
    act(() => rig.result.current.documentState.setPath(PATH));
  }
  return { doc, rig };
}

describe('useSave design view', () => {
  it('does nothing without a document or a path', async () => {
    const { rig } = setup('design', false);
    expect(await rig.result.current.save()).toBe(false);
    expect(api.saveFile).not.toHaveBeenCalled();
  });

  it('writes the serialised page, remembers the revision and clears dirty', async () => {
    const { rig } = setup();
    act(() => rig.result.current.documentState.setDirty(true));
    rig.result.current.undoHistory.revisionRef.current = 7;
    let saved = false;
    await act(async () => {
      saved = await rig.result.current.save();
    });
    expect(saved).toBe(true);
    expect(api.saveFile).toHaveBeenCalledTimes(1);
    const [file, text] = vi.mocked(api.saveFile).mock.calls[0];
    expect(file).toBe(PATH);
    expect(text).toContain('<p>Hi</p>');
    expect(rig.result.current.undoHistory.savedRevisionRef.current).toBe(7);
    expect(rig.result.current.documentState.dirty).toBe(false);
    expect(rig.result.current.documentState.saving).toBe(false);
    expect(toasts).toEqual([expect.objectContaining({ text: 'Saved ' + PATH, isError: false })]);
  });

  it('also writes a changed stylesheet, bumping its link, and moves the baseline onto it', async () => {
    const { rig } = setup();
    act(() => {
      rig.result.current.stylesheet.setCssPath(CSS);
      rig.result.current.stylesheet.setOverrides({ p: { color: 'red' } });
    });
    await act(async () => {
      await rig.result.current.save();
    });
    const css = joinCss('', { p: { color: 'red' } }, '');
    expect(api.saveFile).toHaveBeenCalledTimes(2);
    expect(vi.mocked(api.saveFile).mock.calls[0][1]).toContain('/site.css?v=1');
    expect(vi.mocked(api.saveFile).mock.calls[1]).toEqual([CSS, css]);
    expect(rig.result.current.stylesheet.cssOriginal).toBe(css);
  });

  it('leaves the stylesheet alone when it has not changed', async () => {
    const { rig } = setup();
    act(() => {
      rig.result.current.stylesheet.setCssPath(CSS);
      rig.result.current.stylesheet.setCssOriginal(joinCss('', {}, ''));
    });
    await act(async () => {
      await rig.result.current.save();
    });
    expect(api.saveFile).toHaveBeenCalledTimes(1);
    expect(vi.mocked(api.saveFile).mock.calls[0][1]).not.toContain('?v=');
  });

  it('refreshes the code draft when it holds the stylesheet that was just written', async () => {
    const { rig } = setup();
    act(() => {
      rig.result.current.stylesheet.setCssPath(CSS);
      rig.result.current.stylesheet.setOverrides({ p: { color: 'red' } });
      rig.result.current.codeDraft.setCodeTarget(CSS);
    });
    await act(async () => {
      await rig.result.current.save();
    });
    const css = joinCss('', { p: { color: 'red' } }, '');
    expect(rig.result.current.codeDraft.code).toBe(css);
    expect(rig.result.current.codeDraft.codeOriginal).toBe(css);
  });

  it('reports a failed write, returns false and stops saving', async () => {
    vi.mocked(api.saveFile).mockRejectedValue(new Error('disk full'));
    const { rig } = setup();
    act(() => rig.result.current.documentState.setDirty(true));
    let saved = true;
    await act(async () => {
      saved = await rig.result.current.save();
    });
    expect(saved).toBe(false);
    expect(toasts).toEqual([expect.objectContaining({ text: 'disk full', isError: true })]);
    expect(rig.result.current.documentState.dirty).toBe(true);
    expect(rig.result.current.documentState.saving).toBe(false);
  });
});

describe('useSave code view', () => {
  it('writes the typed text as it is, not the re-serialised document', async () => {
    const { rig } = setup('code');
    act(() => {
      rig.result.current.codeDraft.setCodeTarget(PATH);
      rig.result.current.codeDraft.applyCode('<p>typed   by hand</p>');
    });
    await act(async () => {
      await rig.result.current.save();
    });
    expect(api.saveFile).toHaveBeenCalledWith(PATH, '<p>typed   by hand</p>');
  });

  it('writes a linked script together with the page, bumping its link', async () => {
    const { rig } = setup('code');
    act(() => {
      rig.result.current.codeDraft.setCodeTarget('/etc/www/app.js');
      rig.result.current.codeDraft.applyCode('console.log(1);');
      rig.result.current.documentState.setDirty(true);
    });
    let saved = false;
    await act(async () => {
      saved = await rig.result.current.save();
    });
    expect(saved).toBe(true);
    expect(vi.mocked(api.saveFile).mock.calls[0][1]).toContain('/app.js?v=1');
    expect(vi.mocked(api.saveFile).mock.calls[1]).toEqual(['/etc/www/app.js', 'console.log(1);']);
    expect(rig.result.current.codeDraft.codeOriginal).toBe('console.log(1);');
    expect(rig.result.current.documentState.dirty).toBe(false);
    expect(toasts[0].text).toBe('Saved /etc/www/app.js');
  });

  it('re-reads the style panel when the file written is its stylesheet', async () => {
    const { rig } = setup('code');
    const typed = '.a { color: red; }';
    act(() => {
      rig.result.current.stylesheet.setCssPath(CSS);
      rig.result.current.codeDraft.setCodeTarget(CSS);
      rig.result.current.codeDraft.applyCode(typed);
    });
    await act(async () => {
      await rig.result.current.save();
    });
    const split = splitCss(typed);
    expect(rig.result.current.stylesheet.cssOriginal).toBe(typed);
    expect(rig.result.current.stylesheet.cssHead).toBe(split.head);
    expect(rig.result.current.stylesheet.cssTail).toBe(split.tail);
    expect(rig.result.current.stylesheet.overrides).toEqual(split.overrides);
  });
});
