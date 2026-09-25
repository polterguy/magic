/*
 * What is wrong with the page, asked of the page itself.
 *
 * Every check here reads the live document rather than the markup, which is
 * the one advantage this tool has over a linter: the tree in the canvas is
 * the tree a browser built, so a heading that skips a level or an id used
 * twice is observed rather than inferred.
 *
 * Nothing is fixed automatically. Each finding selects the element it is
 * about, and what to do next is a decision — an image with no alt text might
 * need a description or might be decorative, and only the person looking at
 * it knows which.
 */

import { canContainChildren } from './html';
import { elementOf, labelOf } from './nodes';

export interface Finding {
  // What kind of problem, for grouping.
  kind: string;
  // What is wrong with this particular one.
  detail: string;
  // The element it is about, so the row can select it. Null for the page.
  node: Node | null;
}

/*
 * Elements whose contents are not the page's contents.
 *
 * Void and raw-text tags are already excluded by canContainChildren, so this
 * is the rest: things that hold something a browser or a script deals with
 * rather than something a reader looks at. An <svg> is here for its whole
 * subtree — its children are drawing instructions, and reporting an empty
 * <path> as a missing paragraph is how a panel like this loses its credit.
 */
const NOT_CONTENT = ['svg', 'math', 'video', 'audio', 'picture', 'object', 'canvas', 'template'];

/*
 * A link that points into this same site, reduced to the address a page would
 * be served at. Anything off-site, or anything with a file extension, is
 * somebody else's problem — and a missing .png would be reported here as a
 * missing page, which is worse than not reporting it.
 */
function internalPath(href: string): string | null {
  if (!href.startsWith('/') || href.startsWith('//')) {
    return null;
  }
  const path = href.split('#')[0].split('?')[0];
  if (path === '' || /\.[a-z0-9]+$/i.test(path)) {
    return null;
  }
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

export function audit(doc: Document, urls: string[]): Finding[] {
  const findings: Finding[] = [];
  const body = doc.body;

  // -- The head, which the canvas cannot show ------------------------------
  if ((doc.querySelector('head title')?.textContent ?? '').trim() === '') {
    findings.push({ kind: 'Page', detail: 'No title. Search results and browser tabs need one.', node: null });
  }
  if (!doc.querySelector('head meta[name="description"]')) {
    findings.push({ kind: 'Page', detail: 'No description. Search results fall back to whatever text they find.', node: null });
  }
  if (!doc.querySelector('head meta[name="viewport"]')) {
    findings.push({ kind: 'Page', detail: 'No viewport. Phones assume a desktop width and shrink the result, which is what turns a page that looks right here into small print on a phone.', node: null });
  }

  // -- Images --------------------------------------------------------------
  body.querySelectorAll('img').forEach(image => {
    if (!image.hasAttribute('alt')) {
      findings.push({
        kind: 'Image',
        detail: 'No alt attribute. Add a description, or alt="" if it is decorative.',
        node: image,
      });
    }
    if (!image.getAttribute('src')) {
      findings.push({ kind: 'Image', detail: 'No source.', node: image });
    }
  });

  // -- Identifiers ---------------------------------------------------------
  const seen = new Map<string, Element>();
  body.querySelectorAll('[id]').forEach(element => {
    const id = element.id;
    if (id === '') {
      return;
    }
    if (seen.has(id)) {
      findings.push({
        kind: 'Duplicate id',
        detail: '"' + id + '" is used more than once. Links to it reach only the first.',
        node: element,
      });
    } else {
      seen.set(id, element);
    }
  });

  // -- Links ---------------------------------------------------------------
  body.querySelectorAll('a').forEach(link => {
    const words = (link.textContent ?? '').trim();
    if (words === '' && !link.getAttribute('aria-label') && !link.getAttribute('title') &&
        !link.querySelector('img, svg')) {
      findings.push({ kind: 'Link', detail: 'Nothing to click and nothing to read.', node: link });
    }
    const href = link.getAttribute('href');
    if (href === null || href.trim() === '') {
      findings.push({ kind: 'Link', detail: 'No address.', node: link });
      return;
    }
    const path = internalPath(href);
    if (path !== null && !urls.includes(path)) {
      findings.push({
        kind: 'Link',
        detail: href + ' does not match any page on this site.',
        node: link,
      });
    }
  });

  // -- Heading order -------------------------------------------------------
  let previous = 0;
  body.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
    const level = Number(heading.tagName.substring(1));
    if (previous !== 0 && level > previous + 1) {
      findings.push({
        kind: 'Headings',
        detail: 'h' + level + ' follows h' + previous + ', skipping a level.',
        node: heading,
      });
    }
    previous = level;
  });
  if (body.querySelectorAll('h1').length > 1) {
    findings.push({ kind: 'Headings', detail: 'More than one h1 on the page.', node: null });
  }

  // -- Elements holding nothing --------------------------------------------
  const opaque = NOT_CONTENT.join(',');
  body.querySelectorAll('*').forEach(element => {
    if (!canContainChildren(element) ||
        NOT_CONTENT.includes(element.tagName.toLowerCase()) ||
        element.closest(opaque) !== null ||
        element.children.length > 0) {
      return;
    }
    if ((element.textContent ?? '').trim() === '') {
      findings.push({ kind: 'Empty', detail: 'Holds nothing at all.', node: element });
    }
  });

  return findings;
}

export default function Quality(props: {
  doc: Document | null;
  urls: string[];
  // Bumped on every edit, so the list is re-read rather than remembered.
  version: number;
  onSelect: (node: Node) => void;
}) {

  if (!props.doc) {
    return <p className="designer-empty">No page open.</p>;
  }
  const findings = audit(props.doc, props.urls);

  if (findings.length === 0) {
    return <p className="designer-empty">Nothing to report. The page checks out.</p>;
  }

  // Grouped by kind, in the order the checks found them.
  const kinds: string[] = [];
  findings.forEach(finding => {
    if (!kinds.includes(finding.kind)) {
      kinds.push(finding.kind);
    }
  });

  return (
    <div className="designer-fields">
      <p className="designer-note">
        {findings.length === 1 ? 'One thing' : findings.length + ' things'} worth a look.
        Nothing here is changed for you.
      </p>
      {kinds.map(kind => (
        <div key={kind}>
          <div className="designer-meta-group">{kind}</div>
          {findings.filter(finding => finding.kind === kind).map((finding, index) => (
            <button
              key={index}
              className="designer-finding"
              disabled={!finding.node}
              title={finding.node ? 'Select it' : 'This is about the page itself'}
              onClick={() => finding.node && props.onSelect(finding.node)}>
              <span className="designer-finding-where">
                {finding.node ? labelOf(elementOf(finding.node) ?? finding.node) : 'Page'}
              </span>
              <span>{finding.detail}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
