// @vitest-environment jsdom
/*
 * Undo, redo and the revision counter behind the Save button: a snapshot per edit, coalescing of
 * consecutive edits of one thing, the history limit, restoring selection by position, and
 * dirty meaning "differs from the last saved revision".
 */
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useDocumentState } from '../hooks/useDocumentState';
import { useStylesheetState } from '../hooks/useStylesheetState';
import { HISTORY, useUndoHistory } from '../hooks/useUndoHistory';

const PAGE =
  '<!doctype html><html><head></head><body><div id="a"><p id="one">One</p><p id="two">Two</p></div></body></html>';

function setup() {
  const doc = new DOMParser().parseFromString(PAGE, 'text/html');
  const rig = renderHook(() => {
    const documentState = useDocumentState();
    const stylesheet = useStylesheetState();
    const history = useUndoHistory(documentState, stylesheet);
    return { documentState, stylesheet, history };
  });
  rig.result.current.documentState.docRef.current = doc;
  return { doc, rig };
}

const ids = (doc: Document) => Array.from(doc.querySelectorAll('p')).map(p => p.id);

describe('useUndoHistory mutate', () => {
  it('does nothing without a document', () => {
    const rig = renderHook(() => {
      const documentState = useDocumentState();
      const stylesheet = useStylesheetState();
      return useUndoHistory(documentState, stylesheet);
    });
    let ran = false;
    act(() =>
      rig.result.current.mutate(() => {
        ran = true;
      }),
    );
    expect(ran).toBe(false);
    expect(rig.result.current.history).toHaveLength(0);
  });

  it('runs the change, records a snapshot, marks the page dirty and bumps the version', () => {
    const { doc, rig } = setup();
    act(() => rig.result.current.history.mutate(() => doc.querySelector('#one')!.remove()));
    expect(ids(doc)).toEqual(['two']);
    expect(rig.result.current.history.history).toHaveLength(1);
    expect(rig.result.current.history.history[0].html).toContain('id="one"');
    expect(rig.result.current.documentState.dirty).toBe(true);
    expect(rig.result.current.documentState.version).toBe(1);
    expect(rig.result.current.history.revisionRef.current).toBe(1);
  });

  it('folds consecutive edits with the same coalesce key into one undo step', () => {
    const { doc, rig } = setup();
    const one = doc.querySelector('#one')!;
    act(() => rig.result.current.history.mutate(() => (one.textContent = 'a'), 'text'));
    act(() => rig.result.current.history.mutate(() => (one.textContent = 'ab'), 'text'));
    expect(rig.result.current.history.history).toHaveLength(1);
    act(() => rig.result.current.history.mutate(() => (one.textContent = 'abc'), 'other'));
    expect(rig.result.current.history.history).toHaveLength(2);
  });

  it('starts a new step when the selection moves, even for the same key', () => {
    const { doc, rig } = setup();
    const one = doc.querySelector('#one')!;
    act(() => rig.result.current.history.mutate(() => (one.textContent = 'a'), 'text'));
    act(() => rig.result.current.documentState.setSelected(doc.querySelector('#two')));
    act(() => rig.result.current.history.mutate(() => (one.textContent = 'b'), 'text'));
    expect(rig.result.current.history.history).toHaveLength(2);
  });

  it('keeps at most HISTORY steps', () => {
    const { doc, rig } = setup();
    for (let index = 0; index < HISTORY + 5; index++) {
      act(() =>
        rig.result.current.history.mutate(() => {
          doc.querySelector('#one')!.textContent = 'n' + index;
        }),
      );
    }
    expect(rig.result.current.history.history).toHaveLength(HISTORY);
  });
});

describe('useUndoHistory undo and redo', () => {
  it('does nothing when there is nothing to undo or redo', () => {
    const { doc, rig } = setup();
    act(() => rig.result.current.history.undo());
    act(() => rig.result.current.history.redo());
    expect(ids(doc)).toEqual(['one', 'two']);
    expect(rig.result.current.documentState.version).toBe(0);
  });

  it('undoes to the saved revision, which leaves nothing to save, and redo makes it dirty again', () => {
    const { doc, rig } = setup();
    act(() => rig.result.current.history.mutate(() => doc.querySelector('#one')!.remove()));
    act(() => rig.result.current.history.undo());
    expect(ids(doc)).toEqual(['one', 'two']);
    expect(rig.result.current.documentState.dirty).toBe(false);
    expect(rig.result.current.history.history).toHaveLength(0);
    expect(rig.result.current.history.future).toHaveLength(1);
    act(() => rig.result.current.history.redo());
    expect(ids(doc)).toEqual(['two']);
    expect(rig.result.current.documentState.dirty).toBe(true);
    expect(rig.result.current.history.future).toHaveLength(0);
    expect(rig.result.current.history.history).toHaveLength(1);
  });

  it('is dirty after undoing past the revision that was saved', () => {
    const { doc, rig } = setup();
    act(() => rig.result.current.history.mutate(() => doc.querySelector('#one')!.remove()));
    act(() => {
      rig.result.current.history.savedRevisionRef.current =
        rig.result.current.history.revisionRef.current;
    });
    act(() => rig.result.current.history.undo());
    expect(rig.result.current.documentState.dirty).toBe(true);
  });

  it('abandons the redo branch when editing after stepping back', () => {
    const { doc, rig } = setup();
    act(() => rig.result.current.history.mutate(() => doc.querySelector('#one')!.remove()));
    act(() => rig.result.current.history.undo());
    expect(rig.result.current.history.future).toHaveLength(1);
    act(() => rig.result.current.history.mutate(() => doc.querySelector('#two')!.remove()));
    expect(rig.result.current.history.future).toHaveLength(0);
  });

  it('carries the selection across by position and clears the hover', () => {
    const { doc, rig } = setup();
    act(() => rig.result.current.documentState.setSelected(doc.querySelector('#two')));
    act(() => rig.result.current.documentState.setHovered(doc.querySelector('#one')));
    act(() => rig.result.current.history.mutate(() => (doc.querySelector('#one')!.id = 'uno')));
    act(() => rig.result.current.history.undo());
    const selected = rig.result.current.documentState.selected as Element;
    expect(selected).toBe(doc.querySelector('#two'));
    expect(rig.result.current.documentState.hovered).toBeNull();
  });

  it('restores the style overrides held in the snapshot', () => {
    const { doc, rig } = setup();
    act(() => rig.result.current.stylesheet.setOverrides({ p: { color: 'red' } }));
    act(() =>
      rig.result.current.history.mutate(() => rig.result.current.stylesheet.setOverrides({})),
    );
    expect(rig.result.current.stylesheet.overrides).toEqual({});
    act(() => rig.result.current.history.undo());
    expect(rig.result.current.stylesheet.overrides).toEqual({ p: { color: 'red' } });
    expect(ids(doc)).toEqual(['one', 'two']);
  });
});
