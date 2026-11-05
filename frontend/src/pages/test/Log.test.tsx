// @vitest-environment jsdom
/*
 * Log page: lists log entries with the total, shows the empty state, expands an entry carrying a
 * stack trace, pages to older entries, and passes the typed filter to the backend.
 */
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../lib/api';
import { renderPage } from '../../test/renderPage';
import Log from '../Log';

vi.mock('../../lib/api', async importOriginal =>
  (await import('../../test/apiMock')).mockApi(await importOriginal()),
);

function entries(count: number, firstId: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: firstId - index,
    created: '2024-05-06T10:00:00Z',
    type: 'info',
    content: 'entry number ' + (firstId - index),
  }));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.countLog).mockResolvedValue({ count: 42 });
  vi.mocked(api.listLog).mockResolvedValue([
    { id: 3, created: '2024-05-06T10:00:00Z', type: 'info', content: 'Server started' },
    {
      id: 2,
      created: '2024-05-06T09:00:00Z',
      type: 'error',
      content: 'Something broke',
      exception: 'System.InvalidOperationException: boom',
    },
  ]);
});

describe('Log', () => {
  it('lists the entries and the total', async () => {
    renderPage(<Log />);

    expect(await screen.findByText('Server started')).toBeInTheDocument();
    expect(screen.getByText('Something broke')).toBeInTheDocument();
    expect(screen.getByText('42 log items')).toBeInTheDocument();
    expect(api.listLog).toHaveBeenCalledWith(null, 20, undefined);
  });

  it('shows an empty state when the log is empty', async () => {
    vi.mocked(api.listLog).mockResolvedValue([]);
    vi.mocked(api.countLog).mockResolvedValue({ count: 0 });
    renderPage(<Log />);

    expect(await screen.findByText('The log is empty')).toBeInTheDocument();
  });

  it('reveals the exception of an entry when it is clicked', async () => {
    renderPage(<Log />);

    await userEvent.click(await screen.findByText('Something broke'));

    expect(await screen.findByText(/InvalidOperationException: boom/)).toBeInTheDocument();
  });

  it('pages to older entries from the last id on the page', async () => {
    vi.mocked(api.listLog).mockResolvedValueOnce(entries(20, 100));
    renderPage(<Log />);
    await screen.findByText('entry number 100');

    const older = screen.getByRole('button', { name: 'Older ›' });
    await waitFor(() => expect(older).toBeEnabled());
    await userEvent.click(older);

    await waitFor(() => expect(api.listLog).toHaveBeenLastCalledWith(81, 20, undefined));
  });

  it('sends the typed filter to the backend', async () => {
    renderPage(<Log />);
    await screen.findByText('Server started');

    await userEvent.type(screen.getByPlaceholderText('Filter log…'), 'broke');

    await waitFor(() => expect(api.listLog).toHaveBeenLastCalledWith(null, 20, 'broke'));
    expect(api.countLog).toHaveBeenLastCalledWith('broke');
  });

  it('opens the entry a ?id= deep link points at', async () => {
    renderPage(<Log />, { route: '/log?id=2' });

    expect(await screen.findByText(/InvalidOperationException: boom/)).toBeInTheDocument();
    expect(api.listLog).toHaveBeenCalledWith(3, 20, undefined);
  });
});
