// @vitest-environment jsdom
/*
 * Setup page: validates the first-run form before calling the backend, submits name, email and
 * password, stores them for root, and treats an already configured backend (401) as done.
 */
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../lib/api';
import { renderPage } from '../../test/renderPage';
import Setup from '../Setup';

vi.mock('../../lib/api', async importOriginal =>
  (await import('../../test/apiMock')).mockApi(await importOriginal()),
);

const PASSWORD = 'a-long-enough-pass';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.setupSystem).mockResolvedValue({ ticket: 'new-ticket' });
  vi.mocked(api.saveUserExtra).mockResolvedValue(undefined);
});

async function fill(name: string, email: string, password: string, repeat: string) {
  const user = userEvent.setup();
  if (name) await user.type(screen.getByLabelText('Full name'), name);
  if (email) await user.type(screen.getByLabelText('Email'), email);
  if (password) await user.type(screen.getByLabelText(/^Password/), password);
  if (repeat) await user.type(screen.getByLabelText('Repeat password'), repeat);
  await user.click(screen.getByRole('button', { name: 'Save' }));
}

describe('Setup', () => {
  it('explains what to do', () => {
    renderPage(<Setup />);

    expect(screen.getByRole('heading', { name: 'Set up your cloudlet' })).toBeInTheDocument();
  });

  it('asks for a name before anything else', async () => {
    renderPage(<Setup />);

    await fill('', '', '', '');

    expect(screen.getByText('Your name is required')).toBeInTheDocument();
    expect(api.setupSystem).not.toHaveBeenCalled();
  });

  it('rejects an invalid email', async () => {
    renderPage(<Setup />);

    await fill('Ada', 'ada@example', PASSWORD, PASSWORD);

    expect(screen.getByText('That does not look like an email address')).toBeInTheDocument();
  });

  it('rejects a password that is too short', async () => {
    renderPage(<Setup />);

    await fill('Ada', 'ada@example.com', 'short', 'short');

    expect(screen.getByText(/must be at least 12 characters/)).toBeInTheDocument();
  });

  it('rejects passwords that do not match', async () => {
    renderPage(<Setup />);

    await fill('Ada', 'ada@example.com', PASSWORD, PASSWORD + 'x');

    expect(screen.getByText('The two passwords do not match')).toBeInTheDocument();
    expect(api.setupSystem).not.toHaveBeenCalled();
  });

  it('sets the system up and signs in with the new ticket', async () => {
    const { auth } = renderPage(<Setup />);

    await fill('Ada', 'ada@example.com', PASSWORD, PASSWORD);

    await waitFor(() => expect(auth.setupCompleted).toHaveBeenCalled());
    expect(api.setupSystem).toHaveBeenCalledWith({
      password: PASSWORD,
      name: 'Ada',
      email: 'ada@example.com',
      subscribe: true,
    });
    expect(auth.loginWithTicket).toHaveBeenCalledWith('https://cloudlet.test', 'new-ticket');
    expect(api.saveUserExtra).toHaveBeenCalledWith('root', 'name', 'Ada');
    expect(api.saveUserExtra).toHaveBeenCalledWith('root', 'email', 'ada@example.com');
  });

  it('shows the backend error when setup fails', async () => {
    vi.mocked(api.setupSystem).mockRejectedValue(new Error('disk full'));
    const { auth } = renderPage(<Setup />);

    await fill('Ada', 'ada@example.com', PASSWORD, PASSWORD);

    expect(await screen.findByText('disk full')).toBeInTheDocument();
    expect(auth.setupCompleted).not.toHaveBeenCalled();
  });

  it('lets the user through when the backend is already configured', async () => {
    vi.mocked(api.setupSystem).mockRejectedValue(new api.ApiError(401, 'Unauthorized'));
    const { auth } = renderPage(<Setup />);

    await fill('Ada', 'ada@example.com', PASSWORD, PASSWORD);

    await waitFor(() => expect(auth.setupCompleted).toHaveBeenCalled());
  });
});
