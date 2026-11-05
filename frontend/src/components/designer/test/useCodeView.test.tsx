// @vitest-environment jsdom
/*
 * Moving between the Design, Code and Live views and between the files the code view can hold:
 * refusing to switch file with unsaved text, where each file's text comes from, the Live
 * confirmation with unsaved work, applying typed markup or CSS on the way out, and loading
 * (or refreshing) the text on the way in.
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import { joinCss, splitCss } from '../css';
import { useCodeDraft } from '../hooks/useCodeDraft';
import { useCodeView } from '../hooks/useCodeView';
import { useDocumentState } from '../hooks/useDocumentState';
import { useStylesheetState } from '../hooks/useStylesheetState';
import { useUndoHistory } from '../hooks/useUndoHistory';
import { serializeDocument } from '../html';

vi.mock('../../../lib/api', async importOriginal => ({
  ...(await importOriginal<typeof import('../../../lib/api')>()),
  loadFile: vi.fn(),
}));

const PATH = '/etc/www/index.html';
const CSS = '/etc/www/site.css';
const PAGE = '<!doctype html><html><head></head><body><p id="one">Hi</p></body></html>';

let toasts: Toast[];

beforeEach(() => {
  toasts = [];
  setToastListener(t => toasts.push(t));
  vi.mocked(api.loadFile).mockResolvedValue('console.log(1);');
});

afterEach(() => {
  setToastListener(null);
  vi.clearAllMocks();
});

function setup(view = 'design') {
  const doc = new DOMParser().parseFromString(PAGE, 'text/html');
  const choice = vi.fn();
  const save = vi.fn().mockResolvedValue(true);
  const setView = vi.fn();
  const rig = renderHook(
    ({ current }: { current: string }) => {
      const documentState = useDocumentState();
      const codeDraft = useCodeDraft();
      const stylesheet = useStylesheetState();
      const undoHistory = useUndoHistory(documentState, stylesheet);
      const views = useCodeView({
        origin: 'https://cloud.example',
        choice: choice as never,
        save,
        ui: { view: current, setView },
        documentState,
        codeDraft,
        stylesheet,
        undoHistory,
      });
      return { documentState, codeDraft, stylesheet, undoHistory, views };
    },
    { initialProps: { current: view } },
  );
  rig.result.current.documentState.docRef.current = doc;
  act(() => rig.result.current.documentState.setPath(PATH));
  return { doc, rig, choice, save, setView };
}

describe('useCodeView switchCodeTarget', () => {
  it('does nothing when the file is already open', async () => {
    const { rig } = setup();
    act(() => rig.result.current.codeDraft.setCodeTarget(PATH));
    await act(async () => {
      await rig.result.current.views.switchCodeTarget(PATH);
    });
    expect(api.loadFile).not.toHaveBeenCalled();
    expect(toasts).toHaveLength(0);
  });

  it('refuses while the code view holds unsaved text', async () => {
    const { rig } = setup();
    act(() => {
      rig.result.current.codeDraft.setCodeOriginal('old');
      rig.result.current.codeDraft.applyCode('typed');
    });
    await act(async () => {
      await rig.result.current.views.switchCodeTarget('/etc/www/app.js');
    });
    expect(toasts).toEqual([
      expect.objectContaining({ text: 'Save your changes before switching file', isError: true }),
    ]);
    expect(rig.result.current.codeDraft.codeTarget).toBe('');
  });

  it('does nothing without a document', async () => {
    const { rig } = setup();
    rig.result.current.documentState.docRef.current = null;
    await act(async () => {
      await rig.result.current.views.switchCodeTarget('/etc/www/app.js');
    });
    expect(api.loadFile).not.toHaveBeenCalled();
  });

  it('opens the page from the canvas document, not from disk', async () => {
    const { rig, doc } = setup();
    await act(async () => {
      await rig.result.current.views.switchCodeTarget(PATH);
    });
    const text = serializeDocument(doc);
    expect(rig.result.current.codeDraft.code).toBe(text);
    expect(rig.result.current.codeDraft.codeOriginal).toBe(text);
    expect(rig.result.current.codeDraft.codeTarget).toBe(PATH);
    expect(api.loadFile).not.toHaveBeenCalled();
  });

  it('opens the style panel stylesheet as the panel has made it, not from disk', async () => {
    const { rig } = setup();
    act(() => {
      rig.result.current.stylesheet.setCssPath(CSS);
      rig.result.current.stylesheet.setCssHead('p { margin: 0; }');
      rig.result.current.stylesheet.setOverrides({ b: { color: 'red' } });
    });
    await act(async () => {
      await rig.result.current.views.switchCodeTarget(CSS);
    });
    expect(rig.result.current.codeDraft.code).toBe(
      joinCss('p { margin: 0; }', { b: { color: 'red' } }, ''),
    );
    expect(api.loadFile).not.toHaveBeenCalled();
  });

  it('reads any other file from disk', async () => {
    const { rig } = setup();
    await act(async () => {
      await rig.result.current.views.switchCodeTarget('/etc/www/app.js');
    });
    expect(api.loadFile).toHaveBeenCalledWith('/etc/www/app.js');
    expect(rig.result.current.codeDraft.code).toBe('console.log(1);');
    expect(rig.result.current.codeDraft.codeOriginal).toBe('console.log(1);');
    expect(rig.result.current.codeDraft.codeTarget).toBe('/etc/www/app.js');
    expect(rig.result.current.documentState.busy).toBe(false);
  });

  it('shows the error and keeps the old file when the read fails', async () => {
    vi.mocked(api.loadFile).mockRejectedValue(new Error('gone'));
    const { rig } = setup();
    await act(async () => {
      await rig.result.current.views.switchCodeTarget('/etc/www/app.js');
    });
    expect(toasts).toEqual([expect.objectContaining({ text: 'gone', isError: true })]);
    expect(rig.result.current.codeDraft.codeTarget).toBe('');
    expect(rig.result.current.documentState.busy).toBe(false);
  });
});

describe('useCodeView switchView to Live', () => {
  it('goes straight there when nothing is unsaved', async () => {
    const { rig, choice, setView } = setup();
    await act(async () => {
      await rig.result.current.views.switchView('live');
    });
    expect(choice).not.toHaveBeenCalled();
    expect(setView).toHaveBeenCalledWith('live');
  });

  it('asks when there is unsaved work, naming the served address', async () => {
    const { rig, choice } = setup();
    choice.mockResolvedValue('stay');
    act(() => rig.result.current.documentState.setDirty(true));
    await act(async () => {
      await rig.result.current.views.switchView('live');
    });
    expect(choice).toHaveBeenCalledTimes(1);
    const question = choice.mock.calls[0][0];
    expect(question.title).toBe('Unsaved changes');
    expect(question.message).toContain('Live loads / from the server');
    expect(question.buttons.map((button: { value: string }) => button.value)).toEqual([
      'save',
      'live',
      'stay',
    ]);
  });

  it.each([['stay'], [null]])('stays put when the answer is %s', async answer => {
    const { rig, choice, save, setView } = setup();
    choice.mockResolvedValue(answer);
    act(() => rig.result.current.documentState.setDirty(true));
    await act(async () => {
      await rig.result.current.views.switchView('live');
    });
    expect(setView).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it('saves first and then opens Live', async () => {
    const { rig, choice, save, setView } = setup();
    choice.mockResolvedValue('save');
    act(() => rig.result.current.documentState.setDirty(true));
    await act(async () => {
      await rig.result.current.views.switchView('live');
    });
    expect(save).toHaveBeenCalledTimes(1);
    expect(setView).toHaveBeenCalledWith('live');
  });

  it('stays when the save did not reach disk', async () => {
    const { rig, choice, save, setView } = setup();
    choice.mockResolvedValue('save');
    save.mockResolvedValue(false);
    act(() => rig.result.current.documentState.setDirty(true));
    await act(async () => {
      await rig.result.current.views.switchView('live');
    });
    expect(setView).not.toHaveBeenCalled();
  });

  it('opens Live anyway when told to, without saving', async () => {
    const { rig, choice, save, setView } = setup();
    choice.mockResolvedValue('live');
    act(() => rig.result.current.documentState.setDirty(true));
    await act(async () => {
      await rig.result.current.views.switchView('live');
    });
    expect(save).not.toHaveBeenCalled();
    expect(setView).toHaveBeenCalledWith('live');
  });
});

describe('useCodeView leaving the code view', () => {
  it('applies typed markup: new revision, snapshot, fresh canvas source, nothing selected', async () => {
    const { rig, doc, setView } = setup('code');
    act(() => {
      rig.result.current.codeDraft.setCodeTarget(PATH);
      rig.result.current.codeDraft.setCodeOriginal('before');
      rig.result.current.codeDraft.applyCode('<p id="typed">New</p>');
      rig.result.current.documentState.setSelected(doc.querySelector('#one'));
    });
    await act(async () => {
      await rig.result.current.views.switchView('design');
    });
    const { documentState, undoHistory } = rig.result.current;
    expect(documentState.srcDoc).toContain('<p id="typed">New</p>');
    expect(documentState.srcDoc).toContain('<base href="https://cloud.example/"');
    expect(documentState.selected).toBeNull();
    expect(documentState.dirty).toBe(true);
    expect(undoHistory.history).toHaveLength(1);
    expect(undoHistory.history[0].html).toContain('id="one"');
    expect(undoHistory.revisionRef.current).toBe(1);
    expect(setView).toHaveBeenCalledWith('design');
  });

  it('applies nothing when the markup was not edited', async () => {
    const { rig } = setup('code');
    act(() => {
      rig.result.current.codeDraft.setCodeTarget(PATH);
      rig.result.current.codeDraft.setCodeOriginal('same');
      rig.result.current.codeDraft.applyCode('same');
    });
    await act(async () => {
      await rig.result.current.views.switchView('design');
    });
    expect(rig.result.current.documentState.srcDoc).toBe('');
    expect(rig.result.current.documentState.dirty).toBe(false);
    expect(rig.result.current.undoHistory.history).toHaveLength(0);
  });

  it('feeds hand-edited CSS back to the style panel and normalises the editor text', async () => {
    const { rig } = setup('code');
    const typed = '.a { color: red; }';
    act(() => {
      rig.result.current.stylesheet.setCssPath(CSS);
      rig.result.current.codeDraft.setCodeTarget(CSS);
      rig.result.current.codeDraft.setCodeOriginal('');
      rig.result.current.codeDraft.applyCode(typed);
    });
    await act(async () => {
      await rig.result.current.views.switchView('design');
    });
    const split = splitCss(typed);
    expect(rig.result.current.stylesheet.cssHead).toBe(split.head);
    expect(rig.result.current.stylesheet.cssTail).toBe(split.tail);
    expect(rig.result.current.stylesheet.overrides).toEqual(split.overrides);
    expect(rig.result.current.codeDraft.code).toBe(
      joinCss(split.head, split.overrides, split.tail),
    );
    // CSS text is not markup, so the canvas document is left alone.
    expect(rig.result.current.documentState.srcDoc).toBe('');
    expect(rig.result.current.documentState.dirty).toBe(false);
  });
});

describe('useCodeView entering the code view', () => {
  it('loads the page from the canvas document', async () => {
    const { rig, doc, setView } = setup('design');
    await act(async () => {
      await rig.result.current.views.switchView('code');
    });
    const text = serializeDocument(doc);
    expect(rig.result.current.codeDraft.code).toBe(text);
    expect(rig.result.current.codeDraft.codeOriginal).toBe(text);
    expect(rig.result.current.codeDraft.codeTarget).toBe(PATH);
    expect(setView).toHaveBeenCalledWith('code');
  });

  it('leaves an open script draft exactly where it was', async () => {
    const { rig } = setup('design');
    act(() => {
      rig.result.current.codeDraft.setCodeTarget('/etc/www/app.js');
      rig.result.current.codeDraft.setCodeOriginal('orig');
      rig.result.current.codeDraft.applyCode('edited');
    });
    await act(async () => {
      await rig.result.current.views.switchView('code');
    });
    expect(rig.result.current.codeDraft.code).toBe('edited');
    expect(rig.result.current.codeDraft.codeTarget).toBe('/etc/www/app.js');
  });

  describe('with the stylesheet already open', () => {
    function openStylesheet(rig: ReturnType<typeof setup>['rig']) {
      act(() => {
        rig.result.current.stylesheet.setCssPath(CSS);
        rig.result.current.codeDraft.setCodeTarget(CSS);
      });
    }

    it('catches the text up with what the style panel wrote since', async () => {
      const { rig } = setup('design');
      openStylesheet(rig);
      act(() => {
        rig.result.current.codeDraft.setCodeOriginal('');
        rig.result.current.codeDraft.applyCode('');
        rig.result.current.stylesheet.setOverrides({ p: { color: 'red' } });
      });
      await act(async () => {
        await rig.result.current.views.switchView('code');
      });
      const joined = joinCss('', { p: { color: 'red' } }, '');
      expect(rig.result.current.codeDraft.code).toBe(joined);
      expect(rig.result.current.codeDraft.codeOriginal).toBe(joined);
      expect(toasts).toHaveLength(0);
    });

    it('keeps the saved baseline when the draft had already diverged from it', async () => {
      const { rig } = setup('design');
      openStylesheet(rig);
      act(() => {
        rig.result.current.codeDraft.setCodeOriginal('baseline');
        rig.result.current.codeDraft.applyCode('app text');
        rig.result.current.stylesheet.setOverrides({ p: { color: 'red' } });
      });
      await act(async () => {
        await rig.result.current.views.switchView('code');
      });
      expect(rig.result.current.codeDraft.code).toBe(joinCss('', { p: { color: 'red' } }, ''));
      expect(rig.result.current.codeDraft.codeOriginal).toBe('baseline');
    });

    it('warns about a real conflict between typed text and the style panel, and keeps the typing', async () => {
      const { rig } = setup('design');
      openStylesheet(rig);
      act(() => {
        rig.result.current.codeDraft.applyCode('');
        rig.result.current.codeDraft.setCode('typed by hand');
        rig.result.current.stylesheet.setOverrides({ p: { color: 'red' } });
      });
      await act(async () => {
        await rig.result.current.views.switchView('code');
      });
      expect(rig.result.current.codeDraft.code).toBe('typed by hand');
      expect(toasts).toHaveLength(1);
      expect(toasts[0].isError).toBe(true);
      expect(toasts[0].text).toContain('The Style panel has changes this editor does not');
    });

    it('stays quiet when typed text already matches what the panel would write', async () => {
      const { rig } = setup('design');
      openStylesheet(rig);
      const joined = joinCss('', {}, '');
      act(() => {
        rig.result.current.codeDraft.applyCode('');
        rig.result.current.codeDraft.setCode(joined);
      });
      await act(async () => {
        await rig.result.current.views.switchView('code');
      });
      expect(toasts).toHaveLength(0);
    });
  });
});
