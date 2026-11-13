import { useEffect, useRef, useState } from 'react';

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

/*
 * Plays a CSS animation class on an element. It is removed and added again on the next frame, so
 * an element that is still flashing from an earlier click starts over. Returns the cleanup.
 */
function flash(element: HTMLElement, className: string) {
  element.classList.remove(className);
  const frame = requestAnimationFrame(() => element.classList.add(className));
  const done = () => element.classList.remove(className);
  element.addEventListener('animationend', done, { once: true });
  return () => {
    cancelAnimationFrame(frame);
    element.removeEventListener('animationend', done);
  };
}

// The column a reference in another card points at. A fresh object per click, so a repeat click
// flashes again.
export interface ColumnTarget {
  column: string;
}

// One table in the Designer — its columns, foreign keys and actions.
export default function TableCard(
  props: Readonly<{
    table: TableMeta;
    onAddColumn: () => void;
    onViewDdl: () => void;
    onDropTable: () => void;
    onDropColumn: (columnName: string) => void;
    // The tables on the page, so a reference to one of them can link to its card.
    knownTables: ReadonlySet<string>;
    onOpenTable: (tableName: string, columnName: string) => void;
    // Set when a reference was clicked to come here: scroll to it and highlight it.
    target: ColumnTarget | null;
  }>,
) {
  const { table, target } = props;
  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const columns = table.columns ?? [];

  /*
   * A target column in the collapsed part of the list is revealed first. This is done while
   * rendering (React's pattern for state that follows a prop) rather than in an effect, so the
   * row is already in the DOM when the effect below scrolls to it.
   */
  const [seenTarget, setSeenTarget] = useState<ColumnTarget | null>(null);
  if (target !== seenTarget) {
    setSeenTarget(target);
    if (target && columns.findIndex(column => column.name === target.column) >= COLLAPSED_COLUMNS) {
      setExpanded(true);
    }
  }

  useEffect(() => {
    const card = cardRef.current;
    if (!target || !card) {
      return;
    }
    const row = [...card.querySelectorAll<HTMLElement>('[data-column]')].find(
      element => element.dataset.column === target.column,
    );
    const reduceMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    // The row rather than the card, so the column is on screen even in a long table.
    (row ?? card).scrollIntoView?.({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    card.focus({ preventScroll: true });
    const stopCard = flash(card, 'schema-card-flash');
    const stopRow = row ? flash(row, 'schema-col-flash') : undefined;
    return () => {
      stopCard();
      stopRow?.();
    };
  }, [target]);

  const foreignKeys = table.foreign_keys ?? [];
  const foreignKeyColumns = new Set(foreignKeys.map(fk => fk.column));
  const collapsible = columns.length > COLLAPSED_COLUMNS + COLLAPSE_SLACK;
  const shown = collapsible && !expanded ? columns.slice(0, COLLAPSED_COLUMNS) : columns;

  let meta = plural(columns.length, 'column');
  if (foreignKeys.length > 0) {
    meta += ' · ' + plural(foreignKeys.length, 'reference');
  }

  return (
    // tabIndex -1: focusable from code, so a reference can move focus here, not by Tab.
    <section className="card schema-card" aria-label={table.name} tabIndex={-1} ref={cardRef}>
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
            <li key={column.name} className="schema-col col-row" data-column={column.name}>
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
              {props.knownTables.has(fk.foreign_table) ? (
                <button
                  type="button"
                  className="schema-fk-target schema-fk-link"
                  title={'Go to ' + fk.foreign_table + '.' + fk.foreign_column}
                  onClick={() => props.onOpenTable(fk.foreign_table, fk.foreign_column)}
                >
                  {fk.foreign_table}.{fk.foreign_column}
                </button>
              ) : (
                <span className="schema-fk-target">
                  {fk.foreign_table}.{fk.foreign_column}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
