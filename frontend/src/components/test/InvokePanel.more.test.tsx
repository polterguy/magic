// @vitest-environment jsdom
/*
 * InvokePanel, the body side: JSON and Hyperlambda payload editors seeded from the argument types,
 * the invalid JSON guard, multipart forms with file pickers and thumbnails, and the cURL command
 * for each body type.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  blob: new Blob(['ok']),
  contentType: 'text/plain',
  disposition: '',
  headers: {},
  status: 200,
  elapsed: 3,
};

function setup(endpoint: api.Endpoint, extra: Partial<Parameters<typeof InvokePanel>[0]> = {}) {
  const onResult = vi.fn();
  const view = render(
    <InvokePanel endpoint={endpoint} onResult={onResult} onOpenApi={vi.fn()} {...extra} />,
  );
  return { onResult, container: view.container };
}

const postEndpoint: api.Endpoint = {
  path: 'magic/modules/shop/order',
  verb: 'post',
  consumes: 'application/json',
  input: [
    { name: 'count', type: 'int' },
    { name: 'big', type: 'ulong' },
    { name: 'price', type: 'decimal' },
    { name: 'ratio', type: 'float' },
    { name: 'paid', type: 'bool' },
    { name: 'when', type: 'date' },
    { name: 'name', type: 'string' },
    { name: 'lines', type: '*' },
  ],
};

function editor(mode = 'application/json') {
  return screen.getByLabelText<HTMLTextAreaElement>('code editor ' + mode);
}

beforeEach(() => {
  sessionStorage.clear();
  vi.clearAllMocks();
  vi.mocked(api.listRoles).mockResolvedValue([]);
  vi.mocked(api.invokeEndpoint).mockResolvedValue(response);
});

describe('InvokePanel with a JSON body', () => {
  it('seeds the payload from the argument types, leaving wildcards as a bare *', () => {
    setup(postEndpoint);
    const text = editor().value;
    expect(text).toContain('"count": 42');
    expect(text).toContain('"big": 42');
    expect(text).toContain('"price": 5.5');
    expect(text).toContain('"ratio": 5.5');
    expect(text).toContain('"paid": true');
    expect(text).toContain('"name": "foo"');
    expect(text).toContain('"lines": *');
    expect(text).toMatch(/"when": "\d{4}-\d{2}-\d{2}T/);
  });

  it('refuses to send a payload that is not valid JSON and says why', async () => {
    const { onResult } = setup(postEndpoint);
    await userEvent.click(screen.getByRole('button', { name: '▷ Invoke' }));
    expect(await screen.findByText(/The payload is not valid JSON/)).toBeInTheDocument();
    expect(api.invokeEndpoint).not.toHaveBeenCalled();
    expect(onResult).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '▷ Invoke' })).toBeEnabled();
  });

  it('sends the edited payload with the verb, path and content type', async () => {
    const { onResult } = setup(postEndpoint);
    fireEvent.change(editor(), { target: { value: '{"count": 1}' } });
    await userEvent.click(screen.getByRole('button', { name: '▷ Invoke' }));
    await waitFor(() => expect(onResult).toHaveBeenCalled());
    expect(api.invokeEndpoint).toHaveBeenCalledWith(
      'post',
      'magic/modules/shop/order',
      '{"count": 1}',
      'application/json',
      undefined,
    );
  });

  it('is treated as JSON when no consumes is given, defaulting the content type', async () => {
    const { onResult } = setup({ path: 'x', verb: 'put' });
    expect(editor().value).toBe('{}');
    await userEvent.click(screen.getByRole('button', { name: '▷ Invoke' }));
    await waitFor(() => expect(onResult).toHaveBeenCalled());
    expect(api.invokeEndpoint).toHaveBeenCalledWith(
      'put',
      'x',
      '{}',
      'application/json',
      undefined,
    );
  });

  it('merges a valid payload into the arguments handed to Debug, ignoring invalid JSON', async () => {
    const onDebug = vi.fn();
    setup(postEndpoint, { onDebug });
    await userEvent.click(screen.getByRole('button', { name: 'Debug' }));
    expect(onDebug).toHaveBeenLastCalledWith({});
    fireEvent.change(editor(), { target: { value: '{"a": 1}' } });
    await userEvent.click(screen.getByRole('button', { name: 'Debug' }));
    expect(onDebug).toHaveBeenLastCalledWith({ a: 1 });
  });

  it('copies the payload as curl, escaping single quotes', async () => {
    setup({ path: 'x', verb: 'post', consumes: 'application/json' });
    fireEvent.change(editor(), { target: { value: '{"q": "it\'s"}' } });
    await userEvent.click(screen.getByRole('button', { name: 'Copy as cURL' }));
    expect(toast.copyToClipboard).toHaveBeenCalledWith(
      'curl -X POST "' +
        api.apiBaseUrl() +
        '/x" \\\n  -H "Authorization: Bearer $TOKEN" \\\n  -H "Content-Type: application/json"' +
        " \\\n  -d '{\"q\": \"it'\\''s\"}'",
      'The cURL command',
    );
  });

  it('uses the default content type in curl when none is declared', async () => {
    setup({ path: 'x', verb: 'post' });
    await userEvent.click(screen.getByRole('button', { name: 'Copy as cURL' }));
    expect(vi.mocked(toast.copyToClipboard).mock.calls[0][0]).toContain(
      'Content-Type: application/json',
    );
  });
});

describe('InvokePanel with a Hyperlambda or text body', () => {
  it('uses the Hyperlambda editor and sends the text unvalidated', async () => {
    const { onResult } = setup({ path: 'hl', verb: 'post', consumes: 'hyperlambda' });
    expect(editor('hyperlambda').value).toBe('{}');
    fireEvent.change(editor('hyperlambda'), { target: { value: 'log.info:foo' } });
    await userEvent.click(screen.getByRole('button', { name: '▷ Invoke' }));
    await waitFor(() => expect(onResult).toHaveBeenCalled());
    expect(api.invokeEndpoint).toHaveBeenCalledWith(
      'post',
      'hl',
      'log.info:foo',
      'hyperlambda',
      undefined,
    );
  });

  it('can invoke text consuming endpoints but never merges their payload into Debug', async () => {
    const onDebug = vi.fn();
    const { onResult } = setup({ path: 't', verb: 'post', consumes: 'text/plain' }, { onDebug });
    fireEvent.change(editor('hyperlambda'), { target: { value: 'plain words' } });
    await userEvent.click(screen.getByRole('button', { name: 'Debug' }));
    expect(onDebug).toHaveBeenCalledWith({});
    await userEvent.click(screen.getByRole('button', { name: '▷ Invoke' }));
    await waitFor(() => expect(onResult).toHaveBeenCalled());
    expect(vi.mocked(api.invokeEndpoint).mock.calls[0][2]).toBe('plain words');
  });
});

describe('InvokePanel with a multipart body', () => {
  const multipart: api.Endpoint = {
    path: 'magic/modules/shop/upload',
    verb: 'post',
    consumes: 'multipart/form-data',
    input: [
      { name: 'folder', type: 'string' },
      { name: 'mode', type: 'string' },
      { name: 'file', type: '*' },
    ],
  };

  function picker(container: HTMLElement) {
    return container.querySelector('input[type="file"]') as HTMLInputElement;
  }

  let revokeUrl = vi.fn();

  beforeEach(() => {
    let counter = 0;
    revokeUrl = vi.fn();
    URL.createObjectURL = vi.fn(() => 'blob:thumb-' + ++counter);
    URL.revokeObjectURL = revokeUrl;
  });

  afterEach(() => {
    // Back to jsdom's own (absent) implementations.
    Reflect.deleteProperty(URL, 'createObjectURL');
    Reflect.deleteProperty(URL, 'revokeObjectURL');
  });

  it('renders a text field per argument and a file picker, with no code editor', () => {
    const { container } = setup(multipart);
    expect(screen.getByLabelText(/folder/)).toBeInTheDocument();
    expect(screen.getByLabelText(/mode/)).toBeInTheDocument();
    expect(screen.getByText(/one or more files/)).toBeInTheDocument();
    expect(picker(container)).not.toBeNull();
    expect(screen.queryByLabelText(/code editor/)).not.toBeInTheDocument();
  });

  it('shows no argument grid when the only argument is the file picker', () => {
    setup({ ...multipart, input: [{ name: 'file', type: '*' }] });
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('accumulates picked files across pickings, shows thumbnails for images, and removes chips', async () => {
    const { container } = setup(multipart);
    const png = new File(['x'.repeat(2048)], 'a.png', { type: 'image/png' });
    const txt = new File(['hello'], 'b.txt', { type: 'text/plain' });
    fireEvent.change(picker(container), { target: { files: [png] } });
    expect(screen.getByText('a.png')).toBeInTheDocument();
    expect(screen.getByText('2 KB')).toBeInTheDocument();
    await waitFor(() => expect(container.querySelector('img')).not.toBeNull());
    expect(container.querySelector('img')).toHaveAttribute('src', 'blob:thumb-1');
    fireEvent.change(picker(container), { target: { files: [txt] } });
    expect(screen.getByText('a.png')).toBeInTheDocument();
    expect(screen.getByText('b.txt')).toBeInTheDocument();
    expect(container.querySelectorAll('img')).toHaveLength(1);
    const removes = screen.getAllByTitle('Remove');
    await userEvent.click(removes[0]);
    expect(screen.queryByText('a.png')).not.toBeInTheDocument();
    expect(revokeUrl).toHaveBeenCalledWith('blob:thumb-1');
    expect(screen.getByText('b.txt')).toBeInTheDocument();
  });

  it('ignores a picking that holds no files', () => {
    const { container } = setup(multipart);
    fireEvent.change(picker(container), { target: { files: [] } });
    expect(screen.queryByTitle('Remove')).not.toBeInTheDocument();
  });

  it('posts a FormData with the filled arguments and every file under its part name', async () => {
    const { container, onResult } = setup(multipart);
    await userEvent.type(screen.getByLabelText(/folder/), '/scripts/');
    const one = new File(['1'], 'one.txt', { type: 'text/plain' });
    const two = new File(['2'], 'two.txt', { type: 'text/plain' });
    fireEvent.change(picker(container), { target: { files: [one, two] } });
    await userEvent.click(screen.getByRole('button', { name: '▷ Invoke' }));
    await waitFor(() => expect(onResult).toHaveBeenCalled());
    const call = vi.mocked(api.invokeEndpoint).mock.calls[0];
    expect(call[0]).toBe('post');
    expect(call[1]).toBe('magic/modules/shop/upload');
    expect(call[3]).toBe('multipart/form-data');
    const form = call[2] as FormData;
    expect(form.get('folder')).toBe('/scripts/');
    expect(form.has('mode')).toBe(false);
    expect(form.getAll('file').map(f => (f as File).name)).toEqual(['one.txt', 'two.txt']);
  });

  it('posts an empty form when nothing was filled or picked', async () => {
    const { onResult } = setup(multipart);
    await userEvent.click(screen.getByRole('button', { name: '▷ Invoke' }));
    await waitFor(() => expect(onResult).toHaveBeenCalled());
    const form = vi.mocked(api.invokeEndpoint).mock.calls[0][2] as FormData;
    expect([...form.keys()]).toEqual([]);
  });

  it('copies curl with -F parts for filled arguments and a file placeholder', async () => {
    setup(multipart);
    await userEvent.type(screen.getByLabelText(/folder/), 'docs');
    await userEvent.click(screen.getByRole('button', { name: 'Copy as cURL' }));
    expect(toast.copyToClipboard).toHaveBeenCalledWith(
      'curl -X POST "' +
        api.apiBaseUrl() +
        '/magic/modules/shop/upload" \\\n  -H "Authorization: Bearer $TOKEN"' +
        ' \\\n  -F "folder=docs" \\\n  -F "file=@/path/to/file"',
      'The cURL command',
    );
  });

  it('puts multipart arguments in Debug without merging any payload', async () => {
    const onDebug = vi.fn();
    setup(multipart, { onDebug });
    await userEvent.type(screen.getByLabelText(/mode/), 'fast');
    await userEvent.click(screen.getByRole('button', { name: 'Debug' }));
    expect(onDebug).toHaveBeenCalledWith({ mode: 'fast' });
  });
});
