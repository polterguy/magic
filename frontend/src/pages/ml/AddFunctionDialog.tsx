/*
 * "Create AI function" — lists installable functions and declares one on the
 * type, either as a training snippet whose meta names the file, or by handing
 * the file back for the system instruction. The tool's description and
 * arguments come from the file, so nothing else is generated.
 */

import { useEffect, useState } from 'react';
import Banner from '../../components/Banner';
import { Modal } from '../../components/Dialogs';
import SearchInput from '../../components/SearchInput';
import { availableWorkflows, mlSnippetCreate } from '../../lib/api';
import { showToast } from '../../lib/toast';

export default function AddFunctionDialog(props: {
  type: string;
  onClose: () => void;
  onInstalled: () => void;
  /*
   * When given, the function's file is handed back rather than written as a
   * training snippet — how a function gets added to a system instruction.
   */
  onDeclaration?: (file: string) => void;
}) {

  const [workflows, setWorkflows] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  // Distinguishes "still fetching the list" from a genuinely empty result.
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    availableWorkflows()
      .then(list => setWorkflows(list ?? []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function install(workflow: any) {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      if (props.onDeclaration) {
        props.onDeclaration(workflow.file);
        return;
      }
      await mlSnippetCreate({
        prompt: workflow.name,
        completion: workflow.description ?? '',
        type: props.type,
        meta: 'FUNCTION_INVOCATION ==> ' + workflow.file,
        uri: null,
      });
      showToast('AI function ' + workflow.name + ' added to ' + props.type);
      props.onInstalled();
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setBusy(false);
    }
  }

  const visible = workflows.filter(workflow =>
    !filter ||
    workflow.name?.toLowerCase().includes(filter.toLowerCase()) ||
    workflow.description?.toLowerCase().includes(filter.toLowerCase()));

  return (
    <Modal width={720} onClose={props.onClose}>
      <h2>Add AI function to {props.type}</h2>
      {error && <Banner onClose={() => setError('')} style={{ marginBottom: 10 }}>{error}</Banner>}
      <SearchInput
        placeholder="Filter functions…"
        value={filter}
        onChange={setFilter}
        style={{ width: '100%', marginBottom: 10 }} />
      <div style={{ maxHeight: '50vh', overflow: 'auto' }}>
        {visible.map(workflow => (
          <div
            key={workflow.file}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 4px',
              borderBottom: '1px solid var(--border)',
            }}>
            <div style={{ flex: 1 }}>
              <div><strong>{workflow.name}</strong></div>
              <div className="muted" style={{ fontSize: 13 }}>{workflow.description}</div>
              <div className="mono muted" style={{ fontSize: 11 }}>{workflow.file}</div>
            </div>
            <button
              className="btn btn-secondary btn-small"
              onClick={() => install(workflow)}
              disabled={busy}>
              Install
            </button>
          </div>
        ))}
        {loading && <div className="spinner-panel"><div className="spinner" /></div>}
        {!loading && visible.length === 0 && <div className="muted">No functions found.</div>}
      </div>
      <div className="modal-actions">
        <button className="btn" onClick={props.onClose}>Close</button>
      </div>
    </Modal>
  );
}
