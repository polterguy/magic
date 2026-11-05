// @vitest-environment jsdom
/*
 * The Style panel's edits: inline writes versus writes into a stylesheet rule, coalescing per
 * property, the selector list (only with a stylesheet), falling back to inline when the target
 * stops matching, removing a rule and opening one from the list.
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { setToastListener, type Toast } from '../../../lib/toast';
import { useDocumentState } from '../hooks/useDocumentState';
import { useStyleEdits } from '../hooks/useStyleEdits';
import { useStylesheetState } from '../hooks/useStylesheetState';
import { useUndoHistory } from '../hooks/useUndoHistory';
import { INLINE } from '../Styles';

const PAGE =
  '<!doctype html><html><head></head><body><p id="one" class="note">One</p><p id="two">Two</p></body></html>';

let toasts: Toast[];

beforeEach(() => {
  toasts = [];
  setToastListener(t => toasts.push(t));
});

afterEach(() => {
  setToastListener(null);
});

function setup(withSheet = true) {
  const doc = new DOMParser().parseFromString(PAGE, 'text/html');
  const rig = renderHook(() => {
    const documentState = useDocumentState();
    const stylesheet = useStylesheetState();
    const history = useUndoHistory(documentState, stylesheet);
    const edits = useStyleEdits({ documentState, stylesheet, mutate: history.mutate });
    return { documentState, stylesheet, history, edits };
  });
  rig.result.current.documentState.docRef.current = doc;
  if (withSheet) {
    act(() => {
      rig.result.current.stylesheet.setCssPath('/etc/www/site.css');
      rig.result.current.stylesheet.setCssHead('.note { color: red; }');
    });
  }
  const select = (id: string | null) =>
    act(() =>
      rig.result.current.documentState.setSelected(id ? doc.querySelector('#' + id) : null),
    );
  return { doc, rig, select };
}

describe('useStyleEdits selectors', () => {
  it('offers the page selectors that match, once a stylesheet exists', () => {
    const { rig, select } = setup();
    select('one');
    expect(rig.result.current.edits.selectors).toContain('.note');
    expect(rig.result.current.edits.styleTarget?.id).toBe('one');
  });

  it('offers nothing without a stylesheet', () => {
    const { rig, select } = setup(false);
    select('one');
    expect(rig.result.current.edits.selectors).toEqual([]);
  });

  it('styleTarget is the element around a selected text run', () => {
    const { rig, doc } = setup();
    act(() => rig.result.current.documentState.setSelected(doc.querySelector('#one')!.firstChild));
    expect(rig.result.current.edits.styleTarget?.id).toBe('one');
  });

  it('falls back to inline when the chosen selector no longer matches the selection', () => {
    const { rig, select } = setup();
    select('one');
    act(() => rig.result.current.stylesheet.setTarget('.note'));
    expect(rig.result.current.stylesheet.target).toBe('.note');
    select('two');
    expect(rig.result.current.stylesheet.target).toBe(INLINE);
  });
});

describe('useStyleEdits setStyle', () => {
  it('writes and removes an inline property', () => {
    const { rig, doc, select } = setup();
    select('one');
    act(() => rig.result.current.edits.setStyle('color', 'blue'));
    expect(doc.querySelector<HTMLElement>('#one')!.style.color).toBe('blue');
    act(() => rig.result.current.edits.setStyle('color', ''));
    expect(doc.querySelector('#one')!.getAttribute('style') ?? '').not.toContain('color');
  });

  it('does nothing without a selection', () => {
    const { rig, select } = setup();
    select(null);
    act(() => rig.result.current.edits.setStyle('color', 'blue'));
    expect(rig.result.current.history.history).toHaveLength(0);
  });

  it('coalesces repeated edits of one property into a single undo step', () => {
    const { rig, select } = setup();
    select('one');
    act(() => rig.result.current.edits.setStyle('color', 'blue'));
    act(() => rig.result.current.edits.setStyle('color', 'green'));
    expect(rig.result.current.history.history).toHaveLength(1);
    act(() => rig.result.current.edits.setStyle('width', '10px'));
    expect(rig.result.current.history.history).toHaveLength(2);
  });

  it('writes into the targeted rule, and removes a declaration when the value is empty', () => {
    const { rig, select } = setup();
    select('one');
    act(() => rig.result.current.stylesheet.setTarget('.note'));
    act(() => rig.result.current.edits.setStyle('margin', '4px'));
    expect(rig.result.current.stylesheet.overrides['.note']).toEqual({ margin: '4px' });
    act(() => rig.result.current.edits.setStyle('margin', ''));
    expect(rig.result.current.stylesheet.overrides['.note']).toEqual({});
  });
});

describe('useStyleEdits rules', () => {
  it('removeRule takes the whole selector away and resets a target pointing at it', () => {
    const { rig, select } = setup();
    select('one');
    act(() => rig.result.current.stylesheet.setTarget('.note'));
    act(() => rig.result.current.edits.setStyle('margin', '4px'));
    act(() => rig.result.current.edits.removeRule('.note'));
    expect(rig.result.current.stylesheet.overrides).toEqual({});
    expect(rig.result.current.stylesheet.target).toBe(INLINE);
  });

  it('removeRule leaves the target alone when it is another rule', () => {
    const { rig, select } = setup();
    select('one');
    act(() => rig.result.current.stylesheet.setTarget('.note'));
    act(() => rig.result.current.edits.removeRule('.other'));
    expect(rig.result.current.stylesheet.target).toBe('.note');
  });

  it('editRule selects something the rule matches and makes it the target', () => {
    const { rig, doc, select } = setup();
    select('two');
    act(() => rig.result.current.edits.editRule('.note'));
    expect(rig.result.current.documentState.selected).toBe(doc.querySelector('#one'));
    expect(rig.result.current.stylesheet.target).toBe('.note');
  });

  it('editRule says so when nothing matches, and for an invalid selector', () => {
    const { rig } = setup();
    act(() => rig.result.current.edits.editRule('.gone'));
    act(() => rig.result.current.edits.editRule('::[bad'));
    expect(toasts).toHaveLength(2);
    expect(toasts[0]).toEqual(
      expect.objectContaining({
        text: 'Nothing on this page matches .gone any more',
        isError: true,
      }),
    );
    expect(rig.result.current.stylesheet.target).toBe(INLINE);
  });

  it('editRule does nothing without a document', () => {
    const { rig } = setup();
    rig.result.current.documentState.docRef.current = null;
    act(() => rig.result.current.edits.editRule('.note'));
    expect(toasts).toHaveLength(0);
  });
});
