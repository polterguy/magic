// @vitest-environment jsdom
/*
 * Sql page (SQL Studio): fills the database selectors from the backend, runs the typed SQL against
 * the chosen database and shows the result set, refuses to run an empty buffer, and switches to
 * the table designer. The code editor is replaced by a textarea stub.
 */
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../lib/api';
import { renderPage } from '../../test/renderPage';
import Sql from '../Sql';

vi.mock('../../lib/api', async importOriginal =>
  (await import('../../test/apiMock')).mockApi(await importOriginal()),
);
vi.mock('../../components/CodeEditor', async () => ({
  default: (await import('../../test/CodeEditorStub')).default,
}));

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  vi.mocked(api.defaultDatabaseType).mockResolvedValue({
    default: 'sqlite',
    options: ['sqlite', 'mysql'],
  });
  vi.mocked(api.http.get).mockResolvedValue({ generic: 'Data Source=generic.db' });
  vi.mocked(api.listDatabases).mockResolvedValue({
    databases: [
      {
        name: 'shop',
        tables: [{ name: 'products', columns: [{ name: 'id' }, { name: 'title' }] }],
      },
    ],
  } as never);
  vi.mocked(api.listFiles).mockResolvedValue([]);
  vi.mocked(api.openaiIsConfigured).mockResolvedValue({ result: false });
  vi.mocked(api.executeSql).mockResolvedValue([[{ id: 1, title: 'Widget' }]]);
});

async function ready() {
  renderPage(<Sql />);
  // The database selector is the last link of the type -> connection -> database cascade.
  await waitFor(() => expect(api.listDatabases).toHaveBeenCalledWith('sqlite', 'generic'));
  await screen.findByText('shop');
}

describe('Sql', () => {
  it('fills the selectors from the backend', async () => {
    await ready();

    expect(screen.getByRole('heading', { name: 'SQL Studio' })).toBeInTheDocument();
    expect(screen.getByText('generic')).toBeInTheDocument();
    expect(screen.getByText('sqlite')).toBeInTheDocument();
  });

  it('keeps Run disabled while the editor is empty', async () => {
    await ready();

    expect(screen.getByRole('button', { name: '▷ Run' })).toBeDisabled();
  });

  it('runs the typed SQL against the chosen database and shows the rows', async () => {
    await ready();

    fireEvent.change(screen.getByLabelText('code editor text/x-sql'), {
      target: { value: 'select * from products' },
    });
    await userEvent.click(screen.getByRole('button', { name: '▷ Run' }));

    await waitFor(() =>
      expect(api.executeSql).toHaveBeenCalledWith(
        'sqlite',
        '[generic|shop]',
        'select * from products',
        true,
        false,
      ),
    );
    expect(await screen.findByText('Widget')).toBeInTheDocument();
    expect(screen.getByText('1 rows')).toBeInTheDocument();
  });

  it('switches to the designer and lists the tables', async () => {
    await ready();

    await userEvent.click(screen.getByRole('button', { name: 'Designer' }));

    expect(await screen.findByText('products')).toBeInTheDocument();
    expect(screen.queryByLabelText('code editor text/x-sql')).not.toBeInTheDocument();
  });

  it('explains when no connection strings are configured', async () => {
    vi.mocked(api.http.get).mockResolvedValue({});
    renderPage(<Sql />);

    expect(
      await screen.findByText(/No connection strings are configured for sqlite/),
    ).toBeInTheDocument();
  });
});
