/*
 * Shared harness for the Inspector tests: builds documents from literal markup, renders the
 * panel with spy callbacks and, when asked, applies each edit to the node the way the designer
 * does, so a test can see what the panel shows after an edit.
 */
import { render } from '@testing-library/react';
import { vi } from 'vitest';

import InspectorPanel from './InspectorPanel';

export function makeDoc(bodyMarkup: string) {
  const doc = document.implementation.createHTMLDocument('page');
  doc.body.innerHTML = bodyMarkup;
  return doc;
}

export function spies() {
  return {
    onSetText: vi.fn(),
    onSetAttribute: vi.fn(),
    onRemoveAttribute: vi.fn(),
    onSetClasses: vi.fn(),
    onSelect: vi.fn(),
    onDuplicate: vi.fn(),
    onDelete: vi.fn(),
    onMove: vi.fn(),
    onAddText: vi.fn(),
    onChooseMedia: vi.fn(),
    onWrap: vi.fn(),
    onUnwrap: vi.fn(),
    onChangeTag: vi.fn(),
  };
}

export type Spies = ReturnType<typeof spies>;

export interface Options {
  doc?: Document | null;
  live?: boolean;
  canAddText?: boolean;
  origin?: string;
  urls?: string[];
}

// Renders the panel for the node found by `selector` (or the node itself) in a fresh document.
export function renderInspector(
  markup: string,
  pick: string | ((doc: Document) => Node | null),
  options: Options = {},
) {
  const doc = options.doc === undefined ? makeDoc(markup) : options.doc;
  let node: Node | null = null;
  if (doc) {
    node = typeof pick === 'string' ? doc.querySelector(pick) : pick(doc);
  }
  const s = spies();
  const view = render(<InspectorPanel node={node} doc={doc} s={s} o={options} />);
  return { ...view, s, node, doc };
}

// The text input that sits in the attribute row named `name`.
export function attributeInput(container: HTMLElement, name: string) {
  const label = Array.from(container.querySelectorAll('.designer-attribute label')).find(
    item => item.textContent === name,
  );
  return label!.parentElement!.querySelector('input') as HTMLInputElement;
}
