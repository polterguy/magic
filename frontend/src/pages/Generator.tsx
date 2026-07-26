import { showToast } from '../lib/toast';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronIcon } from '../components/Icons';
import { useSearchParams } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor';
import Tabs from '../components/Tabs';
import {
  crudify,
  customSqlEndpoint,
  defaultDatabaseType,
  http,
  listDatabases,
  listRoles,
} from '../lib/api';

/*
 * Builds the per-verb crudify payload the way the old dashboard's
 * transform-model service does.
 */
function buildCrudifyPayload(
  databaseType: string,
  connectionString: string,
  database: string,
  table: any,
  verb: string,
  options: {
    auth: string[];
    logging: boolean;
    cache: number;
    publicCache: boolean;
    overwrite: boolean;
    paging: boolean;
    sorting: boolean;
    aggregate: boolean;
    distinct: boolean;
    search: boolean;
    // URL overrides — module defaults to the database name, component to the
    // table name (and is only overridable when one single table is selected,
    // like the old dashboard).
    moduleName: string;
    moduleUrl: string | null;
  }) {

  // Old dashboard's per-column verb defaults.
  const columns = (table.columns ?? []).map((column: any) => {
    const name = (column.name ?? '').toLowerCase();
    const decorated: any = { ...column };
    decorated.post = !(column.automatic && column.primary);
    if (column.automatic && (name === 'created' || name === 'last_update')) {
      decorated.post = false;
    }
    decorated.get = true;
    decorated.put = !column.automatic || column.primary;
    decorated.delete = column.primary;
    if ((column.name === 'user' || column.name === 'username') && column.hl === 'string') {
      decorated.locked = 'auth.ticket.get';
    }
    if (name === 'picture' || name === 'image' || name === 'photo') {
      decorated.handling = 'image';
    } else if (name === 'file') {
      decorated.handling = 'file';
    } else if (name === 'youtube' || name === 'video') {
      decorated.handling = 'youtube';
    }
    return decorated;
  });

  const payload: any = {
    databaseType,
    // The backend expects the composite [connectionString|database] format.
    database: '[' + connectionString + '|' + database + ']',
    moduleName: options.moduleName || database,
    moduleUrl: options.moduleUrl || table.name,
    table: table.name,
    verb,
    returnId: columns.filter((c: any) => c.primary && !c.automatic).length === 0,
    overwrite: options.overwrite,
    verbose: false,
    join: true,
    cqrs: false,
    args: { columns: [], primary: [] },
  };

  if (options.auth.length > 0) {
    payload.auth = options.auth.join(',');
  }
  if (verb === 'get') {
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
  } else {
    payload.template = '/system/crudifier/templates/crud.template.' + verb + '.hl';
  }
  if (options.logging && verb !== 'get') {
    const past: any = { post: 'created', put: 'updated', delete: 'deleted' };
    payload.log = database + '.' + table.name + ' entry ' + past[verb];
  }

  const decorate = (column: any) => {
    const entry: any = { name: column.name, type: column.hl };
    if (column.locked) {
      entry.locked = column.locked;
    }
    if (column.handling) {
      entry.handling = column.handling;
    }
    if (column.foreign_key && column.foreign_key.foreign_name !== null &&
        column.foreign_key.foreign_name !== undefined) {
      entry.foreign_key = {
        table: column.foreign_key.foreign_table,
        column: column.foreign_key.foreign_column,
        name: column.foreign_key.foreign_name,
        long: column.foreign_key.long_data,
      };
    }
    return entry;
  };

  for (const column of columns) {
    switch (verb) {
      case 'post':
        if (column.post) {
          payload.args.columns.push(decorate(column));
        }
        break;
      case 'get':
        if (column.get) {
          payload.args.columns.push(decorate(column));
        }
        break;
      case 'put':
        if (column.put) {
          if (column.primary) {
            payload.args.primary.push(decorate(column));
          } else {
            payload.args.columns.push(decorate(column));
          }
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
  return payload;
}

/*
 * Skips verb/table combinations that would generate meaningless endpoints,
 * like the old crudify service does.
 */
function canGenerate(payload: any, verb: string) {
  switch (verb) {
    case 'post': return payload.args.columns.length > 0;
    case 'get': return payload.args.columns.length > 0;
    case 'put': return payload.args.primary.length > 0 && payload.args.columns.length > 0;
    case 'delete': return payload.args.primary.length > 0;
    default: return false;
  }
}

/*
 * Notifications go to the toast stack. An inline banner is part of the page,
 * so showing one pushed everything below it down — the editors and grids
 * jumped under the pointer. Toasts float above the page instead.
 */
function setFeedback(value: { text: string; isError: boolean } | null) {
  if (value) {
    showToast(value.text, value.isError);
  }
}

export default function Generator() {

  const [tab, setTab] = useState('crud');
  return (
    <>
      <div className="page-header">
        <h1>Generator</h1>
        <p>Generate CRUD backends and custom SQL endpoints from your databases</p>
      </div>
      <Tabs
        tabs={[
          { id: 'crud', label: 'CRUD backend' },
          { id: 'sql', label: 'SQL endpoint' },
        ]}
        active={tab}
        onChange={setTab} />
      {tab === 'crud' ? <CrudTab /> : <SqlEndpointTab />}
    </>
  );
}

/*
 * Shared database-selection state for both generator tabs.
 */
function useDatabaseSelection() {

  const [searchParams] = useSearchParams();
  const deepLink = useRef({
    type: searchParams.get('dbType'),
    connectionString: searchParams.get('dbCString'),
    database: searchParams.get('dbName'),
  });
  const [types, setTypes] = useState<string[]>([]);
  const [type, setType] = useState('');
  const [connectionStrings, setConnectionStrings] = useState<string[]>([]);
  const [connectionString, setConnectionString] = useState('');
  const [databasesMeta, setDatabasesMeta] = useState<any[]>([]);
  const [database, setDatabase] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    defaultDatabaseType().then(response => {
      setTypes(response.options);
      setType(deepLink.current.type ?? response.default);
    }).catch(err => setError(err.message));
  }, []);

  useEffect(() => {
    if (!type) {
      return;
    }
    http.get<Record<string, string>>(
      '/magic/system/sql/connection-strings?databaseType=' + encodeURIComponent(type))
      .then(response => {
        const names = Object.keys(response ?? {});
        setConnectionStrings(names);
        const wanted = deepLink.current.connectionString;
        deepLink.current.connectionString = null;
        if (wanted && names.includes(wanted)) {
          setConnectionString(wanted);
        } else {
          setConnectionString(names.includes('generic') ? 'generic' : names[0] ?? '');
        }
      })
      .catch(() => {
        // Database type with no configured connection strings — clear it.
        setConnectionStrings([]);
        setConnectionString('');
        setDatabasesMeta([]);
        setDatabase('');
      });
  }, [type]);

  useEffect(() => {
    if (!type || !connectionString) {
      return;
    }
    listDatabases(type, connectionString).then(response => {
      const meta = response.databases ?? [];
      setDatabasesMeta(meta);
      const names = meta.map((db: any) => db.name);
      const wanted = deepLink.current.database;
      deepLink.current.database = null;
      if (wanted && names.includes(wanted)) {
        setDatabase(wanted);
      } else {
        setDatabase(names.filter((name: string) => name !== 'magic')[0] ?? names[0] ?? '');
      }
    }).catch(() => {
      setDatabasesMeta([]);
      setDatabase('');
    });
  }, [type, connectionString]);

  const selectedMeta = databasesMeta.find(db => db.name === database);

  return {
    types, type, setType,
    connectionStrings, connectionString, setConnectionString,
    databasesMeta, database, setDatabase,
    selectedMeta, error,
  };
}

function DatabaseSelectors({ selection }: { selection: any }) {
  return (
    <>
      <select value={selection.type} onChange={e => selection.setType(e.target.value)}>
        {selection.types.map((option: string) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <select
        value={selection.connectionString}
        onChange={e => selection.setConnectionString(e.target.value)}>
        {selection.connectionStrings.map((option: string) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <select value={selection.database} onChange={e => selection.setDatabase(e.target.value)}>
        {selection.databasesMeta.map((db: any) => (
          <option key={db.name} value={db.name}>{db.name}</option>
        ))}
      </select>
      {selection.type && selection.connectionStrings.length === 0 && (
        <span className="muted">
          No connection strings configured for {selection.type}.
        </span>
      )}
    </>
  );
}

function RoleChips(props: { roles: string[]; selected: string[]; onChange: (roles: string[]) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {props.roles.map(role => (
        <label
          key={role}
          className="chip"
          style={{
            display: 'inline-flex',
            flexDirection: 'row',
            alignItems: 'center',
            cursor: 'pointer',
          }}>
          <input
            type="checkbox"
            checked={props.selected.includes(role)}
            onChange={e => props.onChange(e.target.checked
              ? [...props.selected, role]
              : props.selected.filter(candidate => candidate !== role))} />
          {role}
        </label>
      ))}
    </div>
  );
}

const ALL_VERBS = ['post', 'get', 'put', 'delete'];

/*
 * One crudify invocation creates several endpoint files: GET always produces
 * the read + count endpoints, and the aggregate, distinct and search options
 * add aggregate+group, distinct+count-distinct and search on top of it.
 * Other verbs produce one endpoint each.
 */
function endpointsForVerb(
  verb: string,
  options: { aggregate: boolean; distinct: boolean; search: boolean }) {
  return verb !== 'get'
    ? 1
    : 2 +
      (options.aggregate ? 2 : 0) +
      (options.distinct ? 2 : 0) +
      (options.search ? 1 : 0);
}

function CrudTab() {

  const selection = useDatabaseSelection();
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [verbs, setVerbs] = useState<Set<string>>(new Set(ALL_VERBS));
  const [roles, setRoles] = useState<string[]>([]);
  const [auth, setAuth] = useState<string[]>(['root', 'admin']);
  const [authOpen, setAuthOpen] = useState(false);
  const [moduleName, setModuleName] = useState('');
  const [componentUrl, setComponentUrl] = useState('');
  const [logging, setLogging] = useState(true);
  const [cache, setCache] = useState('0');
  const [publicCache, setPublicCache] = useState(false);
  const [overwrite, setOverwrite] = useState(false);
  const [paging, setPaging] = useState(true);
  const [sorting, setSorting] = useState(true);
  const [aggregate, setAggregate] = useState(false);
  const [distinct, setDistinct] = useState(false);
  const [search, setSearch] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listRoles()
      .then(list => setRoles((list ?? []).map(role => role.name)))
      .catch(() => {});
  }, []);

  // Reset selection, details and URL overrides when the database changes.
  useEffect(() => {
    setSelectedTables(new Set());
    setExpandedTables(new Set());
    setModuleName(selection.database);
  }, [selection.database]);

  const tables = selection.selectedMeta?.tables ?? [];
  const allSelected = tables.length > 0 && selectedTables.size === tables.length;
  const singleTable = selectedTables.size === 1 ? [...selectedTables][0] : null;

  // The component URL follows the single selected table until the user edits it.
  useEffect(() => {
    setComponentUrl(singleTable ?? '');
  }, [singleTable]);

  function toggleTable(name: string) {
    const next = new Set(selectedTables);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    setSelectedTables(next);
  }

  /*
   * How many endpoint files the current selection would actually produce —
   * same rules generation uses, including skipping verbs a table can't
   * support, such as PUT and DELETE on a table without a primary key.
   */
  const plannedEndpoints = useMemo(() => {
    const options = { aggregate, distinct, search };
    let total = 0;
    for (const table of tables.filter((candidate: any) => selectedTables.has(candidate.name))) {
      for (const verb of ALL_VERBS.filter(candidate => verbs.has(candidate))) {
        const payload = buildCrudifyPayload(
          selection.type, selection.connectionString, selection.database, table, verb,
          { ...options, auth, logging, cache: Number(cache), publicCache, overwrite,
            paging, sorting, moduleName, moduleUrl: null });
        if (canGenerate(payload, verb)) {
          total += endpointsForVerb(verb, options);
        }
      }
    }
    return total;
  }, [tables, selectedTables, verbs, aggregate, distinct, search, selection.type,
      selection.connectionString, selection.database, auth, logging, cache, publicCache,
      overwrite, paging, sorting, moduleName]);

  function toggleExpanded(name: string) {
    const next = new Set(expandedTables);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    setExpandedTables(next);
  }

  function toggleVerb(verb: string) {
    const next = new Set(verbs);
    if (next.has(verb)) {
      next.delete(verb);
    } else {
      next.add(verb);
    }
    setVerbs(next);
  }

  async function generate() {
    const targets = tables.filter((table: any) => selectedTables.has(table.name));
    if (targets.length === 0 || verbs.size === 0) {
      setFeedback({ text: 'Select at least one table and one verb', isError: true });
      return;
    }
    setBusy(true);
    setFeedback(null);
    const options = {
      auth,
      logging,
      cache: Number(cache),
      publicCache,
      overwrite,
      paging,
      sorting,
      aggregate,
      distinct,
      search,
      moduleName,
      moduleUrl: singleTable ? componentUrl : null,
    };
    let loc = 0;
    let generated = 0;
    try {
      for (const table of targets) {
        for (const verb of ALL_VERBS.filter(candidate => verbs.has(candidate))) {
          const payload = buildCrudifyPayload(
            selection.type, selection.connectionString, selection.database, table, verb, options);
          if (!canGenerate(payload, verb)) {
            continue;
          }
          const response = await crudify(payload);
          loc += response.loc ?? 0;
          generated += endpointsForVerb(verb, options);
        }
      }
      setFeedback({
        text: `Generated ${generated} endpoints (${loc} lines of code) in /modules/` +
          (moduleName || selection.database) + '/',
        isError: false,
      });
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {selection.error && (
        <div className="error-box" style={{ marginBottom: 12 }}>
          {selection.error}
        </div>
      )}
      <div className="toolbar">
        <DatabaseSelectors selection={selection} />
      </div>
      {!selection.database ? (
        <div className="info-box">
          Select a database with tables to generate a CRUD backend.
        </div>
      ) : (
      <div className="editor-split" style={{ flex: 'unset', alignItems: 'flex-start' }}>
        <div className="card" style={{ padding: 0, overflow: 'auto', maxWidth: 460 }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => setSelectedTables(allSelected
                      ? new Set()
                      : new Set(tables.map((table: any) => table.name)))} />
                </th>
                <th>Table</th>
                <th style={{ width: 130 }}>
                  {selectedTables.size} of {tables.length} selected
                </th>
              </tr>
            </thead>
            <tbody>
              {tables.map((table: any) => (
                <Fragment key={table.name}>
                  <tr
                    className="clickable"
                    title="Click to show columns"
                    onClick={() => toggleExpanded(table.name)}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedTables.has(table.name)}
                        onChange={() => toggleTable(table.name)}
                        onClick={e => e.stopPropagation()} />
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span className="tree-chevron">
                          <ChevronIcon open={expandedTables.has(table.name)} />
                        </span>
                        <strong>{table.name}</strong>
                      </span>
                    </td>
                    <td>{table.columns?.length ?? 0} columns</td>
                  </tr>
                  {expandedTables.has(table.name) && (
                    <tr>
                      <td colSpan={3} style={{ padding: '4px 14px 12px 46px' }}>
                        {(table.columns ?? []).map((column: any) => (
                          <div
                            key={column.name}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '3px 0',
                              fontSize: 13,
                            }}>
                            <span className="mono">{column.name}</span>
                            <span className="muted">{column.db}</span>
                            {column.primary && <span className="badge badge-get">PK</span>}
                            {column.automatic && <span className="badge badge-debug">auto</span>}
                            {column.foreign_key && (
                              <span className="badge badge-info">
                                FK → {column.foreign_key.foreign_table}.
                                {column.foreign_key.foreign_column}
                              </span>
                            )}
                            {column.nullable && <span className="muted">nullable</span>}
                          </div>
                        ))}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <div className="form-grid" style={{ gap: 18 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>URL</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Module…"
                  title="Module segment of the URL — defaults to the database name"
                  value={moduleName}
                  onChange={e => setModuleName(e.target.value)}
                  style={{ width: 160 }} />
                <span className="muted">/</span>
                <input
                  type="text"
                  placeholder="table name"
                  title={singleTable
                    ? 'Component segment of the URL — defaults to the table name'
                    : 'Editable when exactly one table is selected — otherwise each table uses its own name'}
                  value={singleTable ? componentUrl : ''}
                  disabled={!singleTable}
                  onChange={e => setComponentUrl(e.target.value)}
                  style={{ width: 160 }} />
                <span className="muted mono" style={{ fontSize: 12 }}>
                  → /magic/{moduleName || selection.database}/
                  {singleTable ? (componentUrl || singleTable) : '<table>'}
                </span>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>HTTP verbs</div>
              <div style={{ display: 'flex', gap: 14 }}>
                {ALL_VERBS.map(verb => (
                  <label
                    key={verb}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={verbs.has(verb)}
                      onChange={() => toggleVerb(verb)} />
                    {verb.toUpperCase()}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Authorisation</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span>
                  {auth.length > 0 ? auth.join(', ') : <em className="muted">public — no roles</em>}
                </span>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => setAuthOpen(!authOpen)}>
                  {authOpen ? 'Done' : 'Edit'}
                </button>
              </div>
              {authOpen && (
                <div style={{ marginTop: 8 }}>
                  <RoleChips roles={roles} selected={auth} onChange={setAuth} />
                </div>
              )}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                Endpoints (GET)
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(150px, max-content))',
                gap: '6px 20px',
              }}>
                <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={paging}
                    onChange={e => setPaging(e.target.checked)} />
                  Paging
                </label>
                <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={sorting}
                    onChange={e => setSorting(e.target.checked)} />
                  Sorting
                </label>
                <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={aggregate}
                    onChange={e => setAggregate(e.target.checked)} />
                  Aggregate endpoint
                </label>
                <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={distinct}
                    onChange={e => setDistinct(e.target.checked)} />
                  Distinct endpoint
                </label>
                <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={search}
                    onChange={e => setSearch(e.target.checked)} />
                  Search endpoint
                </label>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Generation</div>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={logging}
                    onChange={e => setLogging(e.target.checked)} />
                  Log create/update/delete
                </label>
                <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={overwrite}
                    onChange={e => setOverwrite(e.target.checked)} />
                  Overwrite existing files
                </label>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                GET cache (seconds, 0 = off)
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <input
                  type="number"
                  value={cache}
                  onChange={e => setCache(e.target.value)}
                  style={{ width: 120 }} />
                <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={publicCache}
                    onChange={e => setPublicCache(e.target.checked)} />
                  Public cache
                </label>
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              borderTop: '1px solid var(--border)',
              paddingTop: 14,
            }}>
              <span className="muted">
                {selectedTables.size === 0
                  ? 'Select at least one table.'
                  : verbs.size === 0
                    ? 'Select at least one HTTP verb.'
                    : `${plannedEndpoints} endpoint${plannedEndpoints === 1 ? '' : 's'} across ` +
                      `${selectedTables.size} table${selectedTables.size > 1 ? 's' : ''} ` +
                      `→ /magic/${moduleName || selection.database}/`}
              </span>
              <span style={{ flex: 1 }} />
              <button
                className="btn"
                onClick={generate}
                disabled={busy || selectedTables.size === 0 || verbs.size === 0}>
                {busy ? 'Generating…' : '⚙ Generate backend'}
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </>
  );
}

function SqlEndpointTab() {

  const selection = useDatabaseSelection();
  const [roles, setRoles] = useState<string[]>([]);
  const [auth, setAuth] = useState<string[]>(['root', 'admin']);
  const [verb, setVerb] = useState('get');
  const [moduleName, setModuleName] = useState('');
  const [endpointName, setEndpointName] = useState('custom-sql');
  const [args, setArgs] = useState<{ name: string; type: string }[]>([]);
  const [sql, setSql] = useState('');
  const [overwrite, setOverwrite] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listRoles()
      .then(list => setRoles((list ?? []).map(role => role.name)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selection.database) {
      setModuleName(selection.database);
    }
  }, [selection.database]);

  const hintTables = useMemo(() => {
    const tables: Record<string, string[]> = {};
    for (const table of selection.selectedMeta?.tables ?? []) {
      tables[table.name] = (table.columns ?? []).map((column: any) => column.name);
    }
    return tables;
  }, [selection.selectedMeta]);

  async function generate() {
    if (!sql.trim() || !moduleName || !endpointName) {
      setFeedback({ text: 'Provide SQL, a module name, and an endpoint name', isError: true });
      return;
    }
    setBusy(true);
    try {
      await customSqlEndpoint({
        databaseType: selection.type,
        database: selection.database,
        authorization: auth.join(','),
        moduleName,
        endpointName,
        verb,
        sql,
        arguments: args
          .filter(argument => argument.name)
          .map(argument => argument.name + ':' + argument.type)
          .join('\n'),
        overwrite,
      });
      setFeedback({
        text: 'Endpoint magic/' + moduleName + '/' + endpointName + ' created',
        isError: false,
      });
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {selection.error && (
        <div className="error-box" style={{ marginBottom: 12 }}>
          {selection.error}
        </div>
      )}
      <div className="toolbar">
        <DatabaseSelectors selection={selection} />
        <select value={verb} onChange={e => setVerb(e.target.value)}>
          {['get', 'post', 'put', 'delete', 'patch'].map(option => (
            <option key={option} value={option}>{option.toUpperCase()}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Module name…"
          value={moduleName}
          onChange={e => setModuleName(e.target.value)}
          style={{ width: 150 }} />
        <input
          type="text"
          placeholder="Endpoint name…"
          value={endpointName}
          onChange={e => setEndpointName(e.target.value)}
          style={{ width: 150 }} />
        <span className="spacer" />
        <button className="btn" onClick={generate} disabled={busy || !selection.database}>
          {busy ? 'Generating…' : '⚙ Generate endpoint'}
        </button>
      </div>
      <div className="toolbar">
        <div style={{ fontWeight: 600, fontSize: 13 }}>Authorisation:</div>
        <RoleChips roles={roles} selected={auth} onChange={setAuth} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={overwrite}
            onChange={e => setOverwrite(e.target.checked)} />
          Overwrite
        </label>
      </div>
      <div className="toolbar">
        <div style={{ fontWeight: 600, fontSize: 13 }}>Arguments:</div>
        {args.map((argument, index) => (
          <span key={index} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="name"
              value={argument.name}
              onChange={e => setArgs(args.map((candidate, i) =>
                i === index ? { ...candidate, name: e.target.value } : candidate))}
              style={{ width: 120 }} />
            <select
              value={argument.type}
              onChange={e => setArgs(args.map((candidate, i) =>
                i === index ? { ...candidate, type: e.target.value } : candidate))}>
              {['string', 'long', 'int', 'decimal', 'double', 'bool', 'date'].map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <button
              className="btn btn-danger btn-small"
              onClick={() => setArgs(args.filter((_, i) => i !== index))}>
              ✕
            </button>
          </span>
        ))}
        <button
          className="btn btn-secondary btn-small"
          onClick={() => setArgs([...args, { name: '', type: 'string' }])}>
          + Argument
        </button>
        <span className="muted" style={{ fontSize: 12 }}>
          Reference arguments in SQL as @name
        </span>
      </div>
      <div style={{ height: 280, display: 'flex', flexDirection: 'column' }}>
        <CodeEditor value={sql} onChange={setSql} mode="text/x-sql" hintTables={hintTables} />
      </div>
    </>
  );
}
