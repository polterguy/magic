import { Fragment } from 'react';
import { ChevronIcon } from '../Icons';
import ColumnRow from './ColumnRow';
import { defaultLock } from './crudify';
import { CrudTabState } from './hooks/useCrudTab';

// The selected database's tables, each one ticked for generation or expanded to lock its columns.
export default function CrudTablePicker({ crud }: Readonly<{ crud: CrudTabState }>) {
  const {
    tables,
    selectedTables,
    setSelectedTables,
    allSelected,
    expandedTables,
    toggleExpanded,
    toggleTable,
    locks,
    setColumnLock,
  } = crud;
  return (
    <div className="card gen-table-card" style={{ padding: 0, overflow: 'auto', maxWidth: 460 }}>
      <table className="compact-table">
        <thead>
          <tr>
            <th style={{ width: 40 }}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() =>
                  setSelectedTables(
                    allSelected ? new Set() : new Set(tables.map(table => table.name)),
                  )
                }
              />
            </th>
            <th>Table</th>
            <th style={{ width: 130 }}>
              {selectedTables.size} of {tables.length} selected
            </th>
          </tr>
        </thead>
        <tbody>
          {tables.map(table => (
            <Fragment key={table.name}>
              <tr
                className="clickable"
                title="Click to show columns"
                onClick={() => toggleExpanded(table.name)}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={selectedTables.has(table.name)}
                    onChange={() => toggleTable(table.name)}
                    onClick={e => e.stopPropagation()}
                  />
                </td>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span className="tree-chevron">
                      <ChevronIcon open={expandedTables.has(table.name)} />
                    </span>
                    <strong>{table.name}</strong>
                  </span>
                </td>
                <td>{table.columns?.length ?? 0} columns</td>
              </tr>
              {expandedTables.has(table.name) && (
                <tr>
                  {/*
                   * 80px left padding lines the column names up directly
                   * under the table name above: 40px checkbox column +
                   * cell padding + the expand chevron and its gap.
                   */}
                  <td colSpan={3} style={{ padding: '4px 14px 12px 80px' }}>
                    {(table.columns ?? []).map(column => (
                      <ColumnRow
                        key={column.name}
                        column={column}
                        lock={locks[table.name]?.[column.name] ?? defaultLock(column)}
                        onLock={next => setColumnLock(table.name, column.name, next)}
                      />
                    ))}
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
