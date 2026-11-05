// @vitest-environment jsdom
/*
 * Profile page: loads the signed in user's name and email, saves them as extra fields, validates
 * and submits a password change, and generates an access token for the chosen roles.
 */
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../lib/api';
import { setToastListener, type Toast } from '../../lib/toast';
import { renderPage } from '../../test/renderPage';
import Profile from '../Profile';

vi.mock('../../lib/api', async importOriginal =>
  (await import('../../test/apiMock')).mockApi(await importOriginal()),
);

let toasts: Toast[] = [];

beforeEach(() => {
  vi.clearAllMocks();
  toasts = [];
  setToastListener(toast => toasts.push(toast));
  vi.mocked(api.listUsers).mockResolvedValue([
    {
      username: 'root',
      extra: [
        { type: 'name', value: 'Ada Lovelace' },
        { type: 'email', value: 'ada@example.com' },
      ],
    },
  ]);
  vi.mocked(api.saveUserExtra).mockResolvedValue(undefined);
  vi.mocked(api.changePassword).mockResolvedValue({} as never);
  vi.mocked(api.listRoles).mockResolvedValue([{ name: 'admin' }, { name: 'root' }]);
  vi.mocked(api.http.get).mockResolvedValue({ ticket: 'the.jwt.token' });
});

afterEach(() => {
  setToastListener(null);
});

describe('Profile', () => {
  it('loads the details of the signed in user', async () => {
    renderPage(<Profile />);

    expect(screen.getByText('Signed in as root on https://cloudlet.test')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('Full name')).toHaveValue('Ada Lovelace'));
    expect(screen.getByLabelText('Email')).toHaveValue('ada@example.com');
    expect(api.listUsers).toHaveBeenCalledWith('root', 0, 1);
  });

  it('saves the edited details', async () => {
    renderPage(<Profile />);
    const name = screen.getByLabelText('Full name');
    await waitFor(() => expect(name).toHaveValue('Ada Lovelace'));

    await userEvent.clear(name);
    await userEvent.type(name, 'Ada King');
    await userEvent.click(screen.getByRole('button', { name: 'Save details' }));

    await waitFor(() => expect(toasts.at(-1)?.text).toBe('Your details were saved'));
    expect(api.saveUserExtra).toHaveBeenCalledWith('root', 'name', 'Ada King');
    expect(api.saveUserExtra).toHaveBeenCalledWith('root', 'email', 'ada@example.com');
  });

  it('refuses a short password', async () => {
    renderPage(<Profile />);

    await userEvent.type(screen.getByLabelText(/^New password/), 'short');
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }));

    expect(toasts.at(-1)).toMatchObject({
      text: 'Passwords must be at least 12 characters',
      isError: true,
    });
    expect(api.changePassword).not.toHaveBeenCalled();
  });

  it('refuses a confirmation that does not match', async () => {
    renderPage(<Profile />);

    await userEvent.type(screen.getByLabelText(/^New password/), 'a-long-enough-pass');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'something-else-entirely');
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }));

    expect(toasts.at(-1)).toMatchObject({ text: 'Passwords do not match', isError: true });
    expect(api.changePassword).not.toHaveBeenCalled();
  });

  it('changes the password', async () => {
    renderPage(<Profile />);

    await userEvent.type(screen.getByLabelText(/^New password/), 'a-long-enough-pass');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'a-long-enough-pass');
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }));

    await waitFor(() => expect(api.changePassword).toHaveBeenCalledWith('a-long-enough-pass'));
  });

  it('generates an access token for the selected roles', async () => {
    renderPage(<Profile />);

    await userEvent.click(screen.getByRole('button', { name: 'Generate token…' }));
    await userEvent.click(await screen.findByLabelText('root'));
    await userEvent.click(screen.getByRole('button', { name: 'Generate' }));

    expect(await screen.findByText('the.jwt.token')).toBeInTheDocument();
    const url = vi.mocked(api.http.get).mock.calls.at(-1)![0];
    expect(url).toContain('username=service');
    expect(url).toContain('role=' + encodeURIComponent('admin,root'));
  });
});
