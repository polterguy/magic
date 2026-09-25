/*
 * The half of the page nobody can point at.
 *
 * The canvas shows the body, so everything that decides how the page is
 * titled in a tab, described in a search result and unfurled in a chat window
 * lives somewhere the designer could not reach. It is also the half that gets
 * forgotten, because a page copied from another one arrives wearing the other
 * one's title and its social image.
 *
 * Reading and writing goes straight at the document in the canvas, like every
 * other edit here, so the head is covered by the same undo and the same save.
 */

// Where a value lives in the head, since they are not all meta tags.
export type Home =
  | { at: 'title' }
  | { at: 'lang' }
  | { at: 'canonical' }
  | { at: 'name'; key: string }
  | { at: 'property'; key: string };

export interface MetaField {
  label: string;
  home: Home;
  control: 'text' | 'textarea' | 'image';
  hint?: string;
  options?: string[];
  // Offers the addresses of this site's own pages as you type.
  links?: boolean;
}

export const GROUPS: { title: string; note?: string; fields: MetaField[] }[] = [
  {
    title: 'Page',
    fields: [
      { label: 'Title', home: { at: 'title' }, control: 'text',
        hint: 'Shown in the browser tab and as the headline in search results.' },
      { label: 'Description', home: { at: 'name', key: 'description' }, control: 'textarea',
        hint: 'The paragraph under the headline in search results.' },
      { label: 'Canonical', home: { at: 'canonical' }, control: 'text', links: true,
        hint: 'The address this page should be indexed under, when more than one reaches it.' },
      { label: 'Language', home: { at: 'lang' }, control: 'text',
        options: ['en', 'en-GB', 'en-US', 'nb', 'de', 'fr', 'es', 'it', 'nl', 'sv', 'da'] },
      /*
       * The suggestions stop short of user-scalable=no and maximum-scale=1,
       * which are the two every copied snippet carries and the two that take
       * pinch zoom away from anybody who needs it. They can still be typed —
       * this is a text field, not a menu — they are just not put in front of
       * someone who is reaching for the ordinary answer.
       */
      { label: 'Viewport', home: { at: 'name', key: 'viewport' }, control: 'text',
        hint: 'How a phone lays the page out. Without it a phone assumes a desktop ' +
          'width and shrinks the result, which is what makes an otherwise fine page ' +
          'arrive as unreadable small print.',
        options: [
          'width=device-width, initial-scale=1',
          'width=device-width, initial-scale=1, viewport-fit=cover',
          'width=1024',
        ] },
    ],
  },
  {
    title: 'Sharing',
    note: 'What a link to this page looks like when it is pasted into a chat, ' +
      'a post or a message. Anything left empty falls back to the page fields above.',
    fields: [
      { label: 'Title', home: { at: 'property', key: 'og:title' }, control: 'text' },
      { label: 'Description', home: { at: 'property', key: 'og:description' }, control: 'textarea' },
      { label: 'Image', home: { at: 'property', key: 'og:image' }, control: 'image',
        hint: 'Wide and at least 1200 pixels across. An absolute address, because it is ' +
          'fetched by somebody else’s server.' },
      { label: 'Address', home: { at: 'property', key: 'og:url' }, control: 'text', links: true },
      { label: 'Type', home: { at: 'property', key: 'og:type' }, control: 'text',
        options: ['website', 'article', 'profile', 'video.other'] },
      { label: 'Card', home: { at: 'name', key: 'twitter:card' }, control: 'text',
        options: ['summary_large_image', 'summary'] },
      { label: 'Card image', home: { at: 'name', key: 'twitter:image' }, control: 'image' },
    ],
  },
];

// The element a field lives in, when there is one.
function holder(doc: Document, home: Home): Element | null {
  switch (home.at) {
    case 'title': return doc.querySelector('head title');
    case 'lang': return doc.documentElement;
    case 'canonical': return doc.querySelector('head link[rel="canonical"]');
    case 'name': return doc.querySelector('head meta[name="' + home.key + '"]');
    case 'property': return doc.querySelector('head meta[property="' + home.key + '"]');
  }
}

