/*
 * "Create AI function" — lists installable functions and declares one on the
 * type, either as a training snippet whose meta names the file, or by handing
 * the file back for the system instruction. The tool's description and
 * arguments come from the file, so nothing else is generated.
 */

import { availableWorkflows, mlSnippetCreate } from '@core/api';
import { errorMessage, showError } from '@core/errors';
import { showToast } from '@core/toast';
import Banner from '@shared/ui/Banner';
import { Modal } from '@shared/ui/Dialogs';
import SearchInput from '@shared/ui/SearchInput';
import { ListSkeleton } from '@shared/ui/Skeleton';
import { useEffect, useState } from 'react';

type Workflow = Awaited<ReturnType<typeof availableWorkflows>>[number];

export default function AddFunctionDialog(
  props: Readonly<{
    type: string;
    onClose: () => void;
    onInstalled: () => void;
    /*
     * When given, the function's file is handed back rather than written as a
     * training snippet — how a function gets added to a system instruction.
     */
    onDeclaration?: (file: string) => void;
  }>,
) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  // Distinguishes "still fetching the list" from a genuinely empty result.
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    availableWorkflows()
      .then(list => setWorkflows(list ?? []))
      .catch((err: unknown) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  async function install(workflow: Workflow) {
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
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  const visible = workflows.filter(
    workflow =>
      !filter ||
      workflow.name?.toLowerCase().includes(filter.toLowerCase()) ||
      workflow.description?.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <Modal
      size="lg"
      onClose={props.onClose}
      title={'Add AI function to ' + props.type}
      headerExtra={
        <SearchInput
          placeholder="Filter functions…"
          value={filter}
          onChange={setFilter}
          style={{ width: 220 }}
        />
      }
      actions={
        <button className="btn" onClick={props.onClose}>
          Done
        </button>
      }
    >
      {error && (
        <Banner onClose={() => setError('')} style={{ marginBottom: 10 }}>
          {error}
        </Banner>
      )}
      <div>
        {loading && <ListSkeleton withAction />}
        {!loading &&
          visible.map(workflow => (
            <div
              key={workflow.file}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 4px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ flex: 1 }}>
                <div>
                  <strong>{workflow.name}</strong>
                </div>
                <div className="modal-hint">{workflow.description}</div>
                <div className="mono modal-hint">{workflow.file}</div>
              </div>
              <button
                className="btn btn-secondary btn-small"
                onClick={() => install(workflow)}
                disabled={busy}
              >
                Install
              </button>
            </div>
          ))}
        {!loading && visible.length === 0 && <div className="muted">No functions found.</div>}
      </div>
    </Modal>
  );
}
