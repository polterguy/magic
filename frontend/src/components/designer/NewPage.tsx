/*
 * Making a new page.
 *
 * You type a URL, not a file path. The whole tool already speaks in canonical
 * URLs — the picker says "/testing", never "/etc/www/testing.html" — and what
 * anybody actually wants is "a page at /pricing". The file that lands is
 * derived and shown as you type, so the mechanic is visible rather than magic.
 */

import { useState } from 'react';

import { Modal } from '../Dialogs';
import { fileForUrl, tidyUrl, urlProblem } from './pageUrls';

// What will happen on Create, or what is wrong with the address typed.
function NewPageNote(
  props: Readonly<{
    url: string;
    problem: ReturnType<typeof urlProblem>;
    blank: boolean;
    addCss: boolean;
    addJs: boolean;
  }>,
) {
  const { url, problem, blank, addCss, addJs } = props;
  if (url.trim() === '') {
    return (
      <p className="designer-note">
        The address the page will be served at — type / for the site’s own home page.
      </p>
    );
  }
  if (problem) {
    return <p className="designer-note">{problem}</p>;
  }
  return (
    <p className="designer-note">
      Creates <code>{fileForUrl(url)}</code>, served at <code>{tidyUrl(url)}</code>.
      {blank && (addCss || addJs) && (
        <>
          {' '}
          And{' '}
          <code>
            {tidyUrl(url)}
            {addCss ? '.css' : ''}
            {addCss && addJs ? ' / ' : ''}
            {addJs ? '.js' : ''}
          </code>
          {', linked from it.'}
        </>
      )}
    </p>
  );
}

export default function NewPage(
  props: Readonly<{
    // Canonical URLs already in use, so a collision is refused before writing.
    taken: string[];
    // Page file → the URL it is served at, for the "copy of" list.
    pages: { file: string; url: string }[];
    onCancel: () => void;
    onCreate: (
      file: string,
      copyFrom: string | null,
      companions: { css: boolean; js: boolean },
    ) => void;
  }>,
) {
  // Empty, not "/" — "/" is now itself a real, meaningful answer (the home
  // page), so it can no longer also stand for "nothing typed yet".
  const [url, setUrl] = useState('');
  const [copyFrom, setCopyFrom] = useState('');
  /*
   * On by default. A stylesheet is what lets the Style panel write a class
   * rule at all rather than only ever an inline one, and a script is what
   * the App blocks in the palette require before they will even come off
   * the rail — leaving both off is a choice worth making on purpose, not the
   * quiet default a blank page used to leave you in.
   */
  const [addCss, setAddCss] = useState(true);
  const [addJs, setAddJs] = useState(true);
  const problem = urlProblem(url, props.taken);
  // A copy brings its own files, if it has any — these are for a blank page only.
  const blank = copyFrom === '';

  function create() {
    if (!problem) {
      props.onCreate(fileForUrl(url), blank ? null : copyFrom, {
        css: blank && addCss,
        js: blank && addJs,
      });
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
            placeholder="/pricing, or / for the home page"
            onChange={event => setUrl(event.target.value)}
          />
        </label>

        <label className="designer-field">
          <span>Start from</span>
          <select value={copyFrom} onChange={event => setCopyFrom(event.target.value)}>
            <option value="">A blank page</option>
            {props.pages.map(page => (
              <option key={page.file} value={page.file}>
                A copy of {page.url}
              </option>
            ))}
          </select>
        </label>

        {blank && (
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={addCss}
              onChange={event => setAddCss(event.target.checked)}
            />{' '}
            Create a stylesheet for it too
          </label>
        )}
        {blank && (
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={addJs}
              onChange={event => setAddJs(event.target.checked)}
            />{' '}
            Create a script for it too
          </label>
        )}

        <NewPageNote url={url} problem={problem} blank={blank} addCss={addCss} addJs={addJs} />
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onCancel}>
          Cancel
        </button>
        <button className="btn" onClick={create} disabled={!!problem}>
          Create
        </button>
      </div>
    </Modal>
  );
}
