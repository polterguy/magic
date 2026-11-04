/*
 * Unit tests for the CRUD generator's pure helpers — the crudify payload each
 * table and verb is generated from, the column locks, and the summary line.
 *
 * Run with `npm run test`. Node environment only: nothing here touches the DOM
 * or the network.
 */

import { describe, expect, it } from 'vitest';

import {
  addArgumentColumn,
  addVerbOptions,
  ALL_VERBS,
  buildCrudifyPayload,
  canGenerate,
  crudifyColumnEntry,
  crudSummary,
  defaultLock,
  endpointsForVerb,
  lockSlot,
  resolveLocks,
  withVerbDefaults,
} from '../crudify';
import { CrudifyOptions, CrudifyPayload, CrudTable } from '../types';

const orders: CrudTable = {
  name: 'orders',
  columns: [
    { name: 'id', db: 'integer', primary: true, automatic: true, hl: 'long' },
    { name: 'user', db: 'varchar', hl: 'string' },
    {
      name: 'customer_id',
      db: 'integer',
      hl: 'long',
      foreign_key: {
        foreign_table: 'customers',
        foreign_column: 'id',
        foreign_name: 'name',
        long_data: true,
      },
    },
    { name: 'created', db: 'timestamp', automatic: true, hl: 'date' },
    { name: 'picture', db: 'varchar', hl: 'string' },
    {
      name: 'note',
      db: 'varchar',
      hl: 'string',
      foreign_key: { foreign_table: 'notes', foreign_column: 'id', foreign_name: null },
    },
  ],
};

// A table with no primary key — PUT and DELETE have nothing to identify a row by.
const log: CrudTable = {
  name: 'log',
  columns: [
    { name: 'message', db: 'text', hl: 'string' },
    { name: 'level', db: 'varchar', hl: 'string' },
  ],
};

function options(overrides: Partial<CrudifyOptions> = {}): CrudifyOptions {
  return {
    auth: ['root', 'admin'],
    logging: true,
    cache: 0,
    publicCache: false,
    overwrite: false,
    paging: true,
    sorting: true,
    aggregate: false,
    distinct: false,
    search: false,
    verbose: false,
    moduleName: '',
    moduleUrl: null,
    locks: resolveLocks(undefined, orders),
    ...overrides,
  };
}

function build(verb: string, overrides: Partial<CrudifyOptions> = {}, table = orders) {
  return buildCrudifyPayload('sqlite', 'generic', 'shop', table, verb, options(overrides));
}

function emptyPayload(): CrudifyPayload {
  return {
    databaseType: 'sqlite',
    database: '[generic|shop]',
    moduleName: 'shop',
    moduleUrl: 'orders',
    table: 'orders',
    verb: 'get',
    returnId: true,
    overwrite: false,
    verbose: false,
    join: true,
    cqrs: false,
    args: { columns: [], primary: [] },
  };
}

describe('defaultLock', () => {
  it('locks string user and username columns to the caller', () => {
    expect(defaultLock({ name: 'user', db: 'varchar', hl: 'string' })).toEqual({
      mode: 'username',
      slot: '',
    });
    expect(defaultLock({ name: 'username', db: 'varchar', hl: 'string' })).toEqual({
      mode: 'username',
      slot: '',
    });
  });

  it('leaves other columns, and non-string user columns, unlocked', () => {
    expect(defaultLock({ name: 'user', db: 'integer', hl: 'long' })).toEqual({
      mode: 'none',
      slot: '',
    });
    expect(defaultLock({ name: 'owner', db: 'varchar', hl: 'string' })).toEqual({
      mode: 'none',
      slot: '',
    });
    // Case sensitive: only the exact lowercase names are recognised.
    expect(defaultLock({ name: 'User', db: 'varchar', hl: 'string' }).mode).toBe('none');
  });
});

describe('lockSlot', () => {
  it('maps each lock mode to the slot its value comes from', () => {
    expect(lockSlot({ mode: 'username', slot: 'ignored' })).toBe('auth.ticket.get');
    expect(lockSlot({ mode: 'custom', slot: '  tenant.get  ' })).toBe('tenant.get');
    expect(lockSlot({ mode: 'none', slot: 'tenant.get' })).toBe('');
  });
});

