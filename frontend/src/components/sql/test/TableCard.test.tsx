// @vitest-environment jsdom
/*
 * One table in the Designer: its columns with key and nullability markers, its references, the
 * collapse of a long column list, and the actions.
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { TableMeta } from '../../../lib/api';
import TableCard from '../TableCard';

function renderCard(table: TableMeta) {
  const handlers = {
    onAddColumn: vi.fn(),
    onViewDdl: vi.fn(),
    onDropTable: vi.fn(),
    onDropColumn: vi.fn(),
  };
  render(<TableCard table={table} {...handlers} />);
  return handlers;
}

const taskDue: TableMeta = {
  name: 'task_due',
  columns: [
    { name: 'id', db: 'INTEGER', primary: true },
    { name: 'task', db: 'varchar(256)' },
    { name: 'repeats', db: 'TEXT', nullable: true },
  ],
  foreign_keys: [{ column: 'task', foreign_table: 'tasks', foreign_column: 'id' }],
};

function row(name: string) {
  return screen.getByText(name, { selector: '.schema-col-name' }).closest('li')!;
}

describe('TableCard', () => {
  it('shows the table, its column count and its references', () => {
    renderCard(taskDue);

    expect(screen.getByRole('heading', { name: 'task_due' })).toBeInTheDocument();
    expect(screen.getByText('3 columns · 1 reference')).toBeInTheDocument();
    expect(screen.getByText('tasks.id')).toBeInTheDocument();
  });

  it('marks primary keys, foreign keys and nullable columns', () => {
    renderCard(taskDue);

    expect(within(row('id')).getByText('PK')).toBeInTheDocument();
    expect(within(row('task')).getByText('FK')).toBeInTheDocument();
    expect(within(row('repeats')).getByText('null')).toBeInTheDocument();
    expect(within(row('task')).queryByText('null')).not.toBeInTheDocument();
  });

  it('offers to drop every column but the primary key', async () => {
    const handlers = renderCard(taskDue);

    expect(within(row('id')).queryByRole('button')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Drop column task' }));
    expect(handlers.onDropColumn).toHaveBeenCalledWith('task');
  });

  it('wires the table actions', async () => {
    const handlers = renderCard(taskDue);

    await userEvent.click(screen.getByRole('button', { name: 'Add column' }));
    await userEvent.click(screen.getByRole('button', { name: 'View DDL' }));
    await userEvent.click(screen.getByRole('button', { name: 'Drop table' }));

    expect(handlers.onAddColumn).toHaveBeenCalled();
    expect(handlers.onViewDdl).toHaveBeenCalled();
    expect(handlers.onDropTable).toHaveBeenCalled();
  });

  it('collapses a long column list until expanded', async () => {
    const columns = Array.from({ length: 22 }, (_, index) => ({ name: 'c' + index, db: 'TEXT' }));
    renderCard({ name: 'wide', columns });

    expect(screen.getAllByRole('listitem')).toHaveLength(10);
    await userEvent.click(screen.getByRole('button', { name: 'Show all 22 columns' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(22);
    await userEvent.click(screen.getByRole('button', { name: 'Show fewer columns' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(10);
  });

  it('shows every column of a table only a little over the limit', () => {
    const columns = Array.from({ length: 12 }, (_, index) => ({ name: 'c' + index, db: 'TEXT' }));
    renderCard({ name: 'almost', columns });

    expect(screen.getAllByRole('listitem')).toHaveLength(12);
    expect(screen.queryByRole('button', { name: /Show all/ })).not.toBeInTheDocument();
  });
});
