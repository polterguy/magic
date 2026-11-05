// @vitest-environment jsdom
/*
 * InviteUserDialog: creates the account under a random throwaway password, stores the email (and
 * optional name), adds the chosen roles and mails the sign-in link to the backend the dashboard
 * is signed in to. Send is gated on an email address; failures show a toast and report nothing.
 */
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import { renderPage, type RenderPageOptions } from '../../../test/renderPage';
import InviteUserDialog from '../InviteUserDialog';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

let toasts: Toast[];

beforeEach(() => {
  toasts = [];
  setToastListener(t => toasts.push(t));
});

afterEach(() => {
  setToastListener(null);
  vi.clearAllMocks();
});

const ROLES = [{ name: 'admin' }, { name: 'guest' }];

function renderDialog(options: RenderPageOptions = {}) {
  const onClose = vi.fn();
  const onInvited = vi.fn();
  renderPage(<InviteUserDialog roles={ROLES} onClose={onClose} onInvited={onInvited} />, options);
  return { onClose, onInvited };
}

describe('InviteUserDialog', () => {
  it('only enables Send once the email contains an @', async () => {
    renderDialog();
    const send = screen.getByRole('button', { name: 'Send invite' });
    expect(send).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/^Email/), 'alice');
    expect(send).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/^Email/), '@x.test');
    expect(send).toBeEnabled();
  });

  it('creates the user with a random password, stores the email and mails the link', async () => {
    const { onInvited } = renderDialog();
    await userEvent.type(screen.getByLabelText(/^Email/), 'alice@x.test');
    await userEvent.click(screen.getByRole('button', { name: 'Send invite' }));

    await waitFor(() => expect(onInvited).toHaveBeenCalledWith('alice@x.test'));
    expect(api.createUser).toHaveBeenCalledWith('alice@x.test', expect.any(String));
    const password = vi.mocked(api.createUser).mock.calls[0][1];
    expect(password.length).toBeGreaterThanOrEqual(api.MIN_PASSWORD);
    expect(api.addUserExtra).toHaveBeenCalledTimes(1);
    expect(api.addUserExtra).toHaveBeenCalledWith('alice@x.test', 'email', 'alice@x.test');
    expect(api.addUserToRole).not.toHaveBeenCalled();
    expect(api.sendResetPasswordLink).toHaveBeenCalledWith('https://cloudlet.test', 'alice@x.test');
  });

  it('stores the optional name and adds the toggled roles', async () => {
    const { onInvited } = renderDialog();
    await userEvent.type(screen.getByLabelText(/^Email/), 'alice@x.test');
    await userEvent.type(screen.getByLabelText(/^Full name/), 'Alice A');
    await userEvent.click(screen.getByLabelText('admin'));
    await userEvent.click(screen.getByLabelText('guest'));
    await userEvent.click(screen.getByLabelText('admin'));
    await userEvent.click(screen.getByRole('button', { name: 'Send invite' }));

    await waitFor(() => expect(onInvited).toHaveBeenCalled());
    expect(api.addUserExtra).toHaveBeenCalledWith('alice@x.test', 'name', 'Alice A');
    expect(api.addUserToRole).toHaveBeenCalledTimes(1);
    expect(api.addUserToRole).toHaveBeenCalledWith('alice@x.test', 'guest');
  });

  it('mails with an empty backend url when no backend is selected', async () => {
    const { onInvited } = renderDialog({ auth: { backend: null } });
    await userEvent.type(screen.getByLabelText(/^Email/), 'alice@x.test');
    await userEvent.click(screen.getByRole('button', { name: 'Send invite' }));
    await waitFor(() => expect(onInvited).toHaveBeenCalled());
    expect(api.sendResetPasswordLink).toHaveBeenCalledWith('', 'alice@x.test');
  });

  it('shows the error and reports nothing when a step fails', async () => {
    vi.mocked(api.sendResetPasswordLink).mockRejectedValueOnce(new Error('mail down'));
    const { onInvited } = renderDialog();
    await userEvent.type(screen.getByLabelText(/^Email/), 'alice@x.test');
    await userEvent.click(screen.getByRole('button', { name: 'Send invite' }));

    await waitFor(() => expect(toasts.at(-1)).toMatchObject({ text: 'mail down', isError: true }));
    expect(onInvited).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Send invite' })).toBeEnabled();
  });

  it('stops at the first failing role', async () => {
    vi.mocked(api.addUserToRole).mockRejectedValueOnce(new Error('no such role'));
    renderDialog();
    await userEvent.type(screen.getByLabelText(/^Email/), 'alice@x.test');
    await userEvent.click(screen.getByLabelText('admin'));
    await userEvent.click(screen.getByLabelText('guest'));
    await userEvent.click(screen.getByRole('button', { name: 'Send invite' }));

    await waitFor(() => expect(toasts.at(-1)?.text).toBe('no such role'));
    expect(api.addUserToRole).toHaveBeenCalledTimes(1);
    expect(api.sendResetPasswordLink).not.toHaveBeenCalled();
  });

  it('shows a busy label while inviting', async () => {
    let finish: () => void = () => {
      // replaced below
    };
    vi.mocked(api.createUser).mockReturnValueOnce(
      new Promise<api.MagicResponse>(resolve => {
        finish = () => resolve({} as api.MagicResponse);
      }),
    );
    renderDialog();
    await userEvent.type(screen.getByLabelText(/^Email/), 'alice@x.test');
    await userEvent.click(screen.getByRole('button', { name: 'Send invite' }));
    expect(await screen.findByRole('button', { name: 'Inviting…' })).toBeDisabled();
    finish();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send invite' })).toBeEnabled());
  });

  it('submits on Enter once an email is typed, and ignores Enter on an empty form', async () => {
    const { onInvited } = renderDialog();
    await userEvent.click(screen.getByLabelText(/^Email/));
    await userEvent.keyboard('{Enter}');
    expect(api.createUser).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText(/^Email/), 'alice@x.test{Enter}');
    await waitFor(() => expect(onInvited).toHaveBeenCalledWith('alice@x.test'));
  });

  it('closes on Cancel', async () => {
    const { onClose } = renderDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });
});