describe('resolveLocks', () => {
  it('falls back to the default lock for every column the author did not choose', () => {
    expect(resolveLocks(undefined, orders)).toEqual({
      id: '',
      user: 'auth.ticket.get',
      customer_id: '',
      created: '',
      picture: '',
      note: '',
    });
  });

  it('applies chosen locks, overriding the default', () => {
    const locks = resolveLocks(
      {
        user: { mode: 'none', slot: '' },
        customer_id: { mode: 'custom', slot: 'tenant.get' },
      },
      orders,
    );
    expect(locks.user).toBe('');
    expect(locks.customer_id).toBe('tenant.get');
  });

  it('never locks a primary key, whatever was chosen', () => {
    expect(resolveLocks({ id: { mode: 'username', slot: '' } }, orders).id).toBe('');
  });

  it('returns nothing for a table without columns', () => {
    expect(resolveLocks(undefined, { name: 'empty' })).toEqual({});
    expect(resolveLocks(undefined, { name: 'empty', columns: null })).toEqual({});
  });
});

describe('withVerbDefaults', () => {
  it('keeps an automatic primary key out of POST but in PUT and DELETE', () => {
    const id = withVerbDefaults(orders.columns![0], {});
    expect(id).toMatchObject({ post: false, get: true, put: true, delete: true });
  });

  it('keeps automatic created and last_update columns out of POST and PUT', () => {
    const created = withVerbDefaults(orders.columns![3], {});
    expect(created).toMatchObject({ post: false, get: true });
    // put is `!automatic || primary`, which leaves undefined rather than false here.
    expect(created.put).toBeUndefined();
    const lastUpdate = withVerbDefaults(
      { name: 'last_update', db: 'timestamp', automatic: true, hl: 'date' },
      {},
    );
    expect(lastUpdate.post).toBe(false);
  });

  it('keeps any other automatic column in POST', () => {
    const counter = withVerbDefaults({ name: 'counter', db: 'integer', automatic: true }, {});
    expect(counter.post).toBe(true);
    expect(counter.put).toBeFalsy();
  });

  it('marks the lock and the media handling the column name implies', () => {
    expect(withVerbDefaults(orders.columns![1], { user: 'auth.ticket.get' }).locked).toBe(
      'auth.ticket.get',
    );
    expect(withVerbDefaults(orders.columns![1], { user: '' }).locked).toBeUndefined();
    expect(withVerbDefaults({ name: 'Photo', db: 'x' }, {}).handling).toBe('image');
    expect(withVerbDefaults({ name: 'image', db: 'x' }, {}).handling).toBe('image');
    expect(withVerbDefaults({ name: 'file', db: 'x' }, {}).handling).toBe('file');
    expect(withVerbDefaults({ name: 'video', db: 'x' }, {}).handling).toBe('youtube');
    expect(withVerbDefaults({ name: 'youtube', db: 'x' }, {}).handling).toBe('youtube');
    expect(withVerbDefaults({ name: 'files', db: 'x' }, {}).handling).toBeUndefined();
  });

  it('does not change the column it decorates', () => {
    const column = { name: 'picture', db: 'varchar' };
    withVerbDefaults(column, {});
    expect(column).toEqual({ name: 'picture', db: 'varchar' });
  });
});

describe('crudifyColumnEntry', () => {
  it('carries the foreign key lookup only when it has a display name', () => {
    expect(crudifyColumnEntry(withVerbDefaults(orders.columns![2], {}))).toEqual({
      name: 'customer_id',
      type: 'long',
      foreign_key: { table: 'customers', column: 'id', name: 'name', long: true },
    });
    expect(crudifyColumnEntry(withVerbDefaults(orders.columns![5], {}))).toEqual({
      name: 'note',
      type: 'string',
    });
  });
});

