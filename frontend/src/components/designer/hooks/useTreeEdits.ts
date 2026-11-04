/*
 * Edits that move the selected node around the tree: duplicating, copying,
 * cutting, pasting, deleting, nudging and dragging it.
 */

import { showToast } from '../../../lib/toast';
import type { DropSpot } from '../dropTarget';
import { canContainChildren } from '../html';
import { designableChildren, elementOf, isText, labelOf } from '../nodes';
import type { DocumentState } from './useDocumentState';
import type { UndoHistory } from './useUndoHistory';

export function useTreeEdits(o: {
  clipKey: string;
  documentState: Pick<DocumentState, 'docRef' | 'doc' | 'selected' | 'setSelected' | 'setHovered'>;
  mutate: UndoHistory['mutate'];
}) {
  const { clipKey, mutate } = o;
  const { docRef, doc, selected, setSelected, setHovered } = o.documentState;

  function duplicate() {
    const node = selected;
    if (!node) {
      return;
    }
    mutate(() => {
      const copy = node.cloneNode(true);
      if (!isText(copy)) {
        const element = copy as Element;
        /*
         * An id identifies one element. A copy that keeps it leaves two elements
         * answering to the same name, which breaks the page's own CSS and
         * scripts in ways that only show up later.
         */
        element.removeAttribute('id');
        element.querySelectorAll('[id]').forEach(child => child.removeAttribute('id'));
      }
      (node as ChildNode).after(copy);
      setSelected(copy);
    });
  }

  function copy() {
    const node = selected;
    if (!node) {
      return;
    }
    const html = isText(node) ? (node.textContent ?? '') : (node as Element).outerHTML;
    localStorage.setItem(clipKey, JSON.stringify({ html, isText: isText(node) }));
    showToast('Copied ' + labelOf(node));
  }

  function cut() {
    if (selected) {
      copy();
      remove();
    }
  }

  /*
   * Where a paste lands: inside the selection when it is an empty container,
   * after it otherwise. The same rule the panel uses to decide whether words
   * can go back into an element, so the two behave alike.
   *
   * An id that the destination already carries is dropped, because two
   * elements answering to one name break the page's own CSS. An id that is
   * free here is kept — pasting into a different page should not cost you
   * the anchor you were linking to.
   */
  function paste() {
    const current = docRef.current;
    if (!current) {
      return;
    }
    const stored = localStorage.getItem(clipKey);
    if (!stored) {
      showToast('Nothing has been copied yet', true);
      return;
    }
    const { html, isText: wasText } = JSON.parse(stored) as { html: string; isText: boolean };
    const holder = current.createElement('template');
    if (wasText) {
      holder.content.appendChild(current.createTextNode(html));
    } else {
      holder.innerHTML = html;
    }
    const nodes = Array.from(holder.content.childNodes);
    if (nodes.length === 0) {
      return;
    }
    nodes.forEach(node => {
      if (isText(node)) {
        return;
      }
      const element = node as Element;
      [element, ...Array.from(element.querySelectorAll('[id]'))].forEach(one => {
        const id = one.getAttribute('id');
        if (id && current.getElementById(id)) {
          one.removeAttribute('id');
        }
      });
    });
    const into = elementOf(selected);
    mutate(() => {
      if (!selected || !into) {
        current.body.append(...nodes);
      } else if (
        into === selected &&
        canContainChildren(into) &&
        designableChildren(into).length === 0
      ) {
        into.append(...nodes);
      } else {
        (selected as ChildNode).after(...nodes);
      }
      setSelected(nodes[0]);
    });
  }

  function remove() {
    const node = selected;
    if (!node || node === doc?.body) {
      return;
    }
    mutate(() => {
      const parent = node.parentElement;
      (node as ChildNode).remove();
      setSelected(parent);
      setHovered(null);
    });
  }

  /*
   * Among its designable siblings rather than its element siblings, so a run
   * of text counts as something to move past.
   */
  function nudge(direction: -1 | 1) {
    const node = selected;
    const parent = node?.parentNode;
    if (!node || !parent) {
      return;
    }
    const siblings = designableChildren(parent);
    const sibling = siblings[siblings.indexOf(node) + direction];
    if (!sibling) {
      return;
    }
    mutate(() => {
      if (direction < 0) {
        (sibling as ChildNode).before(node);
      } else {
        (sibling as ChildNode).after(node);
      }
    });
  }

  function move(node: Node, spot: DropSpot) {
    mutate(() => spot.parent.insertBefore(node, spot.before));
  }

  return { duplicate, copy, cut, paste, remove, nudge, move };
}
