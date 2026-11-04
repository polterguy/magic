import {
  ColumnLock,
  CrudColumn,
  CrudifyArgument,
  CrudifyOptions,
  CrudifyPayload,
  CrudTable,
  DecoratedColumn,
} from './types';

export const ALL_VERBS = ['post', 'get', 'put', 'delete'];

// What a string column named user or username gets unless the author says otherwise.
export function defaultLock(column: CrudColumn): ColumnLock {
  return (column.name === 'user' || column.name === 'username') && column.hl === 'string'
    ? { mode: 'username', slot: '' }
    : { mode: 'none', slot: '' };
}

/*
 * Primary keys are never lockable: they are what identifies the row in PUT and
 * DELETE, so locking one would silently drop the lock from both.
 */
export function lockSlot(lock: ColumnLock) {
  if (lock.mode === 'username') {
    return 'auth.ticket.get';
  }
  return lock.mode === 'custom' ? lock.slot.trim() : '';
}

export function resolveLocks(chosen: Record<string, ColumnLock> | undefined, table: CrudTable) {
  const locks: Record<string, string> = {};
  for (const column of table.columns ?? []) {
    const lock = chosen?.[column.name] ?? defaultLock(column);
    locks[column.name] = column.primary ? '' : lockSlot(lock);
  }
  return locks;
}

/*
 * Builds the per-verb crudify payload the way the old dashboard's
 * transform-model service does.
 */
export function buildCrudifyPayload(
  databaseType: string,
  connectionString: string,
  database: string,
  table: CrudTable,
  verb: string,
  options: CrudifyOptions,
) {
  const columns = (table.columns ?? []).map(column => withVerbDefaults(column, options.locks));

  const payload: CrudifyPayload = {
    databaseType,
    // The backend expects the composite [connectionString|database] format.
    database: '[' + connectionString + '|' + database + ']',
    moduleName: options.moduleName || database,
    moduleUrl: options.moduleUrl || table.name,
    table: table.name,
    verb,
    returnId: columns.filter(c => c.primary && !c.automatic).length === 0,
    overwrite: options.overwrite,
    verbose: options.verbose,
    join: true,
    cqrs: !!options.live && verb !== 'get',
    args: { columns: [], primary: [] },
  };

  /*
   * crudify publishes to every connected client when cqrs is on but no
   * authorisation is given, so an audience is always sent along with it.
   */
  if (payload.cqrs) {
    payload.cqrsAuthorisation = options.liveAudience || 'inherited';
    if (payload.cqrsAuthorisation !== 'inherited') {
      payload.cqrsAuthorisationValues = options.liveValues;
    }
  }

  if (options.auth.length > 0) {
    payload.auth = options.auth.join(',');
  }
  addVerbOptions(payload, verb, options);
  if (options.logging && verb !== 'get') {
    const past: Record<string, string> = { post: 'created', put: 'updated', delete: 'deleted' };
    payload.log = database + '.' + table.name + ' entry ' + past[verb];
  }

  for (const column of columns) {
    addArgumentColumn(payload, verb, column);
  }
  return payload;
}

// Old dashboard's per-column verb defaults.
export function withVerbDefaults(column: CrudColumn, locks: Record<string, string>) {
  const name = (column.name ?? '').toLowerCase();
  const decorated: DecoratedColumn = { ...column };
  decorated.post = !(column.automatic && column.primary);
  if (column.automatic && (name === 'created' || name === 'last_update')) {
    decorated.post = false;
  }
  decorated.get = true;
  decorated.put = !column.automatic || column.primary;
  decorated.delete = column.primary;
  if (locks[column.name]) {
    decorated.locked = locks[column.name];
  }
  if (name === 'picture' || name === 'image' || name === 'photo') {
    decorated.handling = 'image';
  } else if (name === 'file') {
    decorated.handling = 'file';
  } else if (name === 'youtube' || name === 'video') {
    decorated.handling = 'youtube';
  }
  return decorated;
}

// What only a GET takes, and the template each verb is generated from.
export function addVerbOptions(payload: CrudifyPayload, verb: string, options: CrudifyOptions) {
  if (verb !== 'get') {
    payload.template = '/system/crudifier/templates/crud.template.' + verb + '.hl';
    return;
  }
  payload.paging = options.paging;
  payload.sorting = options.sorting;
  payload.aggregate = options.aggregate;
  payload.distinct = options.distinct;
  payload.search = options.search;
  if (options.cache > 0) {
    payload.cache = options.cache;
    payload.publicCache = options.publicCache;
  }
  payload.template = '/system/crudifier/templates/crud.template-no-operator.get.hl';
}

// How a column appears in the arguments of the endpoint being generated.
export function crudifyColumnEntry(column: DecoratedColumn) {
  const entry: CrudifyArgument = { name: column.name, type: column.hl };
  if (column.locked) {
    entry.locked = column.locked;
  }
  if (column.handling) {
    entry.handling = column.handling;
  }
  if (column.foreign_key?.foreign_name != null) {
    entry.foreign_key = {
      table: column.foreign_key.foreign_table,
      column: column.foreign_key.foreign_column,
      name: column.foreign_key.foreign_name,
      long: column.foreign_key.long_data,
    };
  }
  return entry;
}

// Puts the column among the arguments of the verb, if the verb takes it.
export function addArgumentColumn(payload: CrudifyPayload, verb: string, column: DecoratedColumn) {
  switch (verb) {
    case 'post':
      if (column.post) {
        payload.args.columns.push(crudifyColumnEntry(column));
      }
      break;
    case 'get':
      if (column.get) {
        payload.args.columns.push(crudifyColumnEntry(column));
      }
      break;
    case 'put':
      if (column.put) {
        payload.args[column.primary ? 'primary' : 'columns'].push(crudifyColumnEntry(column));
      }
      break;
    case 'delete':
      if (column.delete && column.primary) {
        payload.args.primary.push({ [column.name]: column.hl });
      } else if (!column.delete && column.locked) {
        payload.args.columns.push({ name: column.name, locked: column.locked });
      }
      break;
  }
}

/*
 * Skips verb/table combinations that would generate meaningless endpoints,
 * like the old crudify service does.
 */
export function canGenerate(payload: CrudifyPayload, verb: string) {
  switch (verb) {
    case 'post':
      return payload.args.columns.length > 0;
    case 'get':
      return payload.args.columns.length > 0;
    case 'put':
      return payload.args.primary.length > 0 && payload.args.columns.length > 0;
    case 'delete':
      return payload.args.primary.length > 0;
    default:
      return false;
  }
}

/*
 * One crudify invocation creates several endpoint files: GET always produces
 * the read + count endpoints, and the aggregate, distinct and search options
 * add aggregate+group, distinct+count-distinct and search on top of it.
 * Other verbs produce one endpoint each.
 */
export function endpointsForVerb(
  verb: string,
  options: { aggregate: boolean; distinct: boolean; search: boolean },
) {
  if (verb !== 'get') {
    return 1;
  }
  return 2 + (options.aggregate ? 2 : 0) + (options.distinct ? 2 : 0) + (options.search ? 1 : 0);
}

export function crudSummary(tables: number, verbs: number, endpoints: number, module: string) {
  if (tables === 0) {
    return 'Select at least one table.';
  }
  if (verbs === 0) {
    return 'Select at least one HTTP verb.';
  }
  return (
    `${endpoints} endpoint${endpoints === 1 ? '' : 's'} across ` +
    `${tables} table${tables > 1 ? 's' : ''} ` +
    `→ /magic/${module}/`
  );
}
