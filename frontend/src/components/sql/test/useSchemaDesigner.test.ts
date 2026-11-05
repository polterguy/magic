// @vitest-environment jsdom
/*
 * useSchemaDesigner: every schema change asks first where it is destructive, shows the busy
 * state while it runs, reloads the schema afterwards and surfaces failures as error toasts.
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { showToast } from '../../../lib/toast';
import { useSchemaDesigner } from '../hooks/useSchemaDesigner';
import type { ColumnPayload } from '../schema';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

vi.mock('../../../lib/toast', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  showToast: vi.fn(),
}));

const dialog = vi.hoisted(() => ({ confirm: vi.fn(), confirmTyped: vi.fn() }));

vi.mock('../../../lib/useDialog', () => ({ useDialog: () => dialog }));

const reloadSchema = vi.fn();
const setWaiting = vi.fn();
const reload = vi.fn();

function setup() {
  return renderHook(() =>
    useSchemaDesigner({
      type: 'sqlite',
      connectionString: 'generic',
      database: 'shop',
      reloadSchema,
      setWaiting,
    }),
  );
}

// Every waiting flag set on is set off again, and in that order.
function expectWaitingBracketed() {
  expect(setWaiting.mock.calls).toEqual([[true], [false]]);
}

beforeEach(() => {
  vi.clearAllMocks();
  dialog.confirm.mockResolvedValue(true);
  dialog.confirmTyped.mockResolvedValue(true);
  reloadSchema.mockResolvedValue(undefined);
  vi.stubGlobal('location', { reload });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useSchemaDesigner', () => {
  it('flushes the server cache and reloads the page once confirmed', async () => {
    const { result } = setup();

    await act(() => result.current.flushCache());

    expect(api.flushSchemaCache).toHaveBeenCalledWith('sqlite', 'generic');
    expect(reload).toHaveBeenCalled();
    expect(setWaiting.mock.calls).toEqual([[true]]);
  });

  it('does nothing when the flush is declined', async () => {
    dialog.confirm.mockResolvedValue(false);
    const { result } = setup();

    await act(() => result.current.flushCache());

    expect(api.flushSchemaCache).not.toHaveBeenCalled();
    expect(setWaiting).not.toHaveBeenCalled();
  });

  it('reports a failed flush and stops waiting without reloading', async () => {
    vi.mocked(api.flushSchemaCache).mockRejectedValue(new Error('denied'));
    const { result } = setup();

    await act(() => result.current.flushCache());

    expect(showToast).toHaveBeenCalledWith('denied', true, undefined);
    expect(reload).not.toHaveBeenCalled();
    expectWaitingBracketed();
  });

  it('imports a CSV file and announces it', async () => {
    const file = new File(['a,b'], 'people.csv');
    const { result } = setup();

    await act(() => result.current.importCsv(file));

    expect(api.importCsvFile).toHaveBeenCalledWith('sqlite', 'generic', 'shop', file);
    expect(showToast).toHaveBeenCalledWith(
      "Importing people.csv — you'll be notified when it completes",
    );
    expectWaitingBracketed();
  });

  it('reports a failed CSV import', async () => {
    vi.mocked(api.importCsvFile).mockRejectedValue(new Error('bad csv'));
    const { result } = setup();

    await act(() => result.current.importCsv(new File([''], 'x.csv')));

    expect(showToast).toHaveBeenCalledWith('bad csv', true, undefined);
    expectWaitingBracketed();
  });

  it('drops a table only after its name is typed back, then reloads the schema', async () => {
    const { result } = setup();

    await act(() => result.current.dropTableConfirmed('orders'));

    expect(dialog.confirmTyped).toHaveBeenCalledWith(
      expect.objectContaining({ expected: 'orders', title: 'Drop table?' }),
    );
    expect(api.dropTable).toHaveBeenCalledWith('sqlite', 'generic', 'shop', 'orders');
    expect(showToast).toHaveBeenCalledWith('Table orders dropped');
    expect(reloadSchema).toHaveBeenCalled();
    expectWaitingBracketed();
  });

  it('leaves the table alone when the name is not confirmed', async () => {
    dialog.confirmTyped.mockResolvedValue(false);
    const { result } = setup();

    await act(() => result.current.dropTableConfirmed('orders'));

    expect(api.dropTable).not.toHaveBeenCalled();
    expect(setWaiting).not.toHaveBeenCalled();
  });

  it('reports a failed table drop without reloading', async () => {
    vi.mocked(api.dropTable).mockRejectedValue(new Error('locked'));
    const { result } = setup();

    await act(() => result.current.dropTableConfirmed('orders'));

    expect(showToast).toHaveBeenCalledWith('locked', true, undefined);
    expect(reloadSchema).not.toHaveBeenCalled();
    expectWaitingBracketed();
  });

  it('drops a column after confirmation and reloads the schema', async () => {
    const { result } = setup();

    await act(() => result.current.dropColumnConfirmed('orders', 'title'));

    expect(dialog.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'orders.title will be permanently removed.',
        danger: true,
      }),
    );
    expect(api.dropColumn).toHaveBeenCalledWith('sqlite', 'generic', 'shop', 'orders', 'title');
    expect(showToast).toHaveBeenCalledWith('Column title dropped');
    expect(reloadSchema).toHaveBeenCalled();
  });

  it('keeps the column when the drop is declined', async () => {
    dialog.confirm.mockResolvedValue(false);
    const { result } = setup();

    await act(() => result.current.dropColumnConfirmed('orders', 'title'));

    expect(api.dropColumn).not.toHaveBeenCalled();
  });

  it('reports a failed column drop', async () => {
    vi.mocked(api.dropColumn).mockRejectedValue(new Error('in use'));
    const { result } = setup();

    await act(() => result.current.dropColumnConfirmed('orders', 'title'));

    expect(showToast).toHaveBeenCalledWith('in use', true, undefined);
    expect(reloadSchema).not.toHaveBeenCalled();
    expectWaitingBracketed();
  });

  it('exports DDL into the viewer and closes it again', async () => {
    vi.mocked(api.exportDdl).mockResolvedValue({ result: 'create table orders' });
    const { result } = setup();

    await act(() => result.current.viewDdl(['orders'], true, 'Orders DDL'));

    expect(api.exportDdl).toHaveBeenCalledWith('sqlite', 'generic', 'shop', ['orders'], true);
    expect(result.current.ddl).toEqual({ title: 'Orders DDL', sql: 'create table orders' });
    expectWaitingBracketed();

    act(() => result.current.setDdl(null));
    expect(result.current.ddl).toBeNull();
  });

  it('reports a failed DDL export and shows nothing', async () => {
    vi.mocked(api.exportDdl).mockRejectedValue(new Error('no ddl'));
    const { result } = setup();

    await act(() => result.current.viewDdl([], false, 'All'));

    expect(showToast).toHaveBeenCalledWith('no ddl', true, undefined);
    expect(result.current.ddl).toBeNull();
  });

  it('creates a table, closes the dialog and reloads the schema', async () => {
    const { result } = setup();
    act(() => result.current.setNewTable(true));
    expect(result.current.newTable).toBe(true);

    await act(() => result.current.createTable('orders', 'id', 'int', 0));

    expect(api.addTable).toHaveBeenCalledWith(
      'sqlite',
      'generic',
      'shop',
      'orders',
      'id',
      'int',
      0,
    );
    expect(result.current.newTable).toBe(false);
    expect(showToast).toHaveBeenCalledWith('Table orders created');
    expect(reloadSchema).toHaveBeenCalled();
    expectWaitingBracketed();
  });

  it('keeps the new-table dialog open when creation fails', async () => {
    vi.mocked(api.addTable).mockRejectedValue(new Error('exists'));
    const { result } = setup();
    act(() => result.current.setNewTable(true));

    await act(() => result.current.createTable('orders', 'id', 'int', 0));

    expect(showToast).toHaveBeenCalledWith('exists', true, undefined);
    expect(result.current.newTable).toBe(true);
    expect(reloadSchema).not.toHaveBeenCalled();
  });

  it('adds a plain column to the table whose dialog is open', async () => {
    const payload = { columnName: 'note', columnType: 'text' } as unknown as ColumnPayload;
    const { result } = setup();
    act(() => result.current.setAddingColumn('orders'));

    await act(() => result.current.submitColumn('orders', payload));

    expect(api.addColumn).toHaveBeenCalledWith(
      {
        databaseType: 'sqlite',
        connectionString: 'generic',
        databaseName: 'shop',
        tableName: 'orders',
      },
      payload,
    );
    expect(api.addForeignKey).not.toHaveBeenCalled();
    expect(result.current.addingColumn).toBeNull();
    expect(showToast).toHaveBeenCalledWith('Column note added');
    expect(reloadSchema).toHaveBeenCalled();
  });

  it('adds a foreign key when the column references a table', async () => {
    const payload = {
      columnName: 'customer',
      columnType: 'int',
      foreignTable: 'customers',
    } as unknown as ColumnPayload;
    const { result } = setup();

    await act(() => result.current.submitColumn('orders', payload));

    expect(api.addForeignKey).toHaveBeenCalledWith(
      expect.objectContaining({ tableName: 'orders' }),
      payload,
    );
    expect(api.addColumn).not.toHaveBeenCalled();
  });

  it('keeps the add-column dialog open when adding fails', async () => {
    vi.mocked(api.addColumn).mockRejectedValue(new Error('dup'));
    const { result } = setup();
    act(() => result.current.setAddingColumn('orders'));

    await act(() =>
      result.current.submitColumn('orders', { columnName: 'x' } as unknown as ColumnPayload),
    );

    expect(showToast).toHaveBeenCalledWith('dup', true, undefined);
    expect(result.current.addingColumn).toBe('orders');
    expectWaitingBracketed();
  });
});
