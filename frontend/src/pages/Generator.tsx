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
  generateSandboxEndpoint,
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
    verbose: boolean;
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
    verbose: options.verbose,
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
              + 'endpoint, expose a sandboxed Hyperlambda endpoint, or wrap a '
              + 'third-party API from its OpenAPI specification'}
        </p>
      </div>
      <Tabs
        tabs={[
          { id: 'crud', label: 'CRUD backend' },
          { id: 'sql', label: 'SQL endpoint' },
          { id: 'sandbox', label: 'Sandbox API' },
          { id: 'import', label: 'Import API' },
        ]}
        active={tab}
        onChange={setTab} />
      {tab === 'crud' && <CrudTab guided={guiding} />}
      {tab === 'sql' && <SqlEndpointTab />}
      {tab === 'sandbox' && <SandboxTab />}
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
  const [verbose, setVerbose] = useState(false);
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
            paging, sorting, verbose, moduleName, moduleUrl: null });
        if (canGenerate(payload, verb)) {
          total += endpointsForVerb(verb, options);
        }
      }
    }
    return total;
  }, [tables, selectedTables, verbs, aggregate, distinct, search, selection.type,
      selection.connectionString, selection.database, auth, logging, cache, publicCache,
      overwrite, paging, sorting, verbose, moduleName]);

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
      verbose,
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
                {/*
                  * Verbose adds the less common comparison operators (neq, mt, lt,
                  * mteq, lteq) as filtering arguments, on top of the eq and like
                  * arguments you always get.
                  */}
                <label
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                  title="Add neq, mt, lt, mteq and lteq filtering arguments for every column">
                  <input
                    type="checkbox"
                    checked={verbose}
                    onChange={e => setVerbose(e.target.checked)} />
                  Verbose
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
  const [authOpen, setAuthOpen] = useState(false);
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
      {/*
        * Authorisation reads the way it does on the CRUD tab: the roles as a
        * summary, and the chips only once you ask to change them. The chips
        * take a full flex basis so they break onto their own line rather than
        * pushing the rest of the toolbar along.
        */}
      <div className="toolbar">
        <div style={{ fontWeight: 600, fontSize: 13 }}>Authorisation:</div>
        <span>
          {auth.length > 0 ? auth.join(', ') : <em className="muted">public — no roles</em>}
        </span>
        <button
          className="btn btn-secondary btn-small"
          onClick={() => setAuthOpen(!authOpen)}>
          {authOpen ? 'Done' : 'Edit'}
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={overwrite}
            onChange={e => setOverwrite(e.target.checked)} />
          Overwrite
        </label>
        {authOpen && (
          <div style={{ flexBasis: '100%' }}>
            <RoleChips
              roles={roles}
              selected={auth}
              onToggle={(role, selected) => setAuth(selected
                ? [...auth, role]
                : auth.filter(candidate => candidate !== role))} />
          </div>
        )}
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


/*
 * The Sandbox API generator: one endpoint that takes caller-supplied Hyperlambda
 * and/or a natural-language instruction, verifies every referenced function exists,
 * and runs it inside a whitelist whose vocabulary and rate limit come from the
 * caller's roles.
 *
 * The vocabulary is layered: an "everybody" base rule grants the language every
 * caller gets, and each role rule adds slots on top of it — so a CEO role can reach
 * a database an HR role cannot, while both keep the base. Rate limits are matched
 * most-specific-first, with the base as the fallback; root is never throttled or
 * timed out.
 */
/*
 * The base vocabulary mirrors the public Natural Language API's whitelist, minus the
 * database and HTTP slots — those are handed out per role instead. It is only a
 * starting point; the creator edits it freely.
 */
