/*
 * The design surface.
 *
 * The page lives in an iframe with "sandbox=allow-same-origin" and no
 * "allow-scripts", so nothing in the page runs and the frame stays on the
 * dashboard's origin. Every listener below is attached by this component
 * straight onto the frame's document — there is no agent script inside the
 * page, because there is no way to run one and no need for one.
 *
 * Selection outlines and the drop indicator are drawn HERE, in the dashboard,
 * on top of the frame. Nothing the designer draws is ever inside the document
 * being edited, so nothing it draws can end up in the saved file.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DropSpot, findDropSpot } from './dropTarget';
import { elementOf, isText, labelOf, nodeAtPoint, rectOf } from './nodes';
import { CANVAS_SANDBOX } from './html';

export interface CanvasProps {
  srcDoc: string;
  // Fixed pixel width for the tablet and phone views; null fills the pane.
  width: number | null;
  selected: Node | null;
  hovered: Node | null;
  // Bumped by the page whenever the document was mutated, so outlines that
  // are measured from live layout get measured again.
  version: number;
  // Whether a palette block is being dragged in from outside the frame.
  inserting: boolean;
  /*
   * Bumped when the hover came from the tree rather than the canvas, to bring
   * the node on screen. Only from the tree: scrolling the page under a pointer
   * that is already on the thing it is pointing at would be the tool moving
   * the target away from you.
   */
  revealHovered: number;
  /*
   * Bumped when the tree is double-clicked. Unlike the hover reveal this is a
   * deliberate "take me there", so it is smooth and centres the node rather
   * than nudging it just inside the edge.
   */
  revealSelected: number;
  // Shown over the frame when there is a reason it looks empty.
  note: string | null;
  /*
   * Out of sight, but NOT unmounted. The frame's document is the thing being
   * edited, so tearing it down to show another view would throw the edit
   * away along with it.
   */
  hidden: boolean;
  onReady: (doc: Document) => void;
  onHover: (node: Node | null) => void;
  onSelect: (node: Node) => void;
  onMove: (node: Node, spot: DropSpot) => void;
  onInsert: (spot: DropSpot) => void;
  onPendingDone: () => void;
  onEditText: (node: Text, text: string) => void;
  onKey: (event: KeyboardEvent) => void;
}

// How far the pointer travels before a press becomes a drag.
const THRESHOLD = 4;

