// @vitest-environment jsdom
/*
 * Inspector, the data widgets: the table list is fetched only once a Data Grid or Create Row
 * is selected, then the table picker, the column checklist, the delete / inline editing /
 * filtering / live switches of the grid, and the field checklist of Create Row.
 */
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { EndpointMeta } from '../../../lib/api';
import * as dataSources from '../dataSources';
import { renderInspector } from './inspectorHarness';

vi.mock('../dataSources', async importOriginal => ({
  ...(await importOriginal<typeof import('../dataSources')>()),
  loadEndpoints: vi.fn(),
}));

const ENDPOINTS: EndpointMeta[] = [
  {
    path: 'chinook/Album',
    verb: 'get',
    type: 'crud-read',
    output: [
      { name: 'AlbumId', type: 'long' },
      { name: 'Title', type: 'string' },
      {
        name: 'ArtistId',
        type: 'long',
        lookup: [{ table: 'Artist', key: 'ArtistId', name: 'Name' }],
      },
    ],
  },
  { path: 'chinook/Album-count', verb: 'get', type: 'crud-count' },
  {
    path: 'chinook/Album',
    verb: 'delete',
    type: 'crud-delete',
    input: [{ name: 'AlbumId', type: 'long' }],
  },
  {
    path: 'chinook/Album',
    verb: 'put',
    type: 'crud-update',
    input: [
      { name: 'AlbumId', type: 'long' },
      { name: 'Title', type: 'string' },
      { name: 'ArtistId', type: 'long' },
    ],
  },
  {
    path: 'chinook/Album',
    verb: 'post',
    type: 'crud-create',
    input: [
      { name: 'Title', type: 'string' },
      {
        name: 'ArtistId',
        type: 'long',
        lookup: [{ table: 'Artist', key: 'ArtistId', name: 'Name' }],
      },
    ],
  },
  {
    path: 'chinook/Artist',
    verb: 'get',
    type: 'crud-read',
    output: [
      { name: 'ArtistId', type: 'long' },
      { name: 'Name', type: 'string' },
    ],
  },
];

const ALL_COLUMNS = [
  { name: 'Title', label: 'Title', type: 'string', editable: false },
  { name: 'ArtistId', label: 'ArtistId', type: 'long', editable: false },
];

const loadEndpoints = vi.mocked(dataSources.loadEndpoints);

beforeEach(() => {
  loadEndpoints.mockResolvedValue(ENDPOINTS);
});

afterEach(() => {
  vi.clearAllMocks();
});

function tableSelect() {
  return document.querySelector('select');
}

async function waitForTables() {
  await waitFor(() => expect(tableSelect()).not.toBeNull());
}

function json(call: unknown[]) {
  return JSON.parse(call[1] as string) as unknown;
}

async function gridPanel(attributes = '', options = {}) {
  const view = renderInspector(
    `<magic-data-grid ${attributes}></magic-data-grid>`,
    'magic-data-grid',
    options,
  );
  await waitForTables();
  return view;
}

describe('Inspector data sources loading', () => {
  it('does not fetch for an ordinary element', () => {
    renderInspector('<div>x</div>', 'div');
    expect(loadEndpoints).not.toHaveBeenCalled();
  });

  it('fetches once when a grid is selected and shows a loading note meanwhile', async () => {
    let resolve: (value: EndpointMeta[]) => void = () => {
      // replaced below
    };
    loadEndpoints.mockReturnValue(
      new Promise<EndpointMeta[]>(done => {
        resolve = done;
      }),
    );
    renderInspector('<magic-data-grid></magic-data-grid>', 'magic-data-grid');
    expect(screen.getByText('Loading tables…')).toBeInTheDocument();
    expect(tableSelect()).toBeNull();
    resolve(ENDPOINTS);
    await waitForTables();
    expect(screen.queryByText('Loading tables…')).not.toBeInTheDocument();
    expect(loadEndpoints).toHaveBeenCalledTimes(1);
  });

  it('reports a failed fetch for a grid', async () => {
    loadEndpoints.mockRejectedValue(new Error('nope'));
    renderInspector('<magic-data-grid></magic-data-grid>', 'magic-data-grid');
    expect(await screen.findByText('Could not load the list of tables.')).toBeInTheDocument();
    expect(screen.queryByText('Loading tables…')).not.toBeInTheDocument();
  });

  it('reports a failed fetch for a create widget', async () => {
    loadEndpoints.mockRejectedValue(new Error('nope'));
    renderInspector('<magic-data-create></magic-data-create>', 'magic-data-create');
    expect(await screen.findByText('Could not load the list of tables.')).toBeInTheDocument();
  });

  it('shows the loading note for a create widget', () => {
    loadEndpoints.mockReturnValue(new Promise(() => undefined));
    renderInspector('<magic-data-create></magic-data-create>', 'magic-data-create');
    expect(screen.getByText('Loading tables…')).toBeInTheDocument();
  });
});

