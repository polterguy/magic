// @vitest-environment jsdom
/*
 * Tasks page: lists tasks with their schedules, shows the empty state, executes a task after
 * confirmation, and deletes one after the typed-name confirmation.
 */
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../lib/api';
import { renderPage } from '../../test/renderPage';
import Tasks from '../Tasks';

vi.mock('../../lib/api', async importOriginal =>
  (await import('../../test/apiMock')).mockApi(await importOriginal()),
);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.listTasks).mockResolvedValue([
    {
      id: 'nightly-cleanup',
      description: 'Removes stale rows',
      created: '2024-05-06T00:00:00',
      schedules: [{ id: 7, due: '2030-01-01T00:00:00', repeats: '5.minutes' }],
    },
    { id: 'unscheduled' },
  ]);
  vi.mocked(api.countTasks).mockResolvedValue({ count: 2 });
  vi.mocked(api.executeTask).mockResolvedValue({} as never);
  vi.mocked(api.deleteTask).mockResolvedValue({} as never);
});

describe('Tasks', () => {
  it('lists tasks and their schedules', async () => {
    renderPage(<Tasks />);

    expect(screen.getByRole('heading', { name: 'Task Manager' })).toBeInTheDocument();
    const row = (await screen.findByText('nightly-cleanup')).closest('tr')!;
    expect(within(row).getByText('Removes stale rows')).toBeInTheDocument();
    expect(within(row).getByText('every 5.minutes')).toBeInTheDocument();
    expect(screen.getByText('not scheduled')).toBeInTheDocument();
    expect(await screen.findByText('2 tasks')).toBeInTheDocument();
  });

  it('shows an empty state without tasks', async () => {
    vi.mocked(api.listTasks).mockResolvedValue([]);
    vi.mocked(api.countTasks).mockResolvedValue({ count: 0 });
    renderPage(<Tasks />);

    expect(await screen.findByText('No tasks yet')).toBeInTheDocument();
  });

  it('executes a task after confirmation', async () => {
    renderPage(<Tasks />);
    const row = (await screen.findByText('nightly-cleanup')).closest('tr')!;

    await userEvent.click(within(row).getByRole('button', { name: 'Execute' }));
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Execute' }),
    );

    expect(api.executeTask).toHaveBeenCalledWith('nightly-cleanup');
  });

  it('deletes a task once its name has been typed back', async () => {
    renderPage(<Tasks />);
    const row = (await screen.findByText('nightly-cleanup')).closest('tr')!;

    await userEvent.click(within(row).getByRole('button', { name: 'Delete' }));
    await userEvent.type(screen.getByLabelText('Task name'), 'nightly-cleanup');
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }),
    );

    expect(api.deleteTask).toHaveBeenCalledWith('nightly-cleanup');
  });
});