const DEFAULT_BASE_SLOTS = [
  'add', 'and', 'apply', 'case', 'compose', 'convert', 'csv2lambda', 'default',
  'else', 'else-if', 'eq', 'exists', 'floatArray2bytes', 'for-each', 'format',
  'get-count', 'get-first-value', 'get-name', 'get-nodes', 'get-value', 'html-decode',
  'html2lambda', 'html2markdown', 'html2pdf', 'hyper2lambda', 'if', 'include',
  'insert-after', 'insert-before', 'int2words', 'json2lambda', 'json2yaml',
  'lambda2csv', 'lambda2html', 'lambda2hyper', 'lambda2json', 'lambda2xml',
  'lambda2yaml', 'lt', 'lte', 'markdown2html', 'mt', 'mte', 'neq', 'not',
  'not-exists', 'not-null', 'null', 'or', 'reference', 'remove-nodes',
  'return', 'return-nodes', 'return-value', 'semaphore', 'set-name', 'set-value',
  'set-x', 'sleep', 'sort', 'switch', 'throw', 'time', 'try', 'type', 'types',
  'unwrap', 'version', 'vocabulary', 'while', 'xml2lambda', 'yaml2json',
  'yaml2lambda', 'yield',
  'auth.ticket.get', 'auth.ticket.in-role', 'auth.ticket.verify', 'auth.token.verify',
  'cache.count',
  'crypto.aes.decrypt', 'crypto.aes.encrypt', 'crypto.decrypt', 'crypto.encrypt',
  'crypto.fingerprint', 'crypto.get-key', 'crypto.hash', 'crypto.hash.md5',
  'crypto.hash.sha1', 'crypto.hash.sha256', 'crypto.hash.sha384', 'crypto.hash.sha512',
  'crypto.password.hash', 'crypto.password.verify', 'crypto.random', 'crypto.random.int',
  'crypto.rsa.create-key', 'crypto.rsa.decrypt', 'crypto.rsa.encrypt', 'crypto.rsa.sign',
  'crypto.rsa.verify', 'crypto.seed', 'crypto.sign', 'crypto.verify',
  'date.format', 'date.from-unix', 'date.max', 'date.min', 'date.now', 'date.unix',
  'guid.new',
  'math.abs', 'math.add', 'math.ceil', 'math.cos', 'math.decrement', 'math.divide',
  'math.dot', 'math.floor', 'math.increment', 'math.max', 'math.min', 'math.modulo',
  'math.multiply', 'math.random', 'math.round', 'math.sin', 'math.sqrt', 'math.subtract',
  'mime.create', 'mime.parse', 'openai.tokenize',
  'request.cookies.get', 'request.cookies.list', 'request.headers.get',
  'request.headers.list', 'request.host', 'request.ip', 'request.scheme',
  'request.url', 'request.verb',
  'response.cookies.set', 'response.headers.set', 'response.status.set',
  'slots.vocabulary',
  'strings.builder', 'strings.builder.append', 'strings.byte-count', 'strings.capitalize',
  'strings.concat', 'strings.contains', 'strings.ends-with', 'strings.html-decode',
  'strings.html-encode', 'strings.join', 'strings.length', 'strings.matches',
  'strings.mixin', 'strings.regex-replace', 'strings.replace', 'strings.replace-not-of',
  'strings.split', 'strings.starts-with', 'strings.substring', 'strings.to-lower',
  'strings.to-upper', 'strings.trim', 'strings.trim-end', 'strings.trim-start',
  'strings.url-decode', 'strings.url-encode',
  'time.format', 'time.total-milliseconds',
  'validators.date', 'validators.default', 'validators.email', 'validators.enum',
  'validators.integer', 'validators.mandatory', 'validators.recaptcha',
  'validators.regex', 'validators.string', 'validators.url',
].join('\n');

interface RoleRule {
  role: string;
  // Optional per-role overrides — blank inherits from a later rule or the base.
  limit: string;
  window: string;
  timeout: string;
  slots: string;
}

function linesToSlots(text: string) {
  return text.split('\n').map(line => line.trim()).filter(Boolean);
}

/*
 * A role rule is "incomplete" when it has slots but no role: a blank role never matches
 * at runtime, so those slots would be dropped silently. Such a rule blocks generation
 * until it is given a role or removed, so no granted capability is lost quietly.
 * Limit/window/timeout alone do not count — a new rule is seeded with the base values,
 * and those are harmless to drop because they equal the base.
 */
function ruleIsIncomplete(rule: RoleRule) {
  return !rule.role.trim() && !!rule.slots.trim();
}

/*
 * Appends slot lines to an editor's text, skipping any already present, so a wizard
 * never duplicates a line and never disturbs what is already there.
 */
function mergeSlots(existing: string, additions: string[]) {
  const have = new Set(existing.split('\n').map(line => line.trim()).filter(Boolean));
  const fresh = additions.filter(line => !have.has(line));
  if (fresh.length === 0) {
    return existing;
  }
  const trimmed = existing.replace(/\s+$/, '');
  return (trimmed ? trimmed + '\n' : '') + fresh.join('\n') + '\n';
}

/*
 * Wizard that turns "let this role reach database X with these verbs" into the slot
 * lines that grant it: [data.connect:X] pinned to the one database, plus a [data.*]
 * per ticked operation. Raw SQL adds [data.select]/[data.scalar]. Reuses the shared
 * database-selection hook so the dropdowns match the rest of the Generator.
 */
