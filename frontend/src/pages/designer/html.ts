/*
 * Turning a file on disk into a design surface, and back again.
 *
 * The canvas is an iframe with "sandbox=allow-same-origin" and no
 * "allow-scripts". That one attribute is what makes the whole designer
 * possible: the page's own JavaScript never runs, so the DOM inside the frame
 * is exactly what the file says and nothing more — no list rendered from an
 * API call, no node that exists only at runtime. Every element you can click
 * has a home in the source. Meanwhile "allow-same-origin" keeps the frame on
 * the dashboard's own origin, so this code reaches straight into
 * contentDocument instead of shouting at an injected agent over postMessage.
 *
 * The consequence to keep in mind: the live document IS the editing model.
 * Edits mutate it directly, and saving serializes it back.
 */

// Elements that cannot have children, so they never get a closing tag.
const VOID = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

/*
 * Elements whose text content is significant to the byte. Reindenting inside
 * them would change what the page does or shows, so their content is copied
 * through untouched.
 */
const RAW = new Set(['script', 'style', 'pre', 'textarea']);

/*
 * Elements that flow inside a line of text. Whitespace between them is
 * rendered, which is why they are never broken apart onto separate lines the
 * way block elements are — doing so would insert or remove real spaces.
 */
const INLINE = new Set([
  'a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'button', 'cite', 'code', 'data',
  'datalist', 'dfn', 'em', 'i', 'img', 'input', 'kbd', 'label', 'map', 'mark',
  'meter', 'noscript', 'object', 'output', 'picture', 'progress', 'q', 'rp',
  'rt', 'ruby', 's', 'samp', 'select', 'slot', 'small', 'span', 'strong',
  'sub', 'sup', 'svg', 'template', 'textarea', 'time', 'u', 'var', 'wbr',
]);

const INDENT = '  ';

/*
 * Anything the designer adds to the document to do its job carries this
 * attribute, and everything carrying it is dropped on the way back out to
 * disk. The user's file never learns that a design tool touched it.
 */
export const TOOL_ATTRIBUTE = 'data-magic-tool';

/*
 * A value the server fills in, and the page shows a hole for.
 *
 * Magic renders a page by evaluating a same-named Hyperlambda file beside it
 * and substituting every {{expression}} in the markup with what that
 * expression returns. The canvas loads the file rather than the URL, so these
 * arrive as literal text — which is exactly how they get typed over and lost,
 * because nothing about a run of words says the server was going to put
 * something there.
 *
 * One predicate, used by every surface that can show one: the canvas, the
 * element's attributes, and the page's head. A value that holds one of these
 * is not yours to replace with a fixed string, and saying so is this
 * attribute's whole job.
 */
const SLOT = /\{\{[^{}]*\}\}/;
export const SLOT_ATTRIBUTE = 'data-magic-slot';
// Set for as long as one is being typed into, which is what turns it amber.
export const SLOT_EDITING = 'data-magic-slot-editing';

export function hasSlot(value: string) {
  return SLOT.test(value);
}

// Said the same way wherever one of these turns up, which is three places.
export const SERVER_FILLED =
  'The server fills this in when the page is served. Editing it here replaces ' +
  'it with fixed text.';

/*
 * What an edit took away, when it replaced a server-filled value with a fixed
 * one. Empty when it did not.
 *
 * Judged on COUNT rather than on identity, so that renaming an expression —
 * a real edit, and a legitimate one — says nothing, while dropping one of two
 * still reports the one that went. Comparing identity alone would call every
 * rename a loss and teach people to ignore the warning.
 */
export function slotsDropped(before: string, after: string): string[] {
  const all = /\{\{[^{}]*\}\}/g;
  const had: string[] = before.match(all) ?? [];
  const now: string[] = after.match(all) ?? [];
  return now.length >= had.length ? [] : had.filter(one => !now.includes(one));
}

export function isSlot(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE &&
    (node as Element).hasAttribute(SLOT_ATTRIBUTE);
}

/*
 * Puts every {{expression}} in the body inside a marked span, so the canvas
 * has something to draw and something to refuse to swallow.
 *
 * Only the body, because the head is not on the canvas and a span in it would
 * be markup the author never wrote. Never inside script, style, pre or
 * textarea: their text is significant to the byte, and an element spliced into
 * the middle of a script is not a highlight, it is a syntax error.
 */
