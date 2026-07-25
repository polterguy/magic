import { useState } from 'react';
import { Modal } from '../components/Dialogs';
import { changePassword, http, listRoles } from '../lib/api';
import { useAuth } from '../lib/AuthContext';

export default function Profile() {

  const { backend, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);
  const [tokenOpen, setTokenOpen] = useState(false);

  async function submitPassword() {
    if (password.length < 12) {
      setFeedback({ text: 'Passwords must be at least 12 characters', isError: true });
      return;
    }
    if (password !== confirmPassword) {
      setFeedback({ text: 'Passwords do not match', isError: true });
      return;
    }
    try {
      await changePassword(password);
      setFeedback({ text: 'Password changed — sign in again with your new password', isError: false });
      setTimeout(logout, 2000);
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Profile</h1>
        <p>Signed in as {backend?.username} on {backend?.url}</p>
      </div>
      {feedback && (
        <div
          className={feedback.isError ? 'error-box' : 'success-box'}
          style={{ marginBottom: 12 }}>
          {feedback.text}
        </div>
      )}
      <div className="editor-split" style={{ flex: 'unset', alignItems: 'flex-start' }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Change password</h2>
          <div className="form-grid">
            <label>New password (min 12 characters)
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)} />
            </label>
            <label>Confirm password
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)} />
            </label>
            <div>
              <button
                className="btn"
                disabled={!password}
                onClick={submitPassword}>
                Change password
              </button>
            </div>
          </div>
        </div>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Access tokens</h2>
          <p className="muted">
            Generate a long-lived JWT token for service accounts, CI/CD, or
            integrations.
          </p>
          <button className="btn btn-secondary" onClick={() => setTokenOpen(true)}>
            Generate token…
          </button>
        </div>
      </div>
      {tokenOpen && <GenerateTokenDialog onClose={() => setTokenOpen(false)} />}
    </>
  );
}

function GenerateTokenDialog({ onClose }: { onClose: () => void }) {

  const [username, setUsername] = useState('service');
  const [roles, setRoles] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['admin']);
  const [expires, setExpires] = useState(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString().substring(0, 10);
  });
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  useState(() => {
    listRoles()
      .then(list => setRoles((list ?? []).map(role => role.name)))
      .catch(() => {});
  });

  async function generate() {
    setError('');
    try {
      const response = await http.get<{ ticket: string }>(
        '/magic/system/auth/generate-token?username=' + encodeURIComponent(username) +
        '&role=' + encodeURIComponent(selectedRoles.join(',')) +
        '&expires=' + encodeURIComponent(new Date(expires).toISOString()));
      setToken(response.ticket);
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <Modal width={560} onClose={onClose}>
      <h2>Generate token</h2>
      {error && <div className="error-box" style={{ marginBottom: 10 }}>{error}</div>}
      <div className="form-grid">
        <label>Username
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
        </label>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Roles</div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            maxHeight: 140,
            overflow: 'auto',
          }}>
            {roles.map(role => (
              <label
                key={role}
                className="chip"
                style={{
                  display: 'inline-flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}>
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role)}
                  onChange={e => setSelectedRoles(e.target.checked
                    ? [...selectedRoles, role]
                    : selectedRoles.filter(candidate => candidate !== role))} />
                {role}
              </label>
            ))}
          </div>
        </div>
        <label>Expires
          <input type="text" value={expires} onChange={e => setExpires(e.target.value)} />
        </label>
        {token && (
          <div className="success-box mono" style={{ overflowWrap: 'anywhere', fontSize: 12 }}>
            {token}
          </div>
        )}
      </div>
      <div className="modal-actions">
        {token && (
          <button
            className="btn btn-secondary"
            onClick={() => navigator.clipboard.writeText(token)}>
            Copy
          </button>
        )}
        <button className="btn btn-secondary" onClick={onClose}>Close</button>
        <button className="btn" onClick={generate} disabled={!username || selectedRoles.length === 0}>
          Generate
        </button>
      </div>
    </Modal>
  );
}
