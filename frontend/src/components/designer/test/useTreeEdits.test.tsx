// @vitest-environment jsdom
/*
 * Moving the selected node around the tree: duplicating (ids dropped from the copy), the
 * clipboard (copy, cut, paste with id collision handling and the empty-container rule),
 * delete, nudge among designable siblings and drag-move.
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { setToastListener, type Toast } from '../../../lib/toast';
import type { DropSpot } from '../dropTarget';
import { useDocumentState } from '../hooks/useDocumentState';
import { useStylesheetState } from '../hooks/useStylesheetState';
import { useTreeEdits } from '../hooks/useTreeEdits';
import { useUndoHistory } from '../hooks/useUndoHistory';

const KEY = 'test-clip';
const PAGE =
  '<!doctype html><html><head></head><body><div id="box"><p id="one">One</p><p id="two">Two <b id="bold">bold</b></p><p id="three">Three</p></div><section id="empty"></section></body></html>';

let toasts: Toast[];

beforeEach(() => {
  toasts = [];
  setToastListener(t => toasts.push(t));
  localStorage.clear();
});

afterEach(() => {
  setToastListener(null);
});

function setup(html = PAGE) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const rig = renderHook(() => {
    const documentState = useDocumentState();
    const stylesheet = useStylesheetState();
    const history = useUndoHistory(documentState, stylesheet);
    const edits = useTreeEdits({ clipKey: KEY, documentState, mutate: history.mutate });
    return { documentState, history, edits };
  });
  rig.result.current.documentState.docRef.current = doc;
  act(() => rig.result.current.documentState.setDoc(doc));
  const select = (node: Node | null) =>
    act(() => rig.result.current.documentState.setSelected(node));
  const by = (id: string) => doc.querySelector<HTMLElement>('#' + id)!;
  const order = (id: string) =>
    Array.from(by(id).children)
      .map(child => child.id)
      .join(',');
  return { doc, rig, select, by, order };
}

describe('useTreeEdits duplicate and remove', () => {
  it('does nothing without a selection', () => {
    const { rig, doc } = setup();
    act(() => rig.result.current.edits.duplicate());
    act(() => rig.result.current.edits.remove());
    expect(doc.querySelectorAll('p')).toHaveLength(3);
    expect(rig.result.current.history.history).toHaveLength(0);
  });

  it('duplicates after the original, strips every id from the copy and selects it', () => {
    const { rig, doc, select, by } = setup();
    select(by('two'));
    act(() => rig.result.current.edits.duplicate());
    const paragraphs = Array.from(doc.querySelectorAll('p'));
    expect(paragraphs).toHaveLength(4);
    const copy = paragraphs[2];
    expect(copy.id).toBe('');
    expect(copy.querySelector('b')!.id).toBe('');
    expect(copy.textContent).toBe('Two bold');
    expect(by('two')).toBeTruthy();
    expect(rig.result.current.documentState.selected).toBe(copy);
  });

  it('duplicates a run of text', () => {
    const { rig, doc, select, by } = setup();
    const text = by('one').firstChild!;
    select(text);
    act(() => rig.result.current.edits.duplicate());
    expect(by('one').textContent).toBe('OneOne');
    expect(doc.querySelectorAll('p')).toHaveLength(3);
  });

  it('removes the selection and selects its parent', () => {
    const { rig, select, by, order } = setup();
    select(by('two'));
    act(() => rig.result.current.edits.remove());
    expect(order('box')).toBe('one,three');
    expect(rig.result.current.documentState.selected).toBe(by('box'));
    expect(rig.result.current.documentState.hovered).toBeNull();
  });

  it('never removes the body', () => {
    const { rig, select, doc } = setup();
    select(doc.body);
    act(() => rig.result.current.edits.remove());
    expect(doc.querySelector('#box')).toBeTruthy();
    expect(rig.result.current.history.history).toHaveLength(0);
  });
});

describe('useTreeEdits clipboard', () => {
  it('copy stores the markup and says what was copied', () => {
    const { rig, select, by } = setup();
    select(by('one'));
    act(() => rig.result.current.edits.copy());
    const stored = JSON.parse(localStorage.getItem(KEY)!);
    expect(stored).toEqual({ html: '<p id="one">One</p>', isText: false });
    expect(toasts[0].text.startsWith('Copied')).toBe(true);
  });

  it('copy of a text run stores its words', () => {
    const { rig, select, by } = setup();
    select(by('one').firstChild);
    act(() => rig.result.current.edits.copy());
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({ html: 'One', isText: true });
  });

  it('copy and cut with nothing selected leave the clipboard alone', () => {
    const { rig } = setup();
    act(() => rig.result.current.edits.copy());
    act(() => rig.result.current.edits.cut());
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('cut copies and then removes', () => {
    const { rig, select, by, order } = setup();
    select(by('three'));
    act(() => rig.result.current.edits.cut());
    expect(JSON.parse(localStorage.getItem(KEY)!).html).toBe('<p id="three">Three</p>');
    expect(order('box')).toBe('one,two');
  });

  it('paste says so when nothing was copied', () => {
    const { rig } = setup();
    act(() => rig.result.current.edits.paste());
    expect(toasts).toEqual([
      expect.objectContaining({ text: 'Nothing has been copied yet', isError: true }),
    ]);
  });

  it('pastes after the selection and drops an id the page already uses', () => {
    const { rig, select, by, order } = setup();
    localStorage.setItem(
      KEY,
      JSON.stringify({ html: '<p id="one">Again</p><p id="fresh">New</p>', isText: false }),
    );
    select(by('three'));
    act(() => rig.result.current.edits.paste());
    expect(order('box')).toBe('one,two,three,,fresh');
    const pasted = rig.result.current.documentState.selected as Element;
    expect(pasted.textContent).toBe('Again');
    expect(pasted.hasAttribute('id')).toBe(false);
    expect(by('fresh').textContent).toBe('New');
  });

  it('pastes inside an empty container that is selected', () => {
    const { rig, select, by } = setup();
    localStorage.setItem(KEY, JSON.stringify({ html: '<i>x</i>', isText: false }));
    select(by('empty'));
    act(() => rig.result.current.edits.paste());
    expect(by('empty').innerHTML).toBe('<i>x</i>');
  });

  it('pastes at the end of the body when nothing is selected', () => {
    const { rig, doc } = setup();
    localStorage.setItem(KEY, JSON.stringify({ html: '<i>x</i>', isText: false }));
    act(() => rig.result.current.edits.paste());
    expect(doc.body.lastElementChild!.outerHTML).toBe('<i>x</i>');
  });

  it('pastes copied text as a text node', () => {
    const { rig, select, by } = setup();
    localStorage.setItem(KEY, JSON.stringify({ html: 'hello <b>', isText: true }));
    select(by('empty'));
    act(() => rig.result.current.edits.paste());
    expect(by('empty').childNodes).toHaveLength(1);
    expect(by('empty').textContent).toBe('hello <b>');
  });

  it('pastes nothing when the clipboard holds no nodes', () => {
    const { rig, select, by } = setup();
    localStorage.setItem(KEY, JSON.stringify({ html: '', isText: false }));
    select(by('empty'));
    act(() => rig.result.current.edits.paste());
    expect(rig.result.current.history.history).toHaveLength(0);
  });

  it('paste does nothing without a document', () => {
    const { rig, select, by } = setup();
    localStorage.setItem(KEY, JSON.stringify({ html: '<i>x</i>', isText: false }));
    select(by('empty'));
    rig.result.current.documentState.docRef.current = null;
    act(() => rig.result.current.edits.paste());
    expect(by('empty').innerHTML).toBe('');
  });
});

describe('useTreeEdits nudge and move', () => {
  it('moves the node past its next designable sibling and back', () => {
    const { rig, select, by, order } = setup();
    select(by('one'));
    act(() => rig.result.current.edits.nudge(1));
    expect(order('box')).toBe('two,one,three');
    act(() => rig.result.current.edits.nudge(-1));
    expect(order('box')).toBe('one,two,three');
  });

  it('does not move past either end', () => {
    const { rig, select, by, order } = setup();
    select(by('one'));
    act(() => rig.result.current.edits.nudge(-1));
    select(by('three'));
    act(() => rig.result.current.edits.nudge(1));
    expect(order('box')).toBe('one,two,three');
    expect(rig.result.current.history.history).toHaveLength(0);
  });

  it('nudge does nothing without a selection', () => {
    const { rig, order } = setup();
    act(() => rig.result.current.edits.nudge(1));
    expect(order('box')).toBe('one,two,three');
  });

  it('move inserts the node at the drop spot', () => {
    const { rig, by, order } = setup();
    const spot: DropSpot = {
      parent: by('box'),
      before: by('one'),
      line: { left: 0, top: 0, width: 0, height: 0 },
    };
    act(() => rig.result.current.edits.move(by('three'), spot));
    expect(order('box')).toBe('three,one,two');
    expect(rig.result.current.documentState.dirty).toBe(true);
  });
});
