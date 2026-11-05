// @vitest-environment jsdom
/*
 * Edits to the selected element: text, attributes, classes, picking media, wrapping, unwrapping,
 * changing tag, head fields, adding text, dropping blocks (with widget assets and the media
 * picker) and applying a Machine rewrite.
 */
import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import type { DropSpot } from '../dropTarget';
import { useDocumentState } from '../hooks/useDocumentState';
import { useElementEdits } from '../hooks/useElementEdits';
import { useStylesheetState } from '../hooks/useStylesheetState';
import { useUndoHistory } from '../hooks/useUndoHistory';
import type { MediaKind } from '../mediaKinds';
import type { Home } from '../metaTags';
import type { Block } from '../palette';

vi.mock('../../../lib/api', async importOriginal => ({
  ...(await importOriginal<typeof import('../../../lib/api')>()),
  ensureWidgetAssets: vi.fn(),
}));

const spotAt = (parent: Element, before: Node | null): DropSpot => ({
  parent,
  before,
  line: { left: 0, top: 0, width: 0, height: 0 },
});

const PAGE =
  '<!doctype html><html><head><title>Old</title></head><body><div id="box"><p id="p" class="a b">Hello <b>world</b></p><img id="img"><span id="empty"></span></div></body></html>';
const ORIGIN = 'https://cloud.example';

let toasts: Toast[];

beforeEach(() => {
  toasts = [];
  setToastListener(t => toasts.push(t));
  vi.mocked(api.ensureWidgetAssets).mockResolvedValue(undefined as never);
});

afterEach(() => {
  setToastListener(null);
  vi.clearAllMocks();
});

function setup() {
  const doc = new DOMParser().parseFromString(PAGE, 'text/html');
  const rig = renderHook(() => {
    const documentState = useDocumentState();
    const stylesheet = useStylesheetState();
    const history = useUndoHistory(documentState, stylesheet);
    const [choosingMedia, setChoosingMedia] = useState<{ kind: MediaKind; home?: Home } | null>(
      null,
    );
    const [styleTarget, setStyleTarget] = useState<Element | null>(null);
    const edits = useElementEdits({
      origin: ORIGIN,
      styleTarget,
      ui: { choosingMedia, setChoosingMedia },
      documentState,
      mutate: history.mutate,
    });
    return { documentState, history, edits, choosingMedia, setChoosingMedia, setStyleTarget };
  });
  rig.result.current.documentState.docRef.current = doc;
  const by = (id: string) => doc.querySelector<HTMLElement>('#' + id)!;
  const select = (node: Node | null) =>
    act(() => rig.result.current.documentState.setSelected(node));
  return { doc, rig, by, select };
}

describe('useElementEdits text and attributes', () => {
  it('setText writes into a selected text run only', () => {
    const { rig, by, select } = setup();
    select(by('p').firstChild);
    act(() => rig.result.current.edits.setText('Howdy'));
    expect(by('p').textContent).toBe('Howdy world');
    select(by('p'));
    act(() => rig.result.current.edits.setText('ignored'));
    expect(by('p').textContent).toBe('Howdy world');
  });

  it('setAttribute sets, and an empty id removes the attribute', () => {
    const { rig, by, select } = setup();
    select(by('p'));
    act(() => rig.result.current.edits.setAttribute('title', 'tip'));
    expect(by('p').getAttribute('title')).toBe('tip');
    act(() => rig.result.current.edits.setAttribute('id', ''));
    expect(by('box').querySelector('p')!.hasAttribute('id')).toBe(false);
  });

  it('setAttribute warns when it replaces a server-filled value', () => {
    const { rig, by, select } = setup();
    select(by('p'));
    act(() => rig.result.current.edits.setAttribute('title', '{{page.title}}'));
    act(() => rig.result.current.edits.setAttribute('title', 'fixed'));
    expect(toasts).toHaveLength(1);
    expect(toasts[0].isError).toBe(true);
    expect(toasts[0].text).toContain('{{page.title}} was filled in by the server');
  });

  it('attribute edits do nothing without a selection', () => {
    const { rig } = setup();
    act(() => rig.result.current.edits.setAttribute('title', 'x'));
    act(() => rig.result.current.edits.removeAttribute('title'));
    act(() => rig.result.current.edits.setClasses(['x']));
    act(() => rig.result.current.edits.addText());
    expect(rig.result.current.history.history).toHaveLength(0);
  });

  it('removeAttribute and setClasses', () => {
    const { rig, by, select } = setup();
    select(by('p'));
    act(() => rig.result.current.edits.removeAttribute('class'));
    expect(by('p').hasAttribute('class')).toBe(false);
    act(() => rig.result.current.edits.setClasses(['x', 'y']));
    expect(by('p').getAttribute('class')).toBe('x y');
    act(() => rig.result.current.edits.setClasses([]));
    expect(by('p').hasAttribute('class')).toBe(false);
  });

  it('setMeta writes the head field and coalesces typing into one undo step', () => {
    const { rig, doc } = setup();
    act(() => rig.result.current.edits.setMeta({ at: 'title' }, 'N'));
    act(() => rig.result.current.edits.setMeta({ at: 'title' }, 'New'));
    expect(doc.title).toBe('New');
    expect(rig.result.current.history.history).toHaveLength(1);
    act(() => rig.result.current.edits.setMeta({ at: 'name', key: 'description' }, 'About'));
    expect(doc.querySelector('meta[name="description"]')!.getAttribute('content')).toBe('About');
    expect(rig.result.current.history.history).toHaveLength(2);
  });
});

