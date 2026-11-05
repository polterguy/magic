// @vitest-environment jsdom
/*
 * AddFunctionDialog: lists installable AI functions, filterable by name or description. Install
 * either writes a training snippet whose meta names the file, or, when the caller wants a
 * declaration, hands the file back untouched. Covers loading, empty and failing lists, and
 * failing installs.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../../lib/api';
import { setToastListener, type Toast } from '../../../lib/toast';
import AddFunctionDialog from '../AddFunctionDialog';

vi.mock('../../../lib/api', async importOriginal =>
  (await import('../../../test/apiMock')).mockApi(await importOriginal()),
);

const WORKFLOWS = [
  { name: 'Send email', description: 'Mails somebody', file: '/misc/workflows/send-email.hl' },
  { name: 'Weather', description: 'Looks up the forecast', file: '/misc/workflows/weather.hl' },
  { name: 'Bare', description: undefined as unknown as string, file: '/misc/workflows/bare.hl' },
];

let toasts: Toast[];

beforeEach(() => {
  toasts = [];
  setToastListener(t => toasts.push(t));
  vi.mocked(api.availableWorkflows).mockResolvedValue(WORKFLOWS);
  vi.mocked(api.mlSnippetCreate).mockResolvedValue(undefined as never);
});

afterEach(() => {
  setToastListener(null);
  vi.clearAllMocks();
});

function renderDialog(onDeclaration?: (file: string) => void) {
  const onClose = vi.fn();
  const onInstalled = vi.fn();
  render(
    <AddFunctionDialog
      type="support"
      onClose={onClose}
      onInstalled={onInstalled}
      onDeclaration={onDeclaration}
    />,
  );
  return { onClose, onInstalled };
}

describe('AddFunctionDialog', () => {
  it('lists the functions with their description and file once loaded', async () => {
    renderDialog();
    expect(screen.getByText('Add AI function to support')).toBeInTheDocument();
    expect(screen.queryByText('Send email')).not.toBeInTheDocument();

    expect(await screen.findByText('Send email')).toBeInTheDocument();
    expect(screen.getByText('Mails somebody')).toBeInTheDocument();
    expect(screen.getByText('/misc/workflows/weather.hl')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Install' })).toHaveLength(3);
  });

  it('filters on name or description, case-insensitively', async () => {
    renderDialog();
    await screen.findByText('Send email');
    const filter = screen.getByPlaceholderText('Filter functions…');

    await userEvent.type(filter, 'WEATH');
    expect(screen.getByText('Weather')).toBeInTheDocument();
    expect(screen.queryByText('Send email')).not.toBeInTheDocument();

    await userEvent.clear(filter);
    await userEvent.type(filter, 'mails');
    expect(screen.getByText('Send email')).toBeInTheDocument();
    expect(screen.queryByText('Weather')).not.toBeInTheDocument();

    await userEvent.clear(filter);
    await userEvent.type(filter, 'zzz');
    expect(screen.getByText('No functions found.')).toBeInTheDocument();
  });

  it('says so when there are no functions, also for a null answer', async () => {
    vi.mocked(api.availableWorkflows).mockResolvedValue(null as never);
    renderDialog();
    expect(await screen.findByText('No functions found.')).toBeInTheDocument();
  });

  it('shows a failing list in a dismissible banner', async () => {
    vi.mocked(api.availableWorkflows).mockRejectedValue(new Error('list failed'));
    renderDialog();
    expect(await screen.findByText('list failed')).toBeInTheDocument();
    expect(screen.getByText('No functions found.')).toBeInTheDocument();
    await userEvent.click(screen.getByTitle('Dismiss'));
    expect(screen.queryByText('list failed')).not.toBeInTheDocument();
  });

  it('installs a function as a training snippet naming its file', async () => {
    const { onInstalled } = renderDialog();
    await screen.findByText('Send email');
    await userEvent.click(screen.getAllByRole('button', { name: 'Install' })[0]);

    await waitFor(() => expect(onInstalled).toHaveBeenCalled());
    expect(api.mlSnippetCreate).toHaveBeenCalledWith({
      prompt: 'Send email',
      completion: 'Mails somebody',
      type: 'support',
      meta: 'FUNCTION_INVOCATION ==> /misc/workflows/send-email.hl',
      uri: null,
    });
    expect(toasts.map(toast => toast.text)).toContain('AI function Send email added to support');
  });

  it('writes an empty completion for a function without a description', async () => {
    renderDialog();
    await screen.findByText('Bare');
    await userEvent.click(screen.getAllByRole('button', { name: 'Install' })[2]);
    await waitFor(() => expect(api.mlSnippetCreate).toHaveBeenCalled());
    expect(vi.mocked(api.mlSnippetCreate).mock.calls[0][0].completion).toBe('');
  });

  it('hands the file back instead of writing a snippet when a declaration is wanted', async () => {
    const onDeclaration = vi.fn();
    const { onInstalled } = renderDialog(onDeclaration);
    await screen.findByText('Weather');
    await userEvent.click(screen.getAllByRole('button', { name: 'Install' })[1]);

    await waitFor(() => expect(onDeclaration).toHaveBeenCalledWith('/misc/workflows/weather.hl'));
    expect(api.mlSnippetCreate).not.toHaveBeenCalled();
    expect(onInstalled).not.toHaveBeenCalled();
  });

  it('toasts a failing install and leaves the dialog usable', async () => {
    vi.mocked(api.mlSnippetCreate).mockRejectedValue(new Error('cannot write'));
    const { onInstalled } = renderDialog();
    await screen.findByText('Send email');
    await userEvent.click(screen.getAllByRole('button', { name: 'Install' })[0]);

    await waitFor(() =>
      expect(toasts.some(toast => toast.text === 'cannot write' && toast.isError)).toBe(true),
    );
    expect(onInstalled).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: 'Install' })[0]).toBeEnabled(),
    );
  });

  it('disables every Install while one is in flight and ignores a second click', async () => {
    let finish: () => void = () => {
      // replaced as soon as the install starts
    };
    vi.mocked(api.mlSnippetCreate).mockReturnValue(
      new Promise<never>(done => {
        finish = () => done(undefined as never);
      }),
    );
    renderDialog();
    await screen.findByText('Send email');
    const buttons = screen.getAllByRole('button', { name: 'Install' });
    await userEvent.click(buttons[0]);
    await waitFor(() => expect(buttons[1]).toBeDisabled());
    await userEvent.click(buttons[1]);
    expect(api.mlSnippetCreate).toHaveBeenCalledTimes(1);

    finish();
    await waitFor(() => expect(buttons[1]).toBeEnabled());
  });

  it('closes with the Close button', async () => {
    const { onClose } = renderDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });
});
