import { describe, expect, it } from 'vitest';
import { nextSort } from './sort';

describe('nextSort', () => {
  it('starts a new column ascending', () => {
    expect(nextSort({ column: null, direction: 'asc' }, 'name')).toEqual({
      column: 'name',
      direction: 'asc',
    });
  });

  it('cycles the same column ascending → descending → off', () => {
    const desc = nextSort({ column: 'name', direction: 'asc' }, 'name');
    expect(desc).toEqual({ column: 'name', direction: 'desc' });
    expect(nextSort(desc, 'name')).toEqual({ column: null, direction: 'asc' });
  });

  it('switching column restarts ascending, whatever the old direction', () => {
    expect(nextSort({ column: 'name', direction: 'desc' }, 'created')).toEqual({
      column: 'created',
      direction: 'asc',
    });
  });
});
