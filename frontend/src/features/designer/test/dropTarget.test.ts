// @vitest-environment jsdom
/*
 * Unit tests for findDropSpot. jsdom does no layout, so every element's box
 * is stubbed and elementsFromPoint answers from a table.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { findDropSpot } from '../dropTarget';

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

function rect({ left, top, width, height }: Box): DOMRect {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  };
}

function place(element: Element, box: Box) {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(rect(box));
}

/*
 * A page with a container and children laid out either in a column or in a
 * row. [hits] is what the pointer is "over", nearest first.
 */
function setup(html: string, hits: (doc: Document) => Element[]) {
  const doc = new DOMParser().parseFromString(
    '<html><body>' + html + '</body></html>',
    'text/html',
  );
  const host = doc as unknown as { elementsFromPoint: () => Element[] };
  host.elementsFromPoint = () => hits(doc);
  return doc;
}

afterEach(() => vi.restoreAllMocks());

describe('findDropSpot', () => {
  it('returns null when nothing is under the pointer', () => {
    const doc = setup('', () => []);
    expect(findDropSpot(doc, 1, 1, null)).toBeNull();
  });

  it('ignores <html> and tool-owned elements', () => {
    const doc = setup('<div id="c"></div><i data-magic-tool=""></i>', d => [
      d.querySelector('i')!,
      d.documentElement,
    ]);
    expect(findDropSpot(doc, 1, 1, null)).toBeNull();
  });

  it('drops into an empty container and the indicator fills it', () => {
    const doc = setup('<div id="c"></div>', d => [d.querySelector('#c')!, d.body]);
    const container = doc.querySelector('#c')!;
    place(container, { left: 10, top: 20, width: 100, height: 50 });
    const spot = findDropSpot(doc, 30, 30, null)!;
    expect(spot.parent).toBe(container);
    expect(spot.before).toBeNull();
    expect(spot.line).toEqual({ left: 10, top: 20, width: 100, height: 50 });
  });

  it('puts the line above the next child when the pointer is in the top half of a column', () => {
    const doc = setup('<div id="c"><p id="a">a</p><p id="b">b</p></div>', d => [
      d.querySelector('#c')!,
    ]);
    const [a, b] = [doc.querySelector('#a')!, doc.querySelector('#b')!];
    place(doc.querySelector('#c')!, { left: 0, top: 0, width: 200, height: 200 });
    place(a, { left: 0, top: 0, width: 200, height: 50 });
    place(b, { left: 0, top: 60, width: 200, height: 50 });
    const spot = findDropSpot(doc, 100, 80, null)!;
    expect(spot.parent).toBe(doc.querySelector('#c'));
    expect(spot.before).toBe(b);
    expect(spot.line).toEqual({ left: 0, top: 59, width: 200, height: 2 });
  });

  it('appends after the last child when the pointer is below all of them', () => {
    const doc = setup('<div id="c"><p id="a">a</p><p id="b">b</p></div>', d => [
      d.querySelector('#c')!,
    ]);
    place(doc.querySelector('#c')!, { left: 0, top: 0, width: 200, height: 300 });
    place(doc.querySelector('#a')!, { left: 0, top: 0, width: 200, height: 50 });
    place(doc.querySelector('#b')!, { left: 0, top: 60, width: 200, height: 50 });
    const spot = findDropSpot(doc, 100, 200, null)!;
    expect(spot.before).toBeNull();
    expect(spot.line).toEqual({ left: 0, top: 109, width: 200, height: 2 });
  });

  it('lays a vertical line when the children sit side by side', () => {
    const doc = setup('<div id="c"><p id="a">a</p><p id="b">b</p></div>', d => [
      d.querySelector('#c')!,
    ]);
    const b = doc.querySelector('#b')!;
    place(doc.querySelector('#c')!, { left: 0, top: 0, width: 300, height: 100 });
    place(doc.querySelector('#a')!, { left: 0, top: 0, width: 100, height: 100 });
    place(b, { left: 110, top: 0, width: 100, height: 100 });
    const before = findDropSpot(doc, 120, 50, null)!;
    expect(before.before).toBe(b);
    expect(before.line).toEqual({ left: 109, top: 0, width: 2, height: 100 });
    const after = findDropSpot(doc, 250, 50, null)!;
    expect(after.before).toBeNull();
    expect(after.line).toEqual({ left: 209, top: 0, width: 2, height: 100 });
  });

  it('measures against the siblings, not the dragged element', () => {
    const doc = setup('<div id="c"><p id="a">a</p><p id="b">b</p></div>', d => [
      d.querySelector('#c')!,
    ]);
    const [a, b] = [doc.querySelector('#a')!, doc.querySelector('#b')!];
    place(doc.querySelector('#c')!, { left: 0, top: 0, width: 200, height: 200 });
    place(a, { left: 0, top: 0, width: 200, height: 50 });
    place(b, { left: 0, top: 60, width: 200, height: 50 });
    const spot = findDropSpot(doc, 100, 30, a)!;
    expect(spot.before).toBe(b);
  });

  it('skips the dragged element and what is inside it as a target', () => {
    const doc = setup('<div id="c"><p id="a"><b id="in">x</b></p></div>', d => [
      d.querySelector('#in')!,
      d.querySelector('#a')!,
      d.querySelector('#c')!,
    ]);
    const container = doc.querySelector('#c')!;
    place(container, { left: 0, top: 0, width: 100, height: 100 });
    const spot = findDropSpot(doc, 50, 50, doc.querySelector('#a'))!;
    expect(spot.parent).toBe(container);
    expect(spot.before).toBeNull();
  });

  it('drops beside, not into, a container when the pointer is at its edge', () => {
    const doc = setup(
      '<div id="c"><section id="s"><p id="a">a</p></section><section id="t"><p>b</p></section></div>',
      d => [d.querySelector('#s')!],
    );
    const [s, t] = [doc.querySelector('#s')!, doc.querySelector('#t')!];
    place(doc.querySelector('#c')!, { left: 0, top: 0, width: 200, height: 200 });
    place(s, { left: 0, top: 0, width: 200, height: 100 });
    place(t, { left: 0, top: 100, width: 200, height: 100 });
    place(doc.querySelector('#a')!, { left: 0, top: 0, width: 200, height: 100 });
    const edge = findDropSpot(doc, 100, 2, null)!;
    expect(edge.parent).toBe(doc.querySelector('#c'));
    expect(edge.before).toBe(s);
    const inside = findDropSpot(doc, 100, 50, null)!;
    expect(inside.parent).toBe(s);
  });

  it('drops beside a void element, among its siblings in the parent', () => {
    const doc = setup('<div id="c"><img id="i"></div>', d => [d.querySelector('#i')!]);
    const container = doc.querySelector('#c')!;
    place(container, { left: 0, top: 0, width: 100, height: 100 });
    place(doc.querySelector('#i')!, { left: 0, top: 0, width: 100, height: 100 });
    const spot = findDropSpot(doc, 50, 80, null)!;
    expect(spot.parent).toBe(container);
    expect(spot.before).toBeNull();
    expect(spot.line).toEqual({ left: 0, top: 99, width: 100, height: 2 });
  });

  it('is null when the target is the root and cannot hold children', () => {
    const doc = setup('', d => [d.createElement('img')]);
    expect(findDropSpot(doc, 0, 0, null)).toBeNull();
  });
});
