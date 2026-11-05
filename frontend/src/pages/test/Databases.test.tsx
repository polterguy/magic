// @vitest-environment jsdom
/*
 * Databases page: lists the SQLite databases from the backend, protects the magic database from
 * deletion, creates a new one, and switches to the external tab.
 */
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../lib/api';
import { renderPage } from '../../test/renderPage';
import Databases from '../Databases';

vi.mock('../../lib/api', async importOriginal =>
  (await import('../../test/apiMock')).mockApi(await importOriginal()),
);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.listDatabases).mockResolvedValue({
    databases: [
      { name: 'magic', tables: [{ name: 'users' }, { name: 'roles' }] },
      { name: 'shop', tables: [] },
    ],
  });
  vi.mocked(api.createDatabase).mockResolvedValue({} as never);
  vi.mocked(api.loadConfig).mockResolvedValue({ magic: { databases: {} } });
});

describe('Databases', () => {
  it('lists the databases with their table counts', async () => {
    renderPage(<Databases />);

    expect(screen.getByRole('heading', { name: 'Databases' })).toBeInTheDocument();
    const shop = (await screen.findByText('shop')).closest('tr')!;
    expect(within(shop).getByText('0')).toBeInTheDocument();
    const magic = screen.getByText('magic').closest('tr')!;
    expect(within(magic).getByText('2')).toBeInTheDocument();
    expect(within(magic).getByRole('button', { name: 'Delete' })).toBeDisabled();
    expect(within(shop).getByRole('button', { name: 'Delete' })).toBeEnabled();
    expect(api.listDatabases).toHaveBeenCalledWith('sqlite', 'generic');
  });

  it('creates a database from the typed name', async () => {
    renderPage(<Databases />);
    await screen.findByText('shop');

    await userEvent.type(screen.getByPlaceholderText('New database name…'), 'inventory');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(api.createDatabase).toHaveBeenCalledWith('sqlite', 'generic', 'inventory');
  });

  it('switches to the external databases tab', async () => {
    renderPage(<Databases />);
    await screen.findByText('shop');

    await userEvent.click(screen.getByRole('button', { name: 'External' }));

    expect(screen.queryByPlaceholderText('New database name…')).not.toBeInTheDocument();
  });
});
