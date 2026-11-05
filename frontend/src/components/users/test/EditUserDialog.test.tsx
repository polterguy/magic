// @vitest-environment jsdom
/*
 * EditUserDialog: role membership applies immediately (and reverts on failure), extra fields can
 * be added, edited and deleted, and Save writes new fields with add and known ones with update.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import { DialogProvider } from '../../Dialogs';
import EditUserDialog from '../EditUserDialog';

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

function renderDialog(user: Partial<api.User> = {}) {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  render(
    <DialogProvider>
      <EditUserDialog
        user={{
          username: 'alice',
          roles: ['guest'],
          extra: [{ type: 'email', value: 'a@x.test' }],
          ...user,
        }}
        roles={ROLES}
        onClose={onClose}
        onSaved={onSaved}
      />
    </DialogProvider>,
  );
  return { onClose, onSaved };
}

describe('EditUserDialog roles', () => {
  it('shows current membership and adds a role immediately', async () => {
    renderDialog();
    expect(screen.getByLabelText('guest')).toBeChecked();
    expect(screen.getByLabelText('admin')).not.toBeChecked();

    await userEvent.click(screen.getByLabelText('admin'));

    expect(api.addUserToRole).toHaveBeenCalledWith('alice', 'admin');
    expect(screen.getByLabelText('admin')).toBeChecked();
  });

  it('removes a role immediately', async () => {
    renderDialog();
    await userEvent.click(screen.getByLabelText('guest'));
    expect(api.removeUserFromRole).toHaveBeenCalledWith('alice', 'guest');
    expect(screen.getByLabelText('guest')).not.toBeChecked();
  });

  it('reverts the checkbox and shows an error when the call fails', async () => {
    vi.mocked(api.addUserToRole).mockRejectedValueOnce(new Error('nope'));
    renderDialog();
    await userEvent.click(screen.getByLabelText('admin'));
    await waitFor(() => expect(screen.getByLabelText('admin')).not.toBeChecked());
    expect(toasts.at(-1)).toMatchObject({ text: 'nope', isError: true });
  });

  it('starts empty when the user has no roles or fields', () => {
    renderDialog({ roles: undefined, extra: undefined });
    expect(screen.getByLabelText('guest')).not.toBeChecked();
    expect(screen.getByText(/No extra fields/)).toBeInTheDocument();
  });
});

describe('EditUserDialog extra fields', () => {
  async function addField(name: string) {
    await userEvent.click(screen.getByRole('button', { name: '+ Add field' }));
    await userEvent.type(screen.getByLabelText('Field name'), name);
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
  }

  it('adds a new field and saves it with add, existing ones with update', async () => {
    const { onSaved } = renderDialog();
    await addField('phone');
    const inputs = screen.getAllByRole('textbox');
    await userEvent.type(inputs[1], '555');
    await userEvent.clear(inputs[0]);
    await userEvent.type(inputs[0], 'b@x.test');

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.updateUserExtra).toHaveBeenCalledWith('alice', 'email', 'b@x.test');
    expect(api.addUserExtra).toHaveBeenCalledWith('alice', 'phone', '555');
  });

  it('rejects a duplicate field name', async () => {
    renderDialog();
    await addField('email');
    expect(toasts.at(-1)).toMatchObject({
      text: 'The user already has a field named email',
      isError: true,
    });
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
  });

  it('adds nothing when the prompt is cancelled', async () => {
    renderDialog();
    await userEvent.click(screen.getByRole('button', { name: '+ Add field' }));
    await userEvent.click(screen.getAllByRole('button', { name: 'Cancel' }).at(-1)!);
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
  });

  it('deletes a stored field on the server after confirming', async () => {
    renderDialog();
    await userEvent.click(screen.getByTitle('Delete field'));
    expect(screen.getByText('Delete field?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(screen.getByText(/No extra fields/)).toBeInTheDocument());
    expect(api.deleteUserExtra).toHaveBeenCalledWith('alice', 'email');
  });

  it('removes a not-yet-saved field without calling the server', async () => {
    renderDialog();
    await addField('phone');
    await userEvent.click(screen.getAllByTitle('Delete field')[1]);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(screen.getAllByRole('textbox')).toHaveLength(1));
    expect(api.deleteUserExtra).not.toHaveBeenCalled();
  });

  it('keeps the field when delete is declined', async () => {
    renderDialog();
    await userEvent.click(screen.getByTitle('Delete field'));
    await userEvent.click(screen.getAllByRole('button', { name: 'Cancel' }).at(-1)!);
    expect(api.deleteUserExtra).not.toHaveBeenCalled();
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
  });

  it('keeps the field and shows an error when the delete fails', async () => {
    vi.mocked(api.deleteUserExtra).mockRejectedValueOnce(new Error('denied'));
    renderDialog();
    await userEvent.click(screen.getByTitle('Delete field'));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(toasts.at(-1)?.text).toBe('denied'));
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
  });
});

describe('EditUserDialog save', () => {
  it('stops at the first failing write and does not report saved', async () => {
    vi.mocked(api.updateUserExtra).mockRejectedValueOnce(new Error('write failed'));
    const { onSaved } = renderDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(toasts.at(-1)?.text).toBe('write failed'));
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('closes on Cancel', async () => {
    const { onClose } = renderDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('saves when Enter is pressed in a field', async () => {
    const { onSaved } = renderDialog();
    await userEvent.click(screen.getByRole('textbox'));
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });
});
