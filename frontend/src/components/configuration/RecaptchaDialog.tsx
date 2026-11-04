import { useState } from 'react';

import { Modal } from '../Dialogs';
import { asObject, configSection, parseObject, settingText } from './json';

/*
 * Patches magic.auth.recaptcha in the configuration, like the old reCAPTCHA
 * dialog. reCAPTCHA is optional — clearing both fields turns it off.
 */
export default function RecaptchaDialog(
  props: Readonly<{
    config: string;
    onClose: () => void;
    onSave: (config: string) => void;
  }>,
) {
  const existing = configSection(props.config, 'magic', 'auth', 'recaptcha');

  const [key, setKey] = useState(settingText(existing.key));
  const [secret, setSecret] = useState(settingText(existing.secret));

  function save() {
    const parsed = parseObject(props.config);
    if (!parsed) {
      return;
    }
    const magic = asObject(parsed.magic);
    parsed.magic = magic;
    const auth = asObject(magic.auth);
    magic.auth = auth;
    auth.recaptcha = { key, secret };
    props.onSave(JSON.stringify(parsed, null, 2));
  }

  return (
    <Modal width={560} onClose={props.onClose} onSubmit={save}>
      <h2>reCAPTCHA settings</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Your Google reCAPTCHA v3 keys, from{' '}
        <a href="https://www.google.com/recaptcha/admin" target="_blank" rel="noreferrer">
          the reCAPTCHA admin console
        </a>
        {'. Leave both fields empty to turn reCAPTCHA off.'}
      </p>
      <label className="modal-label">
        Site key{' '}
        <input type="text" autoComplete="off" value={key} onChange={e => setKey(e.target.value)} />
      </label>
      <label className="modal-label">
        Secret key{' '}
        <input
          type="text"
          className="secret"
          autoComplete="off"
          value={secret}
          onChange={e => setSecret(e.target.value)}
        />
      </label>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>
          Cancel
        </button>
        <button className="btn" onClick={save}>
          Save
        </button>
      </div>
    </Modal>
  );
}