export default function Canvas(props: CanvasProps) {

  const frameRef = useRef<HTMLIFrameElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<Document | null>(null);

  /*
   * Listeners are attached to the frame's document once per load and live as
   * long as that document does, so they would otherwise close over whichever
   * render attached them. Reading through a ref keeps them current.
   */
  const propsRef = useRef(props);
  propsRef.current = props;

  // Re-measure trigger: outlines come from live layout, which scrolling moves.
  const [, setTick] = useState(0);
  const remeasure = () => setTick(tick => tick + 1);

  const [spot, setSpot] = useState<DropSpot | null>(null);
  const spotRef = useRef<DropSpot | null>(null);
  function showSpot(value: DropSpot | null) {
    spotRef.current = value;
    setSpot(value);
  }

  // The press that has not yet become a drag, and the drag it became.
  const pressRef = useRef<{ x: number; y: number; node: Node } | null>(null);
  const dragRef = useRef<Node | null>(null);
  /*
   * The element being typed into, and everything it held before typing
   * started. The markup is kept whole, not just the words: an icon sitting
   * beside the label is inside the editable region, and the caret can delete
   * it. Restoring the markup on the way out means it always comes back.
   */
  const editRef = useRef<{
    element: Element;
    // Where the run sits among its parent's children, so it can be found again
    // after the markup is restored.
    index: number;
    html: string;
    text: string;
    span: HTMLElement;
  } | null>(null);

  function onMouseDown(event: MouseEvent) {
    const target = event.target as Element;
    if (editRef.current) {
      // Inside the text being typed into, the pointer belongs to the caret.
      if (editRef.current.span.contains(target)) {
        return;
      }
      /*
       * Clicking away finishes the edit, and then goes on to behave like any
       * other click. It has to be done by hand: preventDefault below stops the
       * browser moving focus, which is what would otherwise raise the blur
       * this is listening for — and without it the click would be swallowed
       * just to close an edit, leaving the user to click everything twice.
       */
      commitEdit();
    }
    if (target.nodeType !== Node.ELEMENT_NODE) {
      return;
    }
    const doc = docRef.current;
    if (!doc) {
      return;
    }
    // Otherwise the browser starts selecting text across the whole page.
    event.preventDefault();
    const node = nodeAtPoint(doc, event.clientX, event.clientY, target);
    propsRef.current.onSelect(node);
    pressRef.current = { x: event.clientX, y: event.clientY, node };
  }

  function onMouseMove(event: MouseEvent) {
    const doc = docRef.current;
    if (!doc || editRef.current) {
      return;
    }
    /*
     * A palette block being dragged in from the rail outside. It has to be
     * followed HERE as well as at the window, because the moment the pointer
     * crosses into the frame the parent window stops hearing the mouse
     * entirely — the events belong to the framed document from then on. The
     * window listener covers the part of the drag that is still outside; this
     * covers the part that matters, which is over the page.
     */
    if (propsRef.current.inserting) {
      showSpot(findDropSpot(doc, event.clientX, event.clientY, null));
      return;
    }
    const press = pressRef.current;
    if (press && !dragRef.current &&
        (Math.abs(event.clientX - press.x) > THRESHOLD ||
         Math.abs(event.clientY - press.y) > THRESHOLD)) {
      dragRef.current = press.node;
    }
    if (dragRef.current) {
      showSpot(findDropSpot(doc, event.clientX, event.clientY, dragRef.current));
      return;
    }
    propsRef.current.onHover(nodeAtPoint(doc, event.clientX, event.clientY, event.target as Element));
  }

  function onDoubleClick(event: MouseEvent) {
    const target = event.target as Element;
    if (target.nodeType !== Node.ELEMENT_NODE) {
      return;
    }
    /*
     * A second double-click inside the run already being edited is the normal
     * way to select a word, and it must stay that way. Starting another edit
     * here would wrap the wrapper and leave the outer one behind in the page.
     */
    if (editRef.current?.span.contains(target)) {
      return;
    }
    const doc = docRef.current;
    if (!doc) {
      return;
    }
    // Whichever run was double-clicked, however many the element holds.
    const node = nodeAtPoint(doc, event.clientX, event.clientY, target);
    if (!isText(node)) {
      return;
    }
    event.preventDefault();
    beginEdit(node);
  }

  /*
   * Editing one run, in place, whatever else its element contains.
   *
   * contenteditable only exists on elements, so making the parent editable
   * would hand the caret the whole heading — every other run, and the <em>
   * and <br> between them — and there would be no honest way to tell which
   * part of what came back was the run being edited. So the run is wrapped in
   * an editable span for the duration: the caret cannot leave it, and what
   * was typed is simply that span's text. The wrapper never outlives the
   * edit, because committing restores the element's markup wholesale.
   */
  function beginEdit(node: Text) {
    const doc = docRef.current;
    const element = node.parentElement;
    if (!doc || !element) {
      return;
    }
    const index = Array.from(element.childNodes).indexOf(node);
    const html = element.innerHTML;
    const span = doc.createElement('span');
    span.setAttribute('contenteditable', 'true');
    span.setAttribute('data-magic-editing', '');
    element.insertBefore(span, node);
    span.appendChild(node);
    editRef.current = { element, index, html, text: node.data, span };
    span.focus();
    const range = doc.createRange();
    range.selectNodeContents(span);
    const selection = doc.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    span.addEventListener('blur', commitEdit, { once: true });
    span.addEventListener('keydown', editKeys);
  }

  /*
   * Both keys act on the edit directly rather than by blurring it. Asking for
   * a blur and trusting it to arrive is not the same as ending the edit: if
   * the element never held focus, nothing fires, and the wrapper is left
   * sitting in the document.
   */
  function editKeys(event: Event) {
    const key = (event as KeyboardEvent).key;
    if (key === 'Escape') {
      event.preventDefault();
      cancelEdit();
    } else if (key === 'Enter') {
      // A single line of text, so Enter finishes rather than adding a break.
      event.preventDefault();
      commitEdit();
    }
  }

  // Puts the element back exactly as it was and keeps nothing.
  function cancelEdit() {
    const edit = editRef.current;
    if (!edit) {
      return;
    }
    editRef.current = null;
    edit.span.removeEventListener('keydown', editKeys);
    edit.span.removeEventListener('blur', commitEdit);
    edit.element.innerHTML = edit.html;
  }

  function commitEdit() {
    const edit = editRef.current;
    if (!edit) {
      return;
    }
    editRef.current = null;
    edit.span.removeEventListener('keydown', editKeys);
    edit.span.removeEventListener('blur', commitEdit);
    const typed = (edit.span.textContent ?? '').replace(/\s+/g, ' ').trim();
    /*
     * Typing has already changed the document, but the change has to be made
     * by the page so it goes through undo. So the markup is put back exactly
     * as it was — wrapper gone, everything else untouched — and the page
     * applies the words to the run that was being edited.
     */
    edit.element.innerHTML = edit.html;
    if (typed !== edit.text.trim()) {
      const again = edit.element.childNodes[edit.index];
      if (again && isText(again)) {
        propsRef.current.onEditText(again, typed);
      }
    }
  }

  function finishDrag() {
    const dragged = dragRef.current;
    const inserting = propsRef.current.inserting;
    const target = spotRef.current;
    pressRef.current = null;
    dragRef.current = null;
    showSpot(null);
    if (inserting) {
      // Dropped first, then cleared — the page builds the block from the block
      // it is still holding, and clearing first would take it away.
      if (target) {
        propsRef.current.onInsert(target);
      }
      propsRef.current.onPendingDone();
      return;
    }
    if (dragged && target) {
      propsRef.current.onMove(dragged, target);
    }
  }

  function onLoad() {
    const doc = frameRef.current?.contentDocument;
    if (!doc) {
      return;
    }
    docRef.current = doc;
    /*
     * Links must not take the canvas anywhere. preventDefault on mousedown
     * does NOT stop this — mousedown only owns focus and text selection, and
     * navigation happens on click — so the click is cancelled in its own
     * listener. The sandbox is no help here either: it blocks navigating the
     * TOP frame, and a link navigating its own frame is not top navigation.
     *
     * Left unhandled, clicking a link swaps the document being edited for
     * whatever the link points at, and every element reference held outside
     * belongs to a document that no longer exists.
     */
    doc.addEventListener('click', event => event.preventDefault());
    doc.addEventListener('mousedown', onMouseDown);
    doc.addEventListener('mousemove', onMouseMove);
    doc.addEventListener('dblclick', onDoubleClick);
    doc.addEventListener('mouseup', finishDrag);
    doc.addEventListener('keydown', event => propsRef.current.onKey(event));
    doc.addEventListener('mouseleave', () => propsRef.current.onHover(null));
    // Capturing, because scroll does not bubble out of a scrolling element.
    doc.addEventListener('scroll', remeasure, true);
    propsRef.current.onReady(doc);
    remeasure();
  }

  /*
   * Showing another view ends any edit still open. The canvas is only hidden,
   * not unmounted, so without this the wrapper would sit in the document while
   * the code view serialised it.
   */
  useEffect(() => {
    if (props.hidden) {
      commitEdit();
    }
  }, [props.hidden]);

  /*
   * Hovering a row in the tree brings that node into view, the way the
   * elements panel of a browser's inspector does. Nearest rather than centre,
   * so a node already on screen does not make the page jump.
   */
  useEffect(() => {
    const node = propsRef.current.hovered;
    if (!props.revealHovered || !node || !node.isConnected) {
      return;
    }
    elementOf(node)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    remeasure();
  }, [props.revealHovered]);

  useEffect(() => {
    const node = propsRef.current.selected;
    if (!props.revealSelected || !node || !node.isConnected) {
      return;
    }
    elementOf(node)?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  }, [props.revealSelected]);

  /*
   * A drag that leaves the frame still has to end, and a palette block is
   * dragged from outside the frame to begin with, so the pointer is followed
   * at the window level too.
   */
  useEffect(() => {
    function move(event: MouseEvent) {
      const frame = frameRef.current;
      const doc = docRef.current;
      if (!doc || !frame || !propsRef.current.inserting) {
        return;
      }
      const box = frame.getBoundingClientRect();
      const x = event.clientX - box.left;
      const y = event.clientY - box.top;
      if (x < 0 || y < 0 || x > box.width || y > box.height) {
        showSpot(null);
        return;
      }
      showSpot(findDropSpot(doc, x, y, null));
    }
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', finishDrag);
    window.addEventListener('resize', remeasure);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', finishDrag);
      window.removeEventListener('resize', remeasure);
    };
  }, []);

  interface Box {
    left: number;
    top: number;
    width: number;
    height: number;
  }

  /*
   * Where a box inside the frame lands in the wrapper the overlays are drawn
   * in. An element's box is measured in the frame's own viewport, so the
   * frame's offset is added back on — and the wrapper's border with it, since
   * an absolutely positioned overlay is placed from the padding box while
   * getBoundingClientRect reports the border box.
   */
  function project(box: Box | null): Box | null {
    const frame = frameRef.current;
    const wrap = wrapRef.current;
    if (!box || !frame || !wrap) {
      return null;
    }
    const frameBox = frame.getBoundingClientRect();
    const wrapBox = wrap.getBoundingClientRect();
    return {
      left: frameBox.left - wrapBox.left - wrap.clientLeft + box.left,
      top: frameBox.top - wrapBox.top - wrap.clientTop + box.top,
      width: box.width,
      height: box.height,
    };
  }

  function outline(node: Node | null) {
    if (!node || !node.isConnected) {
      return null;
    }
    const box = rectOf(node);
    if (!box) {
      return null;
    }
    return project({ left: box.left, top: box.top, width: box.width, height: box.height });
  }

  const [boxes, setBoxes] = useState<{ hover: Box | null; selected: Box | null; spot: Box | null }>(
    { hover: null, selected: null, spot: null });
  const boxesRef = useRef('');

  /*
   * Overlays are measured AFTER React has updated the DOM, never during the
   * render that changes it. Selecting something re-renders the panels around
   * the canvas, and a box measured before the browser has laid that out is a
   * box from the previous frame — an outline drawn a few pixels off whatever
   * it is supposed to be around. A layout effect runs once the DOM is current
   * and before anything is painted, so the outline is right the first time.
   *
   * No dependency list: layout moves for reasons React never hears about, and
   * the signature check is what stops this from re-rendering forever.
   */
  useLayoutEffect(() => {
    const next = {
      /*
       * Drawn even when the thing under the pointer is the thing already
       * selected. Suppressing it there meant that pointing at your own
       * selection gave no feedback at all, and no badge to identify it by.
       */
      hover: outline(props.hovered),
      selected: outline(props.selected),
      spot: project(spotRef.current?.line ?? null),
    };
    const signature = JSON.stringify(next);
    if (signature !== boxesRef.current) {
      boxesRef.current = signature;
      setBoxes(next);
    }
  });

  return (
    <div
      className="designer-canvas"
      ref={wrapRef}
      style={props.hidden ? { display: 'none' } : undefined}>
      <iframe
        ref={frameRef}
        className="designer-frame"
        title="Web Designer canvas"
        // Read CANVAS_SANDBOX before changing this. It is load bearing.
        sandbox={CANVAS_SANDBOX}
        srcDoc={props.srcDoc}
        onLoad={onLoad}
        style={props.width ? { width: props.width } : undefined} />
      {props.note && <p className="designer-canvas-note">{props.note}</p>}
      {boxes.hover && <div className="designer-outline hover" style={boxes.hover} />}
      {/*
        * The badge naming what is outlined, and how big it is — the one part
        * of a browser inspector that turns an outline into an identification.
        * It sits above the element, or inside the top when there is no room
        * above, so it is never cut off at the top of the canvas.
        */}
      {boxes.hover && props.hovered && (
        <span
          className="designer-tag"
          style={{
            left: boxes.hover.left,
            top: boxes.hover.top >= 22 ? boxes.hover.top - 22 : boxes.hover.top + 2,
          }}>
          {labelOf(props.hovered)}
          <em>{Math.round(boxes.hover.width)} × {Math.round(boxes.hover.height)}</em>
        </span>
      )}
      {boxes.selected && <div className="designer-outline selected" style={boxes.selected} />}
      {boxes.spot && (
        <div
          className={'designer-drop' + (spot && spot.before === null && boxes.spot.height > 8
            ? ' area' : '')}
          style={boxes.spot} />
      )}
    </div>
  );
}
