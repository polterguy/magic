import type { TableMeta } from '@shared/api';
import { Modal } from '@shared/ui/Dialogs';
import OptionPill from '@shared/ui/OptionPill';
import Select from '@shared/ui/Select';
import Tabs from '@shared/ui/Tabs';
import { useState } from 'react';

import { FIELD_TYPES } from '../lib/dbTypes';
import {
  canAddColumn,
  type ColumnPayload,
  columnPayload,
  defaultFieldType,
  foreignPrimaryKey,
  referenceableTables,
} from '../lib/schema';

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
    <Modal
      size="sm"
      onClose={props.onClose}
      onSubmit={submit}
      title={'Add column to ' + props.tableName}
      actions={
        <>
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
        </>
      }
    >
      <Tabs
        tabs={[
          { id: 'field', label: 'Field' },
          { id: 'foreign', label: 'Foreign key' },
        ]}
        active={mode}
        onChange={setMode}
      />
      {/* A plain column, not a form-grid, holds the pills: form-grid restyles every label in it. */}
      <div className="modal-section">
        <div className="form-grid">
          <label>
            Column name{' '}
            <input type="text" value={columnName} onChange={e => setColumnName(e.target.value)} />
          </label>
          {mode === 'field' ? (
            <>
              <div className={fieldType.size ? 'form-cols-2' : 'form-grid'}>
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
              </div>
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
                <span className="modal-hint">
                  References {foreignTable}.{foreignPk.name} ({foreignPk.hl})
                </span>
              )}
            </>
          )}
        </div>
        <div className="pill-row">
          {mode !== 'field' && (
            <OptionPill label="Cascade on delete" checked={cascading} onChange={setCascading} />
          )}
          <OptionPill label="Nullable" checked={nullable} onChange={setNullable} />
        </div>
      </div>
    </Modal>
  );
}