describe('buildCrudifyPayload', () => {
  it('builds the common part every verb shares', () => {
    const payload = build('post');
    expect(payload).toMatchObject({
      databaseType: 'sqlite',
      database: '[generic|shop]',
      moduleName: 'shop',
      moduleUrl: 'orders',
      table: 'orders',
      verb: 'post',
      returnId: true,
      overwrite: false,
      verbose: false,
      join: true,
      cqrs: false,
      auth: 'root,admin',
    });
    expect(payload.cqrsAuthorisation).toBeUndefined();
  });

  it('uses the module and component URL overrides when given', () => {
    const payload = build('get', { moduleName: 'api', moduleUrl: 'purchases' });
    expect(payload.moduleName).toBe('api');
    expect(payload.moduleUrl).toBe('purchases');
  });

  it('leaves auth out entirely for public endpoints', () => {
    expect('auth' in build('get', { auth: [] })).toBe(false);
  });

  it('asks for the new id back only when no primary key is supplied by the caller', () => {
    expect(build('post').returnId).toBe(true);
    const manual: CrudTable = {
      name: 'tags',
      columns: [{ name: 'tag', db: 'varchar', primary: true, hl: 'string' }],
    };
    expect(build('post', { locks: {} }, manual).returnId).toBe(false);
  });

  it('POST takes every insertable column, with locks, handling and foreign keys', () => {
    const payload = build('post');
    expect(payload.template).toBe('/system/crudifier/templates/crud.template.post.hl');
    expect(payload.log).toBe('shop.orders entry created');
    expect(payload.args.primary).toEqual([]);
    expect(payload.args.columns).toEqual([
      { name: 'user', type: 'string', locked: 'auth.ticket.get' },
      {
        name: 'customer_id',
        type: 'long',
        foreign_key: { table: 'customers', column: 'id', name: 'name', long: true },
      },
      { name: 'picture', type: 'string', handling: 'image' },
      { name: 'note', type: 'string' },
    ]);
    expect(payload.paging).toBeUndefined();
  });

  it('GET takes every column and the read-only options, but never logs', () => {
    const payload = build('get', { aggregate: true, search: true });
    expect(payload.template).toBe('/system/crudifier/templates/crud.template-no-operator.get.hl');
    expect(payload).toMatchObject({
      paging: true,
      sorting: true,
      aggregate: true,
      distinct: false,
      search: true,
    });
    expect(payload.log).toBeUndefined();
    expect(payload.cache).toBeUndefined();
    expect(payload.publicCache).toBeUndefined();
    expect(payload.args.columns.map(c => c.name)).toEqual([
      'id',
      'user',
      'customer_id',
      'created',
      'picture',
      'note',
    ]);
    expect(payload.args.primary).toEqual([]);
  });

  it('GET carries the cache only when it is switched on', () => {
    const payload = build('get', { cache: 30, publicCache: true });
    expect(payload.cache).toBe(30);
    expect(payload.publicCache).toBe(true);
  });

  it('PUT identifies the row by its primary key and updates the rest', () => {
    const payload = build('put');
    expect(payload.template).toBe('/system/crudifier/templates/crud.template.put.hl');
    expect(payload.log).toBe('shop.orders entry updated');
    expect(payload.args.primary).toEqual([{ name: 'id', type: 'long' }]);
    // The automatic created column is not updatable.
    expect(payload.args.columns.map(c => c.name)).toEqual([
      'user',
      'customer_id',
      'picture',
      'note',
    ]);
  });

  it('DELETE takes the primary key as a name/type pair, plus every locked column', () => {
    const payload = build('delete');
    expect(payload.template).toBe('/system/crudifier/templates/crud.template.delete.hl');
    expect(payload.log).toBe('shop.orders entry deleted');
    expect(payload.args.primary).toEqual([{ id: 'long' }]);
    expect(payload.args.columns).toEqual([{ name: 'user', locked: 'auth.ticket.get' }]);
  });

  it('logs nothing when logging is off', () => {
    for (const verb of ALL_VERBS) {
      expect(build(verb, { logging: false }).log).toBeUndefined();
    }
  });

  it('publishes live updates on writes only, to the endpoint roles by default', () => {
    const post = build('post', { live: true });
    expect(post.cqrs).toBe(true);
    expect(post.cqrsAuthorisation).toBe('inherited');
    expect(post.cqrsAuthorisationValues).toBeUndefined();
    expect(build('get', { live: true }).cqrs).toBe(false);
  });

  it('sends an explicit live audience along with its values', () => {
    const put = build('put', { live: true, liveAudience: 'roles', liveValues: 'sales,ops' });
    expect(put.cqrsAuthorisation).toBe('roles');
    expect(put.cqrsAuthorisationValues).toBe('sales,ops');
    // A blank audience falls back to the endpoint's own roles.
    expect(build('delete', { live: true, liveAudience: '' }).cqrsAuthorisation).toBe('inherited');
  });
});

