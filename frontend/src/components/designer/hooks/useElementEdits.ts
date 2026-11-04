/*
 * Edits to the selected element itself: its words, its attributes, its
 * classes, its tag, what wraps it, and what the head says about the page —
 * plus dropping a new block in and letting the Machine rewrite one.
 */

import { ensureWidgetAssets } from '../../../lib/api';
import { showError } from '../../../lib/errors';
import { showToast } from '../../../lib/toast';
import { ensureRequiredAssets } from '../assets';
import type { DropSpot } from '../dropTarget';
import type { Picked } from '../Media';
import { KIND_FOR_TAG } from '../mediaKinds';
import { Home, readMeta, writeMeta } from '../metaTags';
import { elementOf, isElement, isText, writeText } from '../nodes';
import type { Block } from '../palette';
import { reportDropped } from '../slotWarning';
import type { DesignerUi } from './useDesignerUi';
import type { DocumentState } from './useDocumentState';
import type { UndoHistory } from './useUndoHistory';

export function useElementEdits(o: {
  origin: string;
  styleTarget: Element | null;
  ui: Pick<DesignerUi, 'choosingMedia' | 'setChoosingMedia'>;
  documentState: Pick<DocumentState, 'docRef' | 'selected' | 'setSelected'>;
  mutate: UndoHistory['mutate'];
}) {
  const { origin, styleTarget, mutate } = o;
  const { choosingMedia, setChoosingMedia } = o.ui;
  const { docRef, selected, setSelected } = o.documentState;

  function setText(text: string) {
    const node = selected;
    if (node && isText(node)) {
      mutate(() => writeText(node, text), 'text');
    }
  }

  function setAttribute(name: string, value: string) {
    const element = elementOf(selected);
    if (!element) {
      return;
    }
    reportDropped(element.getAttribute(name) ?? '', value);
    mutate(() => {
      // An empty id is never meaningful, and writing id="" to the file is noise.
      if (name === 'id' && value === '') {
        element.removeAttribute('id');
      } else {
        element.setAttribute(name, value);
      }
    }, 'attribute:' + name);
  }

  /*
   * Points the selected element at a file that is already on the cloudlet.
   *
   * Width and height go on with it, from the size the browser measured while
   * showing the thumbnail. Without them the page reflows when the image
   * finally arrives, and this is the one moment where both numbers are known
   * for free.
   *
   * One mutation, so one undo step puts back the image that was there before.
   */
  function pickMedia(picked: Picked) {
    const home = choosingMedia?.home;
    setChoosingMedia(null);
    if (home) {
      mutate(() => writeMeta(docRef.current!, home, origin + picked.src));
      return;
    }
    const element = elementOf(selected);
    if (!element) {
      return;
    }
    mutate(() => {
      element.setAttribute('src', picked.src);
      if (picked.width > 0 && picked.height > 0) {
        element.setAttribute('width', String(picked.width));
        element.setAttribute('height', String(picked.height));
      }
      /*
       * Only an image has alternative text. Describing it is the author's
       * call; the attribute merely has to exist for that choice to be a
       * choice rather than an omission.
       */
      if (element.tagName.toLowerCase() === 'img' && !element.hasAttribute('alt')) {
        element.setAttribute('alt', '');
      }
    });
  }

  /*
   * Puts a new element around the selection.
   *
   * A div around a block and a span around anything inline, because those are
   * the two that can hold what they are wrapping without changing how it
   * lays out. Whatever it should really be is one Change tag away, and that
   * pairing is deliberate: two plain operations instead of one with a
   * vocabulary attached to it.
   *
   * Works on a run of text too — wrap it, then change the wrapper to strong,
   * and a word is bold without going near the code view.
   */
  function wrap() {
    const node = selected;
    const current = docRef.current;
    if (!node || !current || node === current.body || node === current.documentElement) {
      return;
    }
    const inline =
      isText(node) || (isElement(node) && getComputedStyle(node).display.startsWith('inline'));
    mutate(() => {
      const wrapper = current.createElement(inline ? 'span' : 'div');
      (node as ChildNode).before(wrapper);
      wrapper.append(node);
      setSelected(wrapper);
    });
  }

  /*
   * Takes an element away and leaves what was inside it exactly where it was.
   * The counterpart to the div that turned out to be one div too many.
   */
  function unwrap() {
    const element = elementOf(selected);
    const current = docRef.current;
    if (
      !element ||
      !current ||
      element === current.body ||
      element === current.documentElement ||
      !element.parentNode
    ) {
      return;
    }
    mutate(() => {
      const children = Array.from(element.childNodes);
      element.replaceWith(...children);
      setSelected(children[0] ?? null);
    });
  }

  /*
   * The same element, under a different tag.
   *
   * Attributes and children come across untouched, so a heading demoted from
   * h2 to h3 keeps its classes, its id and its words — the point is that only
   * the tag changes, which is the one thing a text editor makes you retype
   * twice and get wrong once.
   */
  function changeTag(tag: string) {
    const element = elementOf(selected);
    const current = docRef.current;
    if (
      !element ||
      !current ||
      element.tagName.toLowerCase() === tag ||
      element === current.body ||
      element === current.documentElement
    ) {
      return;
    }
    mutate(() => {
      const replacement = current.createElement(tag);
      Array.from(element.attributes).forEach(attribute =>
        replacement.setAttribute(attribute.name, attribute.value),
      );
      replacement.append(...Array.from(element.childNodes));
      element.replaceWith(replacement);
      setSelected(replacement);
    });
  }

  /*
   * A field in the head. Coalesced per field, so typing a description is one
   * undo step rather than one per character — the same rule the attribute
   * fields already follow.
   */
  function setMeta(home: Home, value: string) {
    reportDropped(readMeta(docRef.current!, home), value);
    mutate(
      () => writeMeta(docRef.current!, home, value),
      'meta:' + home.at + ('key' in home ? home.key : ''),
    );
  }

  function removeAttribute(name: string) {
    const element = elementOf(selected);
    if (element) {
      mutate(() => element.removeAttribute(name));
    }
  }

  function setClasses(classes: string[]) {
    const element = elementOf(selected);
    if (!element) {
      return;
    }
    mutate(() => {
      if (classes.length === 0) {
        element.removeAttribute('class');
      } else {
        element.setAttribute('class', classes.join(' '));
      }
    });
  }

  /*
   * Gives an element a run of text to hold.
   *
   * Emptying the words out of a paragraph leaves the paragraph — deleting it
   * would be deciding, on the user's behalf, that an element with no text is
   * an element they no longer want, and that is wrong often enough to be
   * dangerous: half the containers on a generated page are empty on purpose,
   * waiting for their script to fill them. So the element stays, and this is
   * how words go back into it.
   */
  function addText() {
    const element = elementOf(selected);
    if (!element) {
      return;
    }
    mutate(() => {
      // Reuse the emptied run if there is one rather than stacking another.
      const existing = Array.from(element.childNodes).find(isText);
      if (existing) {
        existing.data = 'Some text';
        setSelected(existing);
      } else {
        const node = element.ownerDocument.createTextNode('Some text');
        element.append(node);
        setSelected(node);
      }
    });
  }

  function insert(block: Block, spot: DropSpot) {
    const current = docRef.current;
    if (!current) {
      return;
    }
    const html = block.build(current, spot.parent);
    /*
     * A template parses markup without running or loading anything in it, and
     * without the parser relocating stray table or list elements the way it
     * would inside a real body.
     */
    const holder = current.createElement('template');
    holder.innerHTML = html;
    const node = holder.content.firstChild;
    if (!node) {
      return;
    }
    /*
     * Whether this drop just linked a shared widget asset this page did not
     * already have — the signal for "first block of this kind on this page",
     * which is the only time ensureWidgetAssets() below needs to run at all.
     */
    let linkedNewAsset = false;
    mutate(() => {
      spot.parent.insertBefore(node, spot.before);
      setSelected(node);
      linkedNewAsset = ensureRequiredAssets(current, block.requires);
    });
    if (linkedNewAsset) {
      ensureWidgetAssets().catch((err: unknown) => showError(err));
    }
    /*
     * An image dropped onto the page wants a picture, and the grey
     * placeholder is not one. The picker opens on top of the drop, so
     * choosing something already on the cloudlet is the path of least
     * resistance rather than a thing to go and find.
     */
    // The palette keys these blocks by their tag, so this is the same lookup.
    const kind = KIND_FOR_TAG[block.key];
    if (kind) {
      setChoosingMedia({ kind });
    }
  }

  /*
   * Puts what the Machine returned in place of the selected element.
   *
   * Everything it returns is used, not just the first node: asked to turn one
   * paragraph into three, it answers with three, and taking only the first
   * would silently drop two of them.
   *
   * <body> and <html> are refused. Replacing either with whatever comes back
   * would leave a document that is no longer a document, and "redesign the
   * whole page" is a job for Chat Ops, which can see the file and the
   * stylesheet together.
   */
  function rewriteSelected(html: string) {
    const element = styleTarget;
    const current = docRef.current;
    if (!element || !current) {
      return;
    }
    const tag = element.tagName.toLowerCase();
    if (tag === 'body' || tag === 'html') {
      showToast('Select something inside the page — the page itself is Chat Ops\u2019 job', true);
      return;
    }
    const holder = current.createElement('template');
    holder.innerHTML = html;
    const nodes = Array.from(holder.content.childNodes);
    if (nodes.length === 0) {
      showToast('The Machine returned nothing to put there', true);
      return;
    }
    mutate(() => {
      element.replaceWith(...nodes);
      setSelected(nodes[0]);
    });
  }

  return {
    setText,
    setAttribute,
    pickMedia,
    wrap,
    unwrap,
    changeTag,
    setMeta,
    removeAttribute,
    setClasses,
    addText,
    insert,
    rewriteSelected,
  };
}