function DbAccessWizard(props: { onAdd: (lines: string[]) => void; onCancel: () => void }) {

  const selection = useDatabaseSelection();
  const [read, setRead] = useState(true);
  const [create, setCreate] = useState(false);
  const [update, setUpdate] = useState(false);
  const [remove, setRemove] = useState(false);
  const [rawSql, setRawSql] = useState(false);

  function add() {
    if (!selection.database) {
      showToast('Choose a database first', true);
      return;
    }
    const lines = ['data.connect:' + selection.database];
    if (read) {
      lines.push('data.read');
    }
    if (create) {
      lines.push('data.create');
    }
    if (update) {
      lines.push('data.update');
    }
    if (remove) {
      lines.push('data.delete');
    }
    if (rawSql) {
      lines.push('data.select');
      lines.push('data.scalar');
    }
    props.onAdd(lines);
  }

  return (
    <div className="card" style={{ padding: 10, marginBottom: 6 }}>
      <div className="toolbar" style={{ marginBottom: 6 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>Database access</div>
        {selection.types.length > 1 && (
          <Select value={selection.type} onChange={value => selection.setType(value)}>
            {selection.types.map(type => <option key={type} value={type}>{type}</option>)}
          </Select>
        )}
        {selection.connectionStrings.length > 1 && (
          <Select value={selection.connectionString} onChange={value => selection.setConnectionString(value)}>
            {selection.connectionStrings.map(cs => <option key={cs} value={cs}>{cs}</option>)}
          </Select>
        )}
        <Select value={selection.database} onChange={value => selection.setDatabase(value)}>
          <option value="">database…</option>
          {selection.databasesMeta.map((db: any) => <option key={db.name} value={db.name}>{db.name}</option>)}
        </Select>
        {selection.loading && <span className="muted" style={{ fontSize: 12 }}>loading…</span>}
      </div>
      <div className="toolbar">
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={read} onChange={e => setRead(e.target.checked)} />Read
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={create} onChange={e => setCreate(e.target.checked)} />Create
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={update} onChange={e => setUpdate(e.target.checked)} />Update
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={remove} onChange={e => setRemove(e.target.checked)} />Delete
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }} title="Adds data.select and data.scalar — raw SQL against this database">
          <input type="checkbox" checked={rawSql} onChange={e => setRawSql(e.target.checked)} />Raw&nbsp;SQL
        </label>
        <span className="spacer" />
        <button className="btn btn-small" onClick={add} disabled={!selection.database}>Add</button>
        <button className="btn btn-secondary btn-small" onClick={props.onCancel}>Close</button>
      </div>
      <span className="muted" style={{ fontSize: 12 }}>
        Grants <span className="mono">data.connect:{selection.database || '…'}</span> pinned to
        this one database, plus a slot per ticked operation.
      </span>
    </div>
  );
}

/*
 * Wizard granting outbound HTTP. Verb-level only - the whitelist cannot pin a URL, so a
 * granted verb reaches any address; the note says so.
 */
function HttpAccessWizard(props: { onAdd: (lines: string[]) => void; onCancel: () => void }) {

  const [verbs, setVerbs] = useState<Record<string, boolean>>({ get: true, post: false, put: false, patch: false, delete: false });

  function toggle(verb: string, on: boolean) {
    setVerbs({ ...verbs, [verb]: on });
  }

  function add() {
    const lines = Object.keys(verbs).filter(verb => verbs[verb]).map(verb => 'http.' + verb);
    if (lines.length === 0) {
      showToast('Tick at least one verb', true);
      return;
    }
    props.onAdd(lines);
  }

  return (
    <div className="card" style={{ padding: 10, marginBottom: 6 }}>
      <div className="toolbar" style={{ marginBottom: 6 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>Outbound HTTP</div>
        {['get', 'post', 'put', 'patch', 'delete'].map(verb => (
          <label key={verb} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="checkbox" checked={verbs[verb]} onChange={e => toggle(verb, e.target.checked)} />
            {verb.toUpperCase()}
          </label>
        ))}
        <span className="spacer" />
        <button className="btn btn-small" onClick={add}>Add</button>
        <button className="btn btn-secondary btn-small" onClick={props.onCancel}>Close</button>
      </div>
      <span className="muted" style={{ fontSize: 12 }}>
        A granted verb can call any URL.
      </span>
    </div>
  );
}

/*
 * Wizard granting file-system access in Read / Write / Delete tiers. File and folder
 * slots take their path as the slot value, so an optional [path] pins every granted
 * operation to that exact path; blank grants the operation for any path.
 */
const FILE_SLOTS: Record<string, string[]> = {
  read: [
    'io.file.load', 'io.file.load.binary', 'io.file.exists', 'io.file.list',
    'io.file.list-recursively', 'io.file.search', 'io.folder.exists', 'io.folder.list',
    'io.folder.list-recursively', 'io.path.get-folder',
  ],
  write: [
    'io.file.save', 'io.file.save.binary', 'io.file.copy', 'io.file.move', 'io.file.patch',
    'io.file.unzip', 'io.folder.create', 'io.folder.copy', 'io.folder.move',
  ],
  delete: ['io.file.delete', 'io.folder.delete'],
};

function FilesAccessWizard(props: { onAdd: (lines: string[]) => void; onCancel: () => void }) {

  const [path, setPath] = useState('');
  const [read, setRead] = useState(true);
  const [write, setWrite] = useState(false);
  const [remove, setRemove] = useState(false);

  function add() {
    const slots: string[] = [];
    if (read) {
      slots.push(...FILE_SLOTS.read);
    }
    if (write) {
      slots.push(...FILE_SLOTS.write);
    }
    if (remove) {
      slots.push(...FILE_SLOTS.delete);
    }
    if (slots.length === 0) {
      showToast('Tick at least one tier', true);
      return;
    }
    const pinned = path.trim();
    props.onAdd(pinned ? slots.map(slot => slot + ':' + pinned) : slots);
  }

  return (
    <div className="card" style={{ padding: 10, marginBottom: 6 }}>
      <div className="toolbar" style={{ marginBottom: 6 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>File system</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }} title="Load, list, search files and folders">
          <input type="checkbox" checked={read} onChange={e => setRead(e.target.checked)} />Read
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }} title="Save, copy, move, patch, unzip; create folders">
          <input type="checkbox" checked={write} onChange={e => setWrite(e.target.checked)} />Write
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }} title="Delete files and folders">
          <input type="checkbox" checked={remove} onChange={e => setRemove(e.target.checked)} />Delete
        </label>
        <span className="spacer" />
        <button className="btn btn-small" onClick={add}>Add</button>
        <button className="btn btn-secondary btn-small" onClick={props.onCancel}>Close</button>
      </div>
      <div className="toolbar">
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }} title="Pin every ticked operation to this exact path; blank allows any path">
          Path
          <input
            type="text"
            placeholder="/etc/data/  (blank = any path)"
            value={path}
            onChange={e => setPath(e.target.value)}
            style={{ flex: 1 }} />
        </label>
      </div>
      <span className="muted" style={{ fontSize: 12 }}>
        File and folder slots pin their path argument — a path here restricts every ticked
        operation to that exact path; leave it blank to allow any path.
      </span>
    </div>
  );
}