function markSlots(doc: Document) {
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const runs: Text[] = [];
  while (walker.nextNode()) {
    const text = walker.currentNode as Text;
    if (hasSlot(text.data) && !text.parentElement?.closest(Array.from(RAW).join(','))) {
      runs.push(text);
    }
  }
  runs.forEach(text => {
    const pieces = text.data.split(/(\{\{[^{}]*\}\})/);
    const replacement = doc.createDocumentFragment();
    pieces.forEach(piece => {
      if (piece === '') {
        return;
      }
      if (!hasSlot(piece)) {
        replacement.append(piece);
        return;
      }
      const chip = doc.createElement('span');
      chip.setAttribute(SLOT_ATTRIBUTE, '');
      chip.append(piece);
      replacement.append(chip);
    });
    text.replaceWith(replacement);
  });
}

/*
 * Stylesheet the canvas gets on top of the page's own.
 *
 * It is deliberately tiny. Selection outlines and drop indicators are drawn by
 * the parent document on top of the frame, not injected here, so that nothing
 * the designer draws can ever end up in the saved file or disturb the layout
 * being designed.
 */
const CANVAS_CSS = `
/*
 * Reveals an element the page hides. The designer sets the attribute when you
 * ask to see hidden elements; "revert" hands display back to the browser
 * default, and !important is what beats the page's own display:none.
 */
[data-magic-force] { display: revert !important; }

/*
 * Dragging an element should move it, not select the text inside it. Text
 * becomes selectable again only in the element being edited in place.
 */
body { -webkit-user-select: none; user-select: none; }
[contenteditable="true"] {
  -webkit-user-select: text;
  user-select: text;
  outline: none;
  cursor: text;
}

/*
 * The run currently being typed into. Marked so it reads as a mode you are in
 * rather than as a span that appeared in your markup — it is scaffolding, it
 * lasts exactly as long as the edit, and it never reaches the file.
 *
 * The tint carries the marking on pages too light or too dark for an outline
 * alone, and the colour is fixed rather than themed because it has to stand
 * out against the page being designed, not against the dashboard.
 */
[data-magic-editing] {
  outline: 2px solid #35d07f;
  outline-offset: 2px;
  border-radius: 2px;
  background: rgba(53, 208, 127, 0.16);
}

/*
 * A hole the server fills. Drawn as a thing rather than as words, because a
 * thing is not something you type over by accident.
 *
 * Colours are fixed rather than themed for the same reason the editing mark
 * is: this has to stand out against the page being designed, which can be any
 * colour at all, not against the dashboard.
 */
[data-magic-slot] {
  display: inline-block;
  padding: 0 6px;
  border: 1px dashed rgba(120, 130, 150, 0.9);
  border-radius: 4px;
  background: rgba(120, 130, 150, 0.14);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.85em;
  line-height: 1.7;
  white-space: nowrap;
  cursor: text;
}

/*
 * And the same hole while it is being typed into. Amber, because this is the
 * one edit in the tool where the ordinary outcome of typing — replacing what
 * is there with what you meant — is the wrong outcome.
 */
[data-magic-slot][data-magic-slot-editing] {
  border: 1px solid #d98324;
  background: rgba(217, 131, 36, 0.18);
  outline: 2px solid #d98324;
  outline-offset: 2px;
}
`;

/*
 * Builds the document the canvas frame renders.
 *
 * [base] is what makes a page written for the cloudlet work inside a frame
 * belonging to the dashboard. Pages here reference their assets with
 * root-absolute paths — "/taskflow/app.css" — which would otherwise resolve
 * against the dashboard's own origin and 404. It goes first in the head so the
 * stylesheet links after it are resolved against the cloudlet.
 */
