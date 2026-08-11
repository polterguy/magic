/*
 * Adds an HTML widget to a model — a training snippet whose completion tells
 * the model to render the widget through the render-html-widget workflow.
 */

import { useEffect, useState } from 'react';
import Banner from '../../components/Banner';
import { Modal } from '../../components/Dialogs';
import SearchInput from '../../components/SearchInput';
import { availableWidgets, mlSnippetCreate } from '../../lib/api';
import { showToast } from '../../lib/toast';

const WIDGET_WORKFLOW = '/misc/workflows/workflows/machine-learning/render-html-widget.hl';

export default function AddWidgetDialog(props: {
  type: string;
  onClose: () => void;
  onAdded: () => void;
}) {

  const [widgets, setWidgets] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  // Distinguishes "still fetching the list" from a genuinely empty result.
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    availableWidgets()
      .then(list => setWidgets(list ?? []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function install(widget: any) {
    const completion = 'If the user asks you to perform an action associated with ' +
      'this function, then responds with the following in the same message:\n' +
      '\n___\nFUNCTION_INVOCATION[' + WIDGET_WORKFLOW + ']:\n{\n  "filename":' +
      widget.file + '\n}\n___';
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      await mlSnippetCreate({
        prompt: 'WRITE YOUR PROMPT HERE',
        completion,
        type: props.type,
        meta: 'FUNCTION_INVOCATION ==> ' + WIDGET_WORKFLOW,
      });
      showToast(
        'Widget added to ' + props.type + ' — edit its prompt to describe when to use it');
      props.onAdded();
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setBusy(false);
    }
  }

  const query = filter.toLowerCase();
  const visible = widgets.filter(widget =>
    !query ||
    widget.name?.toLowerCase().includes(query) ||
    widget.description?.toLowerCase().includes(query));

  return (
    <Modal width={720} onClose={props.onClose}>
      <h2>Add widget to {props.type}</h2>
      {error && <Banner onClose={() => setError('')} style={{ marginBottom: 10 }}>{error}</Banner>}
      <SearchInput
        placeholder="Filter widgets…"
        value={filter}
        onChange={setFilter}
        style={{ width: '100%', marginBottom: 10 }} />
      <div style={{ maxHeight: '50vh', overflow: 'auto' }}>
        {visible.map(widget => (
          <div
            key={widget.file}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 0',
              borderBottom: '1px solid var(--border)',
            }}>
            <div style={{ flex: 1 }}>
              <strong>{widget.name}</strong>
              {widget.description && <div className="muted">{widget.description}</div>}
            </div>
            <button
              className="btn btn-secondary btn-small"
              onClick={() => install(widget)}
              disabled={busy}>
              Add
            </button>
          </div>
        ))}
        {loading && <div className="spinner-panel"><div className="spinner" /></div>}
        {!loading && visible.length === 0 && <div className="muted">No widgets available.</div>}
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>Close</button>
      </div>
    </Modal>
  );
}
