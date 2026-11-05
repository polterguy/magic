// @vitest-environment jsdom
/*
 * UsersTab: the user table (empty, filtered, sorted and paged), the CSV export, delete with the
 * busy overlay, and the new user, invite, edit and password dialogs with what each does on
 * success and on cancel.
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { exportCsv } from '../../../lib/download';
import { setToastListener, type Toast } from '../../../lib/toast';
import { renderPage } from '../../../test/renderPage';
import UsersTab from '../UsersTab';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);
vi.mock('../../../lib/download', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  exportCsv: vi.fn(),
}));

const ROLES = [{ name: 'root' }, { name: 'editor' }];

const USERS: api.User[] = [
  { username: 'root', roles: ['root'], created: '2024-01-02T00:00:00' },
  {
    username: 'alice',
    roles: ['editor'],
    created: '2024-03-04T00:00:00',
    extra: [
      { type: 'email', value: 'alice@example.com' },
      { type: 'name', value: 'Alice A' },
    ],
  },
  { username: 'bob' },
];

let toasts: Toast[];

beforeEach(() => {
  vi.clearAllMocks();
  toasts = [];
  setToastListener(toast => toasts.push(toast));
  vi.mocked(api.listUsers).mockResolvedValue(USERS);
  vi.mocked(api.countUsers).mockResolvedValue({ count: 3 });
  vi.mocked(api.loadConfig).mockResolvedValue({ magic: { smtp: { host: 'smtp.test' } } });
  vi.mocked(api.deleteUser).mockResolvedValue({} as never);
  vi.mocked(api.createUser).mockResolvedValue({} as never);
  vi.mocked(api.changeUserPassword).mockResolvedValue({} as never);
  vi.mocked(api.sendResetPasswordLink).mockResolvedValue({ result: 'sent' });
});

afterEach(() => {
  setToastListener(null);
});

async function renderTab() {
  const view = renderPage(<UsersTab roles={ROLES} />);
  await screen.findByText('alice');
  return view;
}

function row(username: string) {
  return screen.getByText(username, { selector: 'strong' }).closest('tr')!;
}

function lastListCall() {
  return vi.mocked(api.listUsers).mock.calls.at(-1)!;
}

describe('UsersTab table', () => {
  it('shows name, email, roles and creation date, with placeholders for what is missing', async () => {
    await renderTab();

    const alice = row('alice');
    expect(within(alice).getByText('Alice A')).toBeInTheDocument();
    expect(within(alice).getByText('alice@example.com')).toBeInTheDocument();
    expect(within(alice).getByText('editor')).toBeInTheDocument();
    expect(within(alice).getByText('2024-03-04')).toBeInTheDocument();
    const bob = row('bob');
    expect(within(bob).getAllByText('—')).toHaveLength(2);
    expect(within(bob).getByText('no roles')).toBeInTheDocument();
    expect(screen.getByText('3 users')).toBeInTheDocument();
  });

  it('says there are no users, and disables the export', async () => {
    vi.mocked(api.listUsers).mockResolvedValue([]);
    vi.mocked(api.countUsers).mockResolvedValue({ count: 0 });
    renderPage(<UsersTab roles={ROLES} />);

    expect(await screen.findByText('No users')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeDisabled();
  });

  it('filters by username and says when nothing matches', async () => {
    await renderTab();
    vi.mocked(api.listUsers).mockResolvedValue([]);
    vi.mocked(api.countUsers).mockResolvedValue({ count: 0 });

    await userEvent.type(screen.getByPlaceholderText('Filter by username…'), 'zed');

    expect(await screen.findByText('No users match your filter')).toBeInTheDocument();
    expect(lastListCall()[0]).toBe('zed');
    expect(vi.mocked(api.countUsers)).toHaveBeenLastCalledWith('zed');
  });

  it('sorts by a column through the ascending, descending, off cycle', async () => {
    await renderTab();

    await userEvent.click(screen.getByRole('columnheader', { name: /Username/ }));
    await waitFor(() =>
      expect(lastListCall()[3]).toEqual({ column: 'username', direction: 'asc' }),
    );

    await userEvent.click(screen.getByRole('columnheader', { name: /Username/ }));
    await waitFor(() =>
      expect(lastListCall()[3]).toEqual({ column: 'username', direction: 'desc' }),
    );

    await userEvent.click(screen.getByRole('columnheader', { name: /Created/ }));
    await waitFor(() => expect(lastListCall()[3]).toEqual({ column: 'created', direction: 'asc' }));
  });

  it('pages through the users', async () => {
    vi.mocked(api.countUsers).mockResolvedValue({ count: 40 });
    await renderTab();

    await userEvent.click(await screen.findByRole('button', { name: 'Next ›' }));

    await waitFor(() => expect(lastListCall().slice(1, 3)).toEqual([15, 15]));
    expect(await screen.findByText('2 / 3')).toBeInTheDocument();
  });
});

describe('UsersTab export and delete', () => {
  it('exports every matching user as CSV, not just the visible page', async () => {
    await renderTab();

    await userEvent.click(screen.getByRole('button', { name: 'Export CSV' }));

    await waitFor(() => expect(exportCsv).toHaveBeenCalled());
    expect(lastListCall().slice(0, 3)).toEqual(['', 0, -1]);
    const [rows, filename] = vi.mocked(exportCsv).mock.calls[0];
    expect(filename).toBe('users.csv');
    expect(rows).toContainEqual({
      username: 'alice',
      name: 'Alice A',
      email: 'alice@example.com',
      roles: 'editor',
      created: '2024-03-04T00:00:00',
    });
  });

  it('shows an error when the export fails', async () => {
    await renderTab();
    vi.mocked(api.listUsers).mockRejectedValue(new Error('export refused'));

    await userEvent.click(screen.getByRole('button', { name: 'Export CSV' }));

    await waitFor(() =>
      expect(toasts.at(-1)).toMatchObject({ text: 'export refused', isError: true }),
    );
    expect(exportCsv).not.toHaveBeenCalled();
  });

  it('covers the screen with a waiter while a user is being deleted', async () => {
    let finish: (value: unknown) => void = () => {
      // replaced as soon as deleteUser is called
    };
    vi.mocked(api.deleteUser).mockReturnValue(
      new Promise(resolve => {
        finish = resolve;
      }) as never,
    );
    const { container } = await renderTab();

    await userEvent.click(within(row('bob')).getByRole('button', { name: 'Delete' }));
    await userEvent.type(screen.getByLabelText('Username'), 'bob');
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }),
    );

    await waitFor(() => expect(container.querySelector('.ai-waiter')).not.toBeNull());
    finish({});
    await waitFor(() => expect(container.querySelector('.ai-waiter')).toBeNull());
    expect(api.deleteUser).toHaveBeenCalledWith('bob');
    expect(toasts.at(-1)?.text).toBe('bob deleted');
  });
});

describe('UsersTab new user', () => {
  it('creates a user, tells you, and reloads the list', async () => {
    await renderTab();
    const loads = vi.mocked(api.listUsers).mock.calls.length;

    await userEvent.click(screen.getByRole('button', { name: '+ New user' }));
    await userEvent.type(screen.getByLabelText('Username'), 'carol');
    await userEvent.type(screen.getByLabelText(/^Password/), 'a-long-enough-password');
    await userEvent.click(screen.getByRole('button', { name: 'Create user' }));

    await waitFor(() => expect(toasts.at(-1)?.text).toBe('User carol created'));
    expect(api.createUser).toHaveBeenCalledWith('carol', 'a-long-enough-password');
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(vi.mocked(api.listUsers).mock.calls.length).toBeGreaterThan(loads));
  });

  it('closes without creating anyone', async () => {
    await renderTab();

    await userEvent.click(screen.getByRole('button', { name: '+ New user' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(api.createUser).not.toHaveBeenCalled();
  });
});

describe('UsersTab invite', () => {
  it('explains why invites are unavailable without an SMTP server', async () => {
    vi.mocked(api.loadConfig).mockResolvedValue({ magic: {} });
    await renderTab();

    const invite = screen.getByRole('button', { name: /Invite user/ });
    await waitFor(() => expect(invite).toHaveAttribute('title', expect.stringContaining('SMTP')));
    expect(invite).toBeDisabled();
  });

  it('is disabled when the configuration cannot be read', async () => {
    vi.mocked(api.loadConfig).mockRejectedValue(new Error('no config'));
    await renderTab();

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Invite user/ })).toHaveAttribute(
        'title',
        expect.stringContaining('SMTP'),
      ),
    );
    expect(screen.getByRole('button', { name: /Invite user/ })).toBeDisabled();
  });

  it('stays disabled, without the SMTP hint, until the configuration has been read', () => {
    vi.mocked(api.loadConfig).mockReturnValue(new Promise(() => {}));
    renderPage(<UsersTab roles={ROLES} />);

    const invite = screen.getByRole('button', { name: /Invite user/ });
    expect(invite).toBeDisabled();
    expect(invite).toHaveAttribute('title', 'Create a user and email them a sign-in link');
  });

  it('invites someone by email and reports that the link is on its way', async () => {
    await renderTab();
    const loads = vi.mocked(api.listUsers).mock.calls.length;

    await waitFor(() => expect(screen.getByRole('button', { name: /Invite user/ })).toBeEnabled());
    await userEvent.click(screen.getByRole('button', { name: /Invite user/ }));
    await userEvent.type(screen.getByLabelText(/^Email/), 'dave@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send invite' }));

    await waitFor(() =>
      expect(toasts.at(-1)?.text).toBe(
        'Invite sent — dave@example.com has 20 minutes to use the link',
      ),
    );
    expect(api.createUser).toHaveBeenCalledWith('dave@example.com', expect.any(String));
    expect(api.sendResetPasswordLink).toHaveBeenCalledWith(
      'https://cloudlet.test',
      'dave@example.com',
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(vi.mocked(api.listUsers).mock.calls.length).toBeGreaterThan(loads));
  });

  it('closes the invite dialog without inviting', async () => {
    await renderTab();
    await waitFor(() => expect(screen.getByRole('button', { name: /Invite user/ })).toBeEnabled());

    await userEvent.click(screen.getByRole('button', { name: /Invite user/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(api.createUser).not.toHaveBeenCalled();
  });
});

describe('UsersTab edit and password', () => {
  it('saves an edited user and reloads the list', async () => {
    await renderTab();
    const loads = vi.mocked(api.listUsers).mock.calls.length;

    await userEvent.click(within(row('alice')).getByRole('button', { name: 'Edit' }));
    expect(screen.getByRole('heading', { name: 'Edit alice' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(toasts.at(-1)?.text).toBe('User updated'));
    expect(api.updateUserExtra).toHaveBeenCalledWith('alice', 'email', 'alice@example.com');
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(vi.mocked(api.listUsers).mock.calls.length).toBeGreaterThan(loads));
  });

  it('closes the edit dialog without saving', async () => {
    await renderTab();

    await userEvent.click(within(row('alice')).getByRole('button', { name: 'Edit' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(api.updateUserExtra).not.toHaveBeenCalled();
  });

  it('changes a password', async () => {
    await renderTab();

    await userEvent.click(within(row('alice')).getByRole('button', { name: 'Password' }));
    await userEvent.type(screen.getByLabelText(/^New password/), 'a-brand-new-password');
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }));

    await waitFor(() => expect(toasts.at(-1)?.text).toBe('Password changed'));
    expect(api.changeUserPassword).toHaveBeenCalledWith('alice', 'a-brand-new-password');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('refuses a password that is too short', async () => {
    await renderTab();

    await userEvent.click(within(row('alice')).getByRole('button', { name: 'Password' }));
    await userEvent.type(screen.getByLabelText(/^New password/), 'short');
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }));

    expect(toasts.at(-1)).toMatchObject({
      text: 'Passwords must be at least ' + api.MIN_PASSWORD + ' characters',
      isError: true,
    });
    expect(api.changeUserPassword).not.toHaveBeenCalled();
  });

  it('closes the password dialog without changing anything', async () => {
    await renderTab();

    await userEvent.click(within(row('alice')).getByRole('button', { name: 'Password' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(api.changeUserPassword).not.toHaveBeenCalled();
  });
});
