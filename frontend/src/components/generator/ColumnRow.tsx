import Select from '../Select';
import { ColumnLock, CrudColumn } from './types';

// One column of an expanded table: what it is, and, unless it is a primary key, what it is locked to.
export default function ColumnRow(
  props: Readonly<{
    column: CrudColumn;
    lock: ColumnLock;
    onLock: (lock: ColumnLock) => void;
  }>,
) {
  const { column, lock } = props;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '3px 0',
        fontSize: 13,
        // The lock controls drop to their own line when the row is too narrow for them.
        flexWrap: 'wrap',
      }}
    >
      <span className="mono">{column.name}</span>
      <span className="muted">{column.db}</span>
      {column.primary && <span className="badge badge-get">PK</span>}
      {column.automatic && <span className="badge badge-debug">auto</span>}
      {column.foreign_key && (
        <span className="badge badge-info">
          FK → {column.foreign_key.foreign_table}.{column.foreign_key.foreign_column}
        </span>
      )}
      {column.nullable && <span className="muted">nullable</span>}
      {/*
       * Primary keys identify the row in PUT and DELETE, so they cannot
       * be locked. Every other column can hold its row's owner.
       */}
      {!column.primary && (
        <span
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span className="muted" style={{ whiteSpace: 'nowrap' }}>
            Lock to
          </span>
          <Select
            value={lock.mode}
            onChange={value => props.onLock({ mode: value as ColumnLock['mode'], slot: lock.slot })}
          >
            <option value="none">Not locked</option>
            <option value="username">Current username</option>
            <option value="custom">Custom slot…</option>
          </Select>
          {lock.mode === 'custom' && (
            <input
              type="text"
              placeholder="slot name"
              style={{ minWidth: 160 }}
              value={lock.slot}
              onChange={e => props.onLock({ mode: 'custom', slot: e.target.value })}
            />
          )}
        </span>
      )}
    </div>
  );
}