export function prepareDocument(source: string, baseHref: string): string {
  const doc = new DOMParser().parseFromString(source, 'text/html');

  const base = doc.createElement('base');
  base.setAttribute('href', baseHref);
  base.setAttribute(TOOL_ATTRIBUTE, '');
  doc.head.prepend(base);

  markSlots(doc);

  const canvas = doc.createElement('style');
  canvas.setAttribute(TOOL_ATTRIBUTE, '');
  canvas.textContent = CANVAS_CSS;
  doc.head.append(canvas);

  /*
   * Style edits aimed at a CSS rule rather than at one element land here so
   * they show up immediately, while the real text is written to the
   * stylesheet file. Last in the head, so it outranks the page's own sheet at
   * equal specificity.
   */
  const overrides = doc.createElement('style');
  overrides.setAttribute(TOOL_ATTRIBUTE, '');
  overrides.setAttribute('data-magic-overrides', '');
  doc.head.append(overrides);

  return '<!doctype html>\n' + doc.documentElement.outerHTML;
}

/*
 * The document as it should look on disk: the designer's own additions
 * removed, and the markup formatted.
 *
 * Formatting is unconditional. The pages this tool is pointed at arrive
 * minified onto lines thousands of characters long, where a diff says only
 * that "line 9 changed" and neither a human nor the Chat Ops agent can see
 * what actually moved. Reformatting once costs a single large diff and makes
 * every diff after it readable.
 */
export function serializeDocument(doc: Document): string {
  const copy = doc.cloneNode(true) as Document;
  /*
   * The span the canvas wraps a run of text in while it is being typed into
   * is UNWRAPPED rather than removed — it is scaffolding around the user's
   * words, not an addition of ours, and deleting it would take the words with
   * it. Committing an edit already takes it out; this is what guarantees it
   * can never reach the file even if one were somehow left behind.
   */
  /*
   * Both of these are UNWRAPPED rather than removed, because each is
   * scaffolding around the author's own text rather than an addition of ours,
   * and deleting one would take the text with it. That is also why the span
   * marking a server-filled value carries no TOOL_ATTRIBUTE: if this unwrap
   * ever failed to run, the sweep below would delete the element and the
   * {{expression}} inside it, where leaving it costs a stray span and nothing
   * more. A visible mess beats a silent loss.
   */
  copy.querySelectorAll('[data-magic-editing], [' + SLOT_ATTRIBUTE + ']')
    .forEach(node => node.replaceWith(...Array.from(node.childNodes)));
  /*
   * A stylesheet the designer took over is switched back on. While editing,
   * its link is disabled and its text lives in an injected style element
   * instead, so that the panel is the only thing describing the designer's
   * block — but the link is the author's, and the file gets it back working.
   */
  copy.querySelectorAll('[data-magic-disabled]')
    .forEach(node => node.removeAttribute('disabled'));
  copy.querySelectorAll('[' + TOOL_ATTRIBUTE + ']').forEach(node => node.remove());
  const out: string[] = [];
  if (copy.doctype) {
    out.push('<!doctype ' + copy.doctype.name + '>');
  }
  writeElement(copy.documentElement, 0, out);
  return out.join('\n') + '\n';
}

/*
 * True when the element's children force it open across several lines. One
 * block-level child is enough: block elements already sit on their own lines
 * when rendered, so putting them on their own lines in the file changes
 * nothing about the page.
 */
function isBlockContext(element: Element) {
  return Array.from(element.children)
    .some(child => !INLINE.has(child.tagName.toLowerCase()));
}

function escapeText(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/*
 * Attributes, minus the ones the designer put there. Values are always
 * quoted, including empty ones — `hidden=""` means the same thing as a bare
 * `hidden` and needs no list of which attributes are allowed to stand alone.
 */
function writeAttributes(element: Element) {
  return Array.from(element.attributes)
    .filter(attribute => !attribute.name.startsWith('data-magic-'))
    .map(attribute => ' ' + attribute.name + '="' +
      attribute.value.replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '"')
    .join('');
}

function openTag(element: Element) {
  return '<' + element.tagName.toLowerCase() + writeAttributes(element) + '>';
}

function closeTag(element: Element) {
  return '</' + element.tagName.toLowerCase() + '>';
}

/*
 * An element and everything in it on a single line, for content that sits
 * inside a line of text.
 */
function oneLine(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeText((node as Text).data).replace(/\s+/g, ' ');
  }
  if (node.nodeType === Node.COMMENT_NODE) {
    return '<!--' + (node as Comment).data + '-->';
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }
  const element = node as Element;
  const tag = element.tagName.toLowerCase();
  if (VOID.has(tag)) {
    return openTag(element);
  }
  if (RAW.has(tag)) {
    return openTag(element) + (element.textContent ?? '') + closeTag(element);
  }
  return openTag(element) + inlineContent(element) + closeTag(element);
}

