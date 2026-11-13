import { useState } from 'react';

import type { TableMeta } from '../../lib/api';
import { CodeFileIcon, PlusIcon, TrashIcon } from '../Icons';

/*
 * A table with more columns than this shows its first COLLAPSED_COLUMNS until expanded, so one
 * wide table does not stretch the Designer far down the page. A table only a couple of columns
 * over the limit shows them all, because a "show 1 more" toggle helps nobody.
 */
const COLLAPSED_COLUMNS = 10;
const COLLAPSE_SLACK = 2;

function plural(count: number, word: string) {
  return count + ' ' + word + (count === 1 ? '' : 's');
}

// One table in the Designer — its columns, foreign keys and actions.
export default function TableCard(
  props: Readonly<{
    table: TableMeta;
    onAddColumn: () => void;
    onViewDdl: () => void;
    onDropTable: () => void;
    onDropColumn: (columnName: string) => void;
  }>,
) {
  const { table } = props;
  const [expanded, setExpanded] = useState(false);
  const columns = table.columns ?? [];
  const foreignKeys = table.foreign_keys ?? [];
  const foreignKeyColumns = new Set(foreignKeys.map(fk => fk.column));
  const collapsible = columns.length > COLLAPSED_COLUMNS + COLLAPSE_SLACK;
  const shown = collapsible && !expanded ? columns.slice(0, COLLAPSED_COLUMNS) : columns;

  let meta = plural(columns.length, 'column');
  if (foreignKeys.length > 0) {
    meta += ' · ' + plural(foreignKeys.length, 'reference');
  }

  return (
    <section className="card schema-card" aria-label={table.name}>
      <header className="schema-card-head">
        <div className="schema-card-title">
          <h3>{table.name}</h3>
          <span className="schema-card-meta">{meta}</span>
        </div>
        <div className="schema-card-actions">
          <button
            className="icon-btn"
            title="Add column"
            aria-label="Add column"
            onClick={props.onAddColumn}
          >
            <PlusIcon />
          </button>
          <button
            className="icon-btn"
            title="View DDL"
            aria-label="View DDL"
            onClick={props.onViewDdl}
          >
            <CodeFileIcon />
          </button>
          <button
            className="icon-btn danger"
            title="Drop table"
            aria-label="Drop table"
            onClick={props.onDropTable}
          >
            <TrashIcon />
          </button>
        </div>
      </header>
      {columns.length === 0 ? (
        <p className="schema-card-empty">No columns</p>
      ) : (
        <ul className="schema-cols">
          {shown.map(column => (
            <li key={column.name} className="schema-col col-row">
              <span className="schema-col-name" title={column.name}>
                {column.name}
              </span>
              {column.primary && (
                <span className="schema-badge pk" title="Primary key">
                  PK
                </span>
              )}
              {foreignKeyColumns.has(column.name) && (
                <span className="schema-badge fk" title="Foreign key">
                  FK
                </span>
              )}
              <span className="schema-col-type">
                {column.db}
                {column.nullable && (
                  <span className="schema-col-null" title="Nullable">
                    null
                  </span>
                )}
              </span>
              {/* The drop slot is always there, empty for a primary key, so the types line up. */}
              <span className="schema-col-drop">
                {!column.primary && (
                  <button
                    className="icon-btn danger col-drop"
                    title="Drop column"
                    aria-label={'Drop column ' + column.name}
                    onClick={() => props.onDropColumn(column.name)}
                  >
                    <TrashIcon />
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      {collapsible && (
        <button
          type="button"
          className="schema-more"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show fewer columns' : 'Show all ' + columns.length + ' columns'}
        </button>
      )}
      {foreignKeys.length > 0 && (
        <div className="schema-fks">
          <span className="schema-fks-label">References</span>
          {foreignKeys.map(fk => (
            <div key={fk.column + '>' + fk.foreign_table + '.' + fk.foreign_column}>
              {fk.column} →{' '}
              <span className="schema-fk-target">
                {fk.foreign_table}.{fk.foreign_column}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
