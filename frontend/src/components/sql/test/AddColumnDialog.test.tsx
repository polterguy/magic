// @vitest-environment jsdom
/*
 * AddColumnDialog: a plain field (type defaulting to text, length shown only for sized types) or
 * a foreign key (referenceable tables only, typed after the referenced primary key). Add is gated
 * on a column name, and on a resolvable primary key for foreign keys; Enter submits.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { TableMeta } from '../../../lib/api';
import AddColumnDialog from '../AddColumnDialog';

const TABLES: TableMeta[] = [
  {
    name: 'customers',
    columns: [
      { name: 'id', db: 'integer', primary: true, hl: 'long' },
      { name: 'name', db: 'text', hl: 'string' },
    ],
  },
  {
    name: 'codes',
    columns: [{ name: 'code', db: 'text', primary: true, hl: 'string' }],
  },
  { name: 'logs', columns: [{ name: 'line', db: 'text', hl: 'string' }] },
  { name: 'empty' },
];

function renderDialog(databaseType = 'sqlite') {
  const onClose = vi.fn();
  const onSubmit = vi.fn();
  render(
    <AddColumnDialog
      databaseType={databaseType}
      tableName="orders"
      tables={TABLES}
      onClose={onClose}
      onSubmit={onSubmit}
    />,
  );
  return { onClose, onSubmit };
}

// The select trigger showing `shown` — its label wraps it, so its name is not just the value.
function trigger(shown: string) {
  return screen
    .getAllByRole('button')
    .find(button => button.textContent === shown + '▾') as HTMLElement;
}

async function pick(shown: string, option: string) {
  await userEvent.click(trigger(shown));
  await userEvent.click(screen.getByRole('option', { name: option }));
}

describe('AddColumnDialog field mode', () => {
  it('names the table and keeps Add disabled until the column has a name', async () => {
    renderDialog();
    expect(screen.getByRole('heading', { name: 'Add column to orders' })).toBeInTheDocument();
    const add = screen.getByRole('button', { name: 'Add' });
    expect(add).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/^Column name/), 'note');
    expect(add).toBeEnabled();
  });

  it('submits a text field by default, with the default value only when given', async () => {
    const { onSubmit } = renderDialog();
    await userEvent.type(screen.getByLabelText(/^Column name/), 'note');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(onSubmit).toHaveBeenCalledWith({
      columnName: 'note',
      columnType: 'text',
      defaultValue: null,
      nullable: true,
      columnLength: null,
      foreignTable: '',
      foreignField: '',
      cascading: false,
    });
  });

  it('submits the chosen type, default value and nullability', async () => {
    const { onSubmit } = renderDialog();
    await userEvent.type(screen.getByLabelText(/^Column name/), 'qty');
    await pick('text', 'integer');
    await userEvent.type(screen.getByLabelText(/^Default value/), '1');
    await userEvent.click(screen.getByLabelText('Nullable'));
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        columnName: 'qty',
        columnType: 'integer',
        defaultValue: '1',
        nullable: false,
        columnLength: null,
      }),
    );
  });

  it('shows a length for sized types, pre-filled with the type default and editable', async () => {
    const { onSubmit } = renderDialog('mysql');
    // mysql has no plain text type, so the default is its varchar.
    await userEvent.type(screen.getByLabelText(/^Column name/), 'title');
    const length = screen.getByLabelText(/^Length/);
    expect(length).toHaveValue(255);
    await userEvent.clear(length);
    await userEvent.type(length, '80');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ columnType: 'varchar', columnLength: 80 }),
    );
  });

  it('hides the length again when switching back to an unsized type', async () => {
    renderDialog('mysql');
    expect(screen.getByLabelText(/^Length/)).toBeInTheDocument();
    await pick('varchar', 'int');
    expect(screen.queryByLabelText(/^Length/)).not.toBeInTheDocument();
    await pick('int', 'varchar');
    expect(screen.getByLabelText(/^Length/)).toHaveValue(255);
  });

  it('falls back to the sqlite types for an unknown database type', () => {
    renderDialog('oracle');
    expect(trigger('text')).toBeInTheDocument();
  });

  it('submits on Enter in a field', async () => {
    const { onSubmit } = renderDialog();
    await userEvent.type(screen.getByLabelText(/^Column name/), 'note{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('closes on Cancel', async () => {
    const { onClose } = renderDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('AddColumnDialog foreign key mode', () => {
  async function openForeign() {
    await userEvent.click(screen.getByRole('button', { name: 'Foreign key' }));
  }

  it('swaps the field controls for the table picker and cascade option', async () => {
    renderDialog();
    await openForeign();
    expect(screen.queryByLabelText(/^Default value/)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Cascade on delete')).toBeChecked();
    expect(trigger('Select table…')).toBeInTheDocument();
  });

  it('offers only tables that have a primary key', async () => {
    renderDialog();
    await openForeign();
    await userEvent.click(trigger('Select table…'));
    const options = screen.getAllByRole('option').map(option => option.textContent);
    expect(options.join('|')).toContain('customers');
    expect(options.join('|')).toContain('codes');
    expect(options.join('|')).not.toContain('logs');
    expect(options.join('|')).not.toContain('empty');
  });

  it('keeps Add disabled until a referenced table with a primary key is chosen', async () => {
    renderDialog();
    await openForeign();
    await userEvent.type(screen.getByLabelText(/^Column name/), 'customer_id');
    const add = screen.getByRole('button', { name: 'Add' });
    expect(add).toBeDisabled();
    await pick('Select table…', 'customers');
    expect(screen.getByText('References customers.id (long)')).toBeInTheDocument();
    expect(add).toBeEnabled();
  });

  it('submits an integer-typed key referencing the primary key', async () => {
    const { onSubmit } = renderDialog();
    await openForeign();
    await userEvent.type(screen.getByLabelText(/^Column name/), 'customer_id');
    await pick('Select table…', 'customers');
    await userEvent.click(screen.getByLabelText('Cascade on delete'));
    await userEvent.click(screen.getByLabelText('Nullable'));
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(onSubmit).toHaveBeenCalledWith({
      columnName: 'customer_id',
      columnType: 'integer',
      defaultValue: null,
      nullable: false,
      columnLength: null,
      foreignTable: 'customers',
      foreignField: 'id',
      cascading: false,
    });
  });

  it('types a key that references a string primary key as varchar with a length', async () => {
    const { onSubmit } = renderDialog();
    await openForeign();
    await userEvent.type(screen.getByLabelText(/^Column name/), 'code');
    await pick('Select table…', 'codes');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        columnType: 'varchar',
        columnLength: 255,
        foreignTable: 'codes',
        foreignField: 'code',
        cascading: true,
      }),
    );
  });

  it('submits nothing on Enter while no referenced table is chosen', async () => {
    const { onSubmit } = renderDialog();
    await openForeign();
    await userEvent.type(screen.getByLabelText(/^Column name/), 'customer_id{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
