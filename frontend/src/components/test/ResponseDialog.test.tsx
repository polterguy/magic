// @vitest-environment jsdom
/*
 * ResponseDialog: status badge (ok vs error), timing, the optional run-as badge, the collapsible
 * sorted response headers, the cross-origin header note (only for real HTTP invocations served from
 * another origin), and Copy response for textual bodies only.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { servedByBackend } from '../../lib/backend';
import { copyToClipboard } from '../../lib/toast';
import { DialogProvider } from '../Dialogs';
import type { InvokeResult } from '../InvokePanel';
import ResponseDialog from '../ResponseDialog';

vi.mock('../CodeEditor', async () => ({
  default: (await import('../../test/CodeEditorStub')).default,
}));

vi.mock('../../lib/backend', async importOriginal => ({
  ...(await importOriginal<typeof import('../../lib/backend')>()),
  servedByBackend: vi.fn(),
}));

vi.mock('../../lib/toast', async importOriginal => ({
  ...(await importOriginal<typeof import('../../lib/toast')>()),
  copyToClipboard: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
});

function result(overrides: Partial<InvokeResult> = {}): InvokeResult {
  return {
    blob: new Blob(['hello']),
    contentType: 'text/plain',
    disposition: '',
    status: 200,
    elapsed: 42,
    ...overrides,
  };
}

function renderDialog(
  value: InvokeResult,
  extra: Partial<React.ComponentProps<typeof ResponseDialog>> = {},
) {
  const onClose = vi.fn();
  render(
    <DialogProvider>
      <ResponseDialog result={value} onClose={onClose} {...extra} />
    </DialogProvider>,
  );
  return { onClose };
}

describe('ResponseDialog summary', () => {
  it('shows an ok status with its timing and the body', async () => {
    renderDialog(result());
    expect(screen.getByText('200')).toHaveClass('badge-get');
    expect(screen.getByText('42 ms')).toBeInTheDocument();
    expect(await screen.findByLabelText('code editor text/plain')).toHaveValue('hello');
    expect(screen.queryByText(/^as /)).not.toBeInTheDocument();
  });

  it('marks a failing status as an error', () => {
    renderDialog(result({ status: 500 }));
    expect(screen.getByText('500')).toHaveClass('badge-error');
  });

  it('shows which role the call ran as', () => {
    renderDialog(result({ runAs: 'guest' }));
    expect(screen.getByText('as guest')).toBeInTheDocument();
  });

  it('counts the items when the body is a JSON array', async () => {
    const json = (body: unknown) =>
      result({ blob: new Blob([JSON.stringify(body)]), contentType: 'application/json' });
    const { unmount } = render(
      <DialogProvider>
        <ResponseDialog result={json([{ a: 1 }, { a: 2 }])} onClose={vi.fn()} />
      </DialogProvider>,
    );
    expect(await screen.findByText('2 items')).toBeInTheDocument();
    unmount();

    render(
      <DialogProvider>
        <ResponseDialog result={json([1])} onClose={vi.fn()} />
      </DialogProvider>,
    );
    expect(await screen.findByText('1 item')).toBeInTheDocument();
  });

  it('counts an empty array and shows no count for other bodies', async () => {
    const json = (text: string) =>
      result({ blob: new Blob([text]), contentType: 'application/json' });
    const { unmount } = render(
      <DialogProvider>
        <ResponseDialog result={json('[]')} onClose={vi.fn()} />
      </DialogProvider>,
    );
    expect(await screen.findByText('0 items')).toBeInTheDocument();
    unmount();

    for (const text of ['{"a":[1,2]}', '{not json']) {
      const view = render(
        <DialogProvider>
          <ResponseDialog result={json(text)} onClose={vi.fn()} />
        </DialogProvider>,
      );
      await screen.findByLabelText('code editor application/json');
      expect(screen.queryByText(/ items?$/)).not.toBeInTheDocument();
      view.unmount();
    }

    renderDialog(result());
    await screen.findByLabelText('code editor text/plain');
    expect(screen.queryByText(/ items?$/)).not.toBeInTheDocument();
  });

  it('closes with the Close button', async () => {
    const { onClose } = renderDialog(result());
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('ResponseDialog headers', () => {
  it('shows no header toggle when there are no headers', () => {
    renderDialog(result());
    expect(screen.queryByRole('button', { name: /response headers/ })).not.toBeInTheDocument();
  });

  it('shows no header toggle for an empty header map', () => {
    renderDialog(result({ headers: {} }));
    expect(screen.queryByRole('button', { name: /response headers/ })).not.toBeInTheDocument();
  });

  it('expands and collapses the headers, sorted by name', async () => {
    renderDialog(result({ headers: { 'x-b': '2', 'content-type': 'text/plain', 'x-a': '1' } }));
    const toggle = screen.getByRole('button', { name: 'Show response headers (3)' });
    expect(screen.queryByText('x-a:')).not.toBeInTheDocument();

    await userEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Hide response headers (3)' })).toBeInTheDocument();
    const names = screen.getAllByText(/^[a-z-]+:$/).map(node => node.textContent);
    expect(names).toEqual(['content-type:', 'x-a:', 'x-b:']);
    expect(screen.getByText('text/plain', { selector: 'span' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Hide response headers (3)' }));
    expect(screen.queryByText('x-a:')).not.toBeInTheDocument();
  });
});

describe('ResponseDialog cross-origin note', () => {
  const NOTE = /only exposes some of the response headers/;

  it('is shown for an HTTP invocation to a different origin', () => {
    vi.mocked(servedByBackend).mockReturnValue(false);
    renderDialog(result(), { httpInvocation: true });
    expect(screen.getByText(NOTE)).toBeInTheDocument();
  });

  it('is hidden when the dashboard is served by the backend', () => {
    vi.mocked(servedByBackend).mockReturnValue(true);
    renderDialog(result(), { httpInvocation: true });
    expect(screen.queryByText(NOTE)).not.toBeInTheDocument();
  });

  it('is hidden for a non-HTTP invocation', () => {
    vi.mocked(servedByBackend).mockReturnValue(false);
    renderDialog(result());
    expect(screen.queryByText(NOTE)).not.toBeInTheDocument();
  });
});

describe('ResponseDialog copy', () => {
  it('copies the displayed text once it has loaded', async () => {
    renderDialog(result({ blob: new Blob(['{"a":1}']), contentType: 'application/json' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Copy response' }));
    expect(copyToClipboard).toHaveBeenCalledWith('{\n  "a": 1\n}', 'The response');
  });

  it('offers no copy for a binary response', async () => {
    renderDialog(result({ contentType: 'application/octet-stream' }));
    await waitFor(() => expect(screen.getByText(/The response is a file/)).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Copy response' })).not.toBeInTheDocument();
  });
});
