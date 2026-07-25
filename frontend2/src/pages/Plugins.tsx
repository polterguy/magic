import { useEffect, useMemo, useState } from 'react';
import { useDialog } from '../components/Dialogs';
import { availablePlugins, installedPlugins, installPlugin } from '../lib/api';

export default function Plugins() {

  const [available, setAvailable] = useState<any[]>([]);
  const [installed, setInstalled] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);
  const [installing, setInstalling] = useState<string | null>(null);
  const { confirm } = useDialog();

  useEffect(() => {
    availablePlugins()
      .then(list => setAvailable(list ?? []))
      .catch(err => setFeedback({ text: err.message, isError: true }));
    installedPlugins()
      .then(list => setInstalled(new Set((list ?? []).map((app: any) => app.name))))
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
        <input
          type="text"
          placeholder="Search plugins…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ width: 300 }} />
        <span className="muted">{visible.length} shown</span>
      </div>
      {feedback && (
        <div
          className={feedback.isError ? 'error-box' : 'success-box'}
          style={{ marginBottom: 12 }}>
          {feedback.text}
        </div>
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
            <p className="muted" style={{ flex: 1, marginTop: 8 }}>
              {app.intro || app.description}
            </p>
            <div>
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
    </>
  );
}
