import { showToast } from '../lib/toast';
import Select from '../components/Select';
import { Link } from 'react-router-dom';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import ProgressDialog, { ProgressLine } from '../components/ProgressDialog';
import AiWaiter from '../components/AiWaiter';
import { ChevronIcon } from '../components/Icons';
import CodeEditor from '../components/CodeEditor';
import AiPrompt from '../components/AiPrompt';
import RoleChips from '../components/RoleChips';
import Tabs from '../components/Tabs';
import ImportApiTab from '../components/ImportApiTab';
import {
  DatabaseSelection,
  buildSqlAiContext,
  sqlHintTables,
  useDatabaseSelection,
  useSqlSnippets,
} from '../lib/sql';
import {
  crudify,
  customSqlEndpoint,
  listRoles,
  loadFile,
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

export default function Generator() {

  /*
   * ?tab= — which generator to open on, so the Dashboard can link straight to
   * any one of the three rather than always landing on CRUD.
   */
  const [tab, setTab] = useState(
    () => new URLSearchParams(window.location.search).get('tab') ?? 'crud');
  /*
   * ?guided=1 — the Dashboard's "API from your data" flow: the same CRUD
   * generator wearing a step header, with every table preselected and a
   * done panel instead of a toast. Kept in the URL so a refresh stays in
   * the guided flow.
   *
   * The guided flow is a mode of the CRUD tab, not a separate page, so the
   * tabs stay on screen throughout — somebody who arrives here to wrap a
   * database and then realises they want to import an API, or wrap their own
   * SQL, can simply switch, rather than being stuck in a flow with no visible
   * way out. Switching away leaves the wizard chrome behind with the tab it
   * belongs to.
   */
  const [guided] = useState(
    () => new URLSearchParams(window.location.search).get('guided') === '1');
  const guiding = guided && tab === 'crud';
  return (
    <>
      <div className="page-header">
        <h1>{guiding ? 'API Wizard' : 'Endpoint Generator'}</h1>
        <p>
          {guiding
            ? 'Turn a database into secured REST endpoints'
            : 'Generate a CRUD backend from a database, publish your own SQL as an '
              + 'endpoint, or wrap a third-party API from its OpenAPI specification'}
        </p>
      </div>
      <Tabs
        tabs={[
          { id: 'crud', label: 'CRUD backend' },
          { id: 'sql', label: 'SQL endpoint' },
          { id: 'import', label: 'Import API' },
        ]}
        active={tab}
        onChange={setTab} />
      {tab === 'crud' && <CrudTab guided={guiding} />}
      {tab === 'sql' && <SqlEndpointTab />}
      {tab === 'import' && <ImportApiTab />}
    </>
  );
}

function DatabaseSelectors({ selection }: { selection: DatabaseSelection }) {
  return (
    <>
      <Select value={selection.type} onChange={value => selection.setType(value)}>
        {selection.types.map((option: string) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </Select>
      <Select
        value={selection.connectionString}
        onChange={value => selection.setConnectionString(value)}>
        {selection.connectionStrings.map((option: string) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </Select>
      <Select value={selection.database} onChange={value => selection.setDatabase(value)}>
        {selection.databasesMeta.map((db: any) => (
          <option key={db.name} value={db.name}>{db.name}</option>
        ))}
      </Select>
      {selection.loading && <div className="spinner" />}
      {!selection.loading && selection.type && selection.connectionStrings.length === 0 && (
        <span className="muted">
          No connection strings configured for {selection.type}.
        </span>
      )}
    </>
  );
}

const ALL_VERBS = ['post', 'get', 'put', 'delete'];

// The guided flow's progress header: choose data, generate, done.
function WizardSteps({ step }: { step: number }) {
  return (
    <div className="wizard-steps">
      {['Choose data', 'Generate', 'Done'].map((label, index) => (
        <Fragment key={label}>
          {index > 0 && <span className="wizard-arrow">→</span>}
          <span className={'step' + (step >= index + 1 ? ' active' : '')}>
            {index + 1} · {label}
          </span>
        </Fragment>
      ))}
    </div>
  );
}

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

function CrudTab(props: { guided: boolean }) {

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
  // The guided flow's third step: what generation produced, and where it lives.
  const [done, setDone] = useState<{ generated: number; loc: number; module: string } | null>(null);
  // The generation terminal — null while closed, one line per table/verb while open.
  const [feed, setFeed] = useState<ProgressLine[] | null>(null);
  const [progressText, setProgressText] = useState('');
  // Checked between crudify calls — Cancel keeps what was already generated.
  const cancelRequested = useRef(false);
  // Guided mode's done panel, revealed once the finished terminal is closed.
  const pendingDone = useRef<{ generated: number; loc: number; module: string } | null>(null);

  useEffect(() => {
    listRoles()
      .then(list => setRoles((list ?? []).map(role => role.name)))
      .catch(() => {});
  }, []);

  /*
   * Reset selection, details and URL overrides when the database changes.
   * The guided flow preselects every table instead — its user's answer to
   * "which tables?" is almost always "all of them".
   */
  useEffect(() => {
    setSelectedTables(props.guided
      ? new Set<string>((selection.selectedMeta?.tables ?? []).map((table: any) => table.name))
      : new Set<string>());
    setExpandedTables(new Set());
    setModuleName(selection.database);
  }, [selection.database, selection.selectedMeta, props.guided]);

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

  // Closing a running terminal means "stop" — the loop notices between calls.
  function closeFeed() {
    if (busy) {
      cancelRequested.current = true;
      return;
    }
    setFeed(null);
    if (pendingDone.current) {
      setDone(pendingDone.current);
      pendingDone.current = null;
    }
  }

  async function generate() {
    const targets = tables.filter((table: any) => selectedTables.has(table.name));
    const active = ALL_VERBS.filter(candidate => verbs.has(candidate));
    if (targets.length === 0 || active.length === 0) {
      showToast('Select at least one table and one verb', true);
      return;
    }
    setBusy(true);
    cancelRequested.current = false;
    pendingDone.current = null;
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
    /*
     * Every unit of progress is a resolved promise in this very loop, so the
     * terminal is fed directly — no socket channel, nothing to fake.
     */
    const lines: ProgressLine[] = [];
    const push = (type: string, message: string) => {
      lines.push({ type, message });
      setFeed([...lines]);
    };
    setFeed([]);
    const total = targets.length * active.length;
    const started = Date.now();
    let step = 0;
    let loc = 0;
    let generated = 0;
    let failed = false;
    outer:
    for (const table of targets) {
      for (const verb of active) {
        if (cancelRequested.current) {
          push('warning',
            'Cancelled — the ' + generated + ' endpoints generated so far are kept.');
          break outer;
        }
        step++;
        setProgressText(step + ' of ' + total);
        const payload = buildCrudifyPayload(
          selection.type, selection.connectionString, selection.database, table, verb, options);
        if (!canGenerate(payload, verb)) {
          // Surfacing what used to be silently skipped — the answer to "why
          // did I get fewer endpoints than tables × verbs?".
          push('warning', verb.toUpperCase() + ' ' + table.name + ' — skipped, ' +
            (payload.args.primary.length === 0 && (verb === 'put' || verb === 'delete')
              ? 'no primary key'
              : 'no columns for this verb'));
          continue;
        }
        try {
          const response = await crudify(payload);
          const count = endpointsForVerb(verb, options);
          loc += response.loc ?? 0;
          generated += count;
          push('information', verb.toUpperCase() + ' ' + table.name + ' — ' +
            count + (count === 1 ? ' endpoint, ' : ' endpoints, ') +
            (response.loc ?? 0) + ' lines');
        } catch (err: any) {
          /*
           * One crudify call per verb per table — a failure mid-loop must
           * say WHERE it stopped, and how much had already been generated,
           * or there's no telling which endpoints exist.
           */
          failed = true;
          push('error', verb.toUpperCase() + ' ' + table.name + ' — ' + err.message);
          push('warning', generated + ' endpoints were generated before the failure.');
          break outer;
        }
      }
    }
    if (!failed && !cancelRequested.current) {
      const elapsed = ((Date.now() - started) / 1000).toFixed(1);
      push('success', 'Done — ' + generated + ' endpoints, ' + loc +
        ' lines of Hyperlambda, in ' + elapsed + 's → /magic/' +
        (moduleName || selection.database) + '/');
      if (props.guided) {
        pendingDone.current = { generated, loc, module: moduleName || selection.database };
      }
    }
    setBusy(false);
  }

  // Done panel showing after generation — the guided flow's final step.
  if (props.guided && done) {
    return (
      <>
        <WizardSteps step={3} />
        <div className="card" style={{ maxWidth: 640 }}>
          <h2 style={{ marginTop: 0 }}>Your API is live</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            {done.generated} endpoints ({done.loc} lines of Hyperlambda) were
            generated under <span className="mono">/magic/{done.module}/</span>,
            secured for {auth.length > 0
              ? <strong>{auth.join(', ')}</strong>
              : <em>everyone — no roles required</em>}.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link className="btn" to={'/endpoints?filter=' + encodeURIComponent(done.module)}>
              Try your endpoints
            </Link>
            <Link className="btn btn-secondary" to="/user-roles-management">
              Manage users and roles
            </Link>
            <button className="btn btn-secondary" onClick={() => setDone(null)}>
              Generate more
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {props.guided && (
        <WizardSteps step={selectedTables.size > 0 ? 2 : 1} />
      )}
      {selection.error && (
        <div className="error-box" style={{ marginBottom: 12 }}>
          {selection.error}
        </div>
      )}
      {/*
        * Guided visitors without a database of their own have nothing useful
        * to generate from — send them to create one first, without blocking
        * the screen for those who want Magic's internal database anyway.
        */}
      {props.guided && !selection.loading &&
        !selection.databasesMeta.some((db: any) => db.name !== 'magic') && (
        <div className="info-box" style={{ marginBottom: 12 }}>
          No database of your own yet — <Link to="/databases">create or
          connect one</Link> first, then come back here.
        </div>
      )}
      <div className="toolbar">
        <DatabaseSelectors selection={selection} />
      </div>
      {selection.loading ? (
        <div className="spinner-panel">
          <div className="spinner" />
          <span className="muted">Loading databases…</span>
        </div>
      ) : !selection.database ? (
        <div className="info-box">
          Select a database with tables to generate a CRUD backend.
        </div>
      ) : (
      <div className="editor-split" style={{ flex: 'unset', alignItems: 'flex-start' }}>
        <div className="card gen-table-card" style={{ padding: 0, overflow: 'auto', maxWidth: 460 }}>
          <table className="compact-table">
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
                      {/*
                        * 80px left padding lines the column names up directly
                        * under the table name above: 40px checkbox column +
                        * cell padding + the expand chevron and its gap.
                        */}
                      <td colSpan={3} style={{ padding: '4px 14px 12px 80px' }}>
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
                  <RoleChips
                    roles={roles}
                    selected={auth}
                    onToggle={(role, selected) => setAuth(selected
                      ? [...auth, role]
                      : auth.filter(candidate => candidate !== role))} />
                </div>
              )}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                Endpoints (GET)
              </div>
              <div style={{
                display: 'grid',
                // auto-fit so it collapses to fewer columns on a phone instead
                // of forcing a fixed 3-wide minimum that overflows.
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
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
                  Aggregate
                </label>
                <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={distinct}
                    onChange={e => setDistinct(e.target.checked)} />
                  Distinct
                </label>
                <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={search}
                    onChange={e => setSearch(e.target.checked)} />
                  Search
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
      {feed !== null && (
        <ProgressDialog
          title="Generating your backend"
          label={'/modules/' + (moduleName || selection.database) + '/'}
          lines={feed}
          progress={busy ? progressText : undefined}
          actions={busy && (
            <button
              className="btn btn-secondary"
              onClick={() => { cancelRequested.current = true; }}>
              Cancel
            </button>
          )}
          onClose={closeFeed} />
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
  // The same saved-snippets folder SQL Studio reads and writes.
  const { snippets } = useSqlSnippets(selection.type);

  useEffect(() => {
    listRoles()
      .then(list => setRoles((list ?? []).map(role => role.name)))
      .catch(() => {});
  }, []);

  async function openSnippet(filename: string) {
    if (!filename) {
      return;
    }
    try {
      setSql(await loadFile(filename));
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    }
  }

  function importSqlFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => setSql(String(reader.result ?? ''));
    reader.readAsText(file);
  }

  useEffect(() => {
    if (selection.database) {
      setModuleName(selection.database);
    }
  }, [selection.database]);

  const hintTables = useMemo(
    () => sqlHintTables(selection.selectedMeta), [selection.selectedMeta]);

  function createAiContext() {
    return buildSqlAiContext({
      type: selection.type,
      connectionString: selection.connectionString,
      database: selection.database,
      tables: selection.selectedMeta?.tables ?? [],
      sql,
      args,
    });
  }

  async function generate() {
    if (!sql.trim() || !moduleName || !endpointName) {
      showToast('Provide SQL, a module name, and an endpoint name', true);
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
      showToast('Endpoint magic/' + moduleName + '/' + endpointName + ' created');
    } catch (err: any) {
      showToast(err.message, true, err.logId);
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
        <Select value={verb} onChange={value => setVerb(value)}>
          {['get', 'post', 'put', 'delete', 'patch'].map(option => (
            <option key={option} value={option}>{option.toUpperCase()}</option>
          ))}
        </Select>
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
        <RoleChips
          roles={roles}
          selected={auth}
          onToggle={(role, selected) => setAuth(selected
            ? [...auth, role]
            : auth.filter(candidate => candidate !== role))} />
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
            <Select
              value={argument.type}
              onChange={value => setArgs(args.map((candidate, i) =>
                i === index ? { ...candidate, type: value } : candidate))}>
              {['string', 'long', 'int', 'decimal', 'double', 'bool', 'date'].map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Select>
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
        <span className="spacer" />
        <Select value="" onChange={value => openSnippet(value)}>
          <option value="">Load snippet…</option>
          {snippets.map(snippet => (
            <option key={snippet} value={snippet}>
              {snippet.substring(snippet.lastIndexOf('/') + 1)}
            </option>
          ))}
        </Select>
        <label className="btn btn-secondary btn-small" style={{ cursor: 'pointer' }}>
          Import .sql
          <input
            type="file"
            accept=".sql"
            style={{ display: 'none' }}
            onChange={e => {
              if (e.target.files?.[0]) {
                importSqlFile(e.target.files[0]);
                e.target.value = '';
              }
            }} />
        </label>
      </div>
      <div style={{ height: 280, display: 'flex', flexDirection: 'column' }}>
        <CodeEditor value={sql} onChange={setSql} mode="text/x-sql" hintTables={hintTables} />
      </div>
      <AiPrompt
        fileType="sql"
        getContext={createAiContext}
        session="generator-sql.editor"
        onResult={setSql}
        onError={message => showToast(message, true)}
        style={{ marginTop: 8 }} />
      {busy && <AiWaiter />}
    </>
  );
}
