/*
 * Takes the OpenAI API key and stores it in the backend's configuration,
 * the way the old dashboard's OpenAI configuration dialog does. Opened from
 * both the dashboard's setup prompt and the Configuration screen, so it lives
 * here rather than in either of them.
 */

import Banner from './Banner';
import { useEffect, useState } from 'react';
import { Modal } from './Dialogs';
import { openaiGetKey, openaiSetKey } from '../lib/api';

export default function OpenAiKeyDialog(props: {
  onClose: () => void;
  onSaved: () => void;
}) {

  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  /*
   * Prefilled with whatever key is already configured, so opening this to
   * change an existing key shows what's there instead of an empty field.
   */
  useEffect(() => {
    openaiGetKey()
      .then(response => setKey(response.result ?? ''))
      .catch(() => {});
  }, []);

  async function save() {
    // The old dashboard's sanity check — real keys are far longer than this.
    if (key.length < 20) {
      setError('That does not look like a valid API key');
      return;
    }
    setBusy(true);
    try {
      await openaiSetKey(key);
      props.onSaved();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal width={560} onClose={props.onClose}>
      <h2>Configure OpenAI</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Supply your OpenAI API key. You can get one{' '}
        <a
          href="https://platform.openai.com/account/api-keys"
          target="_blank"
          rel="noreferrer">
          here
        </a>.
      </p>
      {error && <Banner onClose={() => setError('')} style={{ marginBottom: 10 }}>{error}</Banner>}
      <label className="modal-label">
        OpenAI API key
        <input
          type="text"
          className="secret"
          autoFocus
          autoComplete="off"
          placeholder="sk-…"
          value={key}
          onChange={e => setKey(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); }} />
      </label>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        <button className="btn" onClick={save} disabled={busy || !key}>
          {busy ? 'Saving…' : 'Save key'}
        </button>
      </div>
    </Modal>
  );
}
