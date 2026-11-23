/*
 * Making a new page.
 *
 * You type a URL, not a file path. The whole tool already speaks in canonical
 * URLs — the picker says "/testing", never "/etc/www/testing.html" — and what
 * anybody actually wants is "a page at /pricing". The file that lands is
 * derived and shown as you type, so the mechanic is visible rather than magic.
 */

import { Modal } from '@shared/ui/Dialogs';
import OptionPill from '@shared/ui/OptionPill';
import { useState } from 'react';

import { fileForUrl, tidyUrl, urlProblem } from '../lib/pageUrls';

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
      <p className="modal-hint">
        The address the page will be served at — type / for the site’s own home page.
      </p>
    );
  }
  if (problem) {
    return <p className="modal-hint">{problem}</p>;
  }
  return (
    <p className="modal-hint">
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
    <Modal
      size="md"
      onClose={props.onCancel}
      onSubmit={create}
      title="New page"
      actions={
        <>
          <button className="btn btn-secondary" onClick={props.onCancel}>
            Cancel
          </button>
          <button className="btn" onClick={create} disabled={!!problem}>
            Create
          </button>
        </>
      }
    >
      <div className="form-grid">
        <label>
          URL{' '}
          <input
            type="text"
            data-initial-focus
            value={url}
            placeholder="/pricing, or / for the home page"
            onChange={event => setUrl(event.target.value)}
          />
        </label>

        <label>
          Start from{' '}
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
          <div className="pill-row">
            <OptionPill
              label="Create a stylesheet for it too"
              checked={addCss}
              onChange={setAddCss}
            />
            <OptionPill label="Create a script for it too" checked={addJs} onChange={setAddJs} />
          </div>
        )}

        <NewPageNote url={url} problem={problem} blank={blank} addCss={addCss} addJs={addJs} />
      </div>
    </Modal>
  );
}
