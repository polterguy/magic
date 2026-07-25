import { FormEvent, useState } from 'react';
import { useAuth } from '../lib/AuthContext';

export default function Login() {

  const { backend, login } = useAuth();
  const [url, setUrl] = useState(backend?.url ?? 'http://localhost:5000');
  const [username, setUsername] = useState(backend?.username ?? 'root');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(url, username, password);
    } catch (err: any) {
      setError(err.message ?? 'Could not authenticate');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrapper">
      <form className="login-card" onSubmit={submit}>
        <h1>magic</h1>
        <p className="muted" style={{ textAlign: 'center', margin: 0 }}>
          Sign in to your backend
        </p>
        {error && <div className="error-box">{error}</div>}
        <label>
          Backend URL
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="http://localhost:5000"
            required />
        </label>
        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
            required />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required />
        </label>
        <button className="btn" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
