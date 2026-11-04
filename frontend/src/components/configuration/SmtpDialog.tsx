import { useState } from 'react';

import { Modal } from '../Dialogs';
import { asObject, configSection, parseObject, settingText } from './json';

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

  function save() {
    const parsed = parseObject(props.config);
    if (!parsed) {
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
    <Modal onClose={props.onClose} onSubmit={save}>
      <h2>SMTP settings</h2>
      <div className="form-grid">
        <label>
          Host
          <input type="text" value={host} onChange={e => setHost(e.target.value)} />
        </label>
        <label>
          Port
          <input type="number" value={port} onChange={e => setPort(e.target.value)} />
        </label>
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={secure} onChange={e => setSecure(e.target.checked)} />
          Secure (TLS)
        </label>
        <label>
          Username
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
        </label>
        <label>
          Password
          <input
            type="text"
            className="secret"
            autoComplete="off"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </label>
        <label>
          From name
          <input type="text" value={fromName} onChange={e => setFromName(e.target.value)} />
        </label>
        <label>
          From address
          <input type="text" value={fromAddress} onChange={e => setFromAddress(e.target.value)} />
        </label>
      </div>
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
