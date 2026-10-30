/*
 * The one tab here that is not about the page open in the canvas.
 *
 * Every other tab reads and writes the document in the canvas — this one
 * reads and writes /etc/www/.config, a single file that governs the whole
 * cloudlet regardless of which page happens to be open. Picking a different
 * page from the toolbar does nothing to what is shown here, which is also
 * why this tab fetches and saves on its own rather than going through the
 * same mutate()/undo/save cycle as the rest of the designer.
 *
 * It only ever touches three things in that file — spa_enabled, not_found,
 * redirects — because that is all the backend root-gated config.get.hl /
 * config.put.hl endpoints expose. Everything else already in the file
 * (static_files/headers and anything hand-added) never reaches this tab at
 * all, and the save endpoint is the one responsible for leaving it alone.
 */

import { useEffect, useState } from 'react';
import { listFilesRecursively, loadWebsiteConfig, saveWebsiteConfig, WebsiteRedirect } from '../../lib/api';
import { showToast } from '../../lib/toast';
import { TrashIcon } from '../../components/Icons';
import { WEB_ROOT } from './NewPage';

// What the backend actually needs is always this plus ".html" - nobody
// editing this tab thinks of a page as a file with an extension, so neither
// autocomplete list, nor what gets typed into either field, is ever allowed
// to carry one.
function stripHtmlExt(value: string) {
  return value.replace(/\.html?$/i, '');
}

function redirectIsValid(entry: WebsiteRedirect) {
  return entry.from.trim() !== '' && entry.to.trim() !== '';
}

// Stripping an extension only makes sense for one of THIS site's own
// addresses - an external destination's own ".html" is part of someone
// else's real URL, not a slip a user made typing one of ours.
function stripOwnPageExt(value: string) {
  return /^https?:\/\//i.test(value) ? value : stripHtmlExt(value);
}

