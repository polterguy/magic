/*
 * Style edits that land in the page's own stylesheet.
 *
 * The designer never rewrites the stylesheet it was handed. Re-emitting a
 * stylesheet from the CSSOM drops every comment in it and reformats rules the
 * author wrote by hand, which is a rude thing to do to someone's file the
 * first time they nudge a padding.
 *
 * Instead the designer owns one fenced block and only ever rewrites what is
 * inside the fence. Everything outside it — above the opening marker and below
 * the closing one — is returned to disk as the text it arrived as. An override
 * carries the same selector as the rule it is adjusting, so specificity ties
 * and source order decides: the block sits after the author's rules, so the
 * block wins, with no !important anywhere.
 */

/*
 * The block is fenced at BOTH ends. Only what lies between the markers belongs
 * to the designer; everything above the opening one and below the closing one
 * is carried back to disk as text and never parsed. That is what lets someone
 * keep a hand-written media query in the same file without the designer
 * quietly eating it on the next save.
 *
 * The opening marker's text is fixed, because it is how a file written by an
 * earlier version is still recognised. The warning underneath it is re-emitted
 * every save, so it cannot be lost either.
 */
const OPEN = '/* === Web Designer === */';
const CLOSE = '/* === Web Designer end === */';

/*
 * What the fence was called before the tool was renamed. Stylesheets already
 * carrying it are still recognised, and are quietly re-fenced under the new
 * name on the next save — a rename must not turn somebody's existing block
 * into unrecognised author CSS with a second block appended below it.
 */
const OPEN_WAS = '/* === App Designer === */';
const CLOSE_WAS = '/* === App Designer end === */';

// The fence as written by this version or any earlier one.
function findOpen(css: string) {
  const current = css.indexOf(OPEN);
  const previous = css.indexOf(OPEN_WAS);
  if (current === -1 || (previous !== -1 && previous < current)) {
    return { at: previous, marker: OPEN_WAS };
  }
  return { at: current, marker: OPEN };
}

const WARNING = `/* !! WARNING !!  Everything between the marker above and the closing marker
   below is REWRITTEN every time you save from Web Designer. Comments and
   @media blocks put inside this block are deleted, and shorthand properties
   are expanded into their longhand parts.

   Your own CSS is safe ABOVE the opening marker and BELOW the closing one. */`;

// Selector -> declarations, in the order the user set them.
export type Overrides = Record<string, Record<string, string>>;

/*
 * Every stylesheet file a page might be styled by, in the order it links them.
 *
 * Only links pointing back at this cloudlet are candidates — a font or a CDN
 * lives on someone else's server, and nothing here can write to it. Those that
 * remain map onto file paths by prefixing the folder the web root is served
 * from.
 *
 * All of them, not the first: a page linking a shared sheet and a page-specific
 * one is ordinary, and so is a page linking a sheet that was never copied onto
 * this cloudlet. The caller reads down the list until one is actually there.
 */
export function stylesheetPaths(doc: Document, origin: string): string[] {
  const here = new URL(origin).origin;
  return Array.from(doc.querySelectorAll('link[rel~="stylesheet"][href]'))
    .map(link => new URL(link.getAttribute('href') ?? '', origin))
    .filter(url => url.origin === here)
    .map(url => '/etc/www' + url.pathname);
}

/*
 * Parses stylesheet text without applying it to anything. A constructed
 * stylesheet is inert until a document adopts it, which is exactly what is
 * wanted here — the dashboard must not start wearing the page's CSS.
 */
function parse(text: string) {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(text);
  return sheet;
}

/*
 * The selectors in the stylesheet that this element is already styled by, most
 * specific last, offered as targets to edit.
 *
 * Rules carrying a pseudo-class or pseudo-element are left out. ".btn:hover"
 * describes a state the canvas is not in, so editing it there would show no
 * result and teach the user the tool is broken.
 *
 * So is the universal selector, which nearly every stylesheet opens with. It
 * matches everything, so it would be offered for every element ever selected,
 * and taking it up would restyle the entire page from a panel that says it is
 * editing a button.
 */
export function matchingSelectors(css: string, element: Element): string[] {
  const found: string[] = [];
  for (const rule of Array.from(parse(css).cssRules)) {
    if (!(rule instanceof CSSStyleRule) ||
        rule.selectorText.includes(':') ||
        rule.selectorText.trim() === '*') {
      continue;
    }
    if (element.matches(rule.selectorText) && !found.includes(rule.selectorText)) {
      found.push(rule.selectorText);
    }
  }
  return found;
}

