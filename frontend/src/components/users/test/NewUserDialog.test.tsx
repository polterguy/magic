// @vitest-environment jsdom
/*
 * NewUserDialog: Create is gated on a username and a password, a short password is refused with a
 * toast before anything is sent, optional name/email/roles are stored after the user is created
 * (in order, stopping at the first failure), and Enter in a field submits.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import { DialogProvider } from '../../Dialogs';
import NewUserDialog from '../NewUserDialog';

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
const PASSWORD = 'a-long-enough-secret';

function renderDialog() {
  const onClose = vi.fn();
  const onCreated = vi.fn();
  render(
    <DialogProvider>
      <NewUserDialog roles={ROLES} onClose={onClose} onCreated={onCreated} />
    </DialogProvider>,
  );
  return { onClose, onCreated };
}

async function fill(username: string, password: string) {
  await userEvent.type(screen.getByLabelText(/^Username/), username);
  await userEvent.type(screen.getByLabelText(/^Password/), password);
}

describe('NewUserDialog', () => {
  it('keeps Create disabled until both username and password are filled', async () => {
    renderDialog();
    const create = screen.getByRole('button', { name: 'Create user' });
    expect(create).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/^Username/), 'bob');
    expect(create).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/^Password/), 'x');
    expect(create).toBeEnabled();
  });

  it('creates just the user when nothing optional is given', async () => {
    const { onCreated } = renderDialog();
    await fill('bob', PASSWORD);
    await userEvent.click(screen.getByRole('button', { name: 'Create user' }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith('bob'));
    expect(api.createUser).toHaveBeenCalledWith('bob', PASSWORD);
    expect(api.addUserExtra).not.toHaveBeenCalled();
    expect(api.addUserToRole).not.toHaveBeenCalled();
  });

  it('stores name, email and the toggled roles after creating the user', async () => {
    const { onCreated } = renderDialog();
    await fill('bob', PASSWORD);
    await userEvent.type(screen.getByLabelText(/^Full name/), 'Bob B');
    await userEvent.type(screen.getByLabelText(/^Email/), 'bob@x.test');
    await userEvent.click(screen.getByLabelText('admin'));
    await userEvent.click(screen.getByLabelText('guest'));
    // Un-ticking a role takes it out again.
    await userEvent.click(screen.getByLabelText('admin'));
    await userEvent.click(screen.getByRole('button', { name: 'Create user' }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith('bob'));
    expect(api.addUserExtra).toHaveBeenCalledWith('bob', 'name', 'Bob B');
    expect(api.addUserExtra).toHaveBeenCalledWith('bob', 'email', 'bob@x.test');
    expect(api.addUserToRole).toHaveBeenCalledTimes(1);
    expect(api.addUserToRole).toHaveBeenCalledWith('bob', 'guest');
  });

  it('refuses a password shorter than the minimum without calling the server', async () => {
    const { onCreated } = renderDialog();
    await fill('bob', 'short');
    await userEvent.click(screen.getByRole('button', { name: 'Create user' }));

    expect(toasts.at(-1)).toMatchObject({
      text: 'Passwords must be at least ' + api.MIN_PASSWORD + ' characters',
      isError: true,
    });
    expect(api.createUser).not.toHaveBeenCalled();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('shows the error and re-enables Create when creating fails', async () => {
    vi.mocked(api.createUser).mockRejectedValueOnce(new Error('user exists'));
    const { onCreated } = renderDialog();
    await fill('bob', PASSWORD);
    await userEvent.click(screen.getByRole('button', { name: 'Create user' }));

    await waitFor(() =>
      expect(toasts.at(-1)).toMatchObject({ text: 'user exists', isError: true }),
    );
    expect(onCreated).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Create user' })).toBeEnabled();
  });

  it('stops at the first failing role and does not report the user as created', async () => {
    vi.mocked(api.addUserToRole).mockRejectedValueOnce(new Error('no such role'));
    const { onCreated } = renderDialog();
    await fill('bob', PASSWORD);
    await userEvent.click(screen.getByLabelText('admin'));
    await userEvent.click(screen.getByLabelText('guest'));
    await userEvent.click(screen.getByRole('button', { name: 'Create user' }));

    await waitFor(() => expect(toasts.at(-1)?.text).toBe('no such role'));
    expect(api.addUserToRole).toHaveBeenCalledTimes(1);
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('shows a busy label while the request is in flight', async () => {
    let finish: () => void = () => {
      // replaced below
    };
    vi.mocked(api.createUser).mockReturnValueOnce(
      new Promise<api.MagicResponse>(resolve => {
        finish = () => resolve({} as api.MagicResponse);
      }),
    );
    renderDialog();
    await fill('bob', PASSWORD);
    await userEvent.click(screen.getByRole('button', { name: 'Create user' }));

    expect(await screen.findByRole('button', { name: 'Creating…' })).toBeDisabled();
    finish();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Create user' })).toBeEnabled());
  });

  it('submits on Enter in a field when username and password are present', async () => {
    const { onCreated } = renderDialog();
    await fill('bob', PASSWORD);
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith('bob'));
  });

  it('ignores Enter while the form is incomplete', async () => {
    renderDialog();
    await userEvent.type(screen.getByLabelText(/^Username/), 'bob{Enter}');
    expect(api.createUser).not.toHaveBeenCalled();
    expect(toasts).toHaveLength(0);
  });

  it('closes on Cancel', async () => {
    const { onClose } = renderDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });
});
