import { useState } from 'react';

import { Modal } from '../Dialogs';
import OptionPill from '../OptionPill';
import { asObject, configSection, parseObject, settingText } from './json';
import { isValidPort } from './smtp';

/*
 * Patches magic.smtp in the configuration, like the old SMTP dialog.
 */
export default function SmtpDialog(
  props: Readonly<{
    config: string;
    onClose: () => void;
    onSave: (config: string) => void;
  }>,
) {
  const existing = configSection(props.config, 'magic', 'smtp');
  const existingFrom = asObject(existing.from);

  const [host, setHost] = useState(settingText(existing.host));
  const [port, setPort] = useState(settingText(existing.port, '465'));
  const [secure, setSecure] = useState(existing.secure !== false);
  const [username, setUsername] = useState(settingText(existing.username));
  const [password, setPassword] = useState(settingText(existing.password));
  const [fromName, setFromName] = useState(settingText(existingFrom.name));
  const [fromAddress, setFromAddress] = useState(settingText(existingFrom.address));

  const portValid = isValidPort(port);

  function save() {
    const parsed = parseObject(props.config);
    // Enter submits the dialog too, so the button being disabled is not enough.
    if (!parsed || !portValid) {
      return;
    }
    const magic = asObject(parsed.magic);
    parsed.magic = magic;
    magic.smtp = {
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
    <Modal
      size="md"
      onClose={props.onClose}
      onSubmit={save}
      title="SMTP settings"
      subtitle="The mail server the backend sends emails through."
      actions={
        <>
          <button className="btn btn-secondary" onClick={props.onClose}>
            Cancel
          </button>
          <button className="btn" onClick={save} disabled={!portValid}>
            Save
          </button>
        </>
      }
    >
      <section className="modal-section">
        <div className="modal-section-title">Server</div>
        <div className="form-cols-2">
          <label>
            Host <input type="text" value={host} onChange={e => setHost(e.target.value)} />
          </label>
          <label>
            Port{' '}
            <input
              type="number"
              value={port}
              aria-invalid={!portValid}
              onChange={e => setPort(e.target.value)}
            />
          </label>
        </div>
        {!portValid && (
          <span className="modal-hint modal-hint-error">
            The port must be a whole number from 1 to 65535
          </span>
        )}
        <div className="pill-row">
          <OptionPill label="Secure (TLS)" checked={secure} onChange={setSecure} />
        </div>
      </section>
      <section className="modal-section">
        <div className="modal-section-title">Sign-in</div>
        <div className="form-cols-2">
          <label>
            Username{' '}
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
          </label>
          <label>
            Password{' '}
            <input
              type="text"
              className="secret"
              autoComplete="off"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </label>
        </div>
      </section>
      <section className="modal-section">
        <div className="modal-section-title">Sender</div>
        <div className="form-cols-2">
          <label>
            From name{' '}
            <input type="text" value={fromName} onChange={e => setFromName(e.target.value)} />
          </label>
          <label>
            From address{' '}
            <input type="text" value={fromAddress} onChange={e => setFromAddress(e.target.value)} />
          </label>
        </div>
      </section>
    </Modal>
  );
}