export function readMeta(doc: Document, home: Home): string {
  const element = holder(doc, home);
  if (!element) {
    return '';
  }
  switch (home.at) {
    case 'title': return element.textContent ?? '';
    case 'lang': return element.getAttribute('lang') ?? '';
    case 'canonical': return element.getAttribute('href') ?? '';
    default: return element.getAttribute('content') ?? '';
  }
}

/*
 * Writing one of these, creating the tag when it is not there yet and taking
 * it away again when the field is emptied. An empty meta tag says nothing and
 * reads as an oversight, so the absence of a value is expressed as the
 * absence of the tag.
 *
 * The language is the exception: it lives on <html>, which is not ours to
 * remove, so it is only ever set or cleared as an attribute.
 */
export function writeMeta(doc: Document, home: Home, value: string) {
  const trimmed = value.trim();
  const existing = holder(doc, home);

  if (home.at === 'lang') {
    if (trimmed === '') {
      doc.documentElement.removeAttribute('lang');
    } else {
      doc.documentElement.setAttribute('lang', trimmed);
    }
    return;
  }

  if (trimmed === '') {
    existing?.remove();
    return;
  }

  if (existing) {
    if (home.at === 'title') {
      existing.textContent = trimmed;
    } else if (home.at === 'canonical') {
      existing.setAttribute('href', trimmed);
    } else {
      existing.setAttribute('content', trimmed);
    }
    return;
  }

  const head = doc.querySelector('head');
  if (!head) {
    return;
  }
  if (home.at === 'title') {
    const title = doc.createElement('title');
    title.textContent = trimmed;
    head.appendChild(title);
    return;
  }
  if (home.at === 'canonical') {
    const link = doc.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', trimmed);
    head.appendChild(link);
    return;
  }
  const meta = doc.createElement('meta');
  meta.setAttribute(home.at, home.key);
  meta.setAttribute('content', trimmed);
  head.appendChild(meta);
}

export default function Meta(props: {
  doc: Document | null;
  // Absolute origin of the cloudlet, so a preview loads from where the page will.
  origin: string;
  urls: string[];
  onSet: (home: Home, value: string) => void;
  onChooseImage: (home: Home) => void;
}) {

  const doc = props.doc;
  if (!doc) {
    return <p className="designer-empty">No page open.</p>;
  }

  function field(field: MetaField, index: number) {
    const value = readMeta(doc!, field.home);
    const id = 'meta-' + index;

    if (field.control === 'image') {
      return (
        <div className="designer-field" key={id}>
          <span>{field.label}</span>
          <button
            className="designer-image-preview"
            title="Choose an image"
            onClick={() => props.onChooseImage(field.home)}>
            {value === ''
              ? <span className="designer-muted">Nothing chosen</span>
              : <img src={value} alt="" />}
          </button>
          <input
            type="text"
            value={value}
            placeholder="None"
            onChange={event => props.onSet(field.home, event.target.value)} />
          <button
            className="btn btn-secondary"
            onClick={() => props.onChooseImage(field.home)}>
            Choose image…
          </button>
          {field.hint && <p className="designer-note">{field.hint}</p>}
        </div>
      );
    }

    return (
      <label className="designer-field" key={id}>
        <span>{field.label}</span>
        {field.control === 'textarea' ? (
          <textarea
            rows={3}
            value={value}
            placeholder="None"
            onChange={event => props.onSet(field.home, event.target.value)} />
        ) : (
          <input
            type="text"
            list={field.options ? id + '-options' : field.links ? 'designer-page-urls' : undefined}
            value={value}
            placeholder="None"
            onChange={event => props.onSet(field.home, event.target.value)} />
        )}
        {field.options && (
          <datalist id={id + '-options'}>
            {field.options.map(option => <option key={option} value={option} />)}
          </datalist>
        )}
        {field.hint && <p className="designer-note">{field.hint}</p>}
      </label>
    );
  }

  return (
    <div className="designer-fields">
      {/* Absolute, because these are read by other people's servers. */}
      <datalist id="designer-page-urls">
        {props.urls.map(url => <option key={url} value={props.origin + url} />)}
      </datalist>
      {GROUPS.map((group, groupIndex) => (
        <div key={group.title}>
          <div className="designer-meta-group">{group.title}</div>
          {group.note && <p className="designer-note">{group.note}</p>}
          {group.fields.map((one, index) => field(one, groupIndex * 100 + index))}
        </div>
      ))}
    </div>
  );
}
