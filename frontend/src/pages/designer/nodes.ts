/*
 * Nodes, not elements.
 *
 * An element has no text of its own — it has child nodes, some of which are
 * text. Treating "an element's text" as a property of the element was a
 * fiction, and it showed: a heading made of several runs with a <br> and an
 * <em> between them had no single text to offer, so parts of one heading were
 * editable and parts were not, for reasons invisible from the outside.
 *
 * So a run of text is a node like any other. It appears in the tree, it is
 * selected, edited, moved, duplicated and deleted by the same code paths that
 * do those things to elements. Everything below exists to let one selection
 * type cover both.
 */

import { TOOL_ATTRIBUTE } from './html';

export function isText(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}

export function isElement(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE;
}

/*
 * The element a node's styles belong to. Text has no styles of its own, so
 * styling a run means styling whatever contains it — which is what anybody
 * means when they pick a colour with a sentence selected.
 */
export function elementOf(node: Node | null): Element | null {
  if (!node) {
    return null;
  }
  return isText(node) ? node.parentElement : (isElement(node) ? node : null);
}

/*
 * The children worth showing and selecting.
 *
 * Whitespace-only text is left out. Between two block elements it is the
 * indentation of the file and renders as nothing; a page has hundreds of them
 * and a tree listing them all would be unreadable. Between two inline elements
 * it is a real space — those are kept on disk exactly as they are, they simply
 * are not offered as something to click. The code view is there for the rare
 * occasion that a space itself needs editing.
 */
export function designableChildren(node: Node): Node[] {
  return Array.from(node.childNodes).filter(child => {
    if (isElement(child)) {
      return !child.hasAttribute(TOOL_ATTRIBUTE);
    }
    return isText(child) && child.data.trim() !== '';
  });
}

/*
 * A node's box on screen.
 *
 * A run of text has no box of its own, so it is measured through a range —
 * which is better than an element's box, not worse: a run wrapping over three
 * lines reports the union of its line boxes rather than a rectangle covering
 * the whole paragraph.
 */
export function rectOf(node: Node): DOMRect | null {
  if (isElement(node)) {
    return node.getBoundingClientRect();
  }
  if (!isText(node) || !node.ownerDocument) {
    return null;
  }
  const range = node.ownerDocument.createRange();
  range.selectNodeContents(node);
  return range.getBoundingClientRect();
}

// Every line box a node occupies, for hit-testing a run that wraps.
function clientRects(node: Node): DOMRect[] {
  if (isElement(node)) {
    return [node.getBoundingClientRect()];
  }
  if (!isText(node) || !node.ownerDocument) {
    return [];
  }
  const range = node.ownerDocument.createRange();
  range.selectNodeContents(node);
  return Array.from(range.getClientRects());
}

/*
 * The text node under a point, as the browser sees it. Firefox and the rest
 * spell this differently and neither is going away.
 */
function caretNode(doc: Document, x: number, y: number): Node | null {
  const api = doc as unknown as {
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node } | null;
  };
  if (api.caretRangeFromPoint) {
    return api.caretRangeFromPoint(x, y)?.startContainer ?? null;
  }
  return api.caretPositionFromPoint?.(x, y)?.offsetNode ?? null;
}

/*
 * What was clicked: the run of text if the pointer is genuinely over its
 * glyphs, otherwise the element itself.
 *
 * The caret APIs answer with the NEAREST text position, which for a click in
 * a container's padding is some text several elements away. So the answer is
 * only accepted when the point really falls inside one of that run's own line
 * boxes — which is also what stops a click on an element's padding from
 * selecting its child's words.
 */
export function nodeAtPoint(doc: Document, x: number, y: number, element: Element): Node {
  const candidate = caretNode(doc, x, y);
  if (!candidate || !isText(candidate) || candidate.data.trim() === '' ||
      !element.contains(candidate)) {
    return element;
  }
  const over = clientRects(candidate).some(rect =>
    x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom);
  return over ? candidate : element;
}

// How a node reads in the tree and the breadcrumb.
export function labelOf(node: Node): string {
  if (isText(node)) {
    const text = node.data.trim().replace(/\s+/g, ' ');
    return text.length > 26 ? '"' + text.slice(0, 26) + '…"' : '"' + text + '"';
  }
  if (!isElement(node)) {
    return node.nodeName.toLowerCase();
  }
  const tag = node.tagName.toLowerCase();
  if (node.id) {
    return tag + '#' + node.id;
  }
  const className = node.getAttribute('class')?.trim().split(/\s+/)[0];
  return className ? tag + '.' + className : tag;
}

/*
 * Replaces a run's words while keeping the whitespace around them. That
 * whitespace is rendered — it is the gap between a label and the icon after
 * it — so trimming it away would quietly close the gap.
 */
export function writeText(node: Text, text: string) {
  const lead = /^\s*/.exec(node.data)![0];
  const trail = /\s*$/.exec(node.data)![0];
  node.data = lead + text + trail;
}
