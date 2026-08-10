import { copyToClipboard, showToast } from '../lib/toast';
import { useEffect, useRef, useState } from 'react';
import CodeEditor from '../components/CodeEditor';
import OpenAiKeyDialog from '../components/OpenAiKeyDialog';
import Select from '../components/Select';
import { Modal } from '../components/Dialogs';
import { MenuIcon } from '../components/Icons';
import { downloadBlob } from '../components/ResultViewer';
import { downloadFileRaw, http, loadConfig, saveConfig, uploadFile } from '../lib/api';

// Where appsettings.json lives, for the backup download and upload.
const CONFIG_FOLDER = '/config/';
const CONFIG_FILE = 'appsettings.json';

export default function Configuration() {

  const [config, setConfig] = useState('');
  const [busy, setBusy] = useState(false);
  const [smtpOpen, setSmtpOpen] = useState(false);
  const [openaiOpen, setOpenaiOpen] = useState(false);
  const [recaptchaOpen, setRecaptchaOpen] = useState(false);
  const [gitOpen, setGitOpen] = useState(false);
  const [openidOpen, setOpenidOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const uploadInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    reload();
  }, []);

  function reload() {
    loadConfig()
      .then(response => setConfig(JSON.stringify(response, null, 2)))
      .catch(err => showToast(err.message, true));
  }

  async function downloadBackup() {
    setBusy(true);
    try {
      const result = await downloadFileRaw(CONFIG_FOLDER + CONFIG_FILE);
      downloadBlob(result.blob, CONFIG_FILE);
    } catch (err: any) {
      showToast(err.message, true);
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
      showToast('The file has to be named ' + CONFIG_FILE, true);
      return;
    }
    setBusy(true);
    try {
      await uploadFile(CONFIG_FOLDER, file);
      reload();
      showToast('Configuration restored from ' + CONFIG_FILE);
    } catch (err: any) {
      showToast(err.message, true);
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
      showToast('Invalid JSON: ' + err.message, true);
      return;
    }
    setBusy(true);
    try {
      await saveConfig(parsed);
      setConfig(JSON.stringify(parsed, null, 2));
      showToast('Configuration saved');
    } catch (err: any) {
      showToast(err.message, true);
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
          {/*
            * The individual settings dialogs and backup actions live in one
            * hamburger menu — six buttons crowded the header.
            */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-secondary"
              aria-haspopup="menu"
              aria-expanded={toolsOpen}
              title="Settings dialogs and backup"
              onClick={() => setToolsOpen(!toolsOpen)}>
              <MenuIcon />
            </button>
            {toolsOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 2000001 }}
                  onClick={() => setToolsOpen(false)} />
                <ul
                  className="select-menu"
                  role="menu"
                  style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, minWidth: 220 }}>
                  {[
                    { label: 'SMTP', act: () => setSmtpOpen(true) },
                    { label: 'OpenAI', act: () => setOpenaiOpen(true) },
                    { label: 'reCAPTCHA', act: () => setRecaptchaOpen(true) },
                    { label: 'OpenID', act: () => setOpenidOpen(true) },
                    { label: 'Git', act: () => setGitOpen(true) },
                    { label: 'Download backup', act: downloadBackup },
                    { label: 'Upload backup', act: () => uploadInput.current?.click() },
                  ].map(item => (
                    <li
                      key={item.label}
                      className="select-option"
                      role="menuitem"
                      onClick={() => { setToolsOpen(false); item.act(); }}>
                      {item.label}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
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
      {gitOpen && (
        <GitDialog
          config={config}
          onClose={() => setGitOpen(false)}
          onSave={next => { setGitOpen(false); save(next); }} />
      )}
      {openidOpen && (
        <OpenIdDialog
          config={config}
          onClose={() => setOpenidOpen(false)}
          onSave={next => { setOpenidOpen(false); save(next); }} />
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
            showToast('OpenAI API key saved');
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
 * Patches magic.git.github in the configuration — the credentials Hyper IDE's
 * Git support authenticates with towards GitHub.
 */
function GitDialog(props: {
  config: string;
  onClose: () => void;
  onSave: (config: string) => void;
}) {

  const existing = (() => {
    try {
      return JSON.parse(props.config)?.magic?.git?.github ?? {};
    } catch {
      return {};
    }
  })();

  const [username, setUsername] = useState(existing.username ?? '');
  const [token, setToken] = useState(existing.token ?? '');
  const [host, setHost] = useState(existing.host ?? 'github.com');
  const [apiBase, setApiBase] = useState(existing['api-base'] ?? '');

  function save() {
    let parsed: any;
    try {
      parsed = JSON.parse(props.config);
    } catch {
      return;
    }
    parsed.magic = parsed.magic ?? {};
    parsed.magic.git = parsed.magic.git ?? {};
    const github: any = { username, token, host };
    if (apiBase) {
      github['api-base'] = apiBase;
    }
    parsed.magic.git.github = github;
    props.onSave(JSON.stringify(parsed, null, 2));
  }

  return (
    <Modal width={560} onClose={props.onClose} onSubmit={save}>
      <h2>Git settings</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        GitHub credentials for Hyper IDE's Git support. Create a{' '}
        <a href="https://github.com/settings/personal-access-tokens" target="_blank" rel="noreferrer">
          fine-grained personal access token
        </a>{' '}
        with <em>Contents</em> read and write access to the repositories your
        cloudlet manages. The token only authenticates transport — commits are
        authored as the signed-in user's profile name and email.
      </p>
      <label className="modal-label">Username
        <input
          type="text"
          autoComplete="off"
          value={username}
          onChange={e => setUsername(e.target.value)} />
      </label>
      <label className="modal-label">Token
        <input
          type="text"
          className="secret"
          autoComplete="off"
          value={token}
          onChange={e => setToken(e.target.value)} />
      </label>
      <label className="modal-label">Host
        <input
          type="text"
          value={host}
          onChange={e => setHost(e.target.value)} />
      </label>
      <label className="modal-label">API base (optional, for GitHub Enterprise)
        <input
          type="text"
          placeholder="https://api.github.com"
          value={apiBase}
          onChange={e => setApiBase(e.target.value)} />
      </label>
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

/*
 * The path OIDC providers send the id_token back to — must match what Login
 * registers with the provider, character for character.
 */
const OIDC_CALLBACK_PATH = '/authentication/oidc-callback';

/*
 * Patches magic.oidc in the configuration — the client IDs OpenID sign-in
 * runs on.
 *
 * The dropdown is NOT hard-coded: the backend supports any provider for
 * which a slot named [magic.openid.providers.<name>] exists (Google ships
 * with the system), and those are dynamic slots, so the evaluator's slot
 * list tells us every provider the backend COULD use — configured or not.
 * Each provider slot hard-codes its own issuer, URL and scopes, leaving the
 * client ID as the one thing to configure; clearing it turns the provider's
 * sign-in button off.
 */
const OIDC_SLOT_PREFIX = 'magic.openid.providers.';

// Where to create a client ID, for the providers we know the console URL of.
const OIDC_CONSOLES: Record<string, { url: string; name: string }> = {
  google: { url: 'https://console.cloud.google.com/apis/credentials', name: 'the Google Cloud console' },
  microsoft: { url: 'https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade', name: 'the Microsoft Entra admin center' },
  github: { url: 'https://github.com/settings/developers', name: 'GitHub developer settings' },
  linkedin: { url: 'https://www.linkedin.com/developers/apps', name: 'the LinkedIn developer portal' },
  slack: { url: 'https://api.slack.com/apps', name: 'the Slack API dashboard' },
};

/*
 * The configuration each provider needs beyond its client ID. Every value
 * lives under magic.oidc.<provider>.<key> — the provider's startup slot is
 * the authority on what it reads. Providers absent here (google) take a
 * client ID only.
 */
interface OidcField {
  key: string;
  label: string;
  secret?: boolean;
  placeholder?: string;
}

const OIDC_FIELDS: Record<string, OidcField[]> = {
  microsoft: [
    { key: 'tenant', label: 'Directory (tenant) ID' },
    { key: 'client-secret', label: 'Client secret', secret: true },
  ],
  okta: [
    {
      key: 'issuer',
      label: 'Issuer URL',
      placeholder: 'https://dev-123456.okta.com/oauth2/default',
    },
    { key: 'client-secret', label: 'Client secret (optional)', secret: true },
  ],
  auth0: [
    {
      key: 'issuer',
      label: 'Issuer URL — exactly as Auth0 reports it, trailing slash included',
      placeholder: 'https://your-tenant.eu.auth0.com/',
    },
    { key: 'client-secret', label: 'Client secret (optional)', secret: true },
  ],
  keycloak: [
    {
      key: 'issuer',
      label: 'Realm issuer URL',
      placeholder: 'https://keycloak.example.com/realms/master',
    },
    { key: 'client-secret', label: 'Client secret (optional)', secret: true },
  ],
  linkedin: [
    { key: 'client-secret', label: 'Client secret', secret: true },
  ],
  slack: [
    { key: 'client-secret', label: 'Client secret', secret: true },
  ],
  github: [
    { key: 'client-secret', label: 'Client secret', secret: true },
  ],
};

function OpenIdDialog(props: {
  config: string;
  onClose: () => void;
  onSave: (config: string) => void;
}) {

  const existing: Record<string, any> = (() => {
    try {
      return JSON.parse(props.config)?.magic?.oidc ?? {};
    } catch {
      return {};
    }
  })();

  // Null until the slot list answers, so loading and "none" look different.
  const [providers, setProviders] = useState<string[] | null>(null);
  const [provider, setProvider] = useState('');
  /*
   * Every provider's settings, keyed provider → config key → value — edits
   * accumulate across providers, and one Save writes all of them.
   */
  const [values, setValues] = useState<Record<string, Record<string, string>>>(() =>
    Object.fromEntries(Object.keys(existing).map(name =>
      [name, Object.fromEntries(Object.entries(existing[name] ?? {})
        .map(([key, value]) => [key, String(value ?? '')]))])));

  // The selected provider's fields — client ID first, then whatever else it needs.
  const fields: OidcField[] = [
    { key: 'client-id', label: 'Client ID' },
    ...(OIDC_FIELDS[provider] ?? []),
  ];

  function setValue(key: string, value: string) {
    setValues({
      ...values,
      [provider]: { ...(values[provider] ?? {}), [key]: value },
    });
  }

  useEffect(() => {
    http.get<string[]>('/magic/system/evaluator/slots')
      .then(slots => {
        const found = (slots ?? [])
          .filter(name => name.startsWith(OIDC_SLOT_PREFIX))
          .map(name => name.substring(OIDC_SLOT_PREFIX.length))
          .sort();
        setProviders(found);
        setProvider(found[0] ?? '');
      })
      .catch(err => {
        showToast(err.message, true);
        setProviders([]);
      });
  }, []);

  const callbackUrl = window.location.origin + OIDC_CALLBACK_PATH;

  function save() {
    let parsed: any;
    try {
      parsed = JSON.parse(props.config);
    } catch {
      return;
    }
    parsed.magic = parsed.magic ?? {};
    const oidc = { ...(parsed.magic.oidc ?? {}) };
    for (const [name, settings] of Object.entries(values)) {
      const entry = { ...(oidc[name] ?? {}) };
      for (const [key, value] of Object.entries(settings)) {
        if (value.trim()) {
          entry[key] = value.trim();
        } else {
          delete entry[key];
        }
      }
      if (Object.keys(entry).length === 0) {
        delete oidc[name];
      } else {
        oidc[name] = entry;
      }
    }
    if (Object.keys(oidc).length === 0) {
      delete parsed.magic.oidc;
    } else {
      parsed.magic.oidc = oidc;
    }
    props.onSave(JSON.stringify(parsed, null, 2));
  }

  return (
    <Modal width={560} onClose={props.onClose} onSubmit={save}>
      <h2>OpenID sign-in</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Providers users can sign in to the dashboard with. A provider is on
        when it has a client ID, and its sign-in button disappears when the
        field is cleared. Register this redirect URI with the provider:
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span className="mono" style={{ fontSize: 13, overflowWrap: 'anywhere' }}>
          {callbackUrl}
        </span>
        <button
          className="btn btn-secondary btn-small"
          onClick={() => copyToClipboard(callbackUrl, 'The redirect URI')}>
          Copy
        </button>
      </div>
      {providers === null ? (
        <div className="spinner-panel">
          <div className="spinner" />
        </div>
      ) : providers.length === 0 ? (
        <div className="info-box">
          No OpenID providers are registered. The backend supports any
          provider for which a slot named{' '}
          <span className="mono">magic.openid.providers.&lt;name&gt;</span>{' '}
          exists — see the Google slot under{' '}
          <span className="mono">/system/auth/magic.startup/</span> for the
          pattern.
        </div>
      ) : (
        <>
          <label className="modal-label">Provider
            <Select value={provider} onChange={setProvider}>
              {providers.map(name => (
                <option key={name} value={name}>
                  {name + (values[name]?.['client-id']?.trim() ? ' — configured' : '')}
                </option>
              ))}
            </Select>
          </label>
          {fields.map((field, index) => (
            <label className="modal-label" key={provider + '.' + field.key}>
              {field.label}
              <input
                type="text"
                className={field.secret ? 'secret' : undefined}
                autoComplete="off"
                placeholder={field.placeholder ??
                  (index === 0 ? 'Empty — sign-in with this provider is off' : undefined)}
                value={values[provider]?.[field.key] ?? ''}
                onChange={e => setValue(field.key, e.target.value)} />
            </label>
          ))}
          {OIDC_CONSOLES[provider] && (
            <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>
              Create an OAuth client (web application type) in{' '}
              <a href={OIDC_CONSOLES[provider].url} target="_blank" rel="noreferrer">
                {OIDC_CONSOLES[provider].name}
              </a>, with the redirect URI above registered as an authorised
              redirect URI.
            </p>
          )}
        </>
      )}
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        <button
          className="btn"
          disabled={providers === null || providers.length === 0}
          onClick={save}>
          Save
        </button>
      </div>
    </Modal>
  );
}