/*
 * Every selector worth offering for the element in hand.
 *
 * Asking the stylesheet which of its rules match is not enough, and the gap is
 * the whole point of the panel: a class you have just invented matches nothing
 * yet, so it would never be offered, so you could never write the rule that
 * would make it match. The list therefore starts from the element itself —
 * its own classes, then its id — and only then adds whatever the stylesheet
 * already has for it.
 *
 * The designer's own block is read too. A rule written here lives below the
 * fence rather than in the author's text above it, so without this the class
 * you styled a minute ago would be missing from the list the next time the
 * page was opened, and its rule would sit there uneditable.
 */
export function selectorsFor(
  element: Element,
  css: string,
  overrides: Overrides): string[] {

  const found: string[] = [];
  const add = (selector: string) => {
    if (selector && !found.includes(selector)) {
      found.push(selector);
    }
  };
  (element.getAttribute('class') ?? '').trim().split(/\s+/)
    .filter(Boolean)
    .forEach(name => add('.' + name));
  if (element.id) {
    add('#' + element.id);
  }
  matchingSelectors(css, element).forEach(add);
  Object.keys(overrides)
    .filter(selector => matches(element, selector))
    .forEach(add);
  return found;
}

/*
 * A selector from the block is text that was in a file, so it can be anything
 * — including something this browser will not parse. Asking is how you find
 * out, and an unparseable selector is simply not offered.
 */
function matches(element: Element, selector: string) {
  try {
    return element.matches(selector);
  } catch {
    return false;
  }
}

/*
 * Splits a stylesheet into the author's text above the block, the declarations
 * inside it, and the author's text below it.
 *
 * A file written before the closing marker existed has no [tail], so the block
 * ran to the end of the file. Anything in it that is not a plain style rule —
 * a media query somebody added by hand — is lifted out and returned as tail,
 * so that migrating to the fenced format preserves it instead of dropping it.
 */
export function splitCss(css: string): { head: string; overrides: Overrides; tail: string } {
  const opening = findOpen(css);
  if (opening.at === -1) {
    return { head: css, overrides: {}, tail: '' };
  }
  const head = css.substring(0, opening.at);
  const after = css.substring(opening.at + opening.marker.length);
  // The closing marker matches whichever opening one was found.
  const closeMarker = opening.marker === OPEN ? CLOSE : CLOSE_WAS;
  const close = after.indexOf(closeMarker);
  const body = close === -1 ? after : after.substring(0, close);
  let tail = close === -1 ? '' : after.substring(close + closeMarker.length);

  const overrides: Overrides = {};
  const rescued: string[] = [];
  for (const rule of Array.from(parse(body).cssRules)) {
    if (!(rule instanceof CSSStyleRule)) {
      // Not something the designer writes, so it was put here by a person.
      rescued.push(rule.cssText);
      continue;
    }
    const declarations: Record<string, string> = {};
    for (const property of Array.from(rule.style)) {
      declarations[property] = rule.style.getPropertyValue(property);
    }
    overrides[rule.selectorText] = { ...overrides[rule.selectorText], ...declarations };
  }
  if (rescued.length > 0) {
    tail = rescued.join('\n\n') + (tail.trim() === '' ? '' : '\n\n' + tail);
  }
  return { head, overrides, tail };
}

// The designer's block on its own, for previewing edits inside the canvas.
export function overrideCss(overrides: Overrides): string {
  return Object.entries(overrides)
    .filter(([, declarations]) => Object.keys(declarations).length > 0)
    .map(([selector, declarations]) => selector + ' {\n' +
      Object.entries(declarations)
        .map(([property, value]) => '  ' + property + ': ' + value + ';')
        .join('\n') +
      '\n}')
    .join('\n\n');
}

// The full stylesheet to write back to disk.
export function joinCss(head: string, overrides: Overrides, tail = ''): string {
  const block = overrideCss(overrides);
  const author = head.replace(/\s+$/, '');
  const rest = tail.replace(/^\s+/, '').replace(/\s+$/, '');

  /*
   * No overrides means no block, and therefore no markers — an empty fence in
   * somebody's stylesheet is just litter. What was below the fence simply
   * becomes ordinary author CSS again, in the same order it was already in.
   */
  if (block === '') {
    return [author, rest].filter(part => part !== '').join('\n\n') + '\n';
  }
  return [author, OPEN + '\n' + WARNING + '\n' + block + '\n' + CLOSE, rest]
    .filter(part => part !== '')
    .join('\n\n') + '\n';
}