describe('useElementEdits media', () => {
  it('pickMedia sets src, measured size and empty alt for an image, and closes the picker', () => {
    const { rig, by, select } = setup();
    act(() => rig.result.current.setChoosingMedia({ kind: 'image' }));
    select(by('img'));
    act(() => rig.result.current.edits.pickMedia({ src: '/a.png', width: 40, height: 30 }));
    const img = by('img');
    expect(img.getAttribute('src')).toBe('/a.png');
    expect(img.getAttribute('width')).toBe('40');
    expect(img.getAttribute('height')).toBe('30');
    expect(img.getAttribute('alt')).toBe('');
    expect(rig.result.current.choosingMedia).toBeNull();
  });

  it('pickMedia leaves size alone when unmeasured and keeps an existing alt', () => {
    const { rig, by, select } = setup();
    by('img').setAttribute('alt', 'a cat');
    select(by('img'));
    act(() => rig.result.current.edits.pickMedia({ src: '/a.png', width: 0, height: 0 }));
    expect(by('img').hasAttribute('width')).toBe(false);
    expect(by('img').getAttribute('alt')).toBe('a cat');
  });

  it('pickMedia does not add alt to a non-image', () => {
    const { rig, by, select } = setup();
    select(by('p'));
    act(() => rig.result.current.edits.pickMedia({ src: '/a.mp4', width: 0, height: 0 }));
    expect(by('p').getAttribute('src')).toBe('/a.mp4');
    expect(by('p').hasAttribute('alt')).toBe(false);
  });

  it('pickMedia into a head field writes the absolute address', () => {
    const { rig, doc } = setup();
    act(() =>
      rig.result.current.setChoosingMedia({
        kind: 'image',
        home: { at: 'property', key: 'og:image' },
      }),
    );
    act(() => rig.result.current.edits.pickMedia({ src: '/og.png', width: 1, height: 1 }));
    expect(doc.querySelector('meta[property="og:image"]')!.getAttribute('content')).toBe(
      ORIGIN + '/og.png',
    );
  });

  it('pickMedia with nothing selected only closes the picker', () => {
    const { rig } = setup();
    act(() => rig.result.current.setChoosingMedia({ kind: 'image' }));
    act(() => rig.result.current.edits.pickMedia({ src: '/a.png', width: 1, height: 1 }));
    expect(rig.result.current.choosingMedia).toBeNull();
    expect(rig.result.current.history.history).toHaveLength(0);
  });
});

describe('useElementEdits structure', () => {
  it('wrap puts a div around a block element and selects the wrapper', () => {
    const { rig, by, select, doc } = setup();
    select(by('p'));
    act(() => rig.result.current.edits.wrap());
    const wrapper = rig.result.current.documentState.selected as Element;
    expect(wrapper.tagName).toBe('DIV');
    expect(wrapper.firstElementChild).toBe(by('p'));
    expect(doc.querySelector('#box')!.firstElementChild).toBe(wrapper);
  });

  it('wrap puts a span around a text run', () => {
    const { rig, by, select } = setup();
    select(by('p').firstChild);
    act(() => rig.result.current.edits.wrap());
    const wrapper = rig.result.current.documentState.selected as Element;
    expect(wrapper.tagName).toBe('SPAN');
    expect(wrapper.textContent).toBe('Hello ');
  });

  it('wrap, unwrap and changeTag refuse body and html', () => {
    const { rig, doc, select } = setup();
    select(doc.body);
    act(() => rig.result.current.edits.wrap());
    act(() => rig.result.current.edits.unwrap());
    act(() => rig.result.current.edits.changeTag('main'));
    select(doc.documentElement);
    act(() => rig.result.current.edits.wrap());
    act(() => rig.result.current.edits.unwrap());
    act(() => rig.result.current.edits.changeTag('main'));
    expect(rig.result.current.history.history).toHaveLength(0);
  });

  it('wrap does nothing without a selection', () => {
    const { rig } = setup();
    act(() => rig.result.current.edits.wrap());
    expect(rig.result.current.history.history).toHaveLength(0);
  });

  it('unwrap replaces the element with its children and selects the first', () => {
    const { rig, by, select } = setup();
    select(by('p'));
    act(() => rig.result.current.edits.unwrap());
    expect(by('box').querySelector('p')).toBeNull();
    expect(by('box').firstChild!.textContent).toBe('Hello ');
    expect(rig.result.current.documentState.selected).toBe(by('box').firstChild);
  });

  it('unwrap of an empty element selects nothing', () => {
    const { rig, by, select } = setup();
    select(by('empty'));
    act(() => rig.result.current.edits.unwrap());
    expect(rig.result.current.documentState.selected).toBeNull();
  });

  it('changeTag keeps attributes and children and selects the replacement', () => {
    const { rig, by, select } = setup();
    select(by('p'));
    act(() => rig.result.current.edits.changeTag('h2'));
    const heading = rig.result.current.documentState.selected as Element;
    expect(heading.tagName).toBe('H2');
    expect(heading.id).toBe('p');
    expect(heading.className).toBe('a b');
    expect(heading.innerHTML).toBe('Hello <b>world</b>');
  });

  it('changeTag to the same tag does nothing', () => {
    const { rig, by, select } = setup();
    select(by('p'));
    act(() => rig.result.current.edits.changeTag('p'));
    expect(rig.result.current.history.history).toHaveLength(0);
  });

  it('addText fills an empty element, reuses an emptied run, and selects the text', () => {
    const { rig, by, select } = setup();
    select(by('empty'));
    act(() => rig.result.current.edits.addText());
    expect(by('empty').textContent).toBe('Some text');
    const run = by('empty').firstChild!;
    run.textContent = '';
    select(by('empty'));
    act(() => rig.result.current.edits.addText());
    expect(by('empty').childNodes).toHaveLength(1);
    expect(by('empty').textContent).toBe('Some text');
    expect(rig.result.current.documentState.selected).toBe(by('empty').firstChild);
  });
});

