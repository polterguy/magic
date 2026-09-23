/*
 * The blocks you can drag onto the canvas.
 *
 * A palette that inserts a bare <button> is close to useless here: the pages
 * this tool edits carry their own hand-written or generated CSS, so an
 * unclassed element lands unstyled next to siblings that look designed, and
 * the user's first impression is that the tool is broken.
 *
 * So the palette reads the page it is about to insert into. Whatever class a
 * page already puts on its buttons is the class a new button gets. Nothing is
 * hardcoded about any particular stylesheet — the page teaches the palette
 * what its own elements look like.
 */

export interface Block {
  key: string;
  label: string;
  // [context] is the element the block is being dropped into.
  build: (doc: Document, context: Element) => string;
}

export interface BlockGroup {
  label: string;
  blocks: Block[];
}

/*
 * The class a new element should wear to look like it belongs.
 *
 * Asked of the place it is being dropped into first. A page's buttons do not
 * all look alike — a nav button and a call to action are different things —
 * but the buttons inside one container almost always do, so the neighbours a
 * block is landing among are the best evidence there is about what it should
 * look like. Drop a button in the sidebar and it arrives as a nav item; drop
 * the same button in the header and it arrives as the primary action.
 *
 * Only when the destination holds nothing of that kind does the question widen
 * to the whole page, and there it takes a majority to count. Page-wide, the
 * commonest class on a tag used in many roles is merely the least rare, and
 * dressing a new container as the least rare kind of container is guessing.
 */
function houseClass(doc: Document, tag: string, context: Element): string {
  const nearby = Array.from(context.querySelectorAll(tag));
  if (nearby.length > 0) {
    return commonest(nearby, 0);
  }
  const everywhere = Array.from(doc.body.querySelectorAll(tag));
  return commonest(everywhere, everywhere.length / 2);
}

// The class most of these elements share, once more of them share it than the
// threshold demands.
function commonest(elements: Element[], threshold: number): string {
  const counts = new Map<string, number>();
  elements.forEach(element => {
    const className = element.getAttribute('class')?.trim();
    if (className) {
      counts.set(className, (counts.get(className) ?? 0) + 1);
    }
  });
  let best = '';
  let bestCount = threshold;
  counts.forEach((count, className) => {
    if (count > bestCount) {
      best = className;
      bestCount = count;
    }
  });
  return best;
}

function attributes(doc: Document, context: Element, tag: string, extra = '') {
  const className = houseClass(doc, tag, context);
  return (className ? ' class="' + className + '"' : '') + extra;
}

/*
 * A grey placeholder that renders as a picture rather than as a broken-image
 * icon, so a dropped image shows its own box while it waits for a real source.
 */
const PLACEHOLDER =
  'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200">' +
    '<rect width="320" height="200" fill="%23d8d8d8"/>' +
    '<path d="M110 130l30-38 24 30 18-20 28 28z" fill="%23fff"/>' +
    '<circle cx="118" cy="74" r="12" fill="%23fff"/></svg>');

/*
 * Most blocks are the bare element and nothing else — the house-style rule
 * above is what makes them land looking right, and inventing structure the
 * user did not ask for is worse than an empty tag.
 *
 * The exceptions are the handful of elements that are genuinely useless
 * empty: a table with no rows, a dropdown with no options, a list with no
 * items, a details with no summary. Those arrive as a working skeleton.
 */
function tag(doc: Document, at: Element, name: string, inner = '', extra = '') {
  return '<' + name + attributes(doc, at, name, extra) + '>' + inner + '</' + name + '>';
}

function empty(doc: Document, at: Element, name: string, extra = '') {
  return '<' + name + attributes(doc, at, name, extra) + '>';
}

function block(key: string, label: string, build: Block['build']): Block {
  return { key, label, build };
}

// A plain element carrying a word or two, so it can be seen once dropped.
function simple(name: string, label: string, inner = ''): Block {
  return block(name, label, (doc, at) => tag(doc, at, name, inner));
}

function field(key: string, label: string, type: string, placeholder?: string): Block {
  return block(key, label, (doc, at) => empty(doc, at, 'input',
    ' type="' + type + '"' + (placeholder ? ' placeholder="' + placeholder + '"' : '')));
}

