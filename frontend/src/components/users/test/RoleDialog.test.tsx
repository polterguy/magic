// @vitest-environment jsdom
/*
 * RoleDialog: creates a role, or edits one (the name is its key, so it is read-only and only the
 * description is saved with updateRole). Save needs a name; failures toast and keep the dialog.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import { DialogProvider } from '../../Dialogs';
import RoleDialog from '../RoleDialog';

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

function renderDialog(role: api.Role | null) {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  render(
    <DialogProvider>
      <RoleDialog role={role} onClose={onClose} onSaved={onSaved} />
    </DialogProvider>,
  );
  return { onClose, onSaved };
}

describe('RoleDialog new role', () => {
  it('keeps Save disabled until there is a name', async () => {
    renderDialog(null);
    expect(screen.getByRole('heading', { name: 'New role' })).toBeInTheDocument();
    const save = screen.getByRole('button', { name: 'Save' });
    expect(save).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/^Name/), 'editor');
    expect(save).toBeEnabled();
  });

  it('creates the role with its description', async () => {
    const { onSaved } = renderDialog(null);
    await userEvent.type(screen.getByLabelText(/^Name/), 'editor');
    await userEvent.type(screen.getByLabelText(/^Description/), 'Can edit');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('editor'));
    expect(api.createRole).toHaveBeenCalledWith('editor', 'Can edit');
    expect(api.updateRole).not.toHaveBeenCalled();
  });

  it('shows the error and keeps the dialog usable when creating fails', async () => {
    vi.mocked(api.createRole).mockRejectedValueOnce(new Error('role exists'));
    const { onSaved } = renderDialog(null);
    await userEvent.type(screen.getByLabelText(/^Name/), 'editor');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(toasts.at(-1)).toMatchObject({ text: 'role exists', isError: true }),
    );
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('shows a busy label while saving', async () => {
    let finish: () => void = () => {
      // replaced below
    };
    vi.mocked(api.createRole).mockReturnValueOnce(
      new Promise<api.MagicResponse>(resolve => {
        finish = () => resolve({} as api.MagicResponse);
      }),
    );
    renderDialog(null);
    await userEvent.type(screen.getByLabelText(/^Name/), 'editor');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('button', { name: 'Saving…' })).toBeDisabled();
    finish();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled());
  });

  it('submits on Enter in the name field, but not on an empty name', async () => {
    const { onSaved } = renderDialog(null);
    await userEvent.click(screen.getByLabelText(/^Name/));
    await userEvent.keyboard('{Enter}');
    expect(api.createRole).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText(/^Name/), 'editor{Enter}');
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('editor'));
  });

  it('does not submit on Enter inside the description textarea', async () => {
    renderDialog(null);
    await userEvent.type(screen.getByLabelText(/^Name/), 'editor');
    await userEvent.type(screen.getByLabelText(/^Description/), 'line one{Enter}line two');
    expect(api.createRole).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/^Description/)).toHaveValue('line one\nline two');
  });

  it('focuses the name field first', () => {
    renderDialog(null);
    expect(screen.getByLabelText(/^Name/)).toHaveFocus();
  });
});

describe('RoleDialog edit role', () => {
  const role = { name: 'admin', description: 'Everything' };

  it('shows the role with a read-only name and focuses the description', () => {
    renderDialog(role);
    expect(screen.getByRole('heading', { name: 'Edit role admin' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Name/)).toHaveValue('admin');
    expect(screen.getByLabelText(/^Name/)).toHaveAttribute('readonly');
    expect(screen.getByLabelText(/^Description/)).toHaveValue('Everything');
    expect(screen.getByLabelText(/^Description/)).toHaveFocus();
  });

  it('updates the description with updateRole', async () => {
    const { onSaved } = renderDialog(role);
    await userEvent.clear(screen.getByLabelText(/^Description/));
    await userEvent.type(screen.getByLabelText(/^Description/), 'Most things');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('admin'));
    expect(api.updateRole).toHaveBeenCalledWith('admin', 'Most things');
    expect(api.createRole).not.toHaveBeenCalled();
  });

  it('starts with an empty description when the role has none', () => {
    renderDialog({ name: 'guest' });
    expect(screen.getByLabelText(/^Description/)).toHaveValue('');
  });

  it('shows the error when the update fails', async () => {
    vi.mocked(api.updateRole).mockRejectedValueOnce(new Error('denied'));
    const { onSaved } = renderDialog(role);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(toasts.at(-1)?.text).toBe('denied'));
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('closes on Cancel', async () => {
    const { onClose } = renderDialog(role);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });
});
