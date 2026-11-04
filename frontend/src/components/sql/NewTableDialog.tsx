import { useState } from 'react';

import { PK_TYPES } from '../../lib/dbTypes';
import { Modal } from '../Dialogs';
import Select from '../Select';
import { canCreateTable, primaryKeyName } from './schema';

/*
 * Create-table dialog — a primary key column, auto-increment or varchar,
 * matching the old designer.
 */
export default function NewTableDialog(
  props: Readonly<{
    onClose: () => void;
    onCreate: (tableName: string, pkName: string, pkType: string, pkLength: number) => void;
  }>,
) {
  const [tableName, setTableName] = useState('');
  const [pkName, setPkName] = useState('');
  const [pkType, setPkType] = useState('auto_increment');
  const [pkLength, setPkLength] = useState('10');

  // Derive the PK name from the table name like the old dialog does.
  function onTableName(value: string) {
    setTableName(value);
    if (value) {
      setPkName(primaryKeyName(value));
    }
  }

  return (
    <Modal
      onClose={props.onClose}
      onSubmit={() => {
        if (canCreateTable(tableName, pkName))
          props.onCreate(tableName, pkName, pkType, Number(pkLength));
      }}
    >
      <h2>New table</h2>
      <div className="form-grid">
        <label>
          Table name
          <input type="text" value={tableName} onChange={e => onTableName(e.target.value)} />
        </label>
        <label>
          Primary key name
          <input type="text" value={pkName} onChange={e => setPkName(e.target.value)} />
        </label>
        <label>
          Primary key type
          <Select value={pkType} onChange={value => setPkType(value)}>
            {PK_TYPES.map(option => (
              <option key={option.value} value={option.value}>
                {option.name}
              </option>
            ))}
          </Select>
        </label>
        {pkType === 'varchar' && (
          <label>
            Primary key length
            <input type="number" value={pkLength} onChange={e => setPkLength(e.target.value)} />
          </label>
        )}
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>
          Cancel
        </button>
        <button
          className="btn"
          disabled={!canCreateTable(tableName, pkName)}
          onClick={() => props.onCreate(tableName, pkName, pkType, Number(pkLength))}
        >
          Create
        </button>
      </div>
    </Modal>
  );
}
