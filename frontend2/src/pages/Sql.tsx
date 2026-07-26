import { copyToClipboard, showToast } from '../lib/toast';
import { useEffect, useMemo, useRef, useState } from 'react';
import AiPrompt from '../components/AiPrompt';
import { useUnsavedGuard } from '../lib/navGuard';
import { useSearchParams } from 'react-router-dom';
import type CodeMirror from 'codemirror';
import CodeEditor from '../components/CodeEditor';
import { Modal, useDialog } from '../components/Dialogs';
import Tabs from '../components/Tabs';
import { FIELD_TYPES, PK_TYPES } from '../lib/dbTypes';
import {
  addColumn,
  addForeignKey,
  addTable,
  defaultDatabaseType,
  dropColumn,
  dropTable,
  executeSql,
  exportDdl,
  http,
  listDatabases,
  listFiles,
  loadFile,
  saveFile,
} from '../lib/api';

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

export default function Sql() {

  const [searchParams] = useSearchParams();
  // Deep-link parameters from e.g. the Databases screen, consumed once.
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
  const [sql, setSql] = useState('');
  // What the editor last loaded or saved — differing content means unsaved changes.
  const [savedSql, setSavedSql] = useState('');
  const [safeMode, setSafeMode] = useState(true);
  const [result, setResult] = useState<any[][] | null>(null);
  const [busy, setBusy] = useState(false);
  const [snippets, setSnippets] = useState<string[]>([]);
  const [view, setView] = useState<'sql' | 'tables'>('sql');
  const [ddl, setDdl] = useState<{ title: string; sql: string } | null>(null);
  const [newTable, setNewTable] = useState(false);
  const [addingColumn, setAddingColumn] = useState<string | null>(null);
  const editorRef = useRef<CodeMirror.Editor | null>(null);
  const { prompt, confirm } = useDialog();

  useUnsavedGuard(sql !== savedSql, 'Your SQL has unsaved changes.');

  const tables = databasesMeta.find(db => db.name === database)?.tables ?? [];

  async function reloadSchema() {
    try {
      const response = await listDatabases(type, connectionString);
      setDatabasesMeta(response.databases ?? []);
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    }
  }

  async function dropTableConfirmed(tableName: string) {
    const typed = await prompt({
      title: 'Drop table?',
      message: 'This permanently deletes ' + tableName + '. Type the table name to confirm.',
      label: 'Table name',
      confirmText: 'Drop',
    });
    if (typed !== tableName) {
      if (typed !== null) {
        setFeedback({ text: 'Name did not match — nothing dropped', isError: true });
      }
      return;
    }
    try {
      await dropTable(type, connectionString, database, tableName);
      setFeedback({ text: 'Table ' + tableName + ' dropped', isError: false });
      await reloadSchema();
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
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
    try {
      await dropColumn(type, connectionString, database, tableName, columnName);
      setFeedback({ text: 'Column ' + columnName + ' dropped', isError: false });
      await reloadSchema();
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    }
  }

  /*
   * AI context for the prompt bar, same as the old sql-view: the full schema
   * DDL when tables exist, the SQL dialect, and the current editor code.
   */
  async function createAiContext() {
    const dialect = {
      sqlite: 'SQLite',
      mysql: 'MySQL',
      mssql: 'Microsoft SQL Server',
      pgsql: 'PostgreSQL',
    }[type] ?? type;
    let result = '';
    if (tables.length > 0) {
      const ddl = await exportDdl(
        type, connectionString, database, tables.map((table: any) => table.name), true);
      result += 'Current schema:\n\n' + ddl.result + '\n\n';
    }
    result += 'SQL dialect: ' + dialect + '\n\n';
    if (sql.length > 0) {
      result += 'Current code: \n\n' + sql;
    }
    if (tables.length > 0) {
      result += '\n\n**IMPORTANT** - Return ONLY SQL! No ``` characters, or explanations, ' +
        'ONLY the SQL! In the next message you will be given a natural language query being ' +
        "a request from the user. Return only the RAW SQL that solves the user' problem";
    }
    return result;
  }

  async function viewDdl(tables: string[], full: boolean, title: string) {
    try {
      const response = await exportDdl(type, connectionString, database, tables, full);
      setDdl({ title, sql: response.result });
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    }
  }

  useEffect(() => {
    defaultDatabaseType().then(response => {
      setTypes(response.options);
      setType(deepLink.current.type ?? response.default);
    }).catch(err => setFeedback({ text: err.message, isError: true }));
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
        // A database type with no configured connection strings (e.g. the
        // config has it as null) — clear the selection, no scary error.
        setConnectionStrings([]);
        setConnectionString('');
        setDatabasesMeta([]);
        setDatabase('');
      });
    listFiles('/etc/' + type + '/templates/')
      .then(files => setSnippets((files ?? []).filter(file => file.endsWith('.sql'))))
      .catch(() => setSnippets([]));
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
        setDatabase(names.includes('magic') ? 'magic' : names[0] ?? '');
      }
    }).catch(() => {
      setDatabasesMeta([]);
      setDatabase('');
    });
  }, [type, connectionString]);

  /*
   * Table → columns map for Ctrl-Space SQL autocomplete.
   */
  const hintTables = useMemo(() => {
    const tables: Record<string, string[]> = {};
    const meta = databasesMeta.find(db => db.name === database);
    for (const table of meta?.tables ?? []) {
      tables[table.name] = (table.columns ?? []).map((column: any) => column.name);
    }
    return tables;
  }, [databasesMeta, database]);

  async function execute() {
    const selection = editorRef.current?.getSelection() ?? '';
    const toExecute = selection !== '' ? selection : sql;
    if (!toExecute.trim()) {
      setFeedback({ text: 'Write some SQL first', isError: true });
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      const batch = type === 'mssql' && toExecute.includes('go');
      const response = await executeSql(
        type, '[' + connectionString + '|' + database + ']', toExecute, safeMode, batch);
      setResult(response ?? []);
      const count = (response ?? []).reduce((total, set) => total + (set?.length ?? 0), 0);
      setFeedback({
        text: response === null
          ? 'SQL executed successfully, no result'
          : count === 200 && safeMode
            ? 'First 200 records returned. Turn off safe mode to return all records.'
            : count + ' records returned',
        isError: false,
      });
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
      setResult(null);
    } finally {
      setBusy(false);
    }
  }

  async function openSnippet(filename: string) {
    if (!filename) {
      return;
    }
    try {
      const text = await loadFile(filename);
      setSql(text);
      setSavedSql(text);
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    }
  }

  async function saveSnippet() {
    const name = await prompt({ title: 'Save SQL snippet', label: 'Snippet name' });
    if (!name) {
      return;
    }
    const filename = '/etc/' + type + '/templates/' + name +
      (name.endsWith('.sql') ? '' : '.sql');
    try {
      await saveFile(filename, sql);
      setSavedSql(sql);
      setFeedback({ text: 'Saved ' + filename, isError: false });
      if (!snippets.includes(filename)) {
        setSnippets([...snippets, filename].sort());
      }
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    }
  }

  function importSqlFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => setSql(String(reader.result ?? ''));
    reader.readAsText(file);
  }

  function exportCsv(rows: any[]) {
    if (rows.length === 0) {
      return;
    }
    const columns = Object.keys(rows[0]);
    const escape = (value: any) => {
      const text = value === null || value === undefined ? '' : String(value);
      return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
    };
    const csv = [columns.join(',')]
      .concat(rows.map(row => columns.map(column => escape(row[column])).join(',')))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'sql-export.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div>
          <h1>SQL Studio</h1>
          <p>Execute SQL towards your databases, and design them</p>
        </div>
        <span style={{ flex: 1 }} />
        <select value={type} onChange={e => setType(e.target.value)}>
          {types.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
        <select value={connectionString} onChange={e => setConnectionString(e.target.value)}>
          {connectionStrings.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
        <select value={database} onChange={e => setDatabase(e.target.value)}>
          {databasesMeta.map((db: any) => (
            <option key={db.name} value={db.name}>{db.name}</option>
          ))}
        </select>
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
      <Tabs
        tabs={[
          { id: 'sql', label: 'SQL' },
          { id: 'tables', label: 'Designer' },
        ]}
        active={view}
        onChange={id => setView(id as 'sql' | 'tables')} />
      {type && connectionStrings.length === 0 && (
        <div className="info-box" style={{ marginBottom: 12 }}>
          No connection strings are configured for {type}. Add one under Databases → External.
        </div>
      )}
      {view === 'tables' && (
        <>
          <div className="toolbar">
            <span className="muted">{tables.length} tables in {database}</span>
            <span className="spacer" />
            <button className="btn btn-secondary btn-small" onClick={() => setNewTable(true)}>
              + New table
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
                    <span style={{ width: 14 }}>
                      {column.primary ? '🔑' : ''}
                    </span>
                    <span style={{ flex: 1 }} className={column.primary ? '' : 'muted'}>
                      {column.name}
                    </span>
                    <span className="muted mono" style={{ fontSize: 12 }}>
                      {column.db}{column.nullable ? '' : ' •'}
                    </span>
                    {!column.primary && (
                      <button
                        className="icon-btn danger col-drop"
                        title="Drop column"
                        onClick={() => dropColumnConfirmed(table.name, column.name)}
                        style={{ padding: 2 }}>
                        <span style={{ fontSize: 12 }}>✕</span>
                      </button>
                    )}
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
                try {
                  await addTable(type, connectionString, database, tableName, pkName, pkType, pkLength);
                  setNewTable(false);
                  setFeedback({ text: 'Table ' + tableName + ' created', isError: false });
                  await reloadSchema();
                } catch (err: any) {
                  setFeedback({ text: err.message, isError: true });
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
                  setFeedback({ text: 'Column ' + payload.columnName + ' added', isError: false });
                  await reloadSchema();
                } catch (err: any) {
                  setFeedback({ text: err.message, isError: true });
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
        <select value="" onChange={e => openSnippet(e.target.value)}>
          <option value="">Load snippet…</option>
          {snippets.map(snippet => (
            <option key={snippet} value={snippet}>
              {snippet.substring(snippet.lastIndexOf('/') + 1)}
            </option>
          ))}
        </select>
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
        <span className="muted">
          Ctrl+Space autocompletes tables and columns — selection executes alone
        </span>
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
        onError={message => setFeedback({ text: message, isError: true })}
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
              onClick={() => exportCsv(resultSet ?? [])}>
              Export as CSV
            </button>
          </div>
          <div className="card" style={{ overflow: 'auto', padding: 0 }}>
            <ResultTable rows={resultSet ?? []} />
          </div>
        </div>
      ))}
    </>
  );
}

function ResultTable({ rows }: { rows: any[] }) {
  if (rows.length === 0) {
    return <div className="muted" style={{ padding: 16 }}>Empty result set</div>;
  }
  const columns = Object.keys(rows[0]);
  return (
    <table>
      <thead>
        <tr>{columns.map(column => <th key={column}>{column}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            {columns.map(column => (
              <td className="mono" key={column}>{formatCell(row[column])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
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
    <Modal onClose={props.onClose}>
      <h2>New table</h2>
      <div className="form-grid">
        <label>Table name
          <input type="text" value={tableName} onChange={e => onTableName(e.target.value)} />
        </label>
        <label>Primary key name
          <input type="text" value={pkName} onChange={e => setPkName(e.target.value)} />
        </label>
        <label>Primary key type
          <select value={pkType} onChange={e => setPkType(e.target.value)}>
            {PK_TYPES.map(option => (
              <option key={option.value} value={option.value}>{option.name}</option>
            ))}
          </select>
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
  const [fieldType, setFieldType] = useState(fieldTypes[0]);
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
    <Modal width={520} onClose={props.onClose}>
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
              <select
                value={fieldType.name}
                onChange={e => {
                  const next = fieldTypes.find(candidate => candidate.name === e.target.value)!;
                  setFieldType(next);
                  if (next.varcharDefault) {
                    setColumnLength(String(next.varcharDefault));
                  }
                }}>
                {fieldTypes.map(candidate => (
                  <option key={candidate.name} value={candidate.name}>{candidate.name}</option>
                ))}
              </select>
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
              <select value={foreignTable} onChange={e => setForeignTable(e.target.value)}>
                <option value="">Select table…</option>
                {props.tables
                  .filter((table: any) => (table.columns ?? []).some((c: any) => c.primary))
                  .map((table: any) => (
                    <option key={table.name} value={table.name}>{table.name}</option>
                  ))}
              </select>
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
