// @vitest-environment jsdom
/*
 * Users page: lists users and roles from the backend, protects the root user from deletion,
 * deletes a user after the typed-name confirmation, and switches between the two tabs.
 */
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../lib/api';
import { renderPage } from '../../test/renderPage';
import Users from '../Users';

vi.mock('../../lib/api', async importOriginal =>
  (await import('../../test/apiMock')).mockApi(await importOriginal()),
);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.listRoles).mockResolvedValue([
    { name: 'root', description: 'Superuser' },
    { name: 'editor', description: 'Can edit content' },
  ]);
  vi.mocked(api.listUsers).mockResolvedValue([
    { username: 'root', roles: ['root'], created: '2024-01-02T00:00:00' },
    {
      username: 'alice',
      roles: ['editor'],
      created: '2024-03-04T00:00:00',
      extra: [{ type: 'email', value: 'alice@example.com' }],
    },
  ]);
  vi.mocked(api.countUsers).mockResolvedValue({ count: 2 });
  vi.mocked(api.loadConfig).mockResolvedValue({ magic: { smtp: { host: 'smtp.test' } } });
  vi.mocked(api.deleteUser).mockResolvedValue({} as never);
});

describe('Users', () => {
  it('lists the users with their email and roles', async () => {
    renderPage(<Users />);

    expect(screen.getByRole('heading', { name: 'Users & roles' })).toBeInTheDocument();
    const alice = (await screen.findByText('alice')).closest('tr')!;
    expect(within(alice).getByText('alice@example.com')).toBeInTheDocument();
    expect(within(alice).getByText('editor')).toBeInTheDocument();
    expect(await screen.findByText('2 users')).toBeInTheDocument();
    const root = screen.getByText('root', { selector: 'strong' }).closest('tr')!;
    expect(within(root).getByRole('button', { name: 'Delete' })).toBeDisabled();
  });

  it('deletes a user once the username has been typed back', async () => {
    renderPage(<Users />);
    const alice = (await screen.findByText('alice')).closest('tr')!;

    await userEvent.click(within(alice).getByRole('button', { name: 'Delete' }));
    await userEvent.type(screen.getByLabelText('Username'), 'alice');
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }),
    );

    expect(api.deleteUser).toHaveBeenCalledWith('alice');
  });

  it('shows the roles on the roles tab', async () => {
    renderPage(<Users />);
    await screen.findByText('alice');

    await userEvent.click(screen.getByRole('button', { name: 'Roles' }));

    expect(screen.getByText('Can edit content')).toBeInTheDocument();
    expect(screen.getByText('2 of 2 roles')).toBeInTheDocument();
  });
});
