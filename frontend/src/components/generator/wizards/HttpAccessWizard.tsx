import { useState } from 'react';
import { showToast } from '../../../lib/toast';

/*
 * Wizard granting outbound HTTP. Verb-level only - the whitelist cannot pin a URL, so a
 * granted verb reaches any address; the note says so.
 */
export default function HttpAccessWizard(
  props: Readonly<{ onAdd: (lines: string[]) => void; onCancel: () => void }>,
) {
  const [verbs, setVerbs] = useState<Record<string, boolean>>({
    get: true,
    post: false,
    put: false,
    patch: false,
    delete: false,
  });

  function toggle(verb: string, on: boolean) {
    setVerbs({ ...verbs, [verb]: on });
  }

  function add() {
    const lines = Object.keys(verbs)
      .filter(verb => verbs[verb])
      .map(verb => 'http.' + verb);
    if (lines.length === 0) {
      showToast('Tick at least one verb', true);
      return;
    }
    props.onAdd(lines);
  }

  return (
    <div className="card" style={{ padding: 10, marginBottom: 6 }}>
      <div className="toolbar" style={{ marginBottom: 6 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>Outbound HTTP</div>
        {['get', 'post', 'put', 'patch', 'delete'].map(verb => (
          <label key={verb} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              type="checkbox"
              checked={verbs[verb]}
              onChange={e => toggle(verb, e.target.checked)}
            />
            {verb.toUpperCase()}
          </label>
        ))}
        <span className="spacer" />
        <button className="btn btn-small" onClick={add}>
          Add
        </button>
        <button className="btn btn-secondary btn-small" onClick={props.onCancel}>
          Close
        </button>
      </div>
      <span className="muted" style={{ fontSize: 12 }}>
        A granted verb can call any URL.
      </span>
    </div>
  );
}
