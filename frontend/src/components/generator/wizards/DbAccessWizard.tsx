import { useState } from 'react';

import { useDatabaseSelection } from '../../../lib/sql';
import { showToast } from '../../../lib/toast';
import Select from '../../Select';

/*
 * Wizard that turns "let this role reach database X with these verbs" into the slot
 * lines that grant it: [data.connect:X] pinned to the one database, plus a [data.*]
 * per ticked operation. Raw SQL adds [data.select]/[data.scalar]. Reuses the shared
 * database-selection hook so the dropdowns match the rest of the Generator.
 */
export default function DbAccessWizard(
  props: Readonly<{ onAdd: (lines: string[]) => void; onCancel: () => void }>,
) {
  const selection = useDatabaseSelection();
  const [read, setRead] = useState(true);
  const [create, setCreate] = useState(false);
  const [update, setUpdate] = useState(false);
  const [remove, setRemove] = useState(false);
  const [rawSql, setRawSql] = useState(false);

  function add() {
    if (!selection.database) {
      showToast('Choose a database first', true);
      return;
    }
    const lines = ['data.connect:' + selection.database];
    if (read) {
      lines.push('data.read');
    }
    if (create) {
      lines.push('data.create');
    }
    if (update) {
      lines.push('data.update');
    }
    if (remove) {
      lines.push('data.delete');
    }
    if (rawSql) {
      lines.push('data.select', 'data.scalar');
    }
    props.onAdd(lines);
  }

  return (
    <div className="card" style={{ padding: 10, marginBottom: 6 }}>
      <div className="toolbar" style={{ marginBottom: 6 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>Database access</div>
        {selection.types.length > 1 && (
          <Select value={selection.type} onChange={value => selection.setType(value)}>
            {selection.types.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        )}
        {selection.connectionStrings.length > 1 && (
          <Select
            value={selection.connectionString}
            onChange={value => selection.setConnectionString(value)}
          >
            {selection.connectionStrings.map(cs => (
              <option key={cs} value={cs}>
                {cs}
              </option>
            ))}
          </Select>
        )}
        <Select value={selection.database} onChange={value => selection.setDatabase(value)}>
          <option value="">database…</option>
          {selection.databasesMeta.map(db => (
            <option key={db.name} value={db.name}>
              {db.name}
            </option>
          ))}
        </Select>
        {selection.loading && (
          <span className="muted" style={{ fontSize: 12 }}>
            loading…
          </span>
        )}
      </div>
      <div className="toolbar">
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={read} onChange={e => setRead(e.target.checked)} />
          Read
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={create} onChange={e => setCreate(e.target.checked)} />
          Create
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={update} onChange={e => setUpdate(e.target.checked)} />
          Update
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={remove} onChange={e => setRemove(e.target.checked)} />
          Delete
        </label>
        <label
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          title="Adds data.select and data.scalar — raw SQL against this database"
        >
          <input type="checkbox" checked={rawSql} onChange={e => setRawSql(e.target.checked)} />
          Raw&nbsp;SQL
        </label>
        <span className="spacer" />
        <button className="btn btn-small" onClick={add} disabled={!selection.database}>
          Add
        </button>
        <button className="btn btn-secondary btn-small" onClick={props.onCancel}>
          Close
        </button>
      </div>
      <span className="muted" style={{ fontSize: 12 }}>
        Grants <span className="mono">data.connect:{selection.database || '…'}</span> pinned to this
        one database, plus a slot per ticked operation.
      </span>
    </div>
  );
}
