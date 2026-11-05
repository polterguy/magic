// @vitest-environment jsdom
/*
 * SocketFeedback: opens a socket on its channel, calls onReady once it is connected (never after
 * being torn down, and only once), renders every published message as a terminal line (with
 * defaults for missing fields), shows progress counts and the done actions, and reports a failed
 * connection in a dismissible banner. The socket module is stubbed with a controllable fake.
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createSocket } from '../../lib/socket';
import SocketFeedback from '../SocketFeedback';

vi.mock('../../lib/socket', () => ({ createSocket: vi.fn() }));

class FakeConnection {
  handlers = new Map<string, (args: string) => void>();
  resolveStart: () => void = () => {
    // replaced by start()
  };
  rejectStart: (reason: unknown) => void = () => {
    // replaced by start()
  };
  stopped = false;
  stopFails = false;

  on(channel: string, handler: (args: string) => void) {
    this.handlers.set(channel, handler);
  }

  start() {
    return new Promise<void>((resolve, reject) => {
      this.resolveStart = resolve;
      this.rejectStart = reject;
    });
  }

  stop() {
    this.stopped = true;
    return this.stopFails ? Promise.reject(new Error('stop failed')) : Promise.resolve();
  }

  publish(channel: string, payload: unknown) {
    this.handlers.get(channel)!(typeof payload === 'string' ? payload : JSON.stringify(payload));
  }
}

let connections: FakeConnection[];

// jsdom has no layout and no scrollTo; the terminal scrolls itself to the newest line.
beforeAll(() => {
  Element.prototype.scrollTo = vi.fn();
});

beforeEach(() => {
  connections = [];
  vi.mocked(createSocket).mockImplementation(() => {
    const connection = new FakeConnection();
    connections.push(connection);
    return connection as unknown as ReturnType<typeof createSocket>;
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

// Runs the action, then lets the promise callbacks it triggers settle inside act.
async function settle(action: () => void) {
  await act(async () => {
    action();
    await Promise.resolve();
  });
}

function setup(props: Partial<React.ComponentProps<typeof SocketFeedback>> = {}) {
  const onReady = vi.fn();
  const onClose = vi.fn();
  const view = render(
    <SocketFeedback
      title="Vectorising"
      channel="feedback-1"
      onReady={onReady}
      onClose={onClose}
      {...props}
    />,
  );
  return { onReady, onClose, ...view };
}

describe('SocketFeedback connection', () => {
  it('shows the title and channel, waiting for the server', () => {
    setup();
    expect(screen.getByRole('heading', { name: 'Vectorising' })).toBeInTheDocument();
    expect(screen.getByText('feedback-1')).toBeInTheDocument();
    expect(screen.getByText('Waiting for your server…')).toBeInTheDocument();
  });

  it('starts the job only once the socket is connected', async () => {
    const { onReady } = setup();
    expect(onReady).not.toHaveBeenCalled();
    await settle(() => {
      connections[0].resolveStart();
    });
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it('calls the newest onReady when the callback changed before connecting', async () => {
    const { onReady, rerender } = setup();
    const newer = vi.fn();
    rerender(
      <SocketFeedback title="Vectorising" channel="feedback-1" onReady={newer} onClose={vi.fn()} />,
    );
    expect(connections).toHaveLength(1);
    await settle(() => {
      connections[0].resolveStart();
    });
    expect(newer).toHaveBeenCalledTimes(1);
    expect(onReady).not.toHaveBeenCalled();
  });

  it('fires onReady once even though StrictMode connects twice', async () => {
    const onReady = vi.fn();
    render(
      <StrictMode>
        <SocketFeedback title="t" channel="c" onReady={onReady} onClose={vi.fn()} />
      </StrictMode>,
    );
    expect(connections.length).toBeGreaterThanOrEqual(2);
    // The first connection was torn down while negotiating; its outcome is not reported.
    await settle(() => {
      connections[0].rejectStart(
        new Error('Failed to start the HttpConnection before stop() was called'),
      );
      connections.at(-1)!.resolveStart();
    });
    expect(onReady).toHaveBeenCalledTimes(1);
    expect(screen.queryByTitle('Dismiss')).not.toBeInTheDocument();
  });

  it('ignores a start that completes after unmounting', async () => {
    const { onReady, unmount } = setup();
    unmount();
    expect(connections[0].stopped).toBe(true);
    await settle(() => {
      connections[0].resolveStart();
    });
    expect(onReady).not.toHaveBeenCalled();
  });

  it('swallows a failing stop on unmount', async () => {
    const { unmount } = setup();
    connections[0].stopFails = true;
    unmount();
    await act(async () => {
      await Promise.resolve();
    });
    expect(connections[0].stopped).toBe(true);
  });

  it('opens a new connection when the channel changes', () => {
    const { rerender } = setup();
    rerender(
      <SocketFeedback
        title="Vectorising"
        channel="feedback-2"
        onReady={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(connections).toHaveLength(2);
    expect(connections[0].stopped).toBe(true);
    expect(connections[1].handlers.has('feedback-2')).toBe(true);
  });

  it('closes with the Close button', async () => {
    const { onClose } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('SocketFeedback errors', () => {
  it('shows a failed connection in a banner that can be dismissed', async () => {
    const { onReady } = setup();
    await settle(() => {
      connections[0].rejectStart(new Error('offline'));
    });
    expect(screen.getByText('Error: offline')).toBeInTheDocument();
    expect(onReady).not.toHaveBeenCalled();

    await userEvent.click(screen.getByTitle('Dismiss'));
    expect(screen.queryByText('Error: offline')).not.toBeInTheDocument();
  });
});

describe('SocketFeedback messages', () => {
  it('appends each published message as a line of its type', async () => {
    setup();
    await settle(() => {
      connections[0].publish('feedback-1', { type: 'information', message: 'Starting' });
      connections[0].publish('feedback-1', { type: 'error', message: 'Broke' });
    });
    expect(screen.queryByText('Waiting for your server…')).not.toBeInTheDocument();
    expect(screen.getByText('Starting')).toHaveClass('terminal-line', 'information');
    expect(screen.getByText('Broke')).toHaveClass('terminal-line', 'error');
  });

  it('defaults the type to information and the text to the raw payload', async () => {
    setup();
    await settle(() => {
      connections[0].publish('feedback-1', { message: 'No type here' });
      connections[0].publish('feedback-1', { type: 'warning' });
    });
    expect(screen.getByText('No type here')).toHaveClass('information');
    expect(screen.getByText('{"type":"warning"}')).toHaveClass('warning');
  });
});

describe('SocketFeedback progress and completion', () => {
  const progress = {
    total: 3,
    counts: (message: { type: string; message: string }) => message.message.startsWith('Embedding'),
    noun: 'snippet',
  };

  it('shows no progress readout unless asked to', () => {
    setup();
    expect(screen.queryByText(/^Processing/)).not.toBeInTheDocument();
  });

  it('counts only the messages the job emits per item', async () => {
    setup({ progress });
    expect(screen.getByText('Processing snippet 0 of 3')).toBeInTheDocument();
    await settle(() => {
      connections[0].publish('feedback-1', { type: 'information', message: 'Embedding a' });
      connections[0].publish('feedback-1', { type: 'information', message: 'Connecting' });
      connections[0].publish('feedback-1', { type: 'information', message: 'Embedding b' });
    });
    expect(screen.getByText('Processing snippet 2 of 3')).toBeInTheDocument();
  });

  it('shows the done actions only after a terminal message arrives', async () => {
    setup({
      isComplete: message => message.message === 'Done!',
      renderDone: messages => <a href="#next">Open result ({messages.length})</a>,
    });
    await settle(() => {
      connections[0].publish('feedback-1', { type: 'information', message: 'Working' });
    });
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    await settle(() => {
      connections[0].publish('feedback-1', { type: 'success', message: 'Done!' });
    });
    expect(screen.getByRole('link', { name: 'Open result (2)' })).toBeInTheDocument();
  });

  it('shows no actions when only isComplete is given', async () => {
    setup({ isComplete: message => message.message === 'Done!' });
    await settle(() => {
      connections[0].publish('feedback-1', { type: 'success', message: 'Done!' });
    });
    expect(screen.getByText('Done!')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
