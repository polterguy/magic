import { copyToClipboard, showToast } from '../lib/toast';
import { useMemo, useRef, useState } from 'react';
import AiPrompt from '../components/AiPrompt';
import AiWaiter from '../components/AiWaiter';
import { useSessionState } from '../lib/useSessionState';
import type CodeMirror from 'codemirror';
import CodeEditor from '../components/CodeEditor';
import { Modal, useDialog } from '../components/Dialogs';
import Tabs from '../components/Tabs';
import Select from '../components/Select';
import { FIELD_TYPES, PK_TYPES } from '../lib/dbTypes';
import { exportCsv } from '../lib/download';
import { buildSqlAiContext, sqlHintTables, useDatabaseSelection, useSqlSnippets } from '../lib/sql';
import {
  addColumn,
  addForeignKey,
  addTable,
  dropColumn,
  dropTable,
  executeSql,
  exportDdl,
  flushSchemaCache,
  importCsvFile,
  loadFile,
  saveFile,
} from '../lib/api';

export default function Sql() {

  // Prefers magic — the SQL editor's most common target, unlike the
  // generators which deliberately avoid it.
  const selection = useDatabaseSelection({ preferMagic: true });
  const { type, connectionString, database } = selection;
  // The editor's buffer outlives the page — leaving and coming back restores
  // it, instead of a discard-changes dialog standing in the way.
  const [sql, setSql] = useSessionState('magic2.sql-studio.sql', '');
  // What the editor last loaded or saved — differing content means unsaved changes.
  const [savedSql, setSavedSql] = useSessionState('magic2.sql-studio.saved', '');
  const [safeMode, setSafeMode] = useState(true);
  const [result, setResult] = useState<any[][] | null>(null);
  const [busy, setBusy] = useState(false);
  // Click-triggered round-trips outside Run — DDL exports, schema changes,
  // imports and snippet I/O.
  const [waiting, setWaiting] = useState(false);
  const { snippets, setSnippets } = useSqlSnippets(type);
  const [selectedSnippet, setSelectedSnippet] =
    useSessionState('magic2.sql-studio.snippet', '');
  const [view, setView] = useState<'sql' | 'tables'>('sql');
  const [ddl, setDdl] = useState<{ title: string; sql: string } | null>(null);
  const [newTable, setNewTable] = useState(false);
  const [addingColumn, setAddingColumn] = useState<string | null>(null);
  const editorRef = useRef<CodeMirror.Editor | null>(null);
  const { prompt, confirm, confirmTyped } = useDialog();

  const tables = selection.selectedMeta?.tables ?? [];
  const reloadSchema = selection.reloadSchema;

  async function flushCache() {
    if (!await confirm({
      title: 'Flush server-side cache?',
      message: 'This clears the cached database schema on the server, then reloads the ' +
        'page so the dashboard picks up the fresh schema everywhere. Any unsaved changes ' +
        'in the editor will be lost.',
      confirmText: 'Flush and reload',
    })) {
      return;
    }
    setWaiting(true);
    try {
      await flushSchemaCache(type, connectionString);
      window.location.reload();
    } catch (err: any) {
      showToast(err.message, true, err.logId);
      setWaiting(false);
    }
  }

  async function importCsv(file: File) {
    setWaiting(true);
    try {
      await importCsvFile(type, connectionString, database, file);
      showToast('Importing ' + file.name + ' — you\'ll be notified when it completes');
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setWaiting(false);
    }
  }

  async function dropTableConfirmed(tableName: string) {
    if (!await confirmTyped({
      title: 'Drop table?',
      message: 'This permanently deletes ' + tableName + '. Type the table name to confirm.',
      label: 'Table name',
      expected: tableName,
      confirmText: 'Drop',
      mismatch: 'Name did not match — nothing dropped',
    })) {
      return;
    }
    setWaiting(true);
    try {
      await dropTable(type, connectionString, database, tableName);
      showToast('Table ' + tableName + ' dropped');
      await reloadSchema();
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setWaiting(false);
    }
  }

  async function dropColumnConfirmed(tableName: string, columnName: string) {
    if (!await confirm({
      title: 'Drop column?',
      message: tableName + '.' + columnName + ' will be permanently removed.',
      confirmText: 'Drop',
      danger: true,
    })) {
      return;
    }
    setWaiting(true);
    try {
      await dropColumn(type, connectionString, database, tableName, columnName);
      showToast('Column ' + columnName + ' dropped');
      await reloadSchema();
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setWaiting(false);
    }
  }

  function createAiContext() {
    return buildSqlAiContext({ type, connectionString, database, tables, sql });
  }

  async function viewDdl(tables: string[], full: boolean, title: string) {
    setWaiting(true);
    try {
      const response = await exportDdl(type, connectionString, database, tables, full);
      setDdl({ title, sql: response.result });
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setWaiting(false);
    }
  }

  // Table → columns map for Ctrl-Space SQL autocomplete.
  const hintTables = useMemo(
    () => sqlHintTables(selection.selectedMeta), [selection.selectedMeta]);

  async function execute() {
    const selected = editorRef.current?.getSelection() ?? '';
    const toExecute = selected !== '' ? selected : sql;
    if (!toExecute.trim()) {
      showToast('Write some SQL first', true);
      return;
    }
    setBusy(true);
    try {
      // Batch mode only when a line actually IS a GO statement — merely
      // containing the letters "go" (category, algorithm…) doesn't count.
      const batch = type === 'mssql' && /^\s*go\s*;?\s*$/im.test(toExecute);
      const response = await executeSql(
        type, '[' + connectionString + '|' + database + ']', toExecute, safeMode, batch);
      setResult(response ?? []);
      const count = (response ?? []).reduce((total, set) => total + (set?.length ?? 0), 0);
      showToast(response === null
        ? 'SQL executed successfully, no result'
        : count === 200 && safeMode
          ? 'First 200 records returned. Turn off safe mode to return all records.'
          : count + ' records returned');
    } catch (err: any) {
      showToast(err.message, true, err.logId);
      setResult(null);
    } finally {
      setBusy(false);
    }
  }

  async function openSnippet(filename: string) {
    if (!filename) {
      return;
    }
    // Loading over unsaved work destroys it — the navigation guard can't see
    // this, so ask the same question it would.
    if (sql !== savedSql && !await confirm({
      title: 'Discard unsaved changes?',
      message: 'Your SQL has unsaved changes. Loading ' +
        filename.substring(filename.lastIndexOf('/') + 1) + ' replaces them.',
      confirmText: 'Discard',
      danger: true,
    })) {
      return;
    }
    setSelectedSnippet(filename);
    setWaiting(true);
    try {
      const text = await loadFile(filename);
      setSql(text);
      setSavedSql(text);
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setWaiting(false);
    }
  }

  async function saveSnippet() {
    // Saving over the snippet you loaded is the common case, so its name is
    // suggested — the dialog selects it, so typing replaces it outright.
    const suggestion = selectedSnippet
      ? selectedSnippet.substring(selectedSnippet.lastIndexOf('/') + 1).replace(/\.sql$/, '')
      : '';
    const name = await prompt({
      title: 'Save SQL snippet',
      label: 'Snippet name',
      initial: suggestion,
    });
    if (!name) {
      return;
    }
    const filename = '/etc/' + type + '/templates/' + name +
      (name.endsWith('.sql') ? '' : '.sql');
    setWaiting(true);
    try {
      await saveFile(filename, sql);
      setSavedSql(sql);
      setSelectedSnippet(filename);
      showToast('Saved ' + filename);
      if (!snippets.includes(filename)) {
        setSnippets([...snippets, filename].sort());
      }
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setWaiting(false);
    }
  }

  function importSqlFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => setSql(String(reader.result ?? ''));
    reader.readAsText(file);
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="page-title">
          <h1>SQL Studio</h1>
          <p>Execute SQL towards your databases, and design them</p>
        </div>
        <div className="page-tools">
          <Select value={type} onChange={selection.setType}>
            {selection.types.map(option => <option key={option} value={option}>{option}</option>)}
          </Select>
          <Select value={connectionString} onChange={selection.setConnectionString}>
            {selection.connectionStrings.map(option =>
              <option key={option} value={option}>{option}</option>)}
          </Select>
          <Select value={database} onChange={selection.setDatabase}>
            {selection.databasesMeta.map((db: any) => (
              <option key={db.name} value={db.name}>{db.name}</option>
            ))}
          </Select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={safeMode}
              onChange={e => setSafeMode(e.target.checked)} />
            Safe mode
          </label>
          <button className="btn" onClick={execute} disabled={busy || !database}>
            {busy ? 'Running…' : '▷ Run'}
          </button>
        </div>
      </div>
      <Tabs
        tabs={[
          { id: 'sql', label: 'SQL' },
          { id: 'tables', label: 'Designer' },
        ]}
        active={view}
        onChange={id => setView(id as 'sql' | 'tables')} />
      {selection.connectionsLoaded && selection.connectionStrings.length === 0 && (
        <div className="info-box" style={{ marginBottom: 12 }}>
          No connection strings are configured for {type}. Add one under Databases → External.
        </div>
      )}
      {selection.schemaLoading && (
        <div className="spinner-panel">
          <div className="spinner" />
          <span className="muted">Loading databases and schema…</span>
        </div>
      )}
      {view === 'tables' && !selection.schemaLoading && (
        <>
          <div className="toolbar">
            <span className="muted">{tables.length} tables in {database}</span>
            <span className="spacer" />
            <button className="btn btn-secondary btn-small" onClick={() => setNewTable(true)}>
              + New table
            </button>
            <label
              className={'btn btn-secondary btn-small' + (database ? '' : ' disabled')}
              style={{ cursor: database ? 'pointer' : 'not-allowed' }}
              title="Create a table from a CSV file, named after the file">
              Import .csv
              <input
                type="file"
                accept=".csv"
                disabled={!database}
                style={{ display: 'none' }}
                onChange={e => {
                  if (e.target.files?.[0]) {
                    importCsv(e.target.files[0]);
                    e.target.value = '';
                  }
                }} />
            </label>
            <button
              className="btn btn-secondary btn-small"
              title="Flush the server-side schema cache and reload"
              disabled={!connectionString}
              onClick={flushCache}>
              Flush cache
            </button>
            <button
              className="btn btn-secondary btn-small"
              onClick={() => viewDdl(
                tables.map((table: any) => table.name), true, database + ' — full DDL')}>
              Database DDL
            </button>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 14,
            overflow: 'auto',
          }}>
            {tables.map((table: any) => (
              <div className="card" key={table.name} style={{ padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                  <strong style={{ flex: 1 }}>{table.name}</strong>
                  <button
                    className="btn btn-secondary btn-small"
                    title="Add column"
                    onClick={() => setAddingColumn(table.name)}>
                    + Col
                  </button>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => viewDdl([table.name], false, table.name + ' — DDL')}>
                    DDL
                  </button>
                  <button
                    className="btn btn-danger btn-small"
                    title="Drop table"
                    onClick={() => dropTableConfirmed(table.name)}>
                    ✕
                  </button>
                </div>
                {(table.columns ?? []).map((column: any) => (
                  <div
                    key={column.name}
                    className="col-row"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '2px 0' }}>
                    <span style={{ width: 14, flexShrink: 0 }}>
                      {column.primary ? '🔑' : ''}
                    </span>
                    <span
                      style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}
                      className={column.primary ? '' : 'muted'}>
                      {column.name}
                    </span>
                    <span className="muted mono" style={{ fontSize: 12 }}>
                      {column.db}
                    </span>
                    {/* Not-null marker in its own fixed slot, so the dots line up. */}
                    <span
                      className="mono"
                      title={column.nullable ? 'Nullable' : 'Not null'}
                      style={{ width: 8, textAlign: 'center', flexShrink: 0, fontSize: 12, color: 'var(--text-soft)' }}>
                      {column.nullable ? '' : '•'}
                    </span>
                    {/* Drop control always reserves its slot — empty for the primary
                        key — so every row's type column ends at the same place. */}
                    <span style={{ width: 18, flexShrink: 0, display: 'inline-flex', justifyContent: 'center' }}>
                      {!column.primary && (
                        <button
                          className="icon-btn danger col-drop"
                          title="Drop column"
                          onClick={() => dropColumnConfirmed(table.name, column.name)}
                          style={{ padding: 2 }}>
                          <span style={{ fontSize: 12 }}>✕</span>
                        </button>
                      )}
                    </span>
                  </div>
                ))}
                {(table.foreign_keys ?? []).length > 0 && (
                  <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                    {(table.foreign_keys ?? []).map((fk: any, index: number) => (
                      <div key={index} className="muted" style={{ fontSize: 12 }}>
                        {fk.column} → {fk.foreign_table}.{fk.foreign_column}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {newTable && (
            <NewTableDialog
              databaseType={type}
              onClose={() => setNewTable(false)}
              onCreate={async (tableName, pkName, pkType, pkLength) => {
                setWaiting(true);
                try {
                  await addTable(type, connectionString, database, tableName, pkName, pkType, pkLength);
                  setNewTable(false);
                  showToast('Table ' + tableName + ' created');
                  await reloadSchema();
                } catch (err: any) {
                  showToast(err.message, true, err.logId);
                } finally {
                  setWaiting(false);
                }
              }} />
          )}
          {addingColumn && (
            <AddColumnDialog
              databaseType={type}
              tableName={addingColumn}
              tables={tables}
              onClose={() => setAddingColumn(null)}
              onSubmit={async payload => {
                setWaiting(true);
                try {
                  if (payload.foreignTable) {
                    await addForeignKey(
                      type, connectionString, database, addingColumn,
                      payload.columnName, payload.columnType, payload.foreignTable,
                      payload.foreignField, payload.nullable, payload.columnLength, payload.cascading);
                  } else {
                    await addColumn(
                      type, connectionString, database, addingColumn,
                      payload.columnName, payload.columnType, payload.defaultValue,
                      payload.nullable, payload.columnLength);
                  }
                  setAddingColumn(null);
                  showToast('Column ' + payload.columnName + ' added');
                  await reloadSchema();
                } catch (err: any) {
                  showToast(err.message, true, err.logId);
                } finally {
                  setWaiting(false);
                }
              }} />
          )}
          {ddl && (
            <Modal width={760} onClose={() => setDdl(null)}>
              <h2>{ddl.title}</h2>
              <div style={{ height: '55vh', display: 'flex', flexDirection: 'column' }}>
                <CodeEditor value={ddl.sql} mode="text/x-sql" readOnly />
              </div>
              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => copyToClipboard(ddl.sql, 'The DDL')}>
                  Copy
                </button>
                <button className="btn" onClick={() => setDdl(null)}>Close</button>
              </div>
            </Modal>
          )}
        </>
      )}
      {view === 'sql' && <>
      <div className="toolbar">
        <Select value={selectedSnippet} onChange={value => openSnippet(value)}>
          <option value="">Load snippet…</option>
          {snippets.map(snippet => (
            <option key={snippet} value={snippet}>
              {snippet.substring(snippet.lastIndexOf('/') + 1)}
            </option>
          ))}
        </Select>
        <button className="btn btn-secondary btn-small" onClick={saveSnippet}>
          Save snippet
        </button>
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
      <div style={{ height: 260, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <CodeEditor
          value={sql}
          onChange={setSql}
          mode="text/x-sql"
          onExecute={execute}
          hintTables={hintTables}
          onInstance={instance => { editorRef.current = instance; }} />
      </div>
      <AiPrompt
        fileType="sql"
        getContext={createAiContext}
        session="sql-studio.editor"
        onResult={setSql}
        onError={message => showToast(message, true)}
        style={{ marginTop: 8 }} />
      </>}
      {view === 'sql' && result?.map((resultSet, index) => (
        <div key={index} style={{ marginTop: 16 }}>
          <div className="toolbar" style={{ marginBottom: 6 }}>
            <span className="muted">{(resultSet ?? []).length} rows</span>
            <span className="spacer" />
            <button
              className="btn btn-secondary btn-small"
              disabled={(resultSet ?? []).length === 0}
              onClick={() => exportCsv(resultSet ?? [], 'sql-export.csv')}>
              Export as CSV
            </button>
          </div>
          <div className="card" style={{ overflow: 'auto', padding: 0 }}>
            <ResultTable rows={resultSet ?? []} />
          </div>
        </div>
      ))}
      {waiting && <AiWaiter />}
    </>
  );
}

/*
 * With safe mode off a query can answer with hundreds of thousands of rows,
 * and rendering them all freezes the tab — the data is all still there for
 * the CSV export, only the DOM is capped.
 */
const MAX_RENDERED_ROWS = 1000;

function ResultTable({ rows }: { rows: any[] }) {
  if (rows.length === 0) {
    return <div className="muted" style={{ padding: 16 }}>Empty result set</div>;
  }
  const columns = Object.keys(rows[0]);
  const visible = rows.length > MAX_RENDERED_ROWS ? rows.slice(0, MAX_RENDERED_ROWS) : rows;
  return (
    <>
      <table className="sql-result">
        <thead>
          <tr>{columns.map(column => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {visible.map((row, index) => (
            <tr key={index}>
              {columns.map(column => (
                <td className="mono" key={column} data-label={column}>{formatCell(row[column])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > MAX_RENDERED_ROWS && (
        <div className="muted" style={{ padding: 12 }}>
          Showing the first {MAX_RENDERED_ROWS} of {rows.length} rows — export as CSV to
          get all of them.
        </div>
      )}
    </>
  );
}

function formatCell(value: any) {
  if (value === null || value === undefined) {
    return <span className="muted">null</span>;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

/*
 * Create-table dialog — a primary key column, auto-increment or varchar,
 * matching the old designer.
 */
function NewTableDialog(props: {
  databaseType: string;
  onClose: () => void;
  onCreate: (tableName: string, pkName: string, pkType: string, pkLength: number) => void;
}) {

  const [tableName, setTableName] = useState('');
  const [pkName, setPkName] = useState('');
  const [pkType, setPkType] = useState('auto_increment');
  const [pkLength, setPkLength] = useState('10');

  // Derive the PK name from the table name like the old dialog does.
  function onTableName(value: string) {
    setTableName(value);
    if (value) {
      const singular = value.endsWith('s') ? value.substring(0, value.length - 1) : value;
      setPkName(singular + '_id');
    }
  }

  return (
    <Modal
      onClose={props.onClose}
      onSubmit={() => {
        if (tableName && pkName) props.onCreate(tableName, pkName, pkType, Number(pkLength));
      }}>
      <h2>New table</h2>
      <div className="form-grid">
        <label>Table name
          <input type="text" value={tableName} onChange={e => onTableName(e.target.value)} />
        </label>
        <label>Primary key name
          <input type="text" value={pkName} onChange={e => setPkName(e.target.value)} />
        </label>
        <label>Primary key type
          <Select value={pkType} onChange={value => setPkType(value)}>
            {PK_TYPES.map(option => (
              <option key={option.value} value={option.value}>{option.name}</option>
            ))}
          </Select>
        </label>
        {pkType === 'varchar' && (
          <label>Primary key length
            <input type="number" value={pkLength} onChange={e => setPkLength(e.target.value)} />
          </label>
        )}
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        <button
          className="btn"
          disabled={!tableName || !pkName}
          onClick={() => props.onCreate(tableName, pkName, pkType, Number(pkLength))}>
          Create
        </button>
      </div>
    </Modal>
  );
}

/*
 * Add-column dialog — a plain field, or a foreign key referencing another
 * table (Field vs Foreign key tab).
 */
function AddColumnDialog(props: {
  databaseType: string;
  tableName: string;
  tables: any[];
  onClose: () => void;
  onSubmit: (payload: {
    columnName: string;
    columnType: string;
    defaultValue: string | null;
    nullable: boolean;
    columnLength: number | null;
    foreignTable: string;
    foreignField: string;
    cascading: boolean;
  }) => void;
}) {

  const fieldTypes = FIELD_TYPES[props.databaseType] ?? FIELD_TYPES.sqlite;
  const [mode, setMode] = useState('field');
  const [columnName, setColumnName] = useState('');
  // Default to a text column — the most common case — rather than the first
  // (numeric) type: the exact `text` where a dialect has it, else varchar/nvarchar.
  const [fieldType, setFieldType] = useState(
    fieldTypes.find(t => t.name === 'text')
      ?? fieldTypes.find(t => /char|text/.test(t.name))
      ?? fieldTypes[0]);
  const [columnLength, setColumnLength] = useState('255');
  const [defaultValue, setDefaultValue] = useState('');
  const [nullable, setNullable] = useState(true);
  const [foreignTable, setForeignTable] = useState('');
  const [cascading, setCascading] = useState(true);

  // The foreign field is the referenced table's primary key.
  const foreignMeta = props.tables.find((table: any) => table.name === foreignTable);
  const foreignPk = (foreignMeta?.columns ?? []).find((column: any) => column.primary);

  function submit() {
    if (mode === 'foreign') {
      if (!columnName || !foreignTable || !foreignPk) {
        return;
      }
      props.onSubmit({
        columnName,
        columnType: foreignPk.hl === 'string' ? 'varchar' : (fieldTypes[0].name),
        defaultValue: null,
        nullable,
        columnLength: foreignPk.hl === 'string' ? Number(columnLength) : null,
        foreignTable,
        foreignField: foreignPk.name,
        cascading,
      });
    } else {
      props.onSubmit({
        columnName,
        columnType: fieldType.name,
        defaultValue: defaultValue || null,
        nullable,
        columnLength: fieldType.size ? Number(columnLength) : null,
        foreignTable: '',
        foreignField: '',
        cascading: false,
      });
    }
  }

  return (
    <Modal width={520} onClose={props.onClose} onSubmit={submit}>
      <h2>Add column to {props.tableName}</h2>
      <Tabs
        tabs={[
          { id: 'field', label: 'Field' },
          { id: 'foreign', label: 'Foreign key' },
        ]}
        active={mode}
        onChange={setMode} />
      <div className="form-grid">
        <label>Column name
          <input type="text" value={columnName} onChange={e => setColumnName(e.target.value)} />
        </label>
        {mode === 'field' ? (
          <>
            <label>Type
              <Select
                value={fieldType.name}
                onChange={value => {
                  const next = fieldTypes.find(candidate => candidate.name === value)!;
                  setFieldType(next);
                  if (next.varcharDefault) {
                    setColumnLength(String(next.varcharDefault));
                  }
                }}>
                {fieldTypes.map(candidate => (
                  <option key={candidate.name} value={candidate.name}>{candidate.name}</option>
                ))}
              </Select>
            </label>
            {fieldType.size && (
              <label>Length
                <input
                  type="number"
                  value={columnLength}
                  onChange={e => setColumnLength(e.target.value)} />
              </label>
            )}
            <label>Default value (optional)
              <input
                type="text"
                value={defaultValue}
                onChange={e => setDefaultValue(e.target.value)} />
            </label>
          </>
        ) : (
          <>
            <label>References table
              <Select value={foreignTable} onChange={value => setForeignTable(value)}>
                <option value="">Select table…</option>
                {props.tables
                  .filter((table: any) => (table.columns ?? []).some((c: any) => c.primary))
                  .map((table: any) => (
                    <option key={table.name} value={table.name}>{table.name}</option>
                  ))}
              </Select>
            </label>
            {foreignPk && (
              <div className="muted" style={{ fontSize: 13 }}>
                References {foreignTable}.{foreignPk.name} ({foreignPk.hl})
              </div>
            )}
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={cascading}
                onChange={e => setCascading(e.target.checked)} />
              Cascade on delete
            </label>
          </>
        )}
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={nullable}
            onChange={e => setNullable(e.target.checked)} />
          Nullable
        </label>
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        <button
          className="btn"
          disabled={!columnName || (mode === 'foreign' && !foreignPk)}
          onClick={submit}>
          Add
        </button>
      </div>
    </Modal>
  );
}
