/*
 * The document as a tree of nodes — elements and runs of text alike.
 *
 * Its first job is reaching what you cannot click. A modal, a dropdown, the
 * authenticated half of an app: with the page's JavaScript not running,
 * everything it starts life hiding stays hidden, and the tree is the only way
 * in. Its second job is showing that a heading made of three runs and two
 * elements is exactly that, rather than one opaque thing that sometimes lets
 * you edit its words.
 */

import { useState } from 'react';
import { ChevronIcon } from '../../components/Icons';
import { designableChildren, isText, labelOf } from './nodes';

// How deep the tree stands open before anyone touches it.
const OPEN_TO = 2;

function ancestors(node: Node | null, root: Node) {
  const chain = new Set<Node>();
  let current = node?.parentNode ?? null;
  while (current) {
    chain.add(current);
    if (current === root) {
      break;
    }
    current = current.parentNode;
  }
  return chain;
}

export default function Layers(props: {
  root: Element | null;
  selected: Node | null;
  // Elements the page renders as display:none, shown greyed.
  hidden: Set<Element>;
  onSelect: (node: Node) => void;
  onHover: (node: Node | null) => void;
  // Double click — take me to it on the canvas.
  onReveal: (node: Node) => void;
}) {

  // Nodes whose open state the user has flipped away from the default.
  const [flipped, setFlipped] = useState<Set<Node>>(new Set());

  if (!props.root) {
    return <p className="designer-empty">Nothing loaded yet.</p>;
  }
  const root = props.root;

  // The path down to the selection always stands open, so selecting in the
  // canvas shows you where the node lives instead of leaving the tree behind.
  const path = ancestors(props.selected, root);

  function flip(node: Node) {
    setFlipped(current => {
      const next = new Set(current);
      if (next.has(node)) {
        next.delete(node);
      } else {
        next.add(node);
      }
      return next;
    });
  }

  function row(node: Node, depth: number) {
    const children = designableChildren(node);
    const open = path.has(node) || ((depth < OPEN_TO) !== flipped.has(node));
    const text = isText(node);
    return (
      <div key={depth + ':' + labelOf(node)}>
        <div
          className={'designer-layer' +
            (node === props.selected ? ' selected' : '') +
            (text ? ' text' : '') +
            (!text && props.hidden.has(node as Element) ? ' invisible' : '')}
          style={{ paddingLeft: 6 + depth * 12 }}
          onMouseEnter={() => props.onHover(node)}
          onMouseLeave={() => props.onHover(null)}
          onClick={() => props.onSelect(node)}
          onDoubleClick={() => props.onReveal(node)}>
          {children.length > 0 ? (
            <button
              className="designer-layer-chevron"
              title={open ? 'Collapse' : 'Expand'}
              onClick={event => {
                event.stopPropagation();
                flip(node);
              }}>
              <ChevronIcon open={open} />
            </button>
          ) : (
            <span className="designer-layer-chevron" />
          )}
          <span className="designer-layer-name">{labelOf(node)}</span>
        </div>
        {open && children.map((child, index) => (
          <div key={index}>{row(child, depth + 1)}</div>
        ))}
      </div>
    );
  }

  return <div className="designer-layers">{row(root, 0)}</div>;
}
