/*
 * Sort state for the sortable table-column header (components/SortHeader),
 * kept apart so that file exports only a component, as fast refresh wants.
 */

import { useState } from 'react';

export interface SortState {
  column: string | null;
  direction: 'asc' | 'desc';
}

const UNSORTED: SortState = { column: null, direction: 'asc' };

export function useSort(initial: SortState = UNSORTED) {
  return useState<SortState>(initial);
}

/*
 * Advances the sort state for the clicked column through the 3-click cycle.
 */
export function nextSort(current: SortState, column: string): SortState {
  if (current.column !== column) {
    return { column, direction: 'asc' };
  }
  if (current.direction === 'asc') {
    return { column, direction: 'desc' };
  }
  return { column: null, direction: 'asc' };
}
