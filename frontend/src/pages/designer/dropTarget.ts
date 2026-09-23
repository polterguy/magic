/*
 * Working out where a dragged element lands.
 *
 * Everything here is measured from real layout — bounding boxes of the
 * elements actually on screen — rather than read out of the CSS. A row of
 * cards laid out with flex, with grid, or with inline-block all look the same
 * to a bounding box, so one rule covers all three and there is nothing to keep
 * in step with the stylesheet.
 */

import { canContainChildren } from './html';
import { designableChildren, isElement, rectOf } from './nodes';

export interface DropSpot {
  // Where the node will be inserted.
  parent: Element;
  // The sibling to insert before, or null to append at the end. A run of text
  // is a sibling like any other, so a drop can land either side of one.
  before: Node | null;
  // The indicator to draw, in the canvas frame's own viewport coordinates.
  line: { left: number; top: number; width: number; height: number };
}

// How thick the drop indicator is drawn.
const LINE = 2;

/*
 * How close to an element's leading or trailing edge counts as "next to this"
 * rather than "into this", as a share of the element's own size and as a hard
 * ceiling in pixels. Without it a card that has anything inside it can only
 * ever be dropped INTO, and placing a second card beside the first becomes
 * impossible — which is the most ordinary thing anyone will try to do.
 */
const EDGE_SHARE = 0.25;
const EDGE_MAX = 16;

/*
 * The children an insertion can be placed among. The element being dragged is
 * not one of them: it is about to move, so measuring against where it
 * currently sits would make the indicator jump around it.
 */
function candidates(parent: Node, dragged: Node | null) {
  return designableChildren(parent).filter(child => child !== dragged);
}

/*
 * Whether a container lays its children out side by side.
 *
 * Decided from where the first two children actually are rather than from
 * display and flex-direction, so a flex row, a grid and a line of inline
 * blocks are all recognised by the same test.
 */
function isHorizontal(children: Node[]) {
  if (children.length < 2) {
    return false;
  }
  const first = rectOf(children[0]);
  const second = rectOf(children[1]);
  if (!first || !second) {
    return false;
  }
  const overlap = Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top);
  return overlap > Math.min(first.height, second.height) / 2 && second.left >= first.right - 1;
}

/*
 * Whether the pointer is in the band along the edge of an element where a drop
 * means "beside this". Measured along whichever axis the element's siblings
 * run, so the bands sit on the two edges an insertion could happen at.
 */
function nearEdge(element: Element, x: number, y: number, dragged: Node | null) {
  const parent = element.parentElement;
  if (!parent) {
    return false;
  }
  const box = element.getBoundingClientRect();
  const horizontal = isHorizontal(candidates(parent, dragged));
  const size = horizontal ? box.width : box.height;
  const offset = horizontal ? x - box.left : y - box.top;
  const band = Math.min(EDGE_MAX, size * EDGE_SHARE);
  return offset < band || offset > size - band;
}

export function findDropSpot(
  doc: Document,
  x: number,
  y: number,
  dragged: Node | null): DropSpot | null {

  /*
   * Every element under the pointer, nearest first, with the element being
   * dragged and everything inside it skipped — it is about to be somewhere
   * else, and it must not be able to swallow itself.
   */
  const under = (doc.elementsFromPoint(x, y) as Element[]).filter(element =>
    element.tagName !== 'HTML' &&
    !element.hasAttribute('data-magic-tool') &&
    (!dragged || (element !== dragged && !dragged.contains(element))));
  const target = under[0];
  if (!target) {
    return null;
  }

  /*
   * Pointing well inside a container means into it, between the things it
   * holds. Pointing near one of its edges — or at anything that holds nothing
   * — means beside it, among its siblings.
   */
  let parent: Element | null = target.parentElement;
  if (designableChildren(target).length > 0 && canContainChildren(target) &&
      !nearEdge(target, x, y, dragged)) {
    parent = target;
  }
  if (!parent) {
    return null;
  }
  let children = candidates(parent, dragged);
  if (children.length === 0 && !canContainChildren(parent)) {
    parent = parent.parentElement;
    if (!parent) {
      return null;
    }
    children = candidates(parent, dragged);
  }

  const box = parent.getBoundingClientRect();

  // Nothing to sit between — the drop goes inside, and the indicator fills it.
  if (children.length === 0) {
    return {
      parent,
      before: null,
      line: { left: box.left, top: box.top, width: box.width, height: box.height },
    };
  }

  const horizontal = isHorizontal(children);
  const before = children.find(child => {
    const rect = rectOf(child);
    if (!rect) {
      return false;
    }
    return horizontal
      ? x < rect.left + rect.width / 2
      : y < rect.top + rect.height / 2;
  }) ?? null;

  /*
   * The indicator sits on the leading edge of whatever the element will be
   * inserted before, or on the trailing edge of the last child when it goes
   * at the end.
   */
  const anchor = rectOf(before ?? children[children.length - 1]);
  if (!anchor) {
    return null;
  }
  if (horizontal) {
    return {
      parent,
      before,
      line: {
        left: (before ? anchor.left : anchor.right) - LINE / 2,
        top: anchor.top,
        width: LINE,
        height: anchor.height,
      },
    };
  }
  return {
    parent,
    before,
    line: {
      left: anchor.left,
      top: (before ? anchor.top : anchor.bottom) - LINE / 2,
      width: anchor.width,
      height: LINE,
    },
  };
}
