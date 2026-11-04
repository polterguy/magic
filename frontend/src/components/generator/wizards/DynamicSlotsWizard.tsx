import { useEffect, useState } from 'react';
import { showToast } from '../../../lib/toast';
import { listDynamicSlots } from '../../../lib/api';
import SearchInput from '../../SearchInput';

/*
 * Wizard granting dynamic-slot invocation. [execute]/[signal]/[try-signal] do NOT
 * implement IWhitelistComparer, so pinning them works exactly like any other slot: an
 * unpinned [execute] would let a caller name ANY dynamic slot as its argument — the fact
 * that the slot's own internal lookup separately re-checks a [signal:<name>] pin before
 * actually resolving one is a second, independent gate, not a reason to leave the outer
 * grant open-ended. So every picked slot gets all three aliases pinned individually —
 * [execute:<name>], [signal:<name>], [try-signal:<name>] — never a bare alias. Names come
 * from [slots.vocabulary] (GET /magic/system/evaluator/slots), fetched once per wizard
 * open so the list always reflects what the server currently has.
 */
export default function DynamicSlotsWizard(
  props: Readonly<{ onAdd: (lines: string[]) => void; onCancel: () => void }>,
) {
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [chosen, setChosen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    listDynamicSlots()
      .then(setSlots)
      .catch(() => showToast('Could not load dynamic slots', true))
      .finally(() => setLoading(false));
  }, []);

  const shown = slots.filter(name => !filter || name.toLowerCase().includes(filter.toLowerCase()));
  const count = Object.values(chosen).filter(Boolean).length;

  function add() {
    const picked = Object.keys(chosen).filter(name => chosen[name]);
    if (picked.length === 0) {
      showToast('Pick at least one dynamic slot', true);
      return;
    }
    const lines = picked.flatMap(name => [
      'execute:' + name,
      'signal:' + name,
      'try-signal:' + name,
    ]);
    props.onAdd(lines);
  }

  return (
    <div className="card" style={{ padding: 10, marginBottom: 6 }}>
      <div className="toolbar" style={{ marginBottom: 6 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>Dynamic slots</div>
        <span className="spacer" />
        <button className="btn btn-small" onClick={add} disabled={count === 0}>
          Add
        </button>
        <button className="btn btn-secondary btn-small" onClick={props.onCancel}>
          Close
        </button>
      </div>
      <div className="toolbar" style={{ marginBottom: 6 }}>
        <SearchInput placeholder="Filter dynamic slots…" value={filter} onChange={setFilter} />
        {count > 0 && (
          <span className="muted" style={{ fontSize: 12 }}>
            {count} selected
          </span>
        )}
      </div>
      <div className="card" style={{ maxHeight: 180, overflow: 'auto', padding: 6 }}>
        {loading && (
          <span className="muted" style={{ fontSize: 12 }}>
            loading…
          </span>
        )}
        {!loading && shown.length === 0 && (
          <span className="muted" style={{ fontSize: 12 }}>
            No dynamic slots found.
          </span>
        )}
        {shown.map(name => (
          <label
            key={name}
            className="checkbox-row wizard-pick-row"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
          >
            <input
              type="checkbox"
              checked={!!chosen[name]}
              onChange={e => setChosen({ ...chosen, [name]: e.target.checked })}
            />
            <span className="mono">{name}</span>
          </label>
        ))}
      </div>
      <span className="muted" style={{ fontSize: 12 }}>
        Each pick pins all three aliases to this exact slot —{' '}
        <span className="mono">execute:&lt;name&gt;</span>,{' '}
        <span className="mono">signal:&lt;name&gt;</span>,{' '}
        <span className="mono">try-signal:&lt;name&gt;</span> — never a bare alias, so this role can
        never name a different dynamic slot at either check.
      </span>
    </div>
  );
}
