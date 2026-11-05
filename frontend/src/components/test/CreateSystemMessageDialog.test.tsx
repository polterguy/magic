// @vitest-environment jsdom
/*
 * CreateSystemMessageDialog: asks for a URL, opens a socket on a server-chosen channel, starts the
 * crawl and hands the streamed message back. Covers the happy path, the failures at each step
 * (channel, connection, server-reported ERROR) and the confirmation guarding a close mid-crawl.
 * The socket is a fake that records its handlers.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../lib/api';
import CreateSystemMessageDialog from '../CreateSystemMessageDialog';
import { DialogProvider } from '../Dialogs';

vi.mock('../../lib/api', async importOriginal =>
  (await import('../../test/apiMock')).mockApi(await importOriginal()),
);

interface FakeConnection {
  on: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
}

const sockets = vi.hoisted(() => ({ connection: undefined as FakeConnection | undefined }));

vi.mock('../../lib/socket', () => ({
  createSocket: () => sockets.connection,
}));

let connection: FakeConnection;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  connection = {
    on: vi.fn(),
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
  };
  sockets.connection = connection;
  // gibberish() calls the module's own http client, so the channel comes from a stubbed fetch.
  fetchMock = vi.fn().mockImplementation(() =>
    Promise.resolve(
      new Response(JSON.stringify({ result: 'abc123' }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  );
  vi.stubGlobal('fetch', fetchMock);
  vi.mocked(api.createSystemMessage).mockResolvedValue(undefined as never);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

function renderDialog() {
  const onClose = vi.fn();
  const onGenerated = vi.fn();
  render(
    <DialogProvider>
      <CreateSystemMessageDialog
        instruction="make it about a site"
        template="About [[site]]"
        onGenerated={onGenerated}
        onClose={onClose}
      />
    </DialogProvider>,
  );
  return { onClose, onGenerated };
}

// The handler the dialog registered for the channel, as the socket would invoke it.
function deliver(payload: unknown) {
  const [channel, handler] = connection.on.mock.calls[0] as [string, (raw: string) => void];
  expect(channel).toBe('c_abc123');
  handler(JSON.stringify(payload));
}

async function startGenerating(url = 'https://example.com') {
  await userEvent.type(screen.getByLabelText(/Website URL/), url);
  await userEvent.click(screen.getByRole('button', { name: 'Generate' }));
}

describe('CreateSystemMessageDialog', () => {
  it('keeps Generate disabled until a URL is typed, and ignores Enter on an empty field', async () => {
    renderDialog();
    expect(screen.getByRole('button', { name: 'Generate' })).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/Website URL/), '{Enter}');
    expect(fetchMock).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText(/Website URL/), 'x');
    expect(screen.getByRole('button', { name: 'Generate' })).toBeEnabled();
  });

  it('starts the crawl on a fresh channel and hands the generated message back', async () => {
    const { onGenerated } = renderDialog();
    await userEvent.type(screen.getByLabelText(/Website URL/), 'https://example.com{Enter}');

    await waitFor(() =>
      expect(api.createSystemMessage).toHaveBeenCalledWith(
        'make it about a site',
        'About [[site]]',
        'https://example.com',
        'c_abc123',
      ),
    );
    expect(screen.getByText(/Generating from https:\/\/example.com/)).toBeInTheDocument();

    deliver({ message: 'Hello from the crawl' });
    expect(connection.stop).toHaveBeenCalled();
    expect(onGenerated).toHaveBeenCalledWith('Hello from the crawl');
  });

  it('shows the server-reported failure and returns to the form', async () => {
    const { onGenerated } = renderDialog();
    await startGenerating();
    await waitFor(() => expect(api.createSystemMessage).toHaveBeenCalled());

    deliver({ message: 'ERROR', extra: 'Site unreachable' });
    expect(await screen.findByText('Site unreachable')).toBeInTheDocument();
    expect(onGenerated).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Website URL/)).toHaveValue('https://example.com');
  });

  it('falls back to a generic message when the server gives no reason', async () => {
    renderDialog();
    await startGenerating();
    await waitFor(() => expect(api.createSystemMessage).toHaveBeenCalled());

    deliver({ message: 'ERROR' });
    expect(await screen.findByText('Generation failed')).toBeInTheDocument();
  });

  it('reports a channel that could not be created without opening a socket', async () => {
    fetchMock.mockRejectedValue(new Error('no random'));
    renderDialog();
    await startGenerating();

    expect(await screen.findByText('no random')).toBeInTheDocument();
    expect(connection.start).not.toHaveBeenCalled();
  });

  it('reports a socket that would not connect and closes it', async () => {
    connection.start.mockRejectedValue(new Error('socket down'));
    renderDialog();
    await startGenerating();

    expect(await screen.findByText('socket down')).toBeInTheDocument();
    expect(api.createSystemMessage).not.toHaveBeenCalled();
    expect(connection.stop).toHaveBeenCalled();
  });

  it('reports a failing crawl request and lets the banner be dismissed', async () => {
    vi.mocked(api.createSystemMessage).mockRejectedValue(new Error('crawl refused'));
    renderDialog();
    await startGenerating();

    expect(await screen.findByText('crawl refused')).toBeInTheDocument();
    await userEvent.click(screen.getByTitle('Dismiss'));
    expect(screen.queryByText('crawl refused')).not.toBeInTheDocument();
  });

  it('closes straight away from the form', async () => {
    const { onClose } = renderDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('asks before closing mid-generation and keeps waiting when declined', async () => {
    const { onClose } = renderDialog();
    await startGenerating();
    await waitFor(() => expect(api.createSystemMessage).toHaveBeenCalled());

    await userEvent.keyboard('{Escape}');
    expect(await screen.findByText('Stop waiting?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByText('Stop waiting?')).not.toBeInTheDocument());
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText(/Generating from/)).toBeInTheDocument();
  });

  it('closes and drops the socket when stopping the wait is confirmed', async () => {
    const { onClose } = renderDialog();
    await startGenerating();
    await waitFor(() => expect(api.createSystemMessage).toHaveBeenCalled());

    await userEvent.keyboard('{Escape}');
    await userEvent.click(await screen.findByRole('button', { name: 'Stop waiting' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(connection.stop).toHaveBeenCalled();
  });
});
