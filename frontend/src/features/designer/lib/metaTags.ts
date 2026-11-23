/*
 * Reading and writing the values in a page's head that the Meta panel edits.
 * Lives apart from Meta.tsx so that file only exports its component.
 */

// Where a value lives in the head, since they are not all meta tags.
export type Home =
  | { at: 'title' }
  | { at: 'lang' }
  | { at: 'canonical' }
  | { at: 'name'; key: string }
  | { at: 'property'; key: string };

// The element a field lives in, when there is one.
function holder(doc: Document, home: Home): Element | null {
  switch (home.at) {
    case 'title':
      return doc.querySelector('head title');
    case 'lang':
      return doc.documentElement;
    case 'canonical':
      return doc.querySelector('head link[rel="canonical"]');
    case 'name':
      return doc.querySelector('head meta[name="' + home.key + '"]');
    case 'property':
      return doc.querySelector('head meta[property="' + home.key + '"]');
  }
}

export function readMeta(doc: Document, home: Home): string {
  const element = holder(doc, home);
  if (!element) {
    return '';
  }
  switch (home.at) {
    case 'title':
      return element.textContent ?? '';
    case 'lang':
      return element.getAttribute('lang') ?? '';
    case 'canonical':
      return element.getAttribute('href') ?? '';
    default:
      return element.getAttribute('content') ?? '';
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
    head.append(title);
    return;
  }
  if (home.at === 'canonical') {
    const link = doc.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', trimmed);
    head.append(link);
    return;
  }
  const meta = doc.createElement('meta');
  meta.setAttribute(home.at, home.key);
  meta.setAttribute('content', trimmed);
  head.append(meta);
}
