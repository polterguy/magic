// @vitest-environment jsdom
/*
 * The Designer's table filter, and a reference taking you to the card it points at, clearing a
 * filter that hides that card.
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { TableMeta } from '../../../lib/api';
import DesignerView from '../DesignerView';
import type { SchemaDesigner } from '../hooks/useSchemaDesigner';

const tables: TableMeta[] = [
  {
    name: 'task_due',
    columns: [
      { name: 'id', db: 'INTEGER', primary: true },
      { name: 'task', db: 'varchar(256)' },
    ],
    foreign_keys: [{ column: 'task', foreign_table: 'tasks', foreign_column: 'id' }],
  },
  {
    name: 'tasks',
    columns: [
      { name: 'id', db: 'varchar(256)', primary: true },
      { name: 'hyperlambda', db: 'TEXT' },
    ],
  },
];

function renderView() {
  const designer = {
    ddl: null,
    setDdl: vi.fn(),
    newTable: false,
    setNewTable: vi.fn(),
    addingColumn: null,
    setAddingColumn: vi.fn(),
    importCsv: vi.fn(),
    flushCache: vi.fn(),
    viewDdl: vi.fn(),
    dropTableConfirmed: vi.fn(),
    dropColumnConfirmed: vi.fn(),
  } as unknown as SchemaDesigner;
  render(
    <DesignerView
      type="sqlite"
      connectionString="generic"
      database="magic"
      tables={tables}
      designer={designer}
    />,
  );
}

const card = (name: string) => screen.queryByRole('region', { name });

describe('DesignerView', () => {
  it('filters the tables by table or column name', async () => {
    renderView();

    await userEvent.type(screen.getByLabelText('Filter tables or columns'), 'hyper');

    expect(card('tasks')).toBeInTheDocument();
    expect(card('task_due')).not.toBeInTheDocument();
    expect(screen.getByText('1 of 2 tables')).toBeInTheDocument();
  });

  it('a reference takes you to the referenced card and column', async () => {
    renderView();

    await userEvent.click(screen.getByRole('button', { name: 'tasks.id' }));

    const target = card('tasks')!;
    expect(target).toHaveFocus();
    await waitFor(() => expect(target).toHaveClass('schema-card-flash'));
    const idRow = within(target).getByText('id', { selector: '.schema-col-name' }).closest('li');
    expect(idRow).toHaveClass('schema-col-flash');
  });

  it('clears a filter that hides the referenced card', async () => {
    renderView();
    const filter = screen.getByLabelText('Filter tables or columns');
    await userEvent.type(filter, 'task_due');
    expect(card('tasks')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'tasks.id' }));

    expect(filter).toHaveValue('');
    expect(card('tasks')).toHaveFocus();
  });
});
