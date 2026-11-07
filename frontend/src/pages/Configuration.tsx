import { useEffect, useRef, useState } from 'react';

import CodeEditor from '../components/CodeEditor';
import { CONFIG_FILE, CONFIG_FOLDER } from '../components/configuration/constants';
import GitDialog from '../components/configuration/GitDialog';
import OpenIdDialog from '../components/configuration/OpenIdDialog';
import RecaptchaDialog from '../components/configuration/RecaptchaDialog';
import SmtpDialog from '../components/configuration/SmtpDialog';
import UrlsDialog from '../components/configuration/UrlsDialog';
import Menu from '../components/designer/Menu';
import OpenAiKeyDialog from '../components/OpenAiKeyDialog';
import { downloadFileRaw, loadConfig, MagicConfig, saveConfig, uploadFile } from '../lib/api';
import { downloadBlob } from '../lib/download';
import { showError } from '../lib/errors';
import { showToast } from '../lib/toast';

export default function Configuration() {
  const [config, setConfig] = useState('');
  const [busy, setBusy] = useState(false);
  const [smtpOpen, setSmtpOpen] = useState(false);
  const [openaiOpen, setOpenaiOpen] = useState(false);
  const [recaptchaOpen, setRecaptchaOpen] = useState(false);
  const [gitOpen, setGitOpen] = useState(false);
  const [openidOpen, setOpenidOpen] = useState(false);
  const [urlsOpen, setUrlsOpen] = useState(false);
  const uploadInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    reload();
  }, []);

  function reload() {
    loadConfig()
      .then(response => setConfig(JSON.stringify(response, null, 2)))
      .catch((err: unknown) => showError(err));
  }

  async function downloadBackup() {
    setBusy(true);
    try {
      const result = await downloadFileRaw(CONFIG_FOLDER + CONFIG_FILE);
      downloadBlob(result.blob, CONFIG_FILE);
    } catch (err) {
      showError(err);
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
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  async function save(next?: string) {
    const text = next ?? config;
    let parsed: MagicConfig;
    try {
      parsed = JSON.parse(text) as MagicConfig;
    } catch (err) {
      showError(err, 'Invalid JSON: ');
      return;
    }
    setBusy(true);
    try {
      await saveConfig(parsed);
      setConfig(JSON.stringify(parsed, null, 2));
      showToast('Configuration saved');
    } catch (err) {
      showError(err);
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
          <Menu
            title="Settings dialogs and backup"
            className="btn btn-secondary"
            items={[
              { label: 'SMTP', onClick: () => setSmtpOpen(true) },
              { label: 'OpenAI', onClick: () => setOpenaiOpen(true) },
              { label: 'reCAPTCHA', onClick: () => setRecaptchaOpen(true) },
              { label: 'OpenID', onClick: () => setOpenidOpen(true) },
              { label: 'Git', onClick: () => setGitOpen(true) },
              { label: 'URLs', onClick: () => setUrlsOpen(true) },
              { label: 'Download backup', onClick: () => void downloadBackup() },
              { label: 'Upload backup', onClick: () => uploadInput.current?.click() },
            ]}
          />
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
                void uploadBackup(file);
              }
            }}
          />
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
          onSave={() => save()}
        />
      </div>
      {smtpOpen && (
        <SmtpDialog
          config={config}
          onClose={() => setSmtpOpen(false)}
          onSave={next => {
            setSmtpOpen(false);
            void save(next);
          }}
        />
      )}
      {recaptchaOpen && (
        <RecaptchaDialog
          config={config}
          onClose={() => setRecaptchaOpen(false)}
          onSave={next => {
            setRecaptchaOpen(false);
            void save(next);
          }}
        />
      )}
      {gitOpen && (
        <GitDialog
          config={config}
          onClose={() => setGitOpen(false)}
          onSave={next => {
            setGitOpen(false);
            void save(next);
          }}
        />
      )}
      {urlsOpen && (
        <UrlsDialog
          config={config}
          onClose={() => setUrlsOpen(false)}
          onSave={next => {
            setUrlsOpen(false);
            void save(next);
          }}
        />
      )}
      {openidOpen && (
        <OpenIdDialog
          config={config}
          onClose={() => setOpenidOpen(false)}
          onSave={next => {
            setOpenidOpen(false);
            void save(next);
          }}
        />
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
          }}
        />
      )}
    </>
  );
}
