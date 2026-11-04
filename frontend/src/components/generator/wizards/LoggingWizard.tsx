import { useState } from 'react';

import { showToast } from '../../../lib/toast';

/*
 * Wizard granting logging. Write covers the four severities; Read covers querying the log.
 */
export default function LoggingWizard(
  props: Readonly<{ onAdd: (lines: string[]) => void; onCancel: () => void }>,
) {
  const [write, setWrite] = useState(true);

  function add() {
    if (!write) {
      showToast('Tick Write', true);
      return;
    }
    props.onAdd(['log.info', 'log.debug', 'log.error', 'log.fatal']);
  }

  return (
    <div className="card" style={{ padding: 10, marginBottom: 6 }}>
      <div className="toolbar" style={{ marginBottom: 6 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>Logging</div>
        <label
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          title="log.info / debug / error / fatal"
        >
          <input type="checkbox" checked={write} onChange={e => setWrite(e.target.checked)} /> Write
        </label>
        <span className="spacer" />
        <button className="btn btn-small" onClick={add}>
          Add
        </button>
        <button className="btn btn-secondary btn-small" onClick={props.onCancel}>
          Close
        </button>
      </div>
    </div>
  );
}
