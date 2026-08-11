import { copyToClipboard, showToast } from '../lib/toast';
import Banner from '../components/Banner';
import { useEffect, useState } from 'react';
import DateTimePicker from '../components/DateTimePicker';
import { Modal } from '../components/Dialogs';
import { MIN_PASSWORD, changePassword, http, listRoles, listUsers, saveUserExtra } from '../lib/api';
import { useAuth } from '../lib/AuthContext';

export default function Profile() {

  const { backend, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tokenOpen, setTokenOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Name and email live as extra fields on the user, not on the account row.
  useEffect(() => {
    if (!backend?.username) {
      return;
    }
    listUsers(backend.username, 0, 1)
      .then(users => {
        const me = users.find(user => user.username === backend.username);
        setName(me?.extra?.find(entry => entry.type === 'name')?.value ?? '');
        setEmail(me?.extra?.find(entry => entry.type === 'email')?.value ?? '');
      })
      .catch(err => showToast(err.message, true, err.logId));
  }, [backend?.username]);

  async function saveDetails() {
    setSavingDetails(true);
    try {
      await saveUserExtra(backend!.username, 'name', name.trim());
      await saveUserExtra(backend!.username, 'email', email.trim());
      showToast('Your details were saved');
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setSavingDetails(false);
    }
  }

  async function submitPassword() {
    if (password.length < MIN_PASSWORD) {
      showToast('Passwords must be at least ' + MIN_PASSWORD + ' characters', true);
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match', true);
      return;
    }
    setChangingPassword(true);
    try {
      await changePassword(password);
      showToast('Password changed — sign in again with your new password');
      setTimeout(logout, 2000);
    } catch (err: any) {
      showToast(err.message, true, err.logId);
      setChangingPassword(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Profile</h1>
        <p>Signed in as {backend?.username} on {backend?.url}</p>
      </div>
      <div className="editor-split" style={{ flex: 'unset', alignItems: 'flex-start' }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Your details</h2>
          <div className="form-grid">
            <label>Full name
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={e => setName(e.target.value)} />
            </label>
            <label>Email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)} />
            </label>
          </div>
          <button
            className="btn"
            style={{ marginTop: 12 }}
            onClick={saveDetails}
            disabled={savingDetails}>
            {savingDetails ? 'Saving…' : 'Save details'}
          </button>
        </div>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Change password</h2>
          <div className="form-grid">
            <label>New password (min {MIN_PASSWORD} characters)
              <input
                type="password"
                // Tells the browser this sets a password rather than logging
                // in, so it doesn't autofill saved credentials.
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)} />
            </label>
            <label>Confirm password
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)} />
            </label>
            <div>
              <button
                className="btn"
                disabled={!password || changingPassword}
                onClick={submitPassword}>
                {changingPassword ? 'Changing…' : 'Change password'}
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
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listRoles()
      .then(list => setRoles((list ?? []).map(role => role.name)))
      .catch(() => {});
  }, []);

  async function generate() {
    if (busy) {
      return;
    }
    setError('');
    setBusy(true);
    try {
      const response = await http.get<{ ticket: string }>(
        '/magic/system/auth/generate-token?username=' + encodeURIComponent(username) +
        '&role=' + encodeURIComponent(selectedRoles.join(',')) +
        '&expires=' + encodeURIComponent(new Date(expires).toISOString()));
      setToken(response.ticket);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      width={560}
      onClose={onClose}
      onSubmit={() => { if (username && selectedRoles.length > 0) generate(); }}>
      <h2>Generate token</h2>
      {error && <Banner onClose={() => setError('')} style={{ marginBottom: 10 }}>{error}</Banner>}
      <div className="form-grid">
        <label>Username
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
        </label>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Roles</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
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
          {/* A token that expired before it was issued is never what's wanted. */}
          <DateTimePicker
            dateOnly
            value={expires}
            min={new Date().toISOString().substring(0, 10)}
            onChange={setExpires}
            placeholder="Pick an expiry date" />
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
            onClick={() => copyToClipboard(token, 'The token')}>
            Copy
          </button>
        )}
        <button className="btn btn-secondary" onClick={onClose}>Close</button>
        <button
          className="btn"
          onClick={generate}
          disabled={!username || selectedRoles.length === 0 || busy}>
          {busy ? 'Generating…' : 'Generate'}
        </button>
      </div>
    </Modal>
  );
}