export const GROUPS: BlockGroup[] = [
  {
    label: 'Text',
    blocks: [
      block('text', '#text', () => 'Some text'),
      ...['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map(name =>
        simple(name, name.toUpperCase(), 'Heading')),
      simple('p', 'Paragraph', 'Some text to edit.'),
      simple('strong', 'Strong', 'Important'),
      simple('em', 'Emphasis', 'Emphasised'),
      simple('span', 'Span', 'Text'),
      simple('code', 'Code', 'code'),
      simple('blockquote', 'Quote', 'Quoted text'),
      simple('pre', 'Preformatted', 'Preformatted text'),
      block('br', 'Line break', (doc, at) => empty(doc, at, 'br')),
    ],
  },
  {
    label: 'Layout',
    blocks: [
      simple('div', 'Container'),
      simple('section', 'Section'),
      simple('header', 'Header'),
      simple('footer', 'Footer'),
      simple('nav', 'Nav'),
      simple('main', 'Main'),
      simple('article', 'Article'),
      simple('aside', 'Aside'),
      simple('figure', 'Figure'),
      simple('figcaption', 'Figure caption', 'Caption'),
      block('hr', 'Divider', (doc, at) => empty(doc, at, 'hr')),
    ],
  },
  {
    label: 'Lists',
    blocks: [
      block('ul', 'Bullet list', (doc, at) => {
        const item = attributes(doc, at, 'li');
        return tag(doc, at, 'ul',
          '<li' + item + '>First item</li><li' + item + '>Second item</li>' +
          '<li' + item + '>Third item</li>');
      }),
      block('ol', 'Numbered list', (doc, at) => {
        const item = attributes(doc, at, 'li');
        return tag(doc, at, 'ol',
          '<li' + item + '>First item</li><li' + item + '>Second item</li>' +
          '<li' + item + '>Third item</li>');
      }),
      simple('li', 'List item', 'Item'),
      block('dl', 'Definition list', (doc, at) =>
        tag(doc, at, 'dl', '<dt>Term</dt><dd>Definition</dd>')),
      simple('dt', 'Term', 'Term'),
      simple('dd', 'Definition', 'Definition'),
    ],
  },
  {
    label: 'Forms',
    blocks: [
      simple('form', 'Form'),
      simple('label', 'Label', 'Label'),
      field('input-text', 'Text field', 'text', 'Text'),
      field('input-email', 'Email', 'email', 'name@example.com'),
      field('input-password', 'Password', 'password'),
      field('input-number', 'Number', 'number'),
      field('input-date', 'Date', 'date'),
      field('input-checkbox', 'Checkbox', 'checkbox'),
      field('input-radio', 'Radio', 'radio'),
      field('input-file', 'File', 'file'),
      field('input-range', 'Range', 'range'),
      block('textarea', 'Text area', (doc, at) =>
        tag(doc, at, 'textarea', '', ' placeholder="Text"')),
      block('select', 'Dropdown', (doc, at) =>
        tag(doc, at, 'select', '<option>First</option><option>Second</option>')),
      simple('option', 'Option', 'Option'),
      simple('button', 'Button', 'Button'),
      simple('fieldset', 'Fieldset'),
      simple('legend', 'Legend', 'Legend'),
    ],
  },
  {
    label: 'Media',
    blocks: [
      block('a', 'Link', (doc, at) => tag(doc, at, 'a', 'Link', ' href="/"')),
      block('img', 'Image', (doc, at) =>
        empty(doc, at, 'img', ' src="' + PLACEHOLDER + '" alt=""')),
      block('video', 'Video', (doc, at) => tag(doc, at, 'video', '', ' controls width="320"')),
      block('audio', 'Audio', (doc, at) => tag(doc, at, 'audio', '', ' controls')),
    ],
  },
  {
    label: 'Table',
    blocks: [
      block('table', 'Table', (doc, at) => tag(doc, at, 'table',
        '<thead><tr><th>First</th><th>Second</th><th>Third</th></tr></thead>' +
        '<tbody><tr><td>Cell</td><td>Cell</td><td>Cell</td></tr>' +
        '<tr><td>Cell</td><td>Cell</td><td>Cell</td></tr></tbody>')),
      simple('thead', 'Head'),
      simple('tbody', 'Body'),
      block('tr', 'Row', (doc, at) => tag(doc, at, 'tr', '<td>Cell</td><td>Cell</td>')),
      simple('th', 'Header cell', 'Heading'),
      simple('td', 'Cell', 'Cell'),
      simple('caption', 'Table caption', 'Caption'),
    ],
  },
  {
    label: 'Interactive',
    blocks: [
      block('details', 'Details', (doc, at) =>
        tag(doc, at, 'details', '<summary>Summary</summary>Hidden until opened.')),
      simple('summary', 'Summary', 'Summary'),
    ],
  },
];

/*
 * The escape hatch. Whatever is not in the groups above — a figcaption inside
 * a picture, a web component, something invented after this was written — is
 * still one typed tag name away.
 */
export function customBlock(name: string): Block | null {
  const tagName = name.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (tagName === '') {
    return null;
  }
  return block('custom:' + tagName, '<' + tagName + '>',
    (doc, at) => tag(doc, at, tagName, ''));
}