export default function Website(props: {
  // Every page this site serves, already the designer's usual canonical
  // form ("/pricing", not "/etc/www/pricing.html") - the same list Meta and
  // Quality already get. Hidden folders, .well-known included, are already
  // excluded from this by the same rule that keeps them out of the page
  // picker everywhere else.
  urls: string[];
}) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);

  const [spaEnabled, setSpaEnabled] = useState(false);
  const [notFound, setNotFound] = useState('');
  const [redirects, setRedirects] = useState<WebsiteRedirect[]>([]);
  // Whatever was last read from, or written to, the server — compared
  // against the fields above to know whether there is anything to save.
  const [saved, setSaved] = useState<{ spaEnabled: boolean; notFound: string; redirects: WebsiteRedirect[] } | null>(null);

  /*
   * Every .html file actually on the cloudlet, extension stripped, as
   * suggestions for the 404 field - not the canonical-URL [props.urls] list,
   * which deliberately leaves out anything under a hidden folder. A custom
   * 404 page routinely lives at exactly such a path
   * (/etc/www/.components/404.html is the server's own convention), so
   * excluding every hidden folder here would hide the one place this field
   * is actually meant to point at. .well-known is the one hidden folder
   * excluded anyway - OAuth/standards metadata, never a 404 page or a
   * redirect target.
   */
  const [htmlFiles, setHtmlFiles] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadWebsiteConfig()
      .then(config => {
        if (cancelled) {
          return;
        }
        const normalised = {
          spaEnabled: config.spa_enabled,
          notFound: stripHtmlExt(config.not_found),
          redirects: config.redirects ?? [],
        };
        setSpaEnabled(normalised.spaEnabled);
        setNotFound(normalised.notFound);
        setRedirects(normalised.redirects);
        setSaved(normalised);
      })
      .catch(() => setLoadError(true))
      .finally(() => { if (!cancelled) setLoading(false); });
    listFilesRecursively(WEB_ROOT, false)
      .then(files => {
        if (!cancelled) {
          setHtmlFiles(files
            .filter(file => /\.html?$/i.test(file) && !file.includes('/.well-known/'))
            .map(stripHtmlExt)
            .sort((a, b) => a.localeCompare(b)));
        }
      })
      .catch(() => { /* Autocomplete is a convenience - the field still works typed by hand. */ });
    return () => { cancelled = true; };
  }, []);

  const dirty = !saved || saved.spaEnabled !== spaEnabled || saved.notFound !== notFound ||
    JSON.stringify(saved.redirects) !== JSON.stringify(redirects);
  // Stacking a second blank row on top of one nobody has filled in yet
  // would just be more rows to abandon - finish the one that is there first.
  const canAddRedirect = redirects.every(redirectIsValid);

  function addRedirect() {
    setRedirects(list => [...list, { from: '', to: '' }]);
  }

  function updateRedirect(index: number, field: 'from' | 'to', value: string) {
    setRedirects(list => list.map((entry, i) => i === index ? { ...entry, [field]: value } : entry));
  }

  function removeRedirect(index: number) {
    setRedirects(list => list.filter((_, i) => i !== index));
  }

  async function save() {
    setSaving(true);
    try {
      // Blank rows are never meant as real redirects, just an unfinished add.
      const cleaned = redirects.filter(redirectIsValid);
      const notFoundTrimmed = notFound.trim();
      await saveWebsiteConfig({
        spa_enabled: spaEnabled,
        // The one place the extension comes back - the backend's own
        // not_found is a real file path, and a file by that name always
        // ends in .html. Left alone when empty: "" plus ".html" is not a
        // sibling file, it is a typo.
        not_found: notFoundTrimmed === '' ? '' : notFoundTrimmed + '.html',
        redirects: cleaned,
      });
      setRedirects(cleaned);
      setSaved({ spaEnabled, notFound: notFoundTrimmed, redirects: cleaned });
      setNotFound(notFoundTrimmed);
      showToast('Saved the website configuration');
    } catch (err: any) {
      showToast(err.message, true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="designer-empty">Loading…</p>;
  }
  if (loadError) {
    return <p className="designer-empty">Could not load the website configuration.</p>;
  }

  return (
    <div className="designer-fields">
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={spaEnabled}
          onChange={event => setSpaEnabled(event.target.checked)} />
        Serve this site as a single-page app
      </label>
      <p className="designer-note">
        Applies to the WHOLE cloudlet, not just the page open right now — every URL this site
        cannot otherwise resolve falls back to serving /index.html, rather than a 404. Turning
        this on while the site also has ordinary, separate pages means a mistyped or removed
        page's URL silently serves the home page instead of failing loudly.
      </p>

      <label className="designer-field">
        <span>Custom 404 page</span>
        <input
          type="text"
          list="website-not-found-options"
          value={notFound}
          placeholder="/etc/www/.components/404"
          onChange={event => setNotFound(stripHtmlExt(event.target.value))} />
        <datalist id="website-not-found-options">
          {htmlFiles.map(file => <option key={file} value={file} />)}
        </datalist>
      </label>
      <p className="designer-note">
        A file path under /etc/www/, not a page URL — the default above is served if this is
        left empty. No extension here, same as a page's own address — it is added back
        automatically.
      </p>

      <div className="designer-field">
        <span>Redirects</span>
        {redirects.map((redirect, index) => (
          <div key={index} className="designer-redirect-row">
            <input
              type="text"
              value={redirect.from}
              placeholder="/old-page"
              onChange={event => updateRedirect(index, 'from', event.target.value)} />
            <input
              type="text"
              list="website-redirect-to-options"
              value={redirect.to}
              placeholder="/new-page or https://…"
              onChange={event => updateRedirect(index, 'to', stripOwnPageExt(event.target.value))} />
            <button
              className="icon-btn"
              title="Remove this redirect"
              onClick={() => removeRedirect(index)}>
              <TrashIcon />
            </button>
          </div>
        ))}
        <datalist id="website-redirect-to-options">
          {props.urls.map(url => <option key={url} value={url} />)}
        </datalist>
        <button
          className="btn btn-secondary btn-small"
          onClick={addRedirect}
          disabled={!canAddRedirect}
          title={canAddRedirect ? undefined : 'Finish the redirect above first — both its fields need a value'}>
          Add a redirect
        </button>
      </div>

      <div className="modal-actions">
        <button className="btn" onClick={save} disabled={!dirty || saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}
