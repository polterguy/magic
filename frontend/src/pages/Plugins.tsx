import { showToast } from '../lib/toast';
import SearchInput from '../components/SearchInput';
import { useEffect, useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { Modal, useDialog } from '../components/Dialogs';
import { servedByBackend } from '../lib/backend';
import {
  availablePlugins,
  installModule,
  installedPlugins,
  installPlugin,
  moduleNameFromZip,
} from '../lib/api';

/*
 * Descriptions come from the Bazar's manifests, which are markdown, so they
 * have to be rendered as HTML rather than escaped as text — which makes them
 * the one place in the dashboard where remote content reaches the DOM as
 * markup. Markdown permits raw HTML, so a manifest can carry a script tag or
 * an onerror attribute, and every description is put through this first.
 */
function safeHtml(description: string) {
  return DOMPurify.sanitize(marked.parse(description ?? '') as string);
}

// Card intro: render the markdown description, extract its plain text, and
// show the first sentence, capped at 150 characters.
function intro(description: string) {
  /*
   * Parsed into an inert document rather than assigned to an element's
   * innerHTML: an inert document neither runs scripts nor fetches anything,
   * so an <img onerror> can't fire while we're only after the text.
   */
  const parsed = new DOMParser().parseFromString(safeHtml(description), 'text/html');
  const text = (parsed.body.textContent ?? '').replace(/\s+/g, ' ').trim();
  const period = text.indexOf('.');
  const sentence = period === -1 ? text : text.substring(0, period + 1);
  return sentence.length > 150 ? sentence.substring(0, 150) + '…' : sentence;
}

/*
 * Notifications go to the toast stack. An inline banner is part of the page,
 * so showing one pushed everything below it down — the editors and grids
 * jumped under the pointer. Toasts float above the page instead.
 */
function setFeedback(value: { text: string; isError: boolean } | null) {
  if (value) {
    showToast(value.text, value.isError);
  }
}

export default function Plugins() {

  const [available, setAvailable] = useState<any[]>([]);
  // The Bazar listing is a slow remote call, so we show a spinner until it lands.
  const [loading, setLoading] = useState(true);
  const [installed, setInstalled] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('');
  const [installing, setInstalling] = useState<string | null>(null);
  const [details, setDetails] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const { confirm } = useDialog();

  /*
   * Frontends unzip straight into /etc/www. When this cloudlet also serves
   * the dashboard from there, installing one would land on top of it - so
   * they are refused here rather than breaking the dashboard the user is
   * standing in. Nothing is overwritten either way.
   */
  const frontendsBlocked = servedByBackend();
  const blockedReason = 'This cloudlet serves the dashboard from /etc/www, so '
    + 'installing a frontend would overwrite it';

  useEffect(() => {
    availablePlugins()
      .then(list => setAvailable(list ?? []))
      .catch(err => setFeedback({ text: err.message, isError: true }))
      .finally(() => setLoading(false));
    installedPlugins()
      // A manifest's module_name is the folder it installed into, which is
      // what the Bazar calls the plugin — its name is a friendlier label.
      .then(list => setInstalled(new Set((list ?? []).map((app: any) => app.module_name))))
      .catch(() => {});
  }, []);

  const visible = useMemo(() => {
    const query = filter.toLowerCase();
    return available.filter(app =>
      !query ||
      app.name?.toLowerCase().includes(query) ||
      app.type?.toLowerCase().includes(query) ||
      app.description?.toLowerCase().includes(query));
  }, [available, filter]);

  /*
   * A module of your own, as a ZIP, rather than one from the Bazar. Same
   * endpoint Hyper IDE uses — the archive's name becomes the module folder,
   * so an existing module of that name is overwritten.
   */
  async function installFromFile(file: File) {
    const name = moduleNameFromZip(file);
    if (!name) {
      setFeedback({
        text: file.name + ' cannot be a module — the archive must be named ' +
          '<name>.zip, using only lowercase letters, digits, hyphens or ' +
          'underscores, and no further dots',
        isError: true,
      });
      return;
    }
    if (installed.has(name) && !await confirm({
      title: 'Overwrite ' + name + '?',
      message: 'A module called ' + name + ' is already installed. Installing ' +
        'this archive replaces its files.',
      confirmText: 'Yes, overwrite',
      danger: true,
    })) {
      return;
    }
    setUploading(true);
    try {
      await installModule(file);
      setFeedback({ text: 'Module ' + name + ' installed', isError: false });
      const list = await installedPlugins();
      setInstalled(new Set((list ?? []).map((app: any) => app.module_name)));
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    } finally {
      setUploading(false);
    }
  }

  async function install(app: any) {
    const again = installed.has(app.name);
    if (app.type === 'frontend' && !await confirm({
      title: 'Confirm installation',
      message: 'This overwrites all existing frontend files in your /etc/www/ folder. Are you sure?',
      confirmText: 'Yes, install',
      danger: true,
    })) {
      return;
    }
    /*
     * Reinstalling is how a plugin is updated, so it stays available — but
     * it overwrites the module's files, which takes any local edits with it.
     */
    if (again && app.type !== 'frontend' && !await confirm({
      title: 'Reinstall ' + app.name + '?',
      message: 'This overwrites the files in the module with the Bazar\'s current ' +
        'version. Any changes you have made to them are lost.',
      confirmText: 'Yes, reinstall',
      danger: true,
    })) {
      return;
    }
    setInstalling(app.name);
    try {
      await installPlugin(app);
      setFeedback({
        text: app.name + ' is installing — you will be notified when it completes',
        isError: false,
      });
      setInstalled(current => new Set(current).add(app.name));
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    } finally {
      setInstalling(null);
    }
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div>
          <h1>Plugins</h1>
          <p>Install plugins and modules from the Bazar, or your own from a ZIP file</p>
        </div>
        <span style={{ flex: 1 }} />
        <label className={'btn btn-secondary' + (uploading ? ' disabled' : '')}>
          {uploading ? 'Installing…' : 'Install from file…'}
          <input
            type="file"
            accept=".zip"
            style={{ display: 'none' }}
            disabled={uploading}
            onChange={e => {
              const file = e.target.files?.[0];
              // Cleared so picking the same archive twice fires again.
              e.target.value = '';
              if (file) {
                installFromFile(file);
              }
            }} />
        </label>
        <SearchInput
          placeholder="Search plugins…"
          value={filter}
          onChange={setFilter}
          style={{ width: 300 }} />
        <span className="muted">{visible.length} shown</span>
      </div>
      {loading && (
        <div className="spinner-panel">
          <div className="spinner" />
          <span className="muted">Loading plugins from the Bazar…</span>
        </div>
      )}
      <div style={{
        display: loading ? 'none' : 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 14,
      }}>
        {visible.map(app => (
          <div className="card" key={app.name} style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <strong style={{ flex: 1 }}>{app.name}</strong>
              <span className="badge badge-info">{app.type}</span>
            </div>
            <p className="muted line-clamp" style={{ flex: 1, marginTop: 8 }}>
              {intro(app.description)}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-secondary btn-small"
                onClick={() => setDetails(app)}>
                Details
              </button>
              <button
                className={'btn btn-small' + (installed.has(app.name) ? ' btn-secondary' : '')}
                disabled={installing === app.name
                  || (frontendsBlocked && app.type === 'frontend')}
                title={frontendsBlocked && app.type === 'frontend'
                  ? blockedReason
                  : installed.has(app.name)
                    ? 'Install the Bazar\'s current version over the one you have'
                    : undefined}
                onClick={() => install(app)}>
                {installing === app.name
                  ? 'Installing…'
                  : installed.has(app.name) ? 'Reinstall' : 'Install'}
              </button>
            </div>
          </div>
        ))}
      </div>
      {details && (
        <Modal width={700} onClose={() => setDetails(null)}>
          <h2>{details.name}</h2>
          <div
            className="markdown-body"
            style={{ maxHeight: '60vh', overflowY: 'auto' }}
            dangerouslySetInnerHTML={{ __html: safeHtml(details.description) }} />
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setDetails(null)}>Close</button>
            <button
              className="btn"
              disabled={frontendsBlocked && details.type === 'frontend'}
              title={frontendsBlocked && details.type === 'frontend' ? blockedReason : undefined}
              onClick={() => { const app = details; setDetails(null); install(app); }}>
              {installed.has(details.name) ? 'Reinstall' : 'Install'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