/*
 * Wizard granting email. Send pairs [mail.smtp.send] with [mime.create] to compose the
 * message; Receive pairs [mail.pop3.fetch] with [mime.parse] to read one.
 */
function EmailWizard(props: { onAdd: (lines: string[]) => void; onCancel: () => void }) {

  const [send, setSend] = useState(true);
  const [receive, setReceive] = useState(false);

  function add() {
    const lines: string[] = [];
    if (send) {
      lines.push('mail.smtp.send', 'mime.create');
    }
    if (receive) {
      lines.push('mail.pop3.fetch', 'mime.parse');
    }
    if (lines.length === 0) {
      showToast('Tick Send or Receive', true);
      return;
    }
    props.onAdd(lines);
  }

  return (
    <div className="card" style={{ padding: 10, marginBottom: 6 }}>
      <div className="toolbar" style={{ marginBottom: 6 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>Email</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }} title="Send mail through the configured SMTP server">
          <input type="checkbox" checked={send} onChange={e => setSend(e.target.checked)} />Send
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }} title="Fetch mail over POP3">
          <input type="checkbox" checked={receive} onChange={e => setReceive(e.target.checked)} />Receive
        </label>
        <span className="spacer" />
        <button className="btn btn-small" onClick={add}>Add</button>
        <button className="btn btn-secondary btn-small" onClick={props.onCancel}>Close</button>
      </div>
      <span className="muted" style={{ fontSize: 12 }}>
        Send uses the server's configured SMTP account; recipients are set per call.
      </span>
    </div>
  );
}

/*
 * Wizard granting image operations. Each ticked operation maps to one [image.*] slot.
 */
const IMAGE_OPS: { key: string; label: string }[] = [
  { key: 'resize', label: 'Resize' },
  { key: 'crop', label: 'Crop' },
  { key: 'convert', label: 'Convert' },
  { key: 'size', label: 'Size' },
  { key: 'chart', label: 'Chart' },
  { key: 'generate-qr', label: 'QR code' },
];

