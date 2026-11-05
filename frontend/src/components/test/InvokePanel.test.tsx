// @vitest-environment jsdom
/*
 * InvokePanel, the query side: GET and DELETE endpoints put their arguments in the query string,
 * with filter arguments behind an expander, remembered values, descriptions, Run as, Debug,
 * OpenAPI, Edit, and the cURL command. Body carrying endpoints are in InvokePanel.more.test.tsx.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../lib/api';
import * as toast from '../../lib/toast';
import InvokePanel from '../InvokePanel';

vi.mock('../../lib/api', async importOriginal =>
  (await import('../../test/apiMock')).mockApi(await importOriginal()),
);

vi.mock('../../lib/toast', async importOriginal => ({
  ...(await importOriginal<typeof toast>()),
  copyToClipboard: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../CodeEditor', async () => ({
  default: (await import('../../test/CodeEditorStub')).default,
}));

const response = {
  blob: new Blob(['{}']),
  contentType: 'application/json',
  disposition: '',
  headers: {},
  status: 200,
  elapsed: 5,
};

function setup(endpoint: api.Endpoint, extra: Partial<Parameters<typeof InvokePanel>[0]> = {}) {
  const onResult = vi.fn();
  const onOpenApi = vi.fn();
  render(<InvokePanel endpoint={endpoint} onResult={onResult} onOpenApi={onOpenApi} {...extra} />);
  return { onResult, onOpenApi };
}

const getEndpoint: api.Endpoint = {
  path: 'magic/modules/shop/items',
  verb: 'get',
  produces: 'application/json',
  input: [
    { name: 'limit', type: 'long' },
    { name: 'since', type: 'date' },
    { name: 'items.id.eq', type: 'long' },
    { name: 'items.name.like', type: 'string' },
  ],
};

beforeEach(() => {
  sessionStorage.clear();
  vi.clearAllMocks();
  vi.mocked(api.listRoles).mockResolvedValue([]);
  vi.mocked(api.invokeEndpoint).mockResolvedValue(response);
});

describe('InvokePanel with a GET endpoint', () => {
  it('shows consumes and produces, with n/a where absent, and focuses the first argument', () => {
    setup(getEndpoint);
    expect(screen.getByText(/Consumes: n\/a — Produces: application\/json/)).toBeInTheDocument();
    expect(screen.getByLabelText(/limit/)).toHaveFocus();
    expect(screen.queryByLabelText('code editor application/json')).not.toBeInTheDocument();
  });

  it('puts the typed arguments in the query string, encoding dates and special characters', async () => {
    const { onResult } = setup(getEndpoint);
    await userEvent.type(screen.getByLabelText(/limit/), '10');
    await userEvent.type(screen.getByLabelText(/since/), '2026-01-02T03:04:05Z');
    await userEvent.click(screen.getByRole('button', { name: '▷ Invoke' }));
    await waitFor(() => expect(onResult).toHaveBeenCalled());
    expect(api.invokeEndpoint).toHaveBeenCalledWith(
      'get',
      'magic/modules/shop/items?limit=10&since=2026-01-02T03%3A04%3A05.000Z',
      undefined,
      'application/json',
      undefined,
    );
    expect(onResult).toHaveBeenCalledWith({ ...response, runAs: '' });
  });

  it('invokes without a query string when nothing was typed', async () => {
    const { onResult } = setup(getEndpoint);
    await userEvent.click(screen.getByRole('button', { name: '▷ Invoke' }));
    await waitFor(() => expect(onResult).toHaveBeenCalled());
    expect(vi.mocked(api.invokeEndpoint).mock.calls[0][1]).toBe('magic/modules/shop/items');
  });

  it('invokes when Enter is pressed in an argument field', async () => {
    const { onResult } = setup(getEndpoint);
    await userEvent.type(screen.getByLabelText(/limit/), '3{Enter}');
    await waitFor(() => expect(onResult).toHaveBeenCalled());
    expect(vi.mocked(api.invokeEndpoint).mock.calls[0][1]).toBe('magic/modules/shop/items?limit=3');
  });

  it('keeps filter arguments behind an expander that toggles', async () => {
    setup(getEndpoint);
    expect(screen.queryByLabelText(/items.id.eq/)).not.toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: /Filter arguments \(2\)/ });
    await userEvent.click(toggle);
    await userEvent.type(screen.getByLabelText(/items.name.like/), 'a b');
    await userEvent.click(screen.getByRole('button', { name: '▷ Invoke' }));
    await waitFor(() => expect(api.invokeEndpoint).toHaveBeenCalled());
    expect(vi.mocked(api.invokeEndpoint).mock.calls[0][1]).toBe(
      'magic/modules/shop/items?items.name.like=a%20b',
    );
    await userEvent.click(toggle);
    expect(screen.queryByLabelText(/items.id.eq/)).not.toBeInTheDocument();
  });

  it('treats DELETE like GET and omits the argument form when there are no standard arguments', async () => {
    const { onResult } = setup({
      path: 'magic/modules/shop/items',
      verb: 'DELETE',
      input: [{ name: 'items.id.eq', type: 'long' }],
    });
    expect(screen.queryByLabelText(/items.id.eq/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '▷ Invoke' }));
    await waitFor(() => expect(onResult).toHaveBeenCalled());
    expect(api.invokeEndpoint).toHaveBeenCalledWith(
      'DELETE',
      'magic/modules/shop/items',
      undefined,
      'application/json',
      undefined,
    );
  });

  it('remembers typed arguments per endpoint in the session', async () => {
    const first = render(
      <InvokePanel endpoint={getEndpoint} onResult={vi.fn()} onOpenApi={vi.fn()} />,
    );
    await userEvent.type(screen.getByLabelText(/limit/), '7');
    expect(sessionStorage.getItem('magic2.invoke.get:magic/modules/shop/items')).toBe(
      '{"limit":"7"}',
    );
    first.unmount();
    render(<InvokePanel endpoint={getEndpoint} onResult={vi.fn()} onOpenApi={vi.fn()} />);
    expect(screen.getByLabelText(/limit/)).toHaveValue('7');
  });

  it('starts empty when the remembered arguments are corrupt', () => {
    sessionStorage.setItem('magic2.invoke.get:magic/modules/shop/items', '{broken');
    setup(getEndpoint);
    expect(screen.getByLabelText(/limit/)).toHaveValue('');
  });

  it('shows the error of a failed invocation and re-enables the button', async () => {
    vi.mocked(api.invokeEndpoint).mockRejectedValue(new Error('Server on fire'));
    const { onResult } = setup(getEndpoint);
    await userEvent.click(screen.getByRole('button', { name: '▷ Invoke' }));
    expect(await screen.findByText('Server on fire')).toBeInTheDocument();
    expect(onResult).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '▷ Invoke' })).toBeEnabled();
  });

  it('shows the waiter and a disabled button while invoking, and ignores a second submit', async () => {
    let resolve: (value: typeof response) => void = () => {
      // Replaced below by the promise executor.
    };
    vi.mocked(api.invokeEndpoint).mockReturnValue(
      new Promise<typeof response>(r => {
        resolve = r;
      }),
    );
    const { container } = render(
      <InvokePanel endpoint={getEndpoint} onResult={vi.fn()} onOpenApi={vi.fn()} />,
    );
    await userEvent.type(screen.getByLabelText(/limit/), '1{Enter}');
    expect(await screen.findByRole('button', { name: 'Invoking…' })).toBeDisabled();
    expect(container.querySelector('.ai-waiter')).not.toBeNull();
    await userEvent.type(screen.getByLabelText(/limit/), '{Enter}');
    expect(api.invokeEndpoint).toHaveBeenCalledTimes(1);
    resolve(response);
    expect(await screen.findByRole('button', { name: '▷ Invoke' })).toBeEnabled();
    expect(container.querySelector('.ai-waiter')).toBeNull();
  });
});

describe('InvokePanel description and actions', () => {
  const described: api.Endpoint = {
    path: 'a',
    verb: 'get',
    description: 'Lists things. Then does more.',
  };

  it('shows the first sentence of the description and toggles the full text', async () => {
    setup(described);
    expect(screen.getByText(/Lists things\./)).not.toHaveTextContent('Then does more');
    await userEvent.click(screen.getByRole('button', { name: 'more' }));
    expect(screen.getByText(/Then does more/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'less' }));
    expect(screen.getByText(/Lists things\./)).not.toHaveTextContent('Then does more');
  });

  it('offers no more button for a one sentence description, and no paragraph without one', () => {
    setup({ path: 'a', verb: 'get', description: 'Just one' });
    expect(screen.getByText('Just one')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'more' })).not.toBeInTheDocument();
  });

  it('renders Debug only when supplied and hands over the collected arguments', async () => {
    const onDebug = vi.fn();
    const first = render(
      <InvokePanel endpoint={getEndpoint} onResult={vi.fn()} onOpenApi={vi.fn()} />,
    );
    expect(screen.queryByRole('button', { name: 'Debug' })).not.toBeInTheDocument();
    first.unmount();
    setup(getEndpoint, { onDebug });
    await userEvent.type(screen.getByLabelText(/limit/), '5');
    await userEvent.click(screen.getByRole('button', { name: 'Debug' }));
    expect(onDebug).toHaveBeenCalledWith({ limit: '5' });
  });

  it('calls onOpenApi and onEdit', async () => {
    const onEdit = vi.fn();
    const { onOpenApi } = setup(getEndpoint, { onEdit });
    await userEvent.click(screen.getByRole('button', { name: 'OpenAPI' }));
    await userEvent.click(screen.getByRole('button', { name: 'Edit in Hyper IDE' }));
    expect(onOpenApi).toHaveBeenCalledOnce();
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('copies a GET invocation as curl with $TOKEN and the query string', async () => {
    setup(getEndpoint);
    await userEvent.type(screen.getByLabelText(/limit/), '10');
    await userEvent.click(screen.getByRole('button', { name: 'Copy as cURL' }));
    expect(toast.copyToClipboard).toHaveBeenCalledWith(
      'curl -X GET "' +
        api.apiBaseUrl() +
        '/magic/modules/shop/items?limit=10" \\\n  -H "Authorization: Bearer $TOKEN"',
      'The cURL command',
    );
  });

  it('cannot invoke a socket endpoint and offers neither OpenAPI nor curl for it', () => {
    setup({ path: 'chat', verb: 'socket' });
    expect(screen.getByText('This endpoint cannot be invoked from here.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '▷ Invoke' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'OpenAPI' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copy as cURL' })).not.toBeInTheDocument();
  });

  it('does not invoke a binary consuming endpoint on submit', () => {
    setup({ path: 'bin', verb: 'post', consumes: 'application/octet-stream' });
    expect(screen.getByText('This endpoint cannot be invoked from here.')).toBeInTheDocument();
  });
});

describe('InvokePanel Run as', () => {
  it('offers no Run as when there are no roles, or when the roles cannot be listed', async () => {
    vi.mocked(api.listRoles).mockRejectedValue(new Error('forbidden'));
    setup(getEndpoint);
    await waitFor(() => expect(api.listRoles).toHaveBeenCalled());
    expect(screen.queryByText('Run as')).not.toBeInTheDocument();
  });

  it('copes with an undefined role list', async () => {
    vi.mocked(api.listRoles).mockResolvedValue(undefined as unknown as api.Role[]);
    setup(getEndpoint);
    await waitFor(() => expect(api.listRoles).toHaveBeenCalled());
    expect(screen.queryByText('Run as')).not.toBeInTheDocument();
  });

  it('invokes with a fresh token for the chosen role and remembers the choice', async () => {
    vi.mocked(api.listRoles).mockResolvedValue([
      { name: 'admin' },
      { name: 'guest' },
    ] as api.Role[]);
    vi.mocked(api.generateRoleToken).mockResolvedValue('tok123');
    const { onResult } = setup(getEndpoint);
    await userEvent.click(await screen.findByText('me'));
    await userEvent.click(screen.getByRole('option', { name: 'guest' }));
    expect(sessionStorage.getItem('magic2.invoke.runAs')).toBe('guest');
    await userEvent.click(screen.getByRole('button', { name: '▷ Invoke' }));
    await waitFor(() => expect(onResult).toHaveBeenCalled());
    expect(api.generateRoleToken).toHaveBeenCalledWith('guest');
    expect(vi.mocked(api.invokeEndpoint).mock.calls[0][4]).toBe('tok123');
    expect(onResult).toHaveBeenCalledWith({ ...response, runAs: 'guest' });
  });

  it('starts from the remembered role and embeds its token in the curl command', async () => {
    sessionStorage.setItem('magic2.invoke.runAs', 'admin');
    vi.mocked(api.listRoles).mockResolvedValue([{ name: 'admin' }] as api.Role[]);
    vi.mocked(api.generateRoleToken).mockResolvedValue('tok-admin');
    setup(getEndpoint);
    await userEvent.click(screen.getByRole('button', { name: 'Copy as cURL' }));
    await waitFor(() => expect(toast.copyToClipboard).toHaveBeenCalled());
    expect(vi.mocked(toast.copyToClipboard).mock.calls[0][0]).toContain(
      'Authorization: Bearer tok-admin',
    );
  });

  it('shows the error when the token for curl cannot be minted, and copies nothing', async () => {
    sessionStorage.setItem('magic2.invoke.runAs', 'admin');
    vi.mocked(api.generateRoleToken).mockRejectedValue(new Error('not root'));
    setup(getEndpoint);
    await userEvent.click(screen.getByRole('button', { name: 'Copy as cURL' }));
    expect(await screen.findByText('not root')).toBeInTheDocument();
    expect(toast.copyToClipboard).not.toHaveBeenCalled();
  });

  it('shows the error when the token for invoking cannot be minted', async () => {
    sessionStorage.setItem('magic2.invoke.runAs', 'admin');
    vi.mocked(api.generateRoleToken).mockRejectedValue(new Error('no token'));
    const { onResult } = setup(getEndpoint);
    await userEvent.click(screen.getByRole('button', { name: '▷ Invoke' }));
    expect(await screen.findByText('no token')).toBeInTheDocument();
    expect(api.invokeEndpoint).not.toHaveBeenCalled();
    expect(onResult).not.toHaveBeenCalled();
  });
});
