/*
 * First-run setup. A backend that hasn't been configured ships a placeholder
 * JWT secret, which is what makes root/root work — so until this is done,
 * anyone can sign in as root. Rendered instead of the layout, so nothing
 * behind it fetches while the system is still wide open.
 *
 * The backend does the rest itself: generates a real secret, ensures the
 * magic database exists, and answers with a ticket signed by the new secret.
 */

import Banner from '../components/Banner';
import { FormEvent, useState } from 'react';
import { EyeIcon, EyeOffIcon } from '../components/Icons';
import { useAuth } from '../lib/AuthContext';
import { ApiError, saveUserExtra, setupSystem } from '../lib/api';

// Same minimum the old dashboard enforced.
const MIN_PASSWORD = 12;

export default function Setup() {

  const { backend, loginWithTicket, setupCompleted } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [subscribe, setSubscribe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const problem =
    name.trim() === '' ? 'Your name is required'
      : !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? 'That does not look like an email address'
        : password.length < MIN_PASSWORD ? 'The password must be at least ' + MIN_PASSWORD + ' characters'
          : !showPassword && password !== repeat ? 'The two passwords do not match'
            : '';

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (problem) {
      setError(problem);
      return;
    }
    setError('');
    setBusy(true);
    try {
      const response = await setupSystem({ password, name, email, subscribe });
      /*
       * The new ticket is signed with the new secret, so the old one is dead
       * — swap it in before anything else is attempted.
       */
      loginWithTicket(backend!.url, response.ticket);
      /*
       * Setup only stores name and email when it CREATES root. On a backend
       * where root already existed it changes the password and drops them,
       * so they are written here to be certain they took.
       */
      await saveUserExtra('root', 'name', name);
      await saveUserExtra('root', 'email', email);
      setupCompleted();
    } catch (err: any) {
      // Already configured — let them through rather than trapping them here.
      if (err instanceof ApiError && err.status === 401) {
        setupCompleted();
        return;
      }
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrapper">
      <form className="login-card" style={{ width: 520 }} onSubmit={submit}>
        <h1>Set up your cloudlet</h1>
        <p className="muted" style={{ textAlign: 'center', margin: 0 }}>
          Your backend is still using its default password. Choose a real one
          for <strong>root</strong> to lock it down.
        </p>
        {error && <Banner onClose={() => setError('')}>{error}</Banner>}
        <label>
          Full name
          <input
            type="text"
            autoFocus
            autoComplete="name"
            value={name}
            onChange={e => setName(e.target.value)} />
        </label>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)} />
        </label>
        <label>
          Password (min {MIN_PASSWORD} characters)
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ flex: 1, minWidth: 0 }} />
            <button
              type="button"
              className="icon-btn"
              title={showPassword ? 'Hide the password' : 'Show the password'}
              onClick={() => {
                /*
                 * Keep the repeat field in step with what's on screen, so
                 * hiding the password again doesn't fail the match check
                 * against something the user never typed twice.
                 */
                setRepeat(password);
                setShowPassword(!showPassword);
              }}>
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </label>
        {/* Confirming is pointless while the password is legible. */}
        {!showPassword && (
          <label>
            Repeat password
            <input
              type="password"
              autoComplete="new-password"
              value={repeat}
              onChange={e => setRepeat(e.target.value)} />
          </label>
        )}
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={subscribe}
            onChange={e => setSubscribe(e.target.checked)} />
          Subscribe to the newsletter
        </label>
        <button className="btn" type="submit" disabled={busy}>
          {busy ? 'Setting up…' : 'Save'}
        </button>
        <p className="muted" style={{ fontSize: 12, textAlign: 'center', margin: 0 }}>
          This takes a few seconds — the server generates a new signing key and
          prepares its database.
        </p>
      </form>
    </div>
  );
}
