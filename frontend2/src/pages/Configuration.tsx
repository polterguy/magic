import { useEffect, useState } from 'react';
import CodeEditor from '../components/CodeEditor';
import { Modal } from '../components/Dialogs';
import { loadConfig, saveConfig } from '../lib/api';

export default function Configuration() {

  const [config, setConfig] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [smtpOpen, setSmtpOpen] = useState(false);

  useEffect(() => {
    loadConfig()
      .then(response => setConfig(JSON.stringify(response, null, 2)))
      .catch(err => setFeedback({ text: err.message, isError: true }));
  }, []);

  async function save(next?: string) {
    const text = next ?? config;
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (err: any) {
      setFeedback({ text: 'Invalid JSON: ' + err.message, isError: true });
      return;
    }
    setBusy(true);
    try {
      await saveConfig(parsed);
      setConfig(JSON.stringify(parsed, null, 2));
      setFeedback({ text: 'Configuration saved', isError: false });
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div>
          <h1>Configuration</h1>
          <p>Your appsettings.json — be careful, this configures everything</p>
        </div>
        <span style={{ flex: 1 }} />
        <button className="btn btn-secondary" onClick={() => setSmtpOpen(true)}>
          SMTP…
        </button>
        <button className="btn" onClick={() => save()} disabled={busy || !config}>
          Save
        </button>
      </div>
      {feedback && (
        <div
          className={feedback.isError ? 'error-box' : 'success-box'}
          style={{ marginBottom: 12 }}>
          {feedback.text}
        </div>
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <CodeEditor
          value={config}
          onChange={setConfig}
          mode="application/json"
          onSave={() => save()} />
      </div>
      {smtpOpen && (
        <SmtpDialog
          config={config}
          onClose={() => setSmtpOpen(false)}
          onSave={next => { setSmtpOpen(false); save(next); }} />
      )}
    </>
  );
}

/*
 * Patches magic.smtp in the configuration, like the old SMTP dialog.
 */
function SmtpDialog(props: {
  config: string;
  onClose: () => void;
  onSave: (config: string) => void;
}) {

  const existing = (() => {
    try {
      return JSON.parse(props.config)?.magic?.smtp ?? {};
    } catch {
      return {};
    }
  })();

  const [host, setHost] = useState(existing.host ?? '');
  const [port, setPort] = useState(String(existing.port ?? 465));
  const [secure, setSecure] = useState(existing.secure !== false);
  const [username, setUsername] = useState(existing.username ?? '');
  const [password, setPassword] = useState(existing.password ?? '');
  const [fromName, setFromName] = useState(existing.from?.name ?? '');
  const [fromAddress, setFromAddress] = useState(existing.from?.address ?? '');

  function save() {
    let parsed: any;
    try {
      parsed = JSON.parse(props.config);
    } catch {
      return;
    }
    parsed.magic = parsed.magic ?? {};
    parsed.magic.smtp = {
      host,
      port: Number(port),
      secure,
      username,
      password,
      from: { name: fromName, address: fromAddress },
    };
    props.onSave(JSON.stringify(parsed, null, 2));
  }

  return (
    <Modal onClose={props.onClose}>
      <h2>SMTP settings</h2>
      <div className="form-grid">
        <label>Host
          <input type="text" value={host} onChange={e => setHost(e.target.value)} />
        </label>
        <label>Port
          <input type="number" value={port} onChange={e => setPort(e.target.value)} />
        </label>
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={secure}
            onChange={e => setSecure(e.target.checked)} />
          Secure (TLS)
        </label>
        <label>Username
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
        </label>
        <label>Password
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </label>
        <label>From name
          <input type="text" value={fromName} onChange={e => setFromName(e.target.value)} />
        </label>
        <label>From address
          <input type="text" value={fromAddress} onChange={e => setFromAddress(e.target.value)} />
        </label>
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        <button className="btn" onClick={save}>Save</button>
      </div>
    </Modal>
  );
}
