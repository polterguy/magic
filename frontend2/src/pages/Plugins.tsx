import SearchInput from '../components/SearchInput';
import Banner from '../components/Banner';
import { useEffect, useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { Modal, useDialog } from '../components/Dialogs';
import { availablePlugins, installedPlugins, installPlugin } from '../lib/api';

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

export default function Plugins() {

  const [available, setAvailable] = useState<any[]>([]);
  const [installed, setInstalled] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);
  const [installing, setInstalling] = useState<string | null>(null);
  const [details, setDetails] = useState<any>(null);
  const { confirm } = useDialog();

  useEffect(() => {
    availablePlugins()
      .then(list => setAvailable(list ?? []))
      .catch(err => setFeedback({ text: err.message, isError: true }));
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

  async function install(app: any) {
    if (app.type === 'frontend' && !await confirm({
      title: 'Confirm installation',
      message: 'This overwrites all existing frontend files in your /etc/www/ folder. Are you sure?',
      confirmText: 'Yes, install',
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
          <p>Install plugins and modules from the Bazar</p>
        </div>
        <span style={{ flex: 1 }} />
        <SearchInput
          placeholder="Search plugins…"
          value={filter}
          onChange={setFilter}
          style={{ width: 300 }} />
        <span className="muted">{visible.length} shown</span>
      </div>
      {feedback && (
        <Banner
          isError={feedback.isError}
          onClose={() => setFeedback(null)}
          style={{ marginBottom: 12 }}>
          {feedback.text}
        </Banner>
      )}
      <div style={{
        display: 'grid',
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
              {installed.has(app.name) ? (
                <button className="btn btn-secondary btn-small" disabled>Installed</button>
              ) : (
                <button
                  className="btn btn-small"
                  disabled={installing === app.name}
                  onClick={() => install(app)}>
                  {installing === app.name ? 'Installing…' : 'Install'}
                </button>
              )}
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
            {!installed.has(details.name) && (
              <button
                className="btn"
                onClick={() => { const app = details; setDetails(null); install(app); }}>
                Install
              </button>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
