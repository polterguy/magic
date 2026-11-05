// @vitest-environment jsdom
/*
 * Unit tests for the node helpers that need a real DOM: telling text from
 * elements, keys, labels, the children worth listing, and hit-testing.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  designableChildren,
  elementOf,
  isElement,
  isText,
  keyOf,
  labelOf,
  nodeAt,
  nodeAtPoint,
  pathTo,
  rectOf,
} from '../nodes';

function body(html: string) {
  return new DOMParser().parseFromString('<html><body>' + html + '</body></html>', 'text/html')
    .body;
}

afterEach(() => vi.restoreAllMocks());

describe('isText and isElement', () => {
  const root = body('<p>hi<!--c--></p>');
  const p = root.firstElementChild!;

  it('tell the kinds of node apart', () => {
    expect(isElement(p)).toBe(true);
    expect(isText(p)).toBe(false);
    expect(isText(p.firstChild!)).toBe(true);
    expect(isElement(p.firstChild!)).toBe(false);
    expect(isText(p.lastChild!)).toBe(false);
    expect(isElement(p.lastChild!)).toBe(false);
  });
});

describe('keyOf', () => {
  it('gives one node the same key every time and different nodes different keys', () => {
    const root = body('<p></p><p></p>');
    const [a, b] = Array.from(root.children);
    expect(keyOf(a)).toBe(keyOf(a));
    expect(keyOf(a)).not.toBe(keyOf(b));
    expect(keyOf(a)).toMatch(/^node-\d+$/);
  });
});

describe('elementOf', () => {
  const root = body('<p>text</p>');
  const p = root.firstElementChild!;

  it('is null for no node', () => {
    expect(elementOf(null)).toBeNull();
  });

  it('is the node itself for an element and the parent for a text run', () => {
    expect(elementOf(p)).toBe(p);
    expect(elementOf(p.firstChild)).toBe(p);
  });

  it('is null for anything else, such as a comment', () => {
    expect(elementOf(document.createComment('x'))).toBeNull();
  });

  it('is null for a text run with no parent', () => {
    expect(elementOf(document.createTextNode('x'))).toBeNull();
  });
});

describe('designableChildren', () => {
  it('leaves out whitespace-only text, comments and tool elements', () => {
    const root = body('<div>\n  <p>a</p>\n  text <!--c--><i data-magic-tool=""></i><b>b</b></div>');
    const kinds = designableChildren(root.firstElementChild!).map(node =>
      isText(node) ? 'text:' + node.data.trim() : (node as Element).tagName,
    );
    expect(kinds).toEqual(['P', 'text:text', 'B']);
  });

  it('lists nothing inside a server-filled slot', () => {
    const root = body('<span data-magic-slot="">{{x}}</span>');
    expect(designableChildren(root.firstElementChild!)).toEqual([]);
  });

  it('lists nothing for an empty element', () => {
    expect(designableChildren(body('<div></div>').firstElementChild!)).toEqual([]);
  });
});

describe('labelOf', () => {
  it('names an element by tag, then id, then first class', () => {
    const root = body('<p></p><p class="  one two"></p><p id="x" class="one"></p>');
    const [plain, classed, withId] = Array.from(root.children);
    expect(labelOf(plain)).toBe('p');
    expect(labelOf(classed)).toBe('p.one');
    expect(labelOf(withId)).toBe('p#x');
  });

  it('quotes text, collapsing whitespace and shortening long runs', () => {
    const root = body('<p>  Hello\n   world  </p>');
    expect(labelOf(root.firstElementChild!.firstChild!)).toBe('"Hello world"');
    const long = document.createTextNode('abcdefghijklmnopqrstuvwxyz0123456789');
    expect(labelOf(long)).toBe('"abcdefghijklmnopqrstuvwxyz…"');
    expect(labelOf(document.createTextNode('abcdefghijklmnopqrstuvwxyz'))).toBe(
      '"abcdefghijklmnopqrstuvwxyz"',
    );
  });

  it('reads a slot as its expression', () => {
    const root = body('<span data-magic-slot="">{{user.name}}</span>');
    expect(labelOf(root.firstElementChild!)).toBe('{{user.name}}');
  });

  it('names other node kinds by their node name', () => {
    expect(labelOf(document.createComment('x'))).toBe('#comment');
  });
});

describe('rectOf', () => {
  it('uses the bounding box of an element', () => {
    const el = document.createElement('div');
    const box = { left: 1, top: 2, width: 3, height: 4 } as DOMRect;
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(box);
    expect(rectOf(el)).toBe(box);
  });

  it('is null for a node that is neither an element nor text', () => {
    expect(rectOf(document.createComment('x'))).toBeNull();
  });

  it('is null for a text run with no document', () => {
    const text = document.createTextNode('x');
    Object.defineProperty(text, 'ownerDocument', { value: null });
    expect(rectOf(text)).toBeNull();
  });
});

describe('nodeAtPoint', () => {
  const lineBox = { left: 0, right: 50, top: 0, bottom: 10 };

  // [caret] decides which node the browser's caret API reports, given the page's own text run.
  function setup(caret: (own: Node) => Node | null, rects: Partial<DOMRect>[], legacy = false) {
    const root = body('<div id="e"><p>Hello</p></div>');
    const doc = root.ownerDocument;
    const own = root.querySelector('p')!.firstChild!;
    vi.spyOn(doc, 'createRange').mockReturnValue({
      selectNodeContents: () => undefined,
      getClientRects: () => rects as unknown as DOMRectList,
    } as unknown as Range);
    const found = caret(own);
    const api = doc as unknown as Record<string, () => unknown>;
    if (legacy) {
      api.caretPositionFromPoint = () => (found ? { offsetNode: found } : null);
    } else {
      api.caretRangeFromPoint = () => (found ? { startContainer: found } : null);
    }
    return { doc, element: root.querySelector('#e')!, own };
  }

  it('answers with the text run when the point is over its glyphs', () => {
    const { doc, element, own } = setup(node => node, [lineBox]);
    expect(nodeAtPoint(doc, 10, 5, element)).toBe(own);
  });

  it('answers with the element when the point is outside every line box', () => {
    const { doc, element } = setup(node => node, [lineBox]);
    expect(nodeAtPoint(doc, 200, 5, element)).toBe(element);
  });

  it('answers with the element when there is no caret', () => {
    const { doc, element } = setup(() => null, []);
    expect(nodeAtPoint(doc, 1, 1, element)).toBe(element);
  });

  it('answers with the element when the caret is not in a text node', () => {
    const { doc, element } = setup(() => document.createElement('b'), []);
    expect(nodeAtPoint(doc, 1, 1, element)).toBe(element);
  });

  it('answers with the element when the caret text is whitespace only', () => {
    const { doc, element } = setup(() => document.createTextNode('   '), []);
    expect(nodeAtPoint(doc, 1, 1, element)).toBe(element);
  });

  it('answers with the element when the caret text lies outside it', () => {
    const { doc, element } = setup(() => document.createTextNode('stray'), [lineBox]);
    expect(nodeAtPoint(doc, 10, 5, element)).toBe(element);
  });

  it('falls back to caretPositionFromPoint where the other is missing', () => {
    const { doc, element, own } = setup(node => node, [lineBox], true);
    expect(nodeAtPoint(doc, 10, 5, element)).toBe(own);
  });

  it('answers with the element when neither caret API exists', () => {
    const root = body('<div id="e"><p>Hello</p></div>');
    expect(nodeAtPoint(root.ownerDocument, 1, 1, root.querySelector('#e')!)).toBe(
      root.querySelector('#e'),
    );
  });
});

describe('pathTo and nodeAt on a real tree', () => {
  it('walk through text runs as well as elements', () => {
    const root = body('<p>a<b>x</b>c</p>');
    const p = root.firstElementChild!;
    const c = p.lastChild!;
    expect(pathTo(c, root)).toEqual([0, 2]);
    expect(nodeAt(root, [0, 2])).toBe(c);
  });
});