describe('useElementEdits insert and rewrite', () => {
  const block = (html: string, extra: Partial<Block> = {}): Block => ({
    key: 'div',
    label: 'Box',
    build: () => html,
    ...extra,
  });

  it('insert drops the built markup at the spot and selects it', () => {
    const { rig, by } = setup();
    const spot = spotAt(by('box'), by('p'));
    act(() => rig.result.current.edits.insert(block('<section id="new">N</section>'), spot));
    expect(by('box').firstElementChild!.id).toBe('new');
    expect(rig.result.current.documentState.selected).toBe(by('new'));
    expect(api.ensureWidgetAssets).not.toHaveBeenCalled();
  });

  it('insert of nothing leaves the page alone', () => {
    const { rig, by } = setup();
    const spot = spotAt(by('box'), null);
    act(() => rig.result.current.edits.insert(block(''), spot));
    expect(rig.result.current.history.history).toHaveLength(0);
  });

  it('insert opens the media picker for an image block', () => {
    const { rig, by } = setup();
    const spot = spotAt(by('box'), null);
    act(() => rig.result.current.edits.insert(block('<img>', { key: 'img' }), spot));
    expect(rig.result.current.choosingMedia).toEqual({ kind: 'image' });
  });

  it('insert links a required script and installs the widget assets once', () => {
    const { rig, by, doc } = setup();
    const spot = spotAt(by('box'), null);
    const widget = block('<magic-grid></magic-grid>', {
      requires: { scripts: ['/assets/magic-widgets.js'] },
    });
    act(() => rig.result.current.edits.insert(widget, spot));
    expect(doc.querySelectorAll('script[src^="/assets/magic-widgets.js"]')).toHaveLength(1);
    expect(api.ensureWidgetAssets).toHaveBeenCalledTimes(1);
    act(() => rig.result.current.edits.insert(widget, spot));
    expect(api.ensureWidgetAssets).toHaveBeenCalledTimes(1);
  });

  it('insert surfaces a failure to install the widget assets', async () => {
    vi.mocked(api.ensureWidgetAssets).mockRejectedValue(new Error('no disk'));
    const { rig, by } = setup();
    const spot = spotAt(by('box'), null);
    const widget = block('<magic-grid></magic-grid>', {
      requires: { scripts: ['/assets/magic-widgets.js'] },
    });
    act(() => rig.result.current.edits.insert(widget, spot));
    await vi.waitFor(() => expect(toasts.some(t => t.text === 'no disk' && t.isError)).toBe(true));
  });

  it('rewriteSelected replaces the styled element with everything returned', () => {
    const { rig, by } = setup();
    act(() => rig.result.current.setStyleTarget(by('p')));
    act(() => rig.result.current.edits.rewriteSelected('<p id="r1">A</p><p id="r2">B</p>'));
    expect(by('box').querySelector('#p')).toBeNull();
    expect(by('r1')).toBeTruthy();
    expect(by('r2')).toBeTruthy();
    expect(rig.result.current.documentState.selected).toBe(by('r1'));
  });

  it('rewriteSelected refuses body, and an empty answer', () => {
    const { rig, by, doc } = setup();
    act(() => rig.result.current.setStyleTarget(doc.body));
    act(() => rig.result.current.edits.rewriteSelected('<p>x</p>'));
    expect(toasts[0].isError).toBe(true);
    expect(toasts[0].text).toContain('Select something inside the page');
    act(() => rig.result.current.setStyleTarget(by('p')));
    act(() => rig.result.current.edits.rewriteSelected(''));
    expect(toasts[1].text).toBe('The Machine returned nothing to put there');
    expect(by('p')).toBeTruthy();
  });

  it('rewriteSelected does nothing without a target', () => {
    const { rig } = setup();
    act(() => rig.result.current.edits.rewriteSelected('<p>x</p>'));
    expect(toasts).toHaveLength(0);
  });
});