function inlineContent(element: Element) {
  return Array.from(element.childNodes).map(oneLine).join('');
}

function writeElement(element: Element, depth: number, out: string[]) {
  const pad = INDENT.repeat(depth);
  const tag = element.tagName.toLowerCase();

  if (VOID.has(tag)) {
    out.push(pad + openTag(element));
    return;
  }

  /*
   * A newline after <pre> is swallowed by the parser but a newline before
   * </pre> is not, so these are written on one line however long they get.
   * Script and style have no such rule and keep the author's own indentation.
   */
  if (tag === 'pre' || tag === 'textarea') {
    out.push(pad + openTag(element) + (element.textContent ?? '') + closeTag(element));
    return;
  }
  if (RAW.has(tag)) {
    const text = (element.textContent ?? '').replace(/^\n/, '').replace(/\s+$/, '');
    if (text === '') {
      out.push(pad + openTag(element) + closeTag(element));
      return;
    }
    out.push(pad + openTag(element));
    text.split('\n').forEach(line => out.push(line));
    out.push(pad + closeTag(element));
    return;
  }

  if (isBlockContext(element)) {
    out.push(pad + openTag(element));
    for (const child of Array.from(element.childNodes)) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        writeElement(child as Element, depth + 1, out);
      } else if (child.nodeType === Node.TEXT_NODE) {
        // Whitespace between block elements is only indentation, and is remade
        // by this very function — but real text among them has to survive.
        const text = (child as Text).data.trim();
        if (text !== '') {
          out.push(INDENT.repeat(depth + 1) + escapeText(text).replace(/\s+/g, ' '));
        }
      } else if (child.nodeType === Node.COMMENT_NODE) {
        out.push(INDENT.repeat(depth + 1) + '<!--' + (child as Comment).data + '-->');
      }
    }
    out.push(pad + closeTag(element));
    return;
  }

  /*
   * A run of inline content goes out on one line however long it gets, and is
   * never wrapped. There is no safe place to put a newline here: a break
   * between two inline elements adds a space the reader can see, and a break
   * inside an attribute changes its value. Block nesting is what makes the
   * file readable, and it has already done its work by the time we get here.
   */
  out.push(pad + openTag(element) + inlineContent(element) + closeTag(element));
}

/*
 * Whether an element is allowed to hold children at all. Dropping something
 * into an <img> or into the middle of a <script> is never what was meant.
 */
/*
 * The canvas sandbox, as one value so it cannot drift.
 *
 * The missing token is the important one. allow-same-origin gives the frame
 * THIS page's origin, which is what lets the designer read and write the
 * document at all — so adding allow-scripts beside it would hand every page
 * being edited, including one somebody else wrote, full run of the dashboard:
 * its storage, its token, its API calls. The whole design rests on untrusted
 * markup never executing, and this attribute is the only thing enforcing it.
 *
 * There is a test asserting this exact string. If you are here to make some
 * page "preview properly", the Live view is where a page is allowed to run.
 */
export const CANVAS_SANDBOX = 'allow-same-origin';

/*
 * The Live sandbox, which depends on where the dashboard is served from.
 *
 * Live runs the page for real, so it keeps allow-scripts. What it never
 * keeps is the ability to navigate the top frame: a previewed page that can
 * retarget the whole tab can put a convincing login screen in front of you,
 * and no preview needs that.
 *
 * [sameOrigin] is the all-in-one case, where the dashboard is served from the
 * very cloudlet whose pages are being edited. There, allow-same-origin would
 * hand the frame the dashboard's own origin — token included — so it is
 * dropped, and the page runs in an opaque origin instead. Its own storage and
 * same-origin calls stop working, which is a real cost, and the alternative
 * is letting an edited page read the session that is editing it.
 */
export function liveSandbox(sameOrigin: boolean): string {
  const tokens = ['allow-scripts', 'allow-forms', 'allow-popups'];
  if (!sameOrigin) {
    tokens.splice(1, 0, 'allow-same-origin');
  }
  return tokens.join(' ');
}

export function canContainChildren(element: Element) {
  const tag = element.tagName.toLowerCase();
  return !VOID.has(tag) && !RAW.has(tag);
}
