// @vitest-environment jsdom
/*
 * One table in the Designer: its columns with key and nullability markers, its references, the
 * collapse of a long column list, and the actions.
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { TableMeta } from '../../../lib/api';
import TableCard, { type ColumnTarget } from '../TableCard';

function renderCard(table: TableMeta, target: ColumnTarget | null = null) {
  const handlers = {
    onAddColumn: vi.fn(),
    onViewDdl: vi.fn(),
    onDropTable: vi.fn(),
    onDropColumn: vi.fn(),
    onOpenTable: vi.fn(),
  };
  render(
    <TableCard
      table={table}
      knownTables={new Set(['tasks', 'task_due'])}
      target={target}
      {...handlers}
    />,
  );
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

  it('links a reference to a table on the page', async () => {
    const handlers = renderCard(taskDue);

    await userEvent.click(screen.getByRole('button', { name: 'tasks.id' }));
    expect(handlers.onOpenTable).toHaveBeenCalledWith('tasks', 'id');
  });

  it('shows a reference to a table that is not on the page as plain text', () => {
    renderCard({
      ...taskDue,
      foreign_keys: [{ column: 'task', foreign_table: 'elsewhere', foreign_column: 'id' }],
    });

    expect(screen.getByText('elsewhere.id')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'elsewhere.id' })).not.toBeInTheDocument();
  });

  it('focuses and highlights the card and the target column', async () => {
    renderCard(taskDue, { column: 'task' });

    const card = screen.getByRole('region', { name: 'task_due' });
    expect(card).toHaveFocus();
    await waitFor(() => expect(card).toHaveClass('schema-card-flash'));
    expect(row('task')).toHaveClass('schema-col-flash');
    expect(row('id')).not.toHaveClass('schema-col-flash');
  });

  it('expands a collapsed table to reveal the target column', async () => {
    const columns = Array.from({ length: 22 }, (_, index) => ({ name: 'c' + index, db: 'TEXT' }));
    renderCard({ name: 'wide', columns }, { column: 'c18' });

    expect(screen.getAllByRole('listitem')).toHaveLength(22);
    await waitFor(() => expect(row('c18')).toHaveClass('schema-col-flash'));
    expect(screen.getByRole('button', { name: 'Show fewer columns' })).toBeInTheDocument();
  });
});
