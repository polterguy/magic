import { showToast } from '../lib/toast';
import { useEffect, useRef, useState } from 'react';
import CodeEditor from '../components/CodeEditor';
import OpenAiKeyDialog from '../components/OpenAiKeyDialog';
import { Modal } from '../components/Dialogs';
import { downloadBlob } from '../components/ResultViewer';
import { downloadFileRaw, loadConfig, saveConfig, uploadFile } from '../lib/api';

// Where appsettings.json lives, for the backup download and upload.
const CONFIG_FOLDER = '/config/';
const CONFIG_FILE = 'appsettings.json';

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

export default function Configuration() {

  const [config, setConfig] = useState('');
  const [busy, setBusy] = useState(false);
  const [smtpOpen, setSmtpOpen] = useState(false);
  const [openaiOpen, setOpenaiOpen] = useState(false);
  const [recaptchaOpen, setRecaptchaOpen] = useState(false);
  const uploadInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    reload();
  }, []);

  function reload() {
    loadConfig()
      .then(response => setConfig(JSON.stringify(response, null, 2)))
      .catch(err => setFeedback({ text: err.message, isError: true }));
  }

  async function downloadBackup() {
    setBusy(true);
    try {
      const result = await downloadFileRaw(CONFIG_FOLDER + CONFIG_FILE);
      downloadBlob(result.blob, CONFIG_FILE);
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    } finally {
      setBusy(false);
    }
  }

  /*
   * Restores a backup by writing it back over the live file, so it has to be
   * the real thing — the old dashboard refused anything not named
   * appsettings.json, and uploading the wrong file here breaks the backend.
   */
  async function uploadBackup(file: File) {
    if (file.name !== CONFIG_FILE) {
      setFeedback({ text: 'The file has to be named ' + CONFIG_FILE, isError: true });
      return;
    }
    setBusy(true);
    try {
      await uploadFile(CONFIG_FOLDER, file);
      reload();
      setFeedback({ text: 'Configuration restored from ' + CONFIG_FILE, isError: false });
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    } finally {
      setBusy(false);
    }
  }

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
        <div className="page-title">
          <h1>Configuration</h1>
          <p>Your appsettings.json — be careful, this configures everything</p>
        </div>
        <div className="page-tools">
          <button className="btn btn-secondary" onClick={() => setSmtpOpen(true)}>
            SMTP…
          </button>
          <button className="btn btn-secondary" onClick={() => setOpenaiOpen(true)}>
            OpenAI…
          </button>
          <button className="btn btn-secondary" onClick={() => setRecaptchaOpen(true)}>
            reCAPTCHA…
          </button>
          <button className="btn btn-secondary" onClick={downloadBackup} title="Download a backup of your configuration">
            Download
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => uploadInput.current?.click()}
            disabled={busy}
            title="Restore your configuration from a backup">
            Upload
          </button>
          <input
            ref={uploadInput}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0];
              // Cleared so picking the same file twice fires onChange again.
              e.target.value = '';
              if (file) {
                uploadBackup(file);
              }
            }} />
          <button className="btn" onClick={() => save()} disabled={busy || !config}>
            Save
          </button>
        </div>
      </div>
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
      {recaptchaOpen && (
        <RecaptchaDialog
          config={config}
          onClose={() => setRecaptchaOpen(false)}
          onSave={next => { setRecaptchaOpen(false); save(next); }} />
      )}
      {/*
        * Unlike the others this writes its own key through the OpenAI
        * endpoint rather than patching the JSON, so the editor is reloaded
        * afterwards to pick up what the backend stored.
        */}
      {openaiOpen && (
        <OpenAiKeyDialog
          onClose={() => setOpenaiOpen(false)}
          onSaved={() => {
            setOpenaiOpen(false);
            reload();
            setFeedback({ text: 'OpenAI API key saved', isError: false });
          }} />
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
    <Modal onClose={props.onClose} onSubmit={save}>
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
          <input
            type="text"
            className="secret"
            autoComplete="off"
            value={password}
            onChange={e => setPassword(e.target.value)} />
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

/*
 * Patches magic.auth.recaptcha in the configuration, like the old reCAPTCHA
 * dialog. reCAPTCHA is optional — clearing both fields turns it off.
 */
function RecaptchaDialog(props: {
  config: string;
  onClose: () => void;
  onSave: (config: string) => void;
}) {

  const existing = (() => {
    try {
      return JSON.parse(props.config)?.magic?.auth?.recaptcha ?? {};
    } catch {
      return {};
    }
  })();

  const [key, setKey] = useState(existing.key ?? '');
  const [secret, setSecret] = useState(existing.secret ?? '');

  function save() {
    let parsed: any;
    try {
      parsed = JSON.parse(props.config);
    } catch {
      return;
    }
    parsed.magic = parsed.magic ?? {};
    parsed.magic.auth = parsed.magic.auth ?? {};
    parsed.magic.auth.recaptcha = { key, secret };
    props.onSave(JSON.stringify(parsed, null, 2));
  }

  return (
    <Modal width={560} onClose={props.onClose} onSubmit={save}>
      <h2>reCAPTCHA settings</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Your Google reCAPTCHA v3 keys, from{' '}
        <a href="https://www.google.com/recaptcha/admin" target="_blank" rel="noreferrer">
          the reCAPTCHA admin console
        </a>. Leave both fields empty to turn reCAPTCHA off.
      </p>
      <label className="modal-label">Site key
        <input
          type="text"
          autoComplete="off"
          value={key}
          onChange={e => setKey(e.target.value)} />
      </label>
      <label className="modal-label">Secret key
        <input
          type="text"
          className="secret"
          autoComplete="off"
          value={secret}
          onChange={e => setSecret(e.target.value)} />
      </label>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        <button className="btn" onClick={save}>Save</button>
      </div>
    </Modal>
  );
}
