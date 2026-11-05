// @vitest-environment jsdom
/*
 * Generator page: opens on the CRUD tab, honours ?tab= and ?guided=1, and switches between the
 * generators.
 */
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../lib/api';
import { renderPage } from '../../test/renderPage';
import Generator from '../Generator';

vi.mock('../../lib/api', async importOriginal =>
  (await import('../../test/apiMock')).mockApi(await importOriginal()),
);

vi.mock('../../components/CodeEditor', async () => ({
  default: (await import('../../test/CodeEditorStub')).default,
}));

/*
 * The page reads the query string from globalThis.location, not the router, so a test sets the
 * address with the History API and restores it afterwards.
 */
function openAt(search: string) {
  globalThis.history.replaceState(null, '', '/generator' + search);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.listDatabases).mockResolvedValue({ databases: [] });
  vi.mocked(api.loadConfig).mockResolvedValue({ magic: { databases: {} } });
  openAt('');
});

afterEach(() => {
  openAt('');
});

describe('Generator', () => {
  it('opens on the CRUD generator', async () => {
    renderPage(<Generator />);

    expect(screen.getByRole('heading', { name: 'Endpoint Generator' })).toBeInTheDocument();
    expect(await screen.findByText(/Select a database with tables/)).toBeInTheDocument();
  });

  it('shows the wizard heading for the guided flow', async () => {
    openAt('?guided=1');
    renderPage(<Generator />);

    expect(screen.getByRole('heading', { name: 'API Wizard' })).toBeInTheDocument();
    expect(await screen.findByText(/No database of your own yet/)).toBeInTheDocument();
  });

  it('opens on the tab named in the query string, and leaves the wizard when switching', async () => {
    openAt('?tab=sql&guided=1');
    renderPage(<Generator />);

    expect(screen.getByRole('heading', { name: 'Endpoint Generator' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'CRUD backend' }));
    expect(screen.getByRole('heading', { name: 'API Wizard' })).toBeInTheDocument();
  });
});
