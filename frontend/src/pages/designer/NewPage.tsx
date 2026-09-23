/*
 * Making a new page.
 *
 * You type a URL, not a file path. The whole tool already speaks in canonical
 * URLs — the picker says "/testing", never "/etc/www/testing.html" — and what
 * anybody actually wants is "a page at /pricing". The file that lands is
 * derived and shown as you type, so the mechanic is visible rather than magic.
 */

import { useState } from 'react';
import { Modal } from '../../components/Dialogs';

export const WEB_ROOT = '/etc/www';

/*
 * The URL as it will be served, tidied. A leading slash is added, a trailing
 * one dropped — "/pricing/" and "/pricing" are the same page, and the trailing
 * form would otherwise turn into a file called "pricing/.html".
 *
 * Only the ends are trimmed. A space in the MIDDLE is refused rather than
 * quietly removed: turning "/pri cing" into "/pricing" behind someone's back
 * is deciding what they meant, and they may well have meant to fix the typo
 * themselves.
 */
export function tidyUrl(input: string) {
  const trimmed = input.trim();
  const withSlash = trimmed.startsWith('/') ? trimmed : '/' + trimmed;
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, '') : withSlash;
}

/*
 * The file a URL becomes. Flat: "/pricing" is "pricing.html", never
 * "pricing/index.html" — both serve the same URL, and the flat form is one
 * file instead of a file and a folder.
 */
export function fileForUrl(url: string) {
  return WEB_ROOT + tidyUrl(url) + '.html';
}

/*
 * Why this URL cannot be used, or null when it can. Everything here is a
 * refusal the backend or the file system would make anyway — better said
 * before the file is written than after.
 */
export function urlProblem(url: string, taken: string[]): string | null {
  const tidy = tidyUrl(url);
  if (tidy === '/') {
    return 'Give the page a name.';
  }
  const segments = tidy.slice(1).split('/');
  if (segments.some(segment => segment === '')) {
    return 'That has an empty step in it — check the slashes.';
  }
  if (segments.some(segment => segment.startsWith('.'))) {
    return 'A name starting with a dot is never served.';
  }
  if (!/^[a-zA-Z0-9\-_/]+$/.test(tidy.slice(1))) {
    return 'Letters, numbers, dashes and underscores only.';
  }
  if (taken.includes(tidy)) {
    return 'There is already a page at ' + tidy + '.';
  }
  return null;
}

// A readable title from the last step of the URL: "/docs/api-keys" → "Api keys".
function titleFor(url: string) {
  const last = tidyUrl(url).split('/').filter(Boolean).pop() ?? 'Page';
  const words = last.replace(/[-_]+/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/*
 * A page with nothing in it but the things every page needs. No stylesheet —
 * blank means blank — and one heading, so the canvas has something to show
 * rather than the "nothing here to design" notice.
 */
export function blankPage(url: string) {
  const title = titleFor(url);
  return '<!doctype html>\n' +
    '<html lang="en">\n' +
    '<head>\n' +
    '<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>' + title + '</title>\n' +
    '</head>\n' +
    '<body>\n' +
    '<h1>' + title + '</h1>\n' +
    '</body>\n' +
    '</html>\n';
}

export default function NewPage(props: {
  // Canonical URLs already in use, so a collision is refused before writing.
  taken: string[];
  // Page file → the URL it is served at, for the "copy of" list.
  pages: { file: string; url: string }[];
  onCancel: () => void;
  onCreate: (file: string, copyFrom: string | null) => void;
}) {

  const [url, setUrl] = useState('/');
  const [copyFrom, setCopyFrom] = useState('');
  const problem = urlProblem(url, props.taken);
  const touched = tidyUrl(url) !== '/';

  function create() {
    if (!problem) {
      props.onCreate(fileForUrl(url), copyFrom === '' ? null : copyFrom);
    }
  }

  return (
    <Modal width={520} onClose={props.onCancel} onSubmit={create}>
      <h2 style={{ marginTop: 0 }}>New page</h2>
      <div className="designer-fields">
        <label className="designer-field">
          <span>URL</span>
          <input
            type="text"
            autoFocus
            value={url}
            placeholder="/pricing"
            onChange={event => setUrl(event.target.value)} />
        </label>

        <label className="designer-field">
          <span>Start from</span>
          <select value={copyFrom} onChange={event => setCopyFrom(event.target.value)}>
            <option value="">A blank page</option>
            {props.pages.map(page => (
              <option key={page.file} value={page.file}>A copy of {page.url}</option>
            ))}
          </select>
        </label>

        <p className="designer-note">
          {touched && problem
            ? problem
            : touched
              ? <>Creates <code>{fileForUrl(url)}</code>, served at <code>{tidyUrl(url)}</code>.</>
              : 'The address the page will be served at.'}
        </p>
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onCancel}>Cancel</button>
        <button className="btn" onClick={create} disabled={!!problem}>Create</button>
      </div>
    </Modal>
  );
}
