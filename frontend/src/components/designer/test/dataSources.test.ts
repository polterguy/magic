/*
 * Turning the endpoints list into the one-entry-per-table list a widget's picker shows: matching
 * siblings by crudify's own type and path convention, deriving keys and editable columns, and
 * the session cache of the endpoint list.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type EndpointMeta, listEndpointsDetailed } from '../../../lib/api';
import { dataGridSources, loadEndpoints } from '../dataSources';

vi.mock('../../../lib/api', () => ({ listEndpointsDetailed: vi.fn() }));

function ep(path: string, verb: string, type: string, extra: Partial<EndpointMeta> = {}) {
  return { path, verb, type, ...extra } satisfies EndpointMeta;
}

// A table with every crudify verb.
function fullTable(module: string, table: string): EndpointMeta[] {
  const path = module + '/' + table;
  return [
    ep(path, 'get', 'crud-read', {
      output: [
        { name: 'id', type: 'long' },
        { name: 'name', type: 'string' },
        { name: 'owner', type: 'long', lookup: [{ table: 'users', key: 'id', name: 'login' }] },
      ],
    }),
    ep(path + '-count', 'get', 'crud-count'),
    ep(path, 'delete', 'crud-delete', { input: [{ name: 'id', type: 'long' }] }),
    ep(path, 'put', 'crud-update', {
      input: [
        { name: 'id', type: 'long' },
        { name: 'name', type: 'string' },
        { name: 'owner', type: 'long' },
      ],
    }),
    ep(path, 'post', 'crud-create', {
      input: [
        { name: 'name', type: 'string' },
        { name: 'owner', type: 'long', lookup: [{ table: 'users' }] },
      ],
    }),
  ];
}

describe('dataGridSources', () => {
  it('builds a full entry for a table with every crudify verb', () => {
    const [source] = dataGridSources(fullTable('shop', 'orders'));
    expect(source).toEqual({
      module: 'shop',
      table: 'orders',
      label: 'shop / orders',
      readUrl: '/shop/orders',
      countUrl: '/shop/orders-count',
      deleteUrl: '/shop/orders',
      updateUrl: '/shop/orders',
      editableColumns: ['name', 'owner'],
      primaryKey: ['id'],
      columns: [
        { name: 'id', type: 'long', lookup: undefined },
        { name: 'name', type: 'string', lookup: undefined },
        { name: 'owner', type: 'long', lookup: [{ table: 'users', key: 'id', name: 'login' }] },
      ],
      createUrl: '/shop/orders',
      createColumns: [
        { name: 'name', type: 'string', lookup: undefined },
        { name: 'owner', type: 'long', lookup: [{ table: 'users' }] },
      ],
    });
  });

  it('offers a read-only table with nulls for the verbs crudify did not generate', () => {
    const [source] = dataGridSources([ep('db/tags', 'get', 'crud-read')]);
    expect(source).toMatchObject({
      countUrl: null,
      deleteUrl: null,
      updateUrl: null,
      createUrl: null,
      editableColumns: [],
      primaryKey: [],
      columns: [],
      createColumns: [],
    });
  });

  it('ignores endpoints that are not a get crud-read', () => {
    const sources = dataGridSources([
      ep('a/b', 'post', 'crud-read'),
      ep('a/c', 'get', 'crud-count'),
      ep('a/d', 'get', 'other'),
      { path: 'a/e', verb: 'get' },
    ]);
    expect(sources).toEqual([]);
  });

  it('only matches a sibling on its exact path and verb', () => {
    const [source] = dataGridSources([
      ep('m/t', 'get', 'crud-read'),
      ep('m/other-count', 'get', 'crud-count'),
      ep('m/other', 'delete', 'crud-delete', { input: [{ name: 'id', type: 'long' }] }),
      ep('m/t', 'get', 'crud-delete'),
      ep('m/t', 'post', 'crud-update'),
      ep('m/other', 'post', 'crud-create'),
    ]);
    expect(source).toMatchObject({
      countUrl: null,
      deleteUrl: null,
      updateUrl: null,
      createUrl: null,
    });
  });

  it('withholds updateUrl when the primary key is the only updatable input', () => {
    const [source] = dataGridSources([
      ep('m/t', 'get', 'crud-read'),
      ep('m/t', 'delete', 'crud-delete', { input: [{ name: 'id', type: 'long' }] }),
      ep('m/t', 'put', 'crud-update', { input: [{ name: 'id', type: 'long' }] }),
    ]);
    expect(source.updateUrl).toBeNull();
    expect(source.editableColumns).toEqual([]);
  });

  it('treats every update column as editable when there is no delete endpoint', () => {
    const [source] = dataGridSources([
      ep('m/t', 'get', 'crud-read'),
      ep('m/t', 'put', 'crud-update', { input: [{ name: 'id', type: 'long' }] }),
    ]);
    expect(source.primaryKey).toEqual([]);
    expect(source.editableColumns).toEqual(['id']);
    expect(source.updateUrl).toBe('/m/t');
  });

  it('sorts by label', () => {
    const labels = dataGridSources([
      ...fullTable('zeta', 'a'),
      ...fullTable('alpha', 'b'),
      ...fullTable('alpha', 'a'),
    ]).map(source => source.label);
    expect(labels).toEqual(['alpha / a', 'alpha / b', 'zeta / a']);
  });
});

describe('loadEndpoints', () => {
  beforeEach(() => {
    vi.mocked(listEndpointsDetailed).mockReset();
  });

  it('fetches once and reuses the answer until a refresh is asked for', async () => {
    vi.mocked(listEndpointsDetailed).mockResolvedValueOnce([ep('a/b', 'get', 'crud-read')]);
    const first = await loadEndpoints(true);
    const second = await loadEndpoints();
    expect(second).toBe(first);
    expect(listEndpointsDetailed).toHaveBeenCalledTimes(1);

    vi.mocked(listEndpointsDetailed).mockResolvedValueOnce([]);
    expect(await loadEndpoints(true)).toEqual([]);
    expect(listEndpointsDetailed).toHaveBeenCalledTimes(2);
  });
});
