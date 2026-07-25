import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type CodeMirror from 'codemirror';
import CodeEditor from '../components/CodeEditor';
import { Modal, useDialog } from '../components/Dialogs';
import Tabs from '../components/Tabs';
import {
  defaultDatabaseType,
  executeSql,
  exportDdl,
  http,
  listDatabases,
  listFiles,
  loadFile,
  saveFile,
} from '../lib/api';

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
  const [safeMode, setSafeMode] = useState(true);
  const [result, setResult] = useState<any[][] | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [snippets, setSnippets] = useState<string[]>([]);
  const [view, setView] = useState<'sql' | 'tables'>('sql');
  const [ddl, setDdl] = useState<{ title: string; sql: string } | null>(null);
  const editorRef = useRef<CodeMirror.Editor | null>(null);
  const { prompt } = useDialog();

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
        const names = Object.keys(response);
        setConnectionStrings(names);
        const wanted = deepLink.current.connectionString;
        deepLink.current.connectionString = null;
        if (wanted && names.includes(wanted)) {
          setConnectionString(wanted);
        } else {
          setConnectionString(names.includes('generic') ? 'generic' : names[0] ?? '');
        }
      })
      .catch(err => setFeedback({ text: err.message, isError: true }));
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
    }).catch(err => setFeedback({ text: err.message, isError: true }));
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
      setSql(await loadFile(filename));
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
          <p>Execute SQL towards your databases</p>
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
        <button className="btn" onClick={execute} disabled={busy}>
          {busy ? 'Running…' : '▷ Run'}
        </button>
      </div>
      <Tabs
        tabs={[
          { id: 'sql', label: 'SQL' },
          { id: 'tables', label: 'Tables' },
        ]}
        active={view}
        onChange={id => setView(id as 'sql' | 'tables')} />
      {view === 'tables' && (
        <>
          <div className="toolbar">
            <span className="muted">
              {(databasesMeta.find(db => db.name === database)?.tables ?? []).length}
              {' tables in '}{database}
            </span>
            <span className="spacer" />
            <button
              className="btn btn-secondary btn-small"
              onClick={() => viewDdl(
                (databasesMeta.find(db => db.name === database)?.tables ?? [])
                  .map((table: any) => table.name),
                true,
                database + ' — full DDL')}>
              Database DDL
            </button>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 14,
            overflow: 'auto',
          }}>
            {(databasesMeta.find(db => db.name === database)?.tables ?? []).map((table: any) => (
              <div className="card" key={table.name} style={{ padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <strong style={{ flex: 1 }}>{table.name}</strong>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => viewDdl([table.name], false, table.name + ' — DDL')}>
                    DDL
                  </button>
                </div>
                {(table.columns ?? []).map((column: any) => (
                  <div
                    key={column.name}
                    style={{ display: 'flex', gap: 6, fontSize: 13, padding: '2px 0' }}>
                    <span style={{ width: 14 }}>
                      {column.primary ? '🔑' : ''}
                    </span>
                    <span style={{ flex: 1 }} className={column.primary ? '' : 'muted'}>
                      {column.name}
                    </span>
                    <span className="muted mono" style={{ fontSize: 12 }}>
                      {column.db}{column.nullable ? '' : ' •'}
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
          {ddl && (
            <Modal width={760} onClose={() => setDdl(null)}>
              <h2>{ddl.title}</h2>
              <div style={{ height: '55vh', display: 'flex', flexDirection: 'column' }}>
                <CodeEditor value={ddl.sql} mode="text/x-sql" readOnly />
              </div>
              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => navigator.clipboard.writeText(ddl.sql)}>
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
      {feedback && (
        <div
          className={feedback.isError ? 'error-box' : 'success-box'}
          style={{ marginBottom: 12 }}>
          {feedback.text}
        </div>
      )}
      <div style={{ height: 260, display: 'flex', flexDirection: 'column' }}>
        <CodeEditor
          value={sql}
          onChange={setSql}
          mode="text/x-sql"
          onExecute={execute}
          hintTables={hintTables}
          onInstance={instance => { editorRef.current = instance; }} />
      </div>
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
