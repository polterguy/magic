/*
 * Adds an HTML widget to a model — a training snippet whose meta names the
 * widget file. The chat pipeline turns it into a tool of its own, described
 * by the snippet's prompt, with the widget's [[placeholder]] tokens as its
 * parameters.
 */

import { useEffect, useState } from 'react';

import { availableWidgets, mlSnippetCreate } from '../../lib/api';
import { errorMessage, showError } from '../../lib/errors';
import { showToast } from '../../lib/toast';
import Banner from '../Banner';
import { Modal } from '../Dialogs';
import SearchInput from '../SearchInput';
import { ListSkeleton } from '../Skeleton';

type Widget = Awaited<ReturnType<typeof availableWidgets>>[number];

export default function AddWidgetDialog(
  props: Readonly<{
    type: string;
    onClose: () => void;
    onAdded: () => void;
  }>,
) {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  // Distinguishes "still fetching the list" from a genuinely empty result.
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    availableWidgets()
      .then(list => setWidgets(list ?? []))
      .catch((err: unknown) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  async function install(widget: Widget) {
    const completion = 'HTML widget at ' + widget.file + '.';
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      await mlSnippetCreate({
        prompt: 'WRITE YOUR PROMPT HERE',
        completion,
        type: props.type,
        meta: 'WIDGET ==> ' + widget.file,
      });
      showToast('Widget added to ' + props.type + ' — edit its prompt to describe when to use it');
      props.onAdded();
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  const query = filter.toLowerCase();
  const visible = widgets.filter(
    widget =>
      !query ||
      widget.name?.toLowerCase().includes(query) ||
      widget.description?.toLowerCase().includes(query),
  );

  return (
    <Modal
      size="lg"
      onClose={props.onClose}
      title={'Add widget to ' + props.type}
      headerExtra={
        <SearchInput
          placeholder="Filter widgets…"
          value={filter}
          onChange={setFilter}
          style={{ width: 220 }}
        />
      }
      actions={
        <button className="btn btn-secondary" onClick={props.onClose}>
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
          visible.map(widget => (
            <div
              key={widget.file}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ flex: 1 }}>
                <strong>{widget.name}</strong>
                {widget.description && <div className="modal-hint">{widget.description}</div>}
              </div>
              <button
                className="btn btn-secondary btn-small"
                onClick={() => install(widget)}
                disabled={busy}
              >
                Add
              </button>
            </div>
          ))}
        {!loading && visible.length === 0 && <div className="muted">No widgets available.</div>}
      </div>
    </Modal>
  );
}