describe('addVerbOptions', () => {
  it('sets only the template for writes', () => {
    const payload = emptyPayload();
    addVerbOptions(payload, 'delete', options({ cache: 10 }));
    expect(payload.template).toBe('/system/crudifier/templates/crud.template.delete.hl');
    expect(payload.cache).toBeUndefined();
    expect(payload.paging).toBeUndefined();
  });

  it('ignores a negative cache', () => {
    const payload = emptyPayload();
    addVerbOptions(payload, 'get', options({ cache: -5 }));
    expect(payload.cache).toBeUndefined();
  });
});

describe('addArgumentColumn', () => {
  it('ignores verbs it does not know', () => {
    const payload = emptyPayload();
    addArgumentColumn(payload, 'patch', withVerbDefaults(orders.columns![1], {}));
    expect(payload.args).toEqual({ columns: [], primary: [] });
  });
});

describe('canGenerate', () => {
  it('generates every verb of a table with a primary key', () => {
    for (const verb of ALL_VERBS) {
      expect(canGenerate(build(verb), verb)).toBe(true);
    }
  });

  it('skips PUT and DELETE on a table without a primary key', () => {
    const locks = resolveLocks(undefined, log);
    expect(canGenerate(build('post', { locks }, log), 'post')).toBe(true);
    expect(canGenerate(build('get', { locks }, log), 'get')).toBe(true);
    expect(canGenerate(build('put', { locks }, log), 'put')).toBe(false);
    expect(canGenerate(build('delete', { locks }, log), 'delete')).toBe(false);
  });

  it('skips PUT when only the primary key is updatable', () => {
    const keyOnly: CrudTable = {
      name: 'keys',
      columns: [{ name: 'id', db: 'integer', primary: true, automatic: true, hl: 'long' }],
    };
    const payload = build('put', { locks: {} }, keyOnly);
    expect(canGenerate(payload, 'put')).toBe(false);
    // POST has nothing to insert either, since the key is automatic.
    expect(canGenerate(build('post', { locks: {} }, keyOnly), 'post')).toBe(false);
  });

  it('never generates an unknown verb', () => {
    expect(canGenerate(build('get'), 'patch')).toBe(false);
  });
});

describe('endpointsForVerb', () => {
  const none = { aggregate: false, distinct: false, search: false };

  it('counts one endpoint per write verb', () => {
    expect(endpointsForVerb('post', { aggregate: true, distinct: true, search: true })).toBe(1);
    expect(endpointsForVerb('put', none)).toBe(1);
    expect(endpointsForVerb('delete', none)).toBe(1);
  });

  it('counts read + count for GET, plus each GET option', () => {
    expect(endpointsForVerb('get', none)).toBe(2);
    expect(endpointsForVerb('get', { ...none, aggregate: true })).toBe(4);
    expect(endpointsForVerb('get', { ...none, distinct: true })).toBe(4);
    expect(endpointsForVerb('get', { ...none, search: true })).toBe(3);
    expect(endpointsForVerb('get', { aggregate: true, distinct: true, search: true })).toBe(7);
  });
});

describe('crudSummary', () => {
  it('asks for a table, then a verb, before summarising', () => {
    expect(crudSummary(0, 4, 0, 'shop')).toBe('Select at least one table.');
    expect(crudSummary(2, 0, 0, 'shop')).toBe('Select at least one HTTP verb.');
  });

  it('pluralises endpoints and tables', () => {
    expect(crudSummary(1, 1, 1, 'shop')).toBe('1 endpoint across 1 table → /magic/shop/');
    expect(crudSummary(3, 4, 15, 'api')).toBe('15 endpoints across 3 tables → /magic/api/');
    expect(crudSummary(1, 2, 0, 'shop')).toBe('0 endpoints across 1 table → /magic/shop/');
  });
});
