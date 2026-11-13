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
    <div className="gen-col">
      <div className="gen-col-info">
        <span className="mono gen-col-name">{column.name}</span>
        <span className="muted">{column.db}</span>
        {column.primary && <span className="badge badge-get">PK</span>}
        {column.automatic && <span className="badge badge-debug">auto</span>}
        {column.foreign_key && (
          <span className="badge badge-info">
            FK → {column.foreign_key.foreign_table}.{column.foreign_key.foreign_column}
          </span>
        )}
        {column.nullable && <span className="muted gen-col-null">nullable</span>}
      </div>
      {/*
       * Primary keys identify the row in PUT and DELETE, so they cannot
       * be locked. Every other column can hold its row's owner.
       */}
      {!column.primary && (
        <div className="gen-col-lock">
          <Select
            className="select-sm"
            ariaLabel={'Lock ' + column.name + ' to'}
            value={lock.mode}
            onChange={value => props.onLock({ mode: value as ColumnLock['mode'], slot: lock.slot })}
          >
            <option value="none">Not locked</option>
            <option value="username">Current username</option>
            <option value="custom">Custom slot…</option>
          </Select>
        </div>
      )}
      {!column.primary && lock.mode === 'custom' && (
        <input
          type="text"
          className="gen-col-slot"
          placeholder="slot name"
          aria-label={'Slot for ' + column.name}
          value={lock.slot}
          onChange={e => props.onLock({ mode: 'custom', slot: e.target.value })}
        />
      )}
    </div>
  );
}