function ImagesWizard(props: { onAdd: (lines: string[]) => void; onCancel: () => void }) {

  const [ops, setOps] = useState<Record<string, boolean>>({
    resize: true, crop: true, convert: true, size: true, chart: false, 'generate-qr': false,
  });

  function add() {
    const lines = IMAGE_OPS.filter(op => ops[op.key]).map(op => 'image.' + op.key);
    if (lines.length === 0) {
      showToast('Tick at least one operation', true);
      return;
    }
    props.onAdd(lines);
  }

  return (
    <div className="card" style={{ padding: 10, marginBottom: 6 }}>
      <div className="toolbar" style={{ marginBottom: 6 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>Images</div>
        {IMAGE_OPS.map(op => (
          <label key={op.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="checkbox" checked={ops[op.key]}
              onChange={e => setOps({ ...ops, [op.key]: e.target.checked })} />
            {op.label}
          </label>
        ))}
        <span className="spacer" />
        <button className="btn btn-small" onClick={add}>Add</button>
        <button className="btn btn-secondary btn-small" onClick={props.onCancel}>Close</button>
      </div>
    </div>
  );
}

/*
 * Wizard granting logging. Write covers the four severities; Read covers querying the log.
 */
function LoggingWizard(props: { onAdd: (lines: string[]) => void; onCancel: () => void }) {

  const [write, setWrite] = useState(true);
  const [read, setRead] = useState(false);

  function add() {
    const lines: string[] = [];
    if (write) {
      lines.push('log.info', 'log.debug', 'log.error', 'log.fatal');
    }
    if (read) {
      lines.push('log.get', 'log.query', 'log.count');
    }
    if (lines.length === 0) {
      showToast('Tick Write or Read', true);
      return;
    }
    props.onAdd(lines);
  }

  return (
    <div className="card" style={{ padding: 10, marginBottom: 6 }}>
      <div className="toolbar" style={{ marginBottom: 6 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>Logging</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }} title="log.info / debug / error / fatal">
          <input type="checkbox" checked={write} onChange={e => setWrite(e.target.checked)} />Write
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }} title="log.get / query / count">
          <input type="checkbox" checked={read} onChange={e => setRead(e.target.checked)} />Read
        </label>
        <span className="spacer" />
        <button className="btn btn-small" onClick={add}>Add</button>
        <button className="btn btn-secondary btn-small" onClick={props.onCancel}>Close</button>
      </div>
    </div>
  );
}

/*
 * Generic capability wizard: a checkbox per named group of slots. Ticking a group and
 * pressing Add merges that group's slots into the editor. Drives the Tier-2 wizards,
 * which are all "pick which sub-capabilities" with no extra parameters.
 */
interface SlotGroup { key: string; label: string; title?: string; slots: string[]; }
interface WizardSpec { label: string; title: string; note?: string; defaults: string[]; groups: SlotGroup[]; }

function GroupWizard(props: { spec: WizardSpec; onAdd: (lines: string[]) => void; onCancel: () => void }) {

  const [on, setOn] = useState<Record<string, boolean>>(
    Object.fromEntries(props.spec.groups.map(g => [g.key, props.spec.defaults.includes(g.key)])));

  function add() {
    const lines: string[] = [];
    for (const group of props.spec.groups) {
      if (on[group.key]) {
        lines.push(...group.slots);
      }
    }
    if (lines.length === 0) {
      showToast('Tick at least one option', true);
      return;
    }
    props.onAdd([...new Set(lines)]);
  }

  return (
    <div className="card" style={{ padding: 10, marginBottom: 6 }}>
      <div className="toolbar" style={{ marginBottom: props.spec.note ? 6 : 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{props.spec.title}</div>
        {props.spec.groups.map(group => (
          <label key={group.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }} title={group.title}>
            <input type="checkbox" checked={on[group.key]}
              onChange={e => setOn({ ...on, [group.key]: e.target.checked })} />
            {group.label}
          </label>
        ))}
        <span className="spacer" />
        <button className="btn btn-small" onClick={add}>Add</button>
        <button className="btn btn-secondary btn-small" onClick={props.onCancel}>Close</button>
      </div>
      {props.spec.note && (
        <span className="muted" style={{ fontSize: 12 }}>{props.spec.note}</span>
      )}
    </div>
  );
}

/*
 * Tier-2 wizard specifications. The dangerous tier (system/python/git/github/dynamic
 * slots/config write) is deliberately omitted, configuration is left out entirely
 * because it exposes secrets, and identity is read-only - never minting a ticket.
 */
const TIER2_WIZARDS: Record<string, WizardSpec> = {
  tasks: {
    label: 'Tasks', title: 'Scheduled tasks', defaults: ['read'],
    groups: [
      { key: 'read', label: 'Read', title: 'List and read tasks', slots: ['tasks.list', 'tasks.get', 'tasks.count'] },
      { key: 'manage', label: 'Manage', title: 'Create, update, delete, schedule and run tasks', slots: ['tasks.create', 'tasks.update', 'tasks.delete', 'tasks.schedule', 'tasks.schedule.delete', 'tasks.execute'] },
    ],
  },
  cache: {
    label: 'Cache', title: 'Caching', defaults: ['read'],
    groups: [
      { key: 'read', label: 'Read', slots: ['cache.get', 'cache.try-get', 'cache.list', 'cache.count'] },
      { key: 'write', label: 'Write', slots: ['cache.set', 'cache.clear'] },
    ],
  },
  sockets: {
    label: 'Sockets', title: 'Web sockets', defaults: ['signal'],
    groups: [
      { key: 'signal', label: 'Signal', title: 'Publish messages to connected clients', slots: ['sockets.signal'] },
      { key: 'groups', label: 'Groups', slots: ['sockets.connection.enter-group', 'sockets.connection.leave-group', 'sockets.user.add-to-group', 'sockets.user.remove-from-group'] },
      { key: 'users', label: 'Users', slots: ['sockets.users', 'sockets.users.count'] },
    ],
  },
  identity: {
    label: 'Identity', title: 'Identity (read only)', defaults: ['read'],
    note: 'Reads the caller identity and verifies tokens. Minting or refreshing a ticket is never offered — that is the escalation the sandbox exists to prevent.',
    groups: [
      { key: 'read', label: 'Read identity', slots: ['auth.ticket.get', 'auth.ticket.in-role', 'auth.ticket.verify', 'auth.token.read', 'auth.token.verify'] },
    ],
  },
  crypto: {
    label: 'Crypto', title: 'Cryptography', defaults: ['hashing', 'random'],
    groups: [
      { key: 'hashing', label: 'Hashing', slots: ['crypto.hash', 'crypto.hash.md5', 'crypto.hash.sha1', 'crypto.hash.sha256', 'crypto.hash.sha384', 'crypto.hash.sha512', 'crypto.password.hash', 'crypto.password.verify'] },
      { key: 'symmetric', label: 'Symmetric', slots: ['crypto.aes.encrypt', 'crypto.aes.decrypt', 'crypto.encrypt', 'crypto.decrypt'] },
      { key: 'rsa', label: 'RSA', slots: ['crypto.rsa.create-key', 'crypto.rsa.encrypt', 'crypto.rsa.decrypt', 'crypto.rsa.sign', 'crypto.rsa.verify', 'crypto.sign', 'crypto.verify', 'crypto.get-key', 'crypto.fingerprint'] },
      { key: 'random', label: 'Random', slots: ['crypto.random', 'crypto.random.int', 'crypto.seed'] },
    ],
  },
  ai: {
    label: 'AI', title: 'AI helpers', defaults: ['tokenize'],
    groups: [
      { key: 'tokenize', label: 'Tokenize', slots: ['openai.tokenize'] },
      { key: 'whisper', label: 'Transcribe', title: 'Speech-to-text with Whisper', slots: ['openai.whisper'] },
    ],
  },
  puppeteer: {
    label: 'Browser', title: 'Headless browser', defaults: ['browse'],
    groups: [
      { key: 'browse', label: 'Browse & read', slots: ['puppeteer.connect', 'puppeteer.goto', 'puppeteer.close', 'puppeteer.url', 'puppeteer.title', 'puppeteer.content', 'puppeteer.evaluate', 'puppeteer.screenshot', 'puppeteer.wait-for-selector', 'puppeteer.wait-for-url'] },
      { key: 'interact', label: 'Interact', slots: ['puppeteer.click', 'puppeteer.type', 'puppeteer.fill', 'puppeteer.select', 'puppeteer.press'] },
    ],
  },
};

function SandboxTab() {

  const [moduleName, setModuleName] = useState('');
  const [endpointName, setEndpointName] = useState('run');
  const [verb, setVerb] = useState('post');
  const [inputMode, setInputMode] = useState('both');
  const [overrideRoot, setOverrideRoot] = useState(true);
  const [returnCode, setReturnCode] = useState(false);
  const [overwrite, setOverwrite] = useState(false);
  // Who may call the endpoint at all — empty means public.
  const [roles, setRoles] = useState<string[]>([]);
  const [auth, setAuth] = useState<string[]>([]);
  const [authOpen, setAuthOpen] = useState(false);
  // The "everybody" base rule: the language, rate limit and timeout every caller gets.
  const [baseSlots, setBaseSlots] = useState(DEFAULT_BASE_SLOTS);
  const [baseLimit, setBaseLimit] = useState('10');
  const [baseWindow, setBaseWindow] = useState('60');
  const [baseTimeout, setBaseTimeout] = useState('20000');
  // Per-role rules, each adding slots and optionally overriding limit/window/timeout.
  const [ruleList, setRuleList] = useState<RoleRule[]>([]);
  // Which role rule (by index) has which capability wizard open, if any.
  const [wizard, setWizard] = useState<{ index: number; kind: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState('');

  useEffect(() => {
    listRoles()
      .then(list => setRoles((list ?? []).map(role => role.name)))
      .catch(() => {});
  }, []);

  function updateRule(index: number, patch: Partial<RoleRule>) {
    setRuleList(ruleList.map((rule, i) => i === index ? { ...rule, ...patch } : rule));
  }

  // Rules carrying slots/overrides but no role would be dropped silently — block on them.
  const hasIncompleteRule = ruleList.some(ruleIsIncomplete);

  async function generate() {
    if (!moduleName || !endpointName) {
      showToast('Provide a module name and an endpoint name', true);
      return;
    }
    /*
     * Role rules first, most-access-first, so the first matching role wins each
     * dimension; the base "everybody" rule last as the '*' fallback. A role only
     * carries [limit]/[window] or [timeout] when it actually overrides them, so a
     * blank field simply inherits from a later rule or the base.
     */
    const rules = [
      ...ruleList
        .filter(rule => rule.role.trim())
        .map(rule => {
          const out: any = { role: rule.role.trim(), slots: linesToSlots(rule.slots) };
          if (rule.limit.trim()) {
            out.limit = Number(rule.limit);
            out.window = Number(rule.window) || Number(baseWindow) || 60;
          }
          if (rule.timeout.trim()) {
            out.timeout = Number(rule.timeout);
          }
          return out;
        }),
      {
        role: '*',
        limit: Number(baseLimit) || 0,
        window: Number(baseWindow) || 60,
        timeout: Number(baseTimeout) || 20000,
        slots: linesToSlots(baseSlots),
      },
    ];
    const policy = { overrideRoot, returnCode, rules };
    setBusy(true);
    try {
      const response = await generateSandboxEndpoint({
        moduleName,
        endpointName,
        verb,
        inputMode,
        authorization: auth.join(','),
        policy: JSON.stringify(policy),
        overwrite,
      });
      setPreview(response.hyperlambda);
      showToast('Endpoint magic/' + moduleName + '/' + endpointName + ' created');
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="toolbar">
        <Select value={verb} onChange={value => setVerb(value)}>
          {['post', 'get', 'put', 'delete', 'patch'].map(option => (
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
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }} title="What the endpoint accepts — this shapes its arguments and description">
          Input
          <Select value={inputMode} onChange={value => setInputMode(value)}>
            <option value="both">Hyperlambda + Natural language</option>
            <option value="hl">Hyperlambda</option>
            <option value="nl">Natural language</option>
          </Select>
        </label>
        <span className="spacer" />
        <button
          className="btn"
          onClick={generate}
          disabled={busy || hasIncompleteRule}
          title={hasIncompleteRule ? 'A role rule has slots but no role — choose a role or remove it' : undefined}>
          {busy ? 'Generating…' : '⚙ Generate endpoint'}
        </button>
      </div>
      <div className="toolbar">
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }} title="When on, a root caller runs with the server's full vocabulary and no sandbox">
          <input
            type="checkbox"
            checked={overrideRoot}
            onChange={e => setOverrideRoot(e.target.checked)} />
          Root bypasses the sandbox
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }} title="When on, the response includes the executed code; otherwise it returns only state and result">
          <input
            type="checkbox"
            checked={returnCode}
            onChange={e => setReturnCode(e.target.checked)} />
          Return code
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={overwrite}
            onChange={e => setOverwrite(e.target.checked)} />
          Overwrite
        </label>
      </div>
      {/* Who may call the endpoint at all — empty leaves it public. */}
      <div className="toolbar">
        <div style={{ fontWeight: 600, fontSize: 13 }}>Who may call:</div>
        <span>
          {auth.length > 0 ? auth.join(', ') : <em className="muted">public — anyone</em>}
        </span>
        <button
          className="btn btn-secondary btn-small"
          onClick={() => setAuthOpen(!authOpen)}>
          {authOpen ? 'Done' : 'Edit'}
        </button>
        {authOpen && (
          <div style={{ flexBasis: '100%' }}>
            <RoleChips
              roles={roles}
              selected={auth}
              onToggle={(role, selected) => setAuth(selected
                ? [...auth, role]
                : auth.filter(candidate => candidate !== role))} />
          </div>
        )}
      </div>
      {/* The "everybody" base rule — the vocabulary and fallback limit every caller gets. */}
      <div className="card" style={{ padding: 12, marginTop: 8 }}>
        <div className="toolbar" style={{ marginBottom: 6 }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>Everybody (base vocabulary)</div>
          <span className="spacer" />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }} title="Fallback invocations per window, per IP, for callers with no matching role rule">
            Limit
            <input type="number" value={baseLimit}
              onChange={e => setBaseLimit(e.target.value)} style={{ width: 80 }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }} title="Window length in seconds">
            Window&nbsp;s
            <input type="number" value={baseWindow}
              onChange={e => setBaseWindow(e.target.value)} style={{ width: 80 }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }} title="Fallback timeout in milliseconds — root is exempt">
            Timeout&nbsp;ms
            <input type="number" step={1000} value={baseTimeout}
              onChange={e => setBaseTimeout(e.target.value)} style={{ width: 90 }} />
          </label>
        </div>
        <div style={{ height: 240, display: 'flex', flexDirection: 'column' }}>
          <CodeEditor value={baseSlots} onChange={setBaseSlots} mode="hyperlambda" />
        </div>
      </div>
      {/* Per-role rules — each adds slots on top of the base for its role. */}
      {ruleList.map((rule, index) => (
        <div key={index} className="card" style={{ padding: 12, marginTop: 8 }}>
          <div className="toolbar" style={{ marginBottom: 6 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }} title="Callers in this role also get these slots">
              Role
              <Select value={rule.role} onChange={value => updateRule(index, { role: value })}>
                <option value="">choose role…</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </Select>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }} title="Invocations per window, per IP — blank inherits the base">
              Limit
              <input type="number" placeholder="base" value={rule.limit}
                onChange={e => updateRule(index, { limit: e.target.value })} style={{ width: 70 }} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }} title="Window length in seconds — used only when this role sets a limit">
              Window&nbsp;s
              <input type="number" placeholder="base" value={rule.window}
                onChange={e => updateRule(index, { window: e.target.value })} style={{ width: 70 }} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }} title="Timeout in milliseconds — blank inherits the base">
              Timeout&nbsp;ms
              <input type="number" step={1000} placeholder="base" value={rule.timeout}
                onChange={e => updateRule(index, { timeout: e.target.value })} style={{ width: 80 }} />
            </label>
            <span className="spacer" />
            <button
              className="btn btn-danger btn-small"
              onClick={() => {
                setRuleList(ruleList.filter((_, i) => i !== index));
                setWizard(null);
              }}>
              Remove
            </button>
          </div>
          {ruleIsIncomplete(rule) && (
            <div className="error-box" style={{ marginBottom: 6, fontSize: 13 }}>
              This rule has slots but no role — choose a role, or remove the rule. It would
              otherwise be dropped.
            </div>
          )}
          <div className="toolbar" style={{ marginBottom: 6 }}>
            <span className="muted" style={{ fontSize: 12, marginRight: 4 }}>Add capability:</span>
            {([['db', 'Database'], ['http', 'HTTP'], ['files', 'Files'], ['email', 'Email'], ['images', 'Images'], ['logging', 'Logging'],
              ...Object.entries(TIER2_WIZARDS).map(([kind, spec]) => [kind, spec.label])] as [string, string][]).map(([kind, label]) => (
              <button
                key={kind}
                className={'btn btn-small' + (wizard?.index === index && wizard?.kind === kind ? '' : ' btn-secondary')}
                onClick={() => setWizard(
                  wizard?.index === index && wizard?.kind === kind ? null : { index, kind })}>
                {label}
              </button>
            ))}
          </div>
          {wizard?.index === index && wizard.kind === 'db' && (
            <DbAccessWizard
              onAdd={lines => updateRule(index, { slots: mergeSlots(rule.slots, lines) })}
              onCancel={() => setWizard(null)} />
          )}
          {wizard?.index === index && wizard.kind === 'http' && (
            <HttpAccessWizard
              onAdd={lines => updateRule(index, { slots: mergeSlots(rule.slots, lines) })}
              onCancel={() => setWizard(null)} />
          )}
          {wizard?.index === index && wizard.kind === 'files' && (
            <FilesAccessWizard
              onAdd={lines => updateRule(index, { slots: mergeSlots(rule.slots, lines) })}
              onCancel={() => setWizard(null)} />
          )}
          {wizard?.index === index && wizard.kind === 'email' && (
            <EmailWizard
              onAdd={lines => updateRule(index, { slots: mergeSlots(rule.slots, lines) })}
              onCancel={() => setWizard(null)} />
          )}
          {wizard?.index === index && wizard.kind === 'images' && (
            <ImagesWizard
              onAdd={lines => updateRule(index, { slots: mergeSlots(rule.slots, lines) })}
              onCancel={() => setWizard(null)} />
          )}
          {wizard?.index === index && wizard.kind === 'logging' && (
            <LoggingWizard
              onAdd={lines => updateRule(index, { slots: mergeSlots(rule.slots, lines) })}
              onCancel={() => setWizard(null)} />
          )}
          {wizard?.index === index && TIER2_WIZARDS[wizard.kind] && (
            <GroupWizard
              key={wizard.kind}
              spec={TIER2_WIZARDS[wizard.kind]}
              onAdd={lines => updateRule(index, { slots: mergeSlots(rule.slots, lines) })}
              onCancel={() => setWizard(null)} />
          )}
          <div style={{ height: 160, display: 'flex', flexDirection: 'column' }}>
            <CodeEditor
              value={rule.slots}
              onChange={value => updateRule(index, { slots: value })}
              mode="hyperlambda" />
          </div>
        </div>
      ))}
      <div className="toolbar" style={{ marginTop: 8 }}>
        <button
          className="btn btn-secondary btn-small"
          onClick={() => setRuleList([...ruleList,
            { role: '', limit: baseLimit, window: baseWindow, timeout: baseTimeout, slots: '' }])}>
          + Add role rule
        </button>
        <span className="muted" style={{ fontSize: 12, flexBasis: '100%' }}>
          Slots are added on top of the base for callers in the role. Limit and timeout
          are optional — blank inherits from a later rule or the base; rules are matched
          top to bottom, so order the most-privileged first. One slot per line —{' '}
          <span className="mono">slot</span>, or <span className="mono">slot:value</span>{' '}
          to pin an argument (e.g. <span className="mono">data.connect:xyz</span>).
        </span>
      </div>
      {preview && (
        <>
          <div className="toolbar" style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Generated endpoint</div>
            <span className="muted" style={{ fontSize: 12 }}>read-only preview of what was saved</span>
          </div>
          <div style={{ height: 320, display: 'flex', flexDirection: 'column' }}>
            <CodeEditor value={preview} mode="hyperlambda" readOnly={true} />
          </div>
        </>
      )}
      {busy && <AiWaiter />}
    </>
  );
}
