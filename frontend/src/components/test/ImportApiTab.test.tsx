// @vitest-environment jsdom
/*
 * ImportApiTab: reading an OpenAPI specification (URL validation, derived module name, base URL and
 * authentication scheme), choosing operations (filter, group, select all), starting the import
 * through the socket dialog with the right payload, and storing the upstream credential into the
 * cloudlet configuration. SocketFeedback is stubbed.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../lib/api';
import { setToastListener, type Toast } from '../../lib/toast';
import ImportApiTab from '../ImportApiTab';

// gibberish is one of the helpers apiMock keeps real, but here it is a network call to stand in for.
vi.mock('../../lib/api', async importOriginal => ({
  ...(await import('../../test/apiMock')).mockApi(await importOriginal()),
  gibberish: vi.fn(),
}));

vi.mock('../SocketFeedback', () => ({
  default: (
    props: Readonly<{ title: string; channel: string; onReady: () => void; onClose: () => void }>,
  ) => (
    <div>
      <span>
        {props.title} via {props.channel}
      </span>
      <button onClick={props.onReady}>Socket ready</button>
      <button onClick={props.onClose}>Close socket</button>
    </div>
  ),
}));

let toasts: Toast[];

const SPEC_URL = 'https://shop.test/docs/openapi.json';

function spec(overrides: Partial<api.OpenApiSpec> = {}): api.OpenApiSpec {
  return {
    title: 'Pet Store API!',
    version: '1.2',
    servers: ['/v1/'],
    'security-schemes': null,
    operations: [
      {
        id: 'listPets',
        verb: 'get',
        path: '/pets',
        summary: 'List pets',
        tag: 'pets',
        parameters: null,
      },
      { id: 'addPet', verb: 'post', path: '/pets', summary: null, tag: 'pets', parameters: null },
      {
        id: 'getOrder',
        verb: 'get',
        path: '/v2/orders/{id}',
        summary: 'One order',
        tag: null,
        parameters: null,
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  toasts = [];
  setToastListener(t => toasts.push(t));
  vi.mocked(api.listRoles).mockResolvedValue([{ name: 'root' }, { name: 'guest' }]);
  vi.mocked(api.parseOpenApi).mockResolvedValue(spec());
  vi.mocked(api.gibberish).mockResolvedValue({ result: 'chan-1' });
  vi.mocked(api.importOpenApi).mockResolvedValue({ created: [], skipped: [], loc: 0 });
});

afterEach(() => {
  setToastListener(null);
  vi.clearAllMocks();
});

async function readSpec() {
  render(<ImportApiTab />);
  await userEvent.type(
    screen.getByPlaceholderText('https://api.example.com/openapi.json'),
    SPEC_URL,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Read' }));
  await screen.findByText(/Pet Store API! 1.2/);
}

function field(label: string) {
  return screen.getByLabelText<HTMLInputElement>(label, { exact: false });
}

describe('ImportApiTab reading', () => {
  it('asks for a URL when none is given', async () => {
    render(<ImportApiTab />);
    await userEvent.click(screen.getByRole('button', { name: 'Read' }));
    expect(toasts.at(-1)).toMatchObject({
      text: 'Give me the URL of an OpenAPI specification',
      isError: true,
    });
    expect(api.parseOpenApi).not.toHaveBeenCalled();
  });

  it('derives module name, base URL and configuration key from the specification', async () => {
    await readSpec();
    expect(api.parseOpenApi).toHaveBeenCalledWith(SPEC_URL);
    expect(screen.getByText(/3 operations/)).toBeInTheDocument();
    expect(field('Module name').value).toBe('pet-store-api');
    expect(field('Base URL').value).toBe('https://shop.test/v1');
    expect(field('Configuration key').value).toBe('magic:integrations:pet-store-api:key');
    expect(
      screen.getByText('No authentication', { selector: '.select-value' }),
    ).toBeInTheDocument();
  });

  it('keeps an absolute server and falls back to a default module name', async () => {
    vi.mocked(api.parseOpenApi).mockResolvedValue(
      spec({ title: null, servers: ['https://api.other.test/'], operations: null }),
    );
    render(<ImportApiTab />);
    await userEvent.type(
      screen.getByPlaceholderText('https://api.example.com/openapi.json'),
      SPEC_URL,
    );
    await userEvent.keyboard('{Enter}');
    await screen.findByText(/0 operations/);
    expect(field('Module name').value).toBe('imported-api');
    expect(field('Base URL').value).toBe('https://api.other.test');
  });

  it('shows the error when the specification cannot be read', async () => {
    vi.mocked(api.parseOpenApi).mockRejectedValueOnce(new Error('not a spec'));
    render(<ImportApiTab />);
    await userEvent.type(
      screen.getByPlaceholderText('https://api.example.com/openapi.json'),
      SPEC_URL,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Read' }));
    await waitFor(() => expect(toasts.at(-1)).toMatchObject({ text: 'not a spec', isError: true }));
    expect(screen.queryByText(/operations$/)).not.toBeInTheDocument();
  });

  it.each([
    [
      'header key',
      { name: 'k', type: 'apiKey', in: 'header', 'header-name': 'X-Key', scheme: null },
      'API key in a header',
      'Header name',
      'X-Key',
    ],
    [
      'query key',
      { name: 'k', type: 'apiKey', in: 'query', 'header-name': 'api_key', scheme: null },
      'API key in a query parameter',
      'Query parameter name',
      'api_key',
    ],
    [
      'basic',
      { name: 'b', type: 'http', in: null, 'header-name': null, scheme: 'basic' },
      'Basic (pre-encoded)',
      '',
      '',
    ],
    [
      'bearer',
      { name: 'b', type: 'http', in: null, 'header-name': null, scheme: 'bearer' },
      'Bearer token',
      '',
      '',
    ],
  ])(
    'preselects the %s scheme the specification declares',
    async (_name, scheme, label, nameLabel, nameValue) => {
      vi.mocked(api.parseOpenApi).mockResolvedValue(spec({ 'security-schemes': [scheme] }));
      await readSpec();
      expect(screen.getByText(label, { selector: '.select-value' })).toBeInTheDocument();
      if (nameLabel) {
        expect(field(nameLabel).value).toBe(nameValue);
      }
    },
  );
});

describe('ImportApiTab choosing operations', () => {
  it('groups by tag, falling back to the first path segment after a version prefix', async () => {
    await readSpec();
    expect(screen.getByText('pets')).toBeInTheDocument();
    expect(screen.getByText('orders')).toBeInTheDocument();
    expect(screen.getByText('2 operations')).toBeInTheDocument();
    expect(screen.getByText('1 operation')).toBeInTheDocument();
    expect(screen.getByText('0 of 3 selected')).toBeInTheDocument();
    expect(screen.queryByText('List pets', { exact: false })).not.toBeInTheDocument();
  });

  it('expands a group to list its operations and selects one', async () => {
    await readSpec();
    await userEvent.click(screen.getByText('pets'));
    expect(screen.getByText('— List pets')).toBeInTheDocument();
    expect(screen.getByText('GET')).toBeInTheDocument();

    await userEvent.click(screen.getByTitle('List pets').querySelector('input')!);

    expect(screen.getByText('1 of 3 selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import 1' })).toBeEnabled();

    await userEvent.click(screen.getByText('pets'));
    expect(screen.queryByText('— List pets')).not.toBeInTheDocument();
  });

  it('selects and deselects a whole group and everything shown', async () => {
    await readSpec();
    const boxes = screen.getAllByRole('checkbox');
    // boxes: header, pets, orders, overwrite is rendered before them
    const header = boxes.find(box => box.closest('th'))!;
    await userEvent.click(header);
    expect(screen.getByText('3 of 3 selected')).toBeInTheDocument();
    await userEvent.click(header);
    expect(screen.getByText('0 of 3 selected')).toBeInTheDocument();

    const groupBox = screen.getByText('pets').closest('tr')!.querySelector('input')!;
    await userEvent.click(groupBox);
    expect(screen.getByText('2 of 3 selected')).toBeInTheDocument();
    await userEvent.click(groupBox);
    expect(screen.getByText('0 of 3 selected')).toBeInTheDocument();
  });

  it('filters on id, summary or tag and says when nothing matches', async () => {
    await readSpec();
    const filter = screen.getByPlaceholderText('Filter operations…');
    await userEvent.type(filter, 'order');
    expect(screen.queryByText('pets')).not.toBeInTheDocument();
    expect(screen.getByText('orders')).toBeInTheDocument();

    await userEvent.clear(filter);
    await userEvent.type(filter, 'LISTPETS');
    expect(screen.getByText('pets')).toBeInTheDocument();
    expect(screen.queryByText('orders')).not.toBeInTheDocument();

    await userEvent.clear(filter);
    await userEvent.type(filter, 'zzz');
    expect(screen.getByText('No operations match your filter')).toBeInTheDocument();
    await userEvent.click(screen.getByTitle('Clear search'));
    expect(screen.getByText('pets')).toBeInTheDocument();
  });

  it('edits the roles allowed to invoke', async () => {
    await readSpec();
    expect(screen.getByText('root')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await userEvent.click(screen.getByLabelText('guest'));
    expect(screen.getByText('root, guest')).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('root'));
    await userEvent.click(screen.getByLabelText('guest'));
    expect(screen.getByText('public — no roles')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByLabelText('guest')).not.toBeInTheDocument();
  });
});

describe('ImportApiTab importing', () => {
  async function selectAll() {
    const header = screen.getAllByRole('checkbox').find(box => box.closest('th'))!;
    await userEvent.click(header);
  }

  it('keeps Import disabled until something is chosen', async () => {
    await readSpec();
    expect(screen.getByRole('button', { name: 'Import' })).toBeDisabled();
  });

  it('refuses an empty module name', async () => {
    await readSpec();
    await selectAll();
    await userEvent.clear(field('Module name'));
    await userEvent.click(screen.getByRole('button', { name: 'Import 3' }));
    expect(toasts.at(-1)).toMatchObject({ text: 'Give the module a name', isError: true });
    expect(api.gibberish).not.toHaveBeenCalled();
  });

  it('opens the progress dialog on a fresh channel and imports once it is ready', async () => {
    vi.mocked(api.parseOpenApi).mockResolvedValue(
      spec({
        'security-schemes': [
          { name: 'k', type: 'apiKey', in: 'header', 'header-name': 'X-Key', scheme: null },
        ],
      }),
    );
    await readSpec();
    await selectAll();
    await userEvent.click(screen.getByLabelText('Overwrite existing files'));
    await userEvent.click(screen.getByRole('button', { name: 'Import 3' }));

    expect(await screen.findByText('Importing 3 operations via chan-1')).toBeInTheDocument();
    expect(api.importOpenApi).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Socket ready' }));

    expect(api.importOpenApi).toHaveBeenCalledWith({
      url: SPEC_URL,
      moduleName: 'pet-store-api',
      baseUrl: 'https://shop.test/v1',
      operations: ['listPets', 'addPet', 'getOrder'],
      authScheme: 'header',
      authName: 'X-Key',
      configKey: 'magic:integrations:pet-store-api:key',
      auth: 'root',
      overwrite: true,
      channel: 'chan-1',
    });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Import 3' })).toBeEnabled());

    await userEvent.click(screen.getByRole('button', { name: 'Close socket' }));
    expect(screen.queryByText(/via chan-1/)).not.toBeInTheDocument();
  });

  it('says "operation" for a single one and reports an import failure', async () => {
    vi.mocked(api.importOpenApi).mockRejectedValueOnce(new Error('import broke'));
    await readSpec();
    await userEvent.click(screen.getByText('orders').closest('tr')!.querySelector('input')!);
    await userEvent.click(screen.getByRole('button', { name: 'Import 1' }));
    expect(await screen.findByText('Importing 1 operation via chan-1')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Socket ready' }));
    await waitFor(() =>
      expect(toasts.at(-1)).toMatchObject({ text: 'import broke', isError: true }),
    );
  });

  it('reports a failure to get a feedback channel', async () => {
    vi.mocked(api.gibberish).mockRejectedValueOnce(new Error('no channel'));
    await readSpec();
    await selectAll();
    await userEvent.click(screen.getByRole('button', { name: 'Import 3' }));
    await waitFor(() => expect(toasts.at(-1)).toMatchObject({ text: 'no channel', isError: true }));
    expect(screen.queryByText(/via chan/)).not.toBeInTheDocument();
  });
});

describe('ImportApiTab credential', () => {
  async function readWithKeyScheme() {
    vi.mocked(api.parseOpenApi).mockResolvedValue(
      spec({
        'security-schemes': [
          { name: 'k', type: 'apiKey', in: 'header', 'header-name': 'X-Key', scheme: null },
        ],
      }),
    );
    await readSpec();
    await userEvent.click(screen.getByRole('button', { name: 'Set' }));
  }

  it('stores the credential under the nested configuration key, replacing non-objects', async () => {
    // A configuration whose "integrations" is a string, not an object, as it would be after hand-editing.
    vi.mocked(api.loadConfig).mockResolvedValue(
      JSON.parse('{"magic":{"integrations":"oops"},"other":1}'),
    );
    await readWithKeyScheme();
    expect(screen.getByText('Store credential')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Credential'), 's3cret');
    await userEvent.click(screen.getByRole('button', { name: 'Store' }));

    await waitFor(() => expect(api.saveConfig).toHaveBeenCalled());
    expect(api.saveConfig).toHaveBeenCalledWith({
      magic: { integrations: { 'pet-store-api': { key: 's3cret' } } },
      other: 1,
    });
    await waitFor(() => expect(screen.queryByText('Store credential')).not.toBeInTheDocument());
    expect(toasts.at(-1)).toMatchObject({
      text: 'Credential stored in your configuration',
      isError: false,
    });
  });

  it('submits on Enter', async () => {
    vi.mocked(api.loadConfig).mockResolvedValue({});
    await readWithKeyScheme();
    await userEvent.type(screen.getByLabelText('Credential'), 'abc{Enter}');
    await waitFor(() => expect(api.saveConfig).toHaveBeenCalled());
  });

  it('refuses an empty credential', async () => {
    await readWithKeyScheme();
    await userEvent.click(screen.getByRole('button', { name: 'Store' }));
    expect(toasts.at(-1)).toMatchObject({ text: 'Give me the credential to store', isError: true });
    expect(api.loadConfig).not.toHaveBeenCalled();
  });

  it('refuses an empty configuration key', async () => {
    await readWithKeyScheme();
    await userEvent.clear(field('Configuration key'));
    await userEvent.type(screen.getByLabelText('Credential'), 'abc');
    await userEvent.click(screen.getByRole('button', { name: 'Store' }));
    expect(toasts.at(-1)).toMatchObject({
      text: 'Give me the configuration key to store it under',
      isError: true,
    });
  });

  it('shows the error and keeps the dialog when saving fails', async () => {
    vi.mocked(api.loadConfig).mockResolvedValue({});
    vi.mocked(api.saveConfig).mockRejectedValueOnce(new Error('disk full'));
    await readWithKeyScheme();
    await userEvent.type(screen.getByLabelText('Credential'), 'abc');
    await userEvent.click(screen.getByRole('button', { name: 'Store' }));
    await waitFor(() => expect(toasts.at(-1)).toMatchObject({ text: 'disk full', isError: true }));
    expect(screen.getByText('Store credential')).toBeInTheDocument();
  });

  it('closes on Cancel without saving', async () => {
    await readWithKeyScheme();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Store credential')).not.toBeInTheDocument();
    expect(api.saveConfig).not.toHaveBeenCalled();
  });
});
