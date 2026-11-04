// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SortHeader from './SortHeader';
import type { SortState } from '../lib/sort';

function renderHeader(sort: SortState, onSort = vi.fn()) {
  render(
    <table>
      <thead>
        <tr>
          <SortHeader column="name" label="Name" sort={sort} onSort={onSort} />
        </tr>
      </thead>
    </table>,
  );
  return { header: screen.getByRole('columnheader'), onSort };
}

describe('SortHeader', () => {
  it('is unsorted with no arrow when another column is sorted', () => {
    const { header } = renderHeader({ column: 'created', direction: 'asc' });
    expect(header).not.toHaveAttribute('aria-sort');
    expect(header).toHaveTextContent(/^Name$/);
  });

  it('shows the direction of the active column', () => {
    const { header } = renderHeader({ column: 'name', direction: 'desc' });
    expect(header).toHaveAttribute('aria-sort', 'descending');
    expect(header).toHaveTextContent('Name ↓');
  });

  it('advances the sort on click and on Enter/Space', async () => {
    const { header, onSort } = renderHeader({ column: 'name', direction: 'asc' });
    await userEvent.click(header);
    header.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onSort).toHaveBeenCalledTimes(3);
    expect(onSort).toHaveBeenCalledWith({ column: 'name', direction: 'desc' });
  });
});
