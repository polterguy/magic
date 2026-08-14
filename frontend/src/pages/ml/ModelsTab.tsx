/*
 * Models tab — the ml_types registry.
 */

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AiWaiter from '../../components/AiWaiter';
import { useDialog } from '../../components/Dialogs';
import { CheckIcon, DashIcon } from '../../components/Icons';
import SocketFeedback from '../../components/SocketFeedback';
import {
  deleteVectors,
  gibberish,
  mlSnippetsCount,
  mlTypeDelete,
  mlUnvectorisedCount,
  vectoriseType,
} from '../../lib/api';
import { showToast } from '../../lib/toast';
import EditModelDialog from './EditModelDialog';
import EmbedDialog from './EmbedDialog';
import ImportDialog from './ImportDialog';

export default function ModelsTab(props: {
  types: any[];
  onChanged: () => void;
}) {

  const [editing, setEditing] = useState<any | null | 'new'>(null);
  const [params, setParams] = useSearchParams();

  /*
   * The command palette links straight at one model. The types are already
   * loaded by the page above, so this waits for them rather than fetching, and
   * drops the parameter once used so a refresh does not reopen the dialog.
   */
  const deepLinked = useRef(false);
  useEffect(() => {
    const type = params.get('edit');
    if (!type || deepLinked.current || props.types.length === 0) {
      return;
    }
    const match = props.types.find(candidate => candidate.type === type);
    deepLinked.current = true;
    params.delete('edit');
    setParams(params, { replace: true });
    if (match) {
      setEditing(match);
    } else {
      showToast('No model named ' + type, true);
    }
  }, [params, setParams, props.types]);
  const [vectorising, setVectorising] =
    useState<{ type: string; channel: string; total: number } | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [embedding, setEmbedding] = useState<string | null>(null);
  // Round-trips before a dialog/terminal appears — counts, vector resets, deletes.
  const [waiting, setWaiting] = useState(false);
  const { confirm, confirmTyped } = useDialog();

  async function remove(type: string) {
    if (!await confirmTyped({
      title: 'Delete model?',
      message: 'This deletes the model and its training data. Type the model name to confirm.',
      label: 'Model name',
      expected: type,
      confirmText: 'Delete',
    })) {
      return;
    }
    setWaiting(true);
    try {
      await mlTypeDelete(type);
      showToast('Model ' + type + ' deleted');
      props.onChanged();
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setWaiting(false);
    }
  }

  async function vectorise(type: string) {
    setWaiting(true);
    try {
      // Snippets without embeddings are exactly the ones about to be vectorised.
      let total = (await mlUnvectorisedCount(type)).count;

      /*
       * Nothing left to vectorise means the model is already fully vectorised,
       * and the vectoriser would do nothing at all. Re-vectorising is still a
       * legitimate thing to want - a changed vector model, or suspect vectors -
       * but it means throwing away every existing embedding first, so the user
       * has to agree to that before we reset them.
       */
      if (total === 0) {
        const all = (await mlSnippetsCount(type, '')).count;
        if (all === 0) {
          showToast('No training snippets in ' + type + ' to vectorise', true);
          return;
        }
        // Waiter off while the confirm dialog awaits the user.
        setWaiting(false);
        if (!await confirm({
          title: 'Re-vectorise ' + type + '?',
          message: 'Every snippet in ' + type + ' is already vectorised. Continuing ' +
            'deletes all ' + all + ' existing vectors and creates ' + all + ' new embeddings, ' +
            'which costs OpenAI credits.',
          confirmText: 'Delete vectors and re-vectorise',
          danger: true,
        })) {
          return;
        }
        setWaiting(true);
        await deleteVectors(type);
        total = all;
      }
      const channel = (await gibberish()).result;
      setVectorising({ type, channel, total });
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setWaiting(false);
    }
  }

  return (
    <>
      <div className="toolbar">
        <span className="muted">{props.types.length} models</span>
        <span className="spacer" />
        <button className="btn" onClick={() => setEditing('new')}>+ New model</button>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Model</th>
              <th style={{ width: 110 }}>Tokens</th>
              <th style={{ width: 110 }}>Embeddings</th>
              <th style={{ width: 330 }}></th>
            </tr>
          </thead>
          <tbody>
            {props.types.map(type => (
              <tr key={type.type}>
                <td><strong>{type.type}</strong></td>
                <td className="mono" data-label="Model">{type.model}</td>
                {/* Tokenised server-side by the backend (the endpoint runs the
                    system message through its GPT tokenizer per row). */}
                <td
                  className="mono"
                  data-label="Tokens"
                  title="Size of this model's system instruction, in tokens">
                  {typeof type.system_message_token_count === 'number'
                    ? type.system_message_token_count.toLocaleString()
                    : <span className="muted">—</span>}
                </td>
                <td data-label="Embeddings">
                  <span
                    className={'state-icon ' + (type.use_embeddings ? 'on' : 'off')}
                    role="img"
                    aria-label={type.use_embeddings ? 'Embeddings on' : 'Embeddings off'}
                    title={type.use_embeddings
                      ? 'This model retrieves from its vectorised training data'
                      : 'This model answers without retrieving training data'}>
                    {type.use_embeddings ? <CheckIcon /> : <DashIcon />}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => setImporting(type.type)}>
                      Import
                    </button>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => vectorise(type.type)}>
                      Vectorise
                    </button>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => setEmbedding(type.type)}>
                      Embed
                    </button>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => setEditing(type)}>
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => remove(type.type)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing !== null && (
        <EditModelDialog
          existing={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); props.onChanged(); }} />
      )}
      {vectorising && (
        <SocketFeedback
          title={'Vectorising ' + vectorising.type}
          channel={vectorising.channel}
          progress={{
            total: vectorising.total,
            // The vectoriser announces every snippet it embeds with this prefix.
            counts: message => message.message.startsWith('Vectorizing:'),
          }}
          onReady={() => {
            vectoriseType(vectorising.type, vectorising.channel)
              .catch(err => showToast(err.message, true, err.logId));
          }}
          onClose={() => setVectorising(null)} />
      )}
      {importing && (
        <ImportDialog
          type={importing}
          onClose={() => setImporting(null)} />
      )}
      {embedding && (
        <EmbedDialog type={embedding} onClose={() => setEmbedding(null)} />
      )}
      {waiting && <AiWaiter />}
    </>
  );
}
