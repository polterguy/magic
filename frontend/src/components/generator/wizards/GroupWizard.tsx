import { useState } from 'react';
import { showToast } from '../../../lib/toast';
import { WizardSpec } from '../types';

/*
 * Generic capability wizard: a checkbox per named group of slots. Ticking a group and
 * pressing Add merges that group's slots into the editor. Drives the Tier-2 wizards,
 * which are all "pick which sub-capabilities" with no extra parameters.
 */

export default function GroupWizard(
  props: Readonly<{ spec: WizardSpec; onAdd: (lines: string[]) => void; onCancel: () => void }>,
) {
  const [on, setOn] = useState<Record<string, boolean>>(
    Object.fromEntries(props.spec.groups.map(g => [g.key, props.spec.defaults.includes(g.key)])),
  );

  function add() {
    const lines: string[] = [];
    for (const group of props.spec.groups) {
      if (on[group.key]) {
        lines.push(...group.slots);
      }
    }
    if (lines.length === 0) {
      showToast('Tick at least one option', true);
      return;
    }
    props.onAdd([...new Set(lines)]);
  }

  return (
    <div className="card" style={{ padding: 10, marginBottom: 6 }}>
      <div className="toolbar" style={{ marginBottom: props.spec.note ? 6 : 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{props.spec.title}</div>
        {props.spec.groups.map(group => (
          <label
            key={group.key}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            title={group.title}
          >
            <input
              type="checkbox"
              checked={on[group.key]}
              onChange={e => setOn({ ...on, [group.key]: e.target.checked })}
            />
            {group.label}
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
      {props.spec.note && (
        <span className="muted" style={{ fontSize: 12 }}>
          {props.spec.note}
        </span>
      )}
    </div>
  );
}
