import { useState } from 'react';

import type { TableMeta } from '../../lib/api';
import { FIELD_TYPES } from '../../lib/dbTypes';
import { Modal } from '../Dialogs';
import Select from '../Select';
import Tabs from '../Tabs';
import {
  canAddColumn,
  type ColumnPayload,
  columnPayload,
  defaultFieldType,
  foreignPrimaryKey,
  referenceableTables,
} from './schema';

/*
 * Add-column dialog — a plain field, or a foreign key referencing another
 * table (Field vs Foreign key tab).
 */
export default function AddColumnDialog(
  props: Readonly<{
    databaseType: string;
    tableName: string;
    tables: TableMeta[];
    onClose: () => void;
    onSubmit: (payload: ColumnPayload) => void;
  }>,
) {
  const fieldTypes = FIELD_TYPES[props.databaseType] ?? FIELD_TYPES.sqlite;
  const [mode, setMode] = useState('field');
  const [columnName, setColumnName] = useState('');
  // Default to a text column — the most common case — rather than the first
  // (numeric) type: the exact `text` where a dialect has it, else varchar/nvarchar.
  const [fieldType, setFieldType] = useState(defaultFieldType(fieldTypes));
  const [columnLength, setColumnLength] = useState('255');
  const [defaultValue, setDefaultValue] = useState('');
  const [nullable, setNullable] = useState(true);
  const [foreignTable, setForeignTable] = useState('');
  const [cascading, setCascading] = useState(true);

  // The foreign field is the referenced table's primary key.
  const foreignPk = foreignPrimaryKey(props.tables, foreignTable);

  function submit() {
    const payload = columnPayload(mode, {
      columnName,
      fieldTypes,
      fieldType,
      columnLength,
      defaultValue,
      nullable,
      foreignTable,
      foreignPk,
      cascading,
    });
    if (payload) {
      props.onSubmit(payload);
    }
  }

  return (
    <Modal width={520} onClose={props.onClose} onSubmit={submit}>
      <h2>Add column to {props.tableName}</h2>
      <Tabs
        tabs={[
          { id: 'field', label: 'Field' },
          { id: 'foreign', label: 'Foreign key' },
        ]}
        active={mode}
        onChange={setMode}
      />
      <div className="form-grid">
        <label>
          Column name{' '}
          <input type="text" value={columnName} onChange={e => setColumnName(e.target.value)} />
        </label>
        {mode === 'field' ? (
          <>
            <label>
              Type
              <Select
                value={fieldType.name}
                onChange={value => {
                  const next = fieldTypes.find(candidate => candidate.name === value)!;
                  setFieldType(next);
                  if (next.varcharDefault) {
                    setColumnLength(String(next.varcharDefault));
                  }
                }}
              >
                {fieldTypes.map(candidate => (
                  <option key={candidate.name} value={candidate.name}>
                    {candidate.name}
                  </option>
                ))}
              </Select>
            </label>
            {fieldType.size && (
              <label>
                Length{' '}
                <input
                  type="number"
                  value={columnLength}
                  onChange={e => setColumnLength(e.target.value)}
                />
              </label>
            )}
            <label>
              Default value (optional){' '}
              <input
                type="text"
                value={defaultValue}
                onChange={e => setDefaultValue(e.target.value)}
              />
            </label>
          </>
        ) : (
          <>
            <label>
              References table
              <Select value={foreignTable} onChange={value => setForeignTable(value)}>
                <option value="">Select table…</option>
                {referenceableTables(props.tables).map(table => (
                  <option key={table.name} value={table.name}>
                    {table.name}
                  </option>
                ))}
              </Select>
            </label>
            {foreignPk && (
              <div className="muted" style={{ fontSize: 13 }}>
                References {foreignTable}.{foreignPk.name} ({foreignPk.hl})
              </div>
            )}
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={cascading}
                onChange={e => setCascading(e.target.checked)}
              />{' '}
              Cascade on delete
            </label>
          </>
        )}
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={nullable} onChange={e => setNullable(e.target.checked)} />{' '}
          Nullable
        </label>
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>
          Cancel
        </button>
        <button
          className="btn"
          disabled={!canAddColumn(columnName, mode, foreignPk)}
          onClick={submit}
        >
          Add
        </button>
      </div>
    </Modal>
  );
}
