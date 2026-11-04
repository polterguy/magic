/*
 * Sortable table-column header. Clicking cycles a column through
 * ascending → descending → off, showing an arrow for the current state.
 * Only columns the backend can actually sort on should use this.
 */

import { type SortState, nextSort } from '../lib/sort';

const ARROWS = { asc: ' ↑', desc: ' ↓' } as const;
const ARIA_SORT = { asc: 'ascending', desc: 'descending' } as const;

export default function SortHeader(
  props: Readonly<{
    column: string;
    label: string;
    sort: SortState;
    onSort: (sort: SortState) => void;
    style?: React.CSSProperties;
  }>,
) {
  const active = props.sort.column === props.column;
  const arrow = active ? ARROWS[props.sort.direction] : '';

  function advance() {
    props.onSort(nextSort(props.sort, props.column));
  }

  return (
    <th
      style={{ cursor: 'pointer', userSelect: 'none', ...props.style }}
      tabIndex={0}
      role="columnheader"
      aria-sort={active ? ARIA_SORT[props.sort.direction] : undefined}
      onClick={advance}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          advance();
        }
      }}
    >
      {props.label}
      <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{arrow}</span>
    </th>
  );
}