describe('Inspector data grid table picker', () => {
  it('lists the tables with the current one selected', async () => {
    await gridPanel('data-read-url="/chinook/Artist"');
    const select = tableSelect()!;
    expect(select).toHaveValue('/chinook/Artist');
    expect(screen.getByRole('option', { name: 'chinook / Album' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Choose a table…' })).toBeInTheDocument();
  });

  it('says so when no table has a read endpoint', async () => {
    loadEndpoints.mockResolvedValue([]);
    await gridPanel();
    expect(
      screen.getByRole('option', { name: 'No crudified table has a read endpoint yet' }),
    ).toBeInTheDocument();
  });

  it('writes the source, its count url and every column but the key when one is picked', async () => {
    const { s } = await gridPanel('data-delete-url="/x"');
    await userEvent.selectOptions(tableSelect()!, '/chinook/Album');
    const calls = s.onSetAttribute.mock.calls;
    expect(calls[0]).toEqual(['data-read-url', '/chinook/Album']);
    expect(calls[1]).toEqual(['data-count-url', '/chinook/Album-count']);
    expect(calls[2][0]).toBe('data-columns');
    expect(json(calls[2])).toEqual([
      { name: 'Title', label: 'Title', type: 'string' },
      { name: 'ArtistId', label: 'ArtistId', type: 'long' },
    ]);
    expect(s.onRemoveAttribute.mock.calls.map(call => call[0] as string)).toEqual([
      'data-delete-url',
      'data-update-url',
      'data-primary-key',
      'data-filterable',
    ]);
  });

  it('removes the count url for a table without a count endpoint', async () => {
    const { s } = await gridPanel();
    await userEvent.selectOptions(tableSelect()!, '/chinook/Artist');
    expect(s.onRemoveAttribute.mock.calls[0]).toEqual(['data-count-url']);
    const columns = s.onSetAttribute.mock.calls.find(call => call[0] === 'data-columns')!;
    expect(json(columns)).toEqual([
      { name: 'ArtistId', label: 'ArtistId', type: 'long' },
      { name: 'Name', label: 'Name', type: 'string' },
    ]);
  });

  it('does nothing when the empty choice is picked', async () => {
    const { s } = await gridPanel('data-read-url="/chinook/Album"');
    await userEvent.selectOptions(tableSelect()!, '');
    expect(s.onSetAttribute).not.toHaveBeenCalled();
    expect(s.onRemoveAttribute).not.toHaveBeenCalled();
  });

  it('shows no column list until a known table is chosen', async () => {
    await gridPanel('data-read-url="/gone/Table"');
    expect(screen.queryByText('Columns')).not.toBeInTheDocument();
    expect(tableSelect()!).toHaveValue('');
  });
});

describe('Inspector data grid columns', () => {
  const COLUMNS = `data-columns='[{"name":"Title","label":"Name of it","type":"string"}]'`;

  it('ticks the columns the grid carries and marks lookups', async () => {
    await gridPanel(`data-read-url="/chinook/Album" ${COLUMNS}`);
    expect(screen.getByRole('checkbox', { name: 'Title' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /ArtistId/ })).not.toBeChecked();
    expect(screen.getByText(/ArtistId →/).closest('label')).toHaveAttribute(
      'title',
      'References Artist',
    );
    expect(screen.getByText(/^Title$/).closest('label')).not.toHaveAttribute('title');
  });

  it('adds a column in the table order and keeps a given label', async () => {
    const { s } = await gridPanel(`data-read-url="/chinook/Album" ${COLUMNS}`);
    await userEvent.click(screen.getByRole('checkbox', { name: /ArtistId/ }));
    const call = s.onSetAttribute.mock.calls[0];
    expect(call[0]).toBe('data-columns');
    expect(json(call)).toEqual([
      { name: 'Title', label: 'Name of it', type: 'string', editable: false },
      { name: 'ArtistId', label: 'ArtistId', type: 'long', editable: false },
    ]);
  });

  it('removes a column', async () => {
    const { s } = await gridPanel(
      `data-read-url="/chinook/Album" data-columns='${JSON.stringify(ALL_COLUMNS)}'`,
    );
    await userEvent.click(screen.getByRole('checkbox', { name: 'Title' }));
    expect(json(s.onSetAttribute.mock.calls[0])).toEqual([
      { name: 'ArtistId', label: 'ArtistId', type: 'long', editable: false },
    ]);
  });

  it('marks columns editable when inline editing is on', async () => {
    const { s } = await gridPanel(
      `data-read-url="/chinook/Album" data-update-url="/chinook/Album" data-columns='[{"name":"Title","label":"Title"}]'`,
    );
    await userEvent.click(screen.getByRole('checkbox', { name: /ArtistId/ }));
    expect(json(s.onSetAttribute.mock.calls[0])).toEqual([
      { name: 'Title', label: 'Title', type: 'string', editable: true },
      { name: 'ArtistId', label: 'ArtistId', type: 'long', editable: true },
    ]);
  });

  it.each([
    ['not JSON', 'data-columns="{oops"'],
    ['not a list', `data-columns='{"name":"Title"}'`],
    ['no name', `data-columns='[{"label":"x"},null,"Title",{"name":3}]'`],
    ['missing', ''],
  ])('treats columns that are %s as none ticked', async (_why, attribute) => {
    await gridPanel(`data-read-url="/chinook/Album" ${attribute}`);
    for (const box of screen.getAllByRole('checkbox').slice(0, 3)) {
      expect(box).not.toBeChecked();
    }
  });

  it('keeps only the valid entries of a mixed list', async () => {
    await gridPanel(
      `data-read-url="/chinook/Album" data-columns='[{"name":"Title"},{"label":"x"},null]'`,
    );
    expect(screen.getByRole('checkbox', { name: 'Title' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /ArtistId/ })).not.toBeChecked();
  });
});

describe('Inspector data grid switches', () => {
  const BASE = `data-read-url="/chinook/Album" data-columns='${JSON.stringify(ALL_COLUMNS)}'`;

  it('enables delete and writes the primary key', async () => {
    const { s } = await gridPanel(BASE);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Allow delete' }));
    expect(s.onSetAttribute).toHaveBeenCalledWith('data-delete-url', '/chinook/Album');
    expect(s.onSetAttribute).toHaveBeenCalledWith('data-primary-key', '["AlbumId"]');
  });

  it('disables delete and drops the key when nothing else needs it', async () => {
    const { s } = await gridPanel(`${BASE} data-delete-url="/chinook/Album"`);
    const box = screen.getByRole('checkbox', { name: 'Allow delete' });
    expect(box).toBeChecked();
    await userEvent.click(box);
    expect(s.onRemoveAttribute).toHaveBeenCalledWith('data-delete-url');
    expect(s.onRemoveAttribute).toHaveBeenCalledWith('data-primary-key');
  });

  it('keeps the primary key when delete goes off but editing is on', async () => {
    const { s } = await gridPanel(
      `${BASE} data-delete-url="/chinook/Album" data-update-url="/chinook/Album"`,
    );
    await userEvent.click(screen.getByRole('checkbox', { name: 'Allow delete' }));
    expect(s.onRemoveAttribute).toHaveBeenCalledWith('data-delete-url');
    expect(s.onSetAttribute).toHaveBeenCalledWith('data-primary-key', '["AlbumId"]');
    expect(s.onRemoveAttribute).not.toHaveBeenCalledWith('data-primary-key');
  });

  it('enables inline editing, flags the columns and writes the key', async () => {
    const { s } = await gridPanel(BASE);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Allow inline editing' }));
    expect(s.onSetAttribute).toHaveBeenCalledWith('data-update-url', '/chinook/Album');
    const columns = s.onSetAttribute.mock.calls.find(call => call[0] === 'data-columns')!;
    expect(json(columns)).toEqual([
      { name: 'Title', label: 'Title', type: 'string', editable: true },
      { name: 'ArtistId', label: 'ArtistId', type: 'long', editable: true },
    ]);
    expect(s.onSetAttribute).toHaveBeenCalledWith('data-primary-key', '["AlbumId"]');
  });

  it('disables inline editing and drops the key when delete is off too', async () => {
    const { s } = await gridPanel(`${BASE} data-update-url="/chinook/Album"`);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Allow inline editing' }));
    expect(s.onRemoveAttribute).toHaveBeenCalledWith('data-update-url');
    expect(s.onRemoveAttribute).toHaveBeenCalledWith('data-primary-key');
    const columns = s.onSetAttribute.mock.calls.find(call => call[0] === 'data-columns')!;
    expect(json(columns)).toEqual(ALL_COLUMNS);
  });

  it('keeps the key when editing goes off but delete is on', async () => {
    const { s } = await gridPanel(
      `${BASE} data-update-url="/chinook/Album" data-delete-url="/chinook/Album"`,
    );
    await userEvent.click(screen.getByRole('checkbox', { name: 'Allow inline editing' }));
    expect(s.onSetAttribute).toHaveBeenCalledWith('data-primary-key', '["AlbumId"]');
  });

  it('disables what the table cannot do and says why', async () => {
    await gridPanel('data-read-url="/chinook/Artist"');
    const del = screen.getByRole('checkbox', { name: 'Allow delete' });
    const edit = screen.getByRole('checkbox', { name: 'Allow inline editing' });
    expect(del).toBeDisabled();
    expect(edit).toBeDisabled();
    expect(del.closest('label')).toHaveAttribute(
      'title',
      expect.stringContaining('no crud-delete'),
    );
    expect(edit.closest('label')).toHaveAttribute(
      'title',
      expect.stringContaining('no crud-update'),
    );
  });

  it('leaves the switches enabled without a hint when the table can do them', async () => {
    await gridPanel(BASE);
    const del = screen.getByRole('checkbox', { name: 'Allow delete' });
    expect(del).toBeEnabled();
    expect(del.closest('label')).not.toHaveAttribute('title');
    expect(
      screen.getByRole('checkbox', { name: 'Allow inline editing' }).closest('label'),
    ).not.toHaveAttribute('title');
  });

  it.each([
    ['Allow filtering', 'data-filterable'],
    ['Update live', 'data-live'],
  ])('toggles %s as a flag attribute', async (name, attribute) => {
    const { s } = await gridPanel(BASE, { live: true });
    const box = screen.getByRole('checkbox', { name });
    expect(box).not.toBeChecked();
    await userEvent.click(box);
    expect(s.onSetAttribute).toHaveBeenCalledWith(attribute, 'true');
    expect(box).toBeChecked();
    await userEvent.click(box);
    expect(s.onRemoveAttribute).toHaveBeenCalledWith(attribute);
    expect(box).not.toBeChecked();
  });

  it('shows the flags that are already on', async () => {
    await gridPanel(`${BASE} data-filterable="true" data-live="true"`);
    expect(screen.getByRole('checkbox', { name: 'Allow filtering' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Update live' })).toBeChecked();
  });
});

describe('Inspector data create widget', () => {
  async function createPanel(attributes = '') {
    const view = renderInspector(
      `<magic-data-create ${attributes}></magic-data-create>`,
      'magic-data-create',
    );
    await waitForTables();
    return view;
  }

  it('offers only tables with a create endpoint', async () => {
    await createPanel();
    expect(screen.getByRole('option', { name: 'chinook / Album' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'chinook / Artist' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Choose a table…' })).toBeInTheDocument();
  });

  it('says so when no table has a create endpoint', async () => {
    loadEndpoints.mockResolvedValue([ENDPOINTS[5]]);
    await createPanel();
    expect(
      screen.getByRole('option', { name: 'No crudified table has a create endpoint yet' }),
    ).toBeInTheDocument();
  });

  it('writes the create url and all the fields when a table is picked', async () => {
    const { s } = await createPanel();
    await userEvent.selectOptions(tableSelect()!, '/chinook/Album');
    expect(s.onSetAttribute).toHaveBeenCalledWith('data-create-url', '/chinook/Album');
    const columns = s.onSetAttribute.mock.calls.find(call => call[0] === 'data-columns')!;
    expect(json(columns)).toEqual([
      { name: 'Title', label: 'Title', type: 'string' },
      { name: 'ArtistId', label: 'ArtistId', type: 'long' },
    ]);
  });

  it('does nothing when the empty choice is picked', async () => {
    const { s } = await createPanel('data-create-url="/chinook/Album"');
    await userEvent.selectOptions(tableSelect()!, '');
    expect(s.onSetAttribute).not.toHaveBeenCalled();
  });

  it('lists the fields of the chosen table with lookups marked', async () => {
    await createPanel(`data-create-url="/chinook/Album" data-columns='[{"name":"Title"}]'`);
    expect(screen.getByText('Fields')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Title' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /ArtistId/ })).not.toBeChecked();
    expect(screen.getByText(/ArtistId →/).closest('label')).toHaveAttribute(
      'title',
      'References Artist',
    );
  });

  it('adds a field in the endpoint order, keeping a given label', async () => {
    const { s } = await createPanel(
      `data-create-url="/chinook/Album" data-columns='[{"name":"Title","label":"Name"}]'`,
    );
    await userEvent.click(screen.getByRole('checkbox', { name: /ArtistId/ }));
    expect(json(s.onSetAttribute.mock.calls[0])).toEqual([
      { name: 'Title', label: 'Name', type: 'string' },
      { name: 'ArtistId', label: 'ArtistId', type: 'long' },
    ]);
  });

  it('removes a field', async () => {
    const { s } = await createPanel(
      `data-create-url="/chinook/Album" data-columns='${JSON.stringify(ALL_COLUMNS)}'`,
    );
    await userEvent.click(screen.getByRole('checkbox', { name: 'Title' }));
    expect(json(s.onSetAttribute.mock.calls[0])).toEqual([
      { name: 'ArtistId', label: 'ArtistId', type: 'long' },
    ]);
  });

  it('shows no fields for an unknown create url', async () => {
    await createPanel('data-create-url="/gone/Table"');
    expect(screen.queryByText('Fields')).not.toBeInTheDocument();
  });
});

describe('Inspector data widgets inside a live panel', () => {
  it('reflects a picked table in the checklist after the edit lands', async () => {
    await gridPanel('', { live: true });
    await userEvent.selectOptions(tableSelect()!, '/chinook/Album');
    await waitFor(() => expect(screen.getByText('Columns')).toBeInTheDocument());
    expect(screen.getByRole('checkbox', { name: 'Title' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Allow delete' })).not.toBeChecked();
  });

  it('loads the tables when only the words inside a grid are selected', async () => {
    renderInspector(
      '<magic-data-grid>words</magic-data-grid>',
      doc => doc.querySelector('magic-data-grid')!.firstChild,
    );
    expect(screen.getByText('Table')).toBeInTheDocument();
    await waitFor(() => expect(tableSelect()).not.toBeNull());
    expect(loadEndpoints).toHaveBeenCalledTimes(1);
  });
});
