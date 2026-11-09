// @vitest-environment jsdom
/*
 * The database, file system and dynamic slot capability wizards: each turns what is ticked or
 * picked into the slot lines handed to onAdd, refuses an empty grant, and closes on request.
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import { renderPage } from '../../../test/renderPage';
import { FILE_CHANGING_SLOTS } from '../slots';
import DbAccessWizard from '../wizards/DbAccessWizard';
import DynamicSlotsWizard from '../wizards/DynamicSlotsWizard';
import FilesAccessWizard from '../wizards/FilesAccessWizard';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

let toasts: Toast[];

beforeEach(() => {
  vi.clearAllMocks();
  toasts = [];
  setToastListener(toast => toasts.push(toast));
});

afterEach(() => {
  setToastListener(null);
});

function stubDatabases(options: {
  types?: string[];
  connections?: Record<string, string>;
  databases?: string[];
}) {
  const types = options.types ?? ['sqlite'];
  vi.mocked(api.defaultDatabaseType).mockResolvedValue({ options: types, default: types[0] });
  vi.mocked(api.http.get).mockResolvedValue(options.connections ?? { generic: 'x' });
  vi.mocked(api.listDatabases).mockResolvedValue({
    databases: (options.databases ?? ['magic', 'crm']).map(name => ({ name, tables: [] })),
  });
}

function renderDb() {
  const onAdd = vi.fn();
  const onCancel = vi.fn();
  renderPage(<DbAccessWizard onAdd={onAdd} onCancel={onCancel} />);
  return { onAdd, onCancel };
}

describe('DbAccessWizard', () => {
  it('grants read access to the first non-system database by default', async () => {
    stubDatabases({});
    const { onAdd } = renderDb();

    expect(screen.getByText('loading…')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled());
    expect(screen.getByText('data.connect:crm')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(onAdd).toHaveBeenCalledWith(['data.connect:crm', 'data.read']);
  });

  it('adds one slot per ticked operation, and the raw SQL pair', async () => {
    stubDatabases({});
    const { onAdd } = renderDb();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled());

    await userEvent.click(screen.getByLabelText('Read'));
    await userEvent.click(screen.getByLabelText('Create'));
    await userEvent.click(screen.getByLabelText('Update'));
    await userEvent.click(screen.getByLabelText('Delete'));
    await userEvent.click(screen.getByLabelText(/Raw/));
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(onAdd).toHaveBeenCalledWith([
      'data.connect:crm',
      'data.create',
      'data.update',
      'data.delete',
      'data.select',
      'data.scalar',
    ]);
  });

  it('pins the database picked from the dropdown', async () => {
    stubDatabases({});
    const { onAdd } = renderDb();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled());

    await userEvent.click(screen.getByRole('button', { name: 'crm' }));
    await userEvent.click(within(screen.getByRole('listbox')).getByText('magic'));
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(onAdd).toHaveBeenCalledWith(['data.connect:magic', 'data.read']);
  });

  it('offers the database types and connection strings when there are several', async () => {
    stubDatabases({ types: ['sqlite', 'mssql'], connections: { generic: 'a', other: 'b' } });
    renderDb();

    await waitFor(() => expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled());
    expect(screen.getByRole('button', { name: 'sqlite' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'generic' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'sqlite' }));
    await userEvent.click(within(screen.getByRole('listbox')).getByText('mssql'));
    await waitFor(() => expect(listDatabasesTypes()).toContain('mssql'));

    await userEvent.click(screen.getByRole('button', { name: 'generic' }));
    await userEvent.click(within(screen.getByRole('listbox')).getByText('other'));
    await waitFor(() =>
      expect(vi.mocked(api.listDatabases)).toHaveBeenLastCalledWith('mssql', 'other'),
    );
  });

  it('cannot add anything while there is no database to pin', async () => {
    stubDatabases({ databases: [] });
    const { onAdd } = renderDb();

    await waitFor(() => expect(screen.queryByText('loading…')).toBeNull());
    expect(screen.getByText('data.connect:…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(onAdd).not.toHaveBeenCalled();
  });

  it('closes without adding', async () => {
    stubDatabases({});
    const { onAdd, onCancel } = renderDb();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onCancel).toHaveBeenCalled();
    expect(onAdd).not.toHaveBeenCalled();
  });
});

function listDatabasesTypes() {
  return vi.mocked(api.listDatabases).mock.calls.map(call => call[0]);
}

describe('FilesAccessWizard', () => {
  function renderFiles() {
    const onAdd = vi.fn();
    const onCancel = vi.fn();
    renderPage(<FilesAccessWizard onAdd={onAdd} onCancel={onCancel} />);
    return { onAdd, onCancel };
  }

  it('grants the read slots for any path', async () => {
    const { onAdd } = renderFiles();

    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    const lines: string[] = onAdd.mock.calls[0][0];
    expect(lines).toContain('io.file.load');
    expect(lines).toContain('io.folder.list');
    expect(lines).toContain('io.path.get-folder');
  });

  it('offers no tier and grants no slot that changes the file system', async () => {
    const { onAdd } = renderFiles();

    expect(screen.queryByLabelText('Write')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Delete')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    const lines: string[] = onAdd.mock.calls[0][0];
    expect(lines.filter(line => FILE_CHANGING_SLOTS.has(line.split(':')[0]))).toEqual([]);
  });

  it('pins file slots to the folder and extension, and folder slots to the folder', async () => {
    const { onAdd } = renderFiles();

    await userEvent.type(screen.getByPlaceholderText(/blank = any path/), '/etc/data');
    await userEvent.type(screen.getByPlaceholderText('any'), '.conf');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    const lines: string[] = onAdd.mock.calls[0][0];
    expect(lines).toContain('io.file.load:/etc/data/*.conf');
    expect(lines).toContain('io.folder.list:/etc/data/');
    expect(lines).toContain('io.path.get-folder');
  });

  it('closes without adding', async () => {
    const { onAdd, onCancel } = renderFiles();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onCancel).toHaveBeenCalled();
    expect(onAdd).not.toHaveBeenCalled();
  });
});

describe('DynamicSlotsWizard', () => {
  function renderSlots() {
    const onAdd = vi.fn();
    const onCancel = vi.fn();
    renderPage(<DynamicSlotsWizard onAdd={onAdd} onCancel={onCancel} />);
    return { onAdd, onCancel };
  }

  it('lists the slots and pins all three aliases of every picked one', async () => {
    vi.mocked(api.listDynamicSlots).mockResolvedValue(['custom.alpha', 'custom.beta']);
    const { onAdd } = renderSlots();

    expect(screen.getByText('loading…')).toBeInTheDocument();
    await userEvent.click(await screen.findByLabelText('custom.alpha'));
    await userEvent.click(screen.getByLabelText('custom.beta'));
    expect(screen.getByText('2 selected')).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('custom.beta'));
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(onAdd).toHaveBeenCalledWith([
      'execute:custom.alpha',
      'signal:custom.alpha',
      'try-signal:custom.alpha',
    ]);
  });

  it('keeps Add disabled until a slot is picked', async () => {
    vi.mocked(api.listDynamicSlots).mockResolvedValue(['custom.alpha']);
    const { onAdd } = renderSlots();
    await screen.findByLabelText('custom.alpha');

    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(onAdd).not.toHaveBeenCalled();
  });

  it('filters the list case-insensitively and clears the filter', async () => {
    vi.mocked(api.listDynamicSlots).mockResolvedValue(['custom.alpha', 'other.beta']);
    renderSlots();
    await screen.findByLabelText('custom.alpha');

    await userEvent.type(screen.getByPlaceholderText('Filter dynamic slots…'), 'BETA');
    expect(screen.queryByLabelText('custom.alpha')).toBeNull();
    expect(screen.getByLabelText('other.beta')).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText('Filter dynamic slots…'), 'zzz');
    expect(screen.getByText('No dynamic slots found.')).toBeInTheDocument();

    await userEvent.click(screen.getByTitle('Clear search'));
    expect(screen.getByLabelText('custom.alpha')).toBeInTheDocument();
  });

  it('says so when the server has no dynamic slots', async () => {
    vi.mocked(api.listDynamicSlots).mockResolvedValue([]);
    renderSlots();

    expect(await screen.findByText('No dynamic slots found.')).toBeInTheDocument();
  });

  it('reports a failure to load the slots', async () => {
    vi.mocked(api.listDynamicSlots).mockRejectedValue(new Error('denied'));
    renderSlots();

    await waitFor(() =>
      expect(toasts.at(-1)).toMatchObject({ text: 'Could not load dynamic slots', isError: true }),
    );
    expect(await screen.findByText('No dynamic slots found.')).toBeInTheDocument();
  });

  it('closes without adding', async () => {
    vi.mocked(api.listDynamicSlots).mockResolvedValue([]);
    const { onAdd, onCancel } = renderSlots();
    await screen.findByText('No dynamic slots found.');

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onCancel).toHaveBeenCalled();
    expect(onAdd).not.toHaveBeenCalled();
  });
});
