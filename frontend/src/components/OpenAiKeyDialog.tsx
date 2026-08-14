/*
 * Takes the OpenAI API key and stores it in the backend's configuration,
 * the way the old dashboard's OpenAI configuration dialog does. Opened from
 * both the dashboard's setup prompt and the Configuration screen, so it lives
 * here rather than in either of them.
 */

import Banner from './Banner';
import Select from './Select';
import { useEffect, useState } from 'react';
import { Modal } from './Dialogs';
import { mlTypeUpdate, mlTypes, modelPriceLabel, openaiGetKey, openaiSetKey } from '../lib/api';

/*
 * Hardcoded rather than fetched — listing models needs a key, and this is the
 * dialog where the key gets supplied in the first place. Prices are USD per
 * million tokens and mirror /system/openai/models.get.hl, which stays the
 * source of truth everywhere a key already exists — update both together.
 */
const MODELS: { name: string; input_price: number; output_price: number }[] = [
  { name: 'gpt-5.6-luna', input_price: 0.2, output_price: 1.2 },
  { name: 'gpt-5.6-terra', input_price: 2, output_price: 12 },
  { name: 'gpt-5.6-sol', input_price: 5, output_price: 30 },
];

/*
 * Preselected until we know what the cloudlet already runs — Terra is the
 * balanced default for the developer tooling behind Chat Ops, where a fumbled
 * answer costs more than the tokens saved by dropping to Luna.
 */
const DEFAULT_MODEL = 'gpt-5.6-terra';

export default function OpenAiKeyDialog(props: {
  onClose: () => void;
  onSaved: () => void;
}) {

  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [model, setModel] = useState(DEFAULT_MODEL);
  // What "default" runs today, so an unchanged dropdown writes nothing.
  const [savedModel, setSavedModel] = useState('');

  /*
   * Prefilled with whatever key is already configured, so opening this to
   * change an existing key shows what's there instead of an empty field.
   */
  useEffect(() => {
    openaiGetKey()
      .then(response => setKey(response.result ?? ''))
      .catch(() => {});
    mlTypes()
      .then(types => {
        const current = (types ?? []).find(candidate => candidate.type === 'default')?.model;
        if (current) {
          setSavedModel(current);
          setModel(current);
        }
      })
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
      if (model !== savedModel) {
        await mlTypeUpdate({ type: 'default', model });
        setSavedModel(model);
      }
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
      <label className="modal-label">
        Model
        <Select value={model} onChange={value => setModel(value)}>
          {MODELS.map(candidate => (
            <option key={candidate.name} value={candidate.name}>
              {candidate.name}{modelPriceLabel(candidate)}
            </option>
          ))}
        </Select>
      </label>
      <p className="muted" style={{ marginTop: 8, marginBottom: 0, fontSize: 'var(--text-sm)' }}>
        Saving also switches the <strong>default</strong> model — the one behind
        Chat Ops and the dashboard's AI tools.
      </p>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        <button className="btn" onClick={save} disabled={busy || !key}>
          {busy ? 'Saving…' : 'Save key'}
        </button>
      </div>
    </Modal>
  );
}
