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

/*
 * The nodes a search should show: the ones that match, and every ancestor
 * between them and the root — because a match nobody can see the path to is
 * not findable, it is merely present.
 *
 * Matching is against the same label the row displays, plus the words a run
 * of text holds, so searching for what you can read on the page finds it.
 */
function matching(root: Element, query: string) {
  const needle = query.trim().toLowerCase();
  const keep = new Set<Node>();
  if (needle === '') {
    return keep;
  }
  const visit = (node: Node) => {
    const children = designableChildren(node);
    let found = labelOf(node).toLowerCase().includes(needle) ||
      (isText(node) && (node.textContent ?? '').toLowerCase().includes(needle));
    children.forEach(child => {
      if (visit(child)) {
        found = true;
      }
    });
    if (found) {
      keep.add(node);
    }
    return found;
  };
  visit(root);
  return keep;
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
  const [query, setQuery] = useState('');

  if (!props.root) {
    return <p className="designer-empty">Nothing loaded yet.</p>;
  }
  const root = props.root;

  // The path down to the selection always stands open, so selecting in the
  // canvas shows you where the node lives instead of leaving the tree behind.
  const path = ancestors(props.selected, root);
  /*
   * While searching, the tree is only the matches and their ancestors, and it
   * stands open all the way down — collapsing part of a search result would
   * hide the thing being searched for.
   */
  const found = matching(root, query);
  const searching = query.trim() !== '';

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
    const children = searching
      ? designableChildren(node).filter(child => found.has(child))
      : designableChildren(node);
    const open = searching || path.has(node) ||
      ((depth < OPEN_TO) !== flipped.has(node));
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

  return (
    <>
      <input
        type="search"
        className="designer-tree-search"
        placeholder="Search the tree…"
        value={query}
        onChange={event => setQuery(event.target.value)} />
      <div className="designer-layers">
        {searching && found.size === 0
          ? <p className="designer-muted">Nothing matches “{query.trim()}”.</p>
          : row(root, 0)}
      </div>
    </>
  );
}
