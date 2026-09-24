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

import { TOOL_ATTRIBUTE } from './html';

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
  return linkedPaths(doc, origin, 'link[rel~="stylesheet"][href]', 'href');
}

/*
 * The same question asked of scripts.
 *
 * Worth being able to read, and not only to edit: the design canvas never
 * runs a page's JavaScript, but the Live view does, and what runs there is
 * exactly these files. Having them in the same dropdown as the markup means
 * you can read what is about to execute before you execute it — which is only
 * a complete answer for scripts that live here. One loaded from somebody
 * else's server is not in this list, because it is not ours to read.
 */
export function scriptPaths(doc: Document, origin: string): string[] {
  return linkedPaths(doc, origin, 'script[src]', 'src');
}

// Files a page links that live on this cloudlet, as paths under the web root.
function linkedPaths(doc: Document, origin: string, selector: string, attribute: string) {
  const here = new URL(origin).origin;
  return Array.from(doc.querySelectorAll(selector))
    .map(element => new URL(element.getAttribute(attribute) ?? '', origin))
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
 * Addresses inside a stylesheet, made absolute against the file it was read
 * from.
 *
 * The author's CSS is about to be moved out of its own file and into the
 * document, and a relative address means different things in the two places:
 * in the file it is relative to the stylesheet, in the document it is relative
 * to the page. Same text, different image. Anything already carrying a scheme,
 * rooted at the site, or pointing at a fragment already means one thing in
 * both places and is left alone.
 */
const ABSOLUTE = /^(?:[a-z][a-z0-9+.-]*:|[/#])/i;

function resolve(address: string, href: string) {
  return ABSOLUTE.test(address) ? address : new URL(address, href).href;
}

export function absoluteUrls(css: string, href: string): string {
  return css
    .replace(/\burl\(\s*(['"]?)([^'")]+)\1\s*\)/gi,
      (whole, quote, address) => ABSOLUTE.test(address)
        ? whole
        : 'url(' + quote + resolve(address, href) + quote + ')')
    .replace(/@import\s+(['"])([^'"]+)\1/gi,
      (whole, quote, address) => ABSOLUTE.test(address)
        ? whole
        : '@import ' + quote + resolve(address, href) + quote);
}

/*
 * Hands the stylesheet the designer edits over to the designer, so that what
 * the panel holds is the whole truth about it.
 *
 * While a page is being edited the block exists twice: once in the file the
 * canvas linked, as it was last saved, and once in the style element the
 * designer injects from what the panel currently holds. Adding and changing
 * rules works anyway, because the injected copy comes later and wins. Removing
 * one does not — the saved copy is still there, still applying, and the change
 * reads as having been ignored.
 *
 * Deleting the saved copy out of the live sheet would be the small fix, and it
 * is not available: the dashboard is usually served from somewhere other than
 * the cloudlet, which makes the sheet cross-origin and its rules unreadable.
 * So the link is switched off instead and the author's own CSS — everything
 * above and below the fence — is put back into the document in its place, at
 * the link's position so that every other stylesheet still cascades against it
 * in the same order. The injected block is then the only copy of the block
 * there is.
 *
 * The link is left in the document rather than removed, disabled and marked,
 * because it belongs to the file: serializing puts it back exactly as the
 * author wrote it.
 */
export function ownStylesheet(doc: Document, file: string, head: string, tail: string) {
  const link = Array.from(doc.querySelectorAll('link[rel~="stylesheet"][href]'))
    .find(candidate => {
      try {
        return '/etc/www' + new URL((candidate as HTMLLinkElement).href).pathname === file;
      } catch {
        return false;
      }
    }) as HTMLLinkElement | undefined;
  if (!link) {
    return;
  }
  link.setAttribute('data-magic-disabled', '');
  link.disabled = true;

  const next = link.nextElementSibling;
  const author = next?.hasAttribute('data-magic-author')
    ? next
    : link.insertAdjacentElement('afterend', doc.createElement('style'))!;
  author.setAttribute(TOOL_ATTRIBUTE, '');
  author.setAttribute('data-magic-author', '');
  author.textContent = absoluteUrls(head + '\n' + tail, link.href);
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
  const classes = (element.getAttribute('class') ?? '').trim().split(/\s+/).filter(Boolean);
  const tag = element.tagName.toLowerCase();
  /*
   * Widest intent first, then narrower. A class on its own is what people
   * reach for; the same class qualified by this tag is how you reach the
   * buttons that are anchors without touching the ones that are not; the id
   * is this element and nothing else; and the bare tag is every one of these
   * on the page, which is both the broadest and the least often wanted, so it
   * sits below the rest rather than first under the cursor.
   */
  classes.forEach(name => add('.' + name));
  classes.forEach(name => add(tag + '.' + name));
  if (element.id) {
    add('#' + element.id);
  }
  add(tag);
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
