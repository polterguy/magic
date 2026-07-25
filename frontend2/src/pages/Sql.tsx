import { useEffect, useState } from 'react';
import CodeEditor from '../components/CodeEditor';
import { defaultDatabaseType, executeSql, http, listDatabases } from '../lib/api';

export default function Sql() {

  const [types, setTypes] = useState<string[]>([]);
  const [type, setType] = useState('');
  const [connectionStrings, setConnectionStrings] = useState<string[]>([]);
  const [connectionString, setConnectionString] = useState('');
  const [databases, setDatabases] = useState<string[]>([]);
  const [database, setDatabase] = useState('');
  const [sql, setSql] = useState('');
  const [safeMode, setSafeMode] = useState(true);
  const [result, setResult] = useState<any[][] | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    defaultDatabaseType().then(response => {
      setTypes(response.options);
      setType(response.default);
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
        setConnectionString(names.includes('generic') ? 'generic' : names[0] ?? '');
      })
      .catch(err => setFeedback({ text: err.message, isError: true }));
  }, [type]);

  useEffect(() => {
    if (!type || !connectionString) {
      return;
    }
    listDatabases(type, connectionString).then(response => {
      const names = (response.databases ?? []).map((db: any) => db.name);
      setDatabases(names);
      setDatabase(names.includes('magic') ? 'magic' : names[0] ?? '');
    }).catch(err => setFeedback({ text: err.message, isError: true }));
  }, [type, connectionString]);

  async function execute() {
    if (!sql.trim()) {
      setFeedback({ text: 'Write some SQL first', isError: true });
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      const batch = type === 'mssql' && sql.includes('go');
      const response = await executeSql(
        type, '[' + connectionString + '|' + database + ']', sql, safeMode, batch);
      setResult(response ?? []);
      const count = (response ?? []).reduce((total, set) => total + (set?.length ?? 0), 0);
      setFeedback({
        text: response === null
          ? 'SQL executed successfully, no result'
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

  return (
    <>
      <div className="page-header">
        <h1>SQL</h1>
        <p>Execute SQL towards your databases</p>
      </div>
      <div className="toolbar">
        <select value={type} onChange={e => setType(e.target.value)}>
          {types.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
        <select value={connectionString} onChange={e => setConnectionString(e.target.value)}>
          {connectionStrings.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
        <select value={database} onChange={e => setDatabase(e.target.value)}>
          {databases.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={safeMode}
            onChange={e => setSafeMode(e.target.checked)} />
          Safe mode
        </label>
        <span className="spacer" />
        <button className="btn" onClick={execute} disabled={busy}>
          {busy ? 'Running…' : '▷ Run'}
        </button>
      </div>
      {feedback && (
        <div
          className={feedback.isError ? 'error-box' : 'success-box'}
          style={{ marginBottom: 12 }}>
          {feedback.text}
        </div>
      )}
      <div style={{ height: 260, display: 'flex', flexDirection: 'column' }}>
        <CodeEditor value={sql} onChange={setSql} mode="text/x-sql" onExecute={execute} />
      </div>
      {result?.map((resultSet, index) => (
        <div className="card" key={index} style={{ marginTop: 16, overflow: 'auto', padding: 0 }}>
          <ResultTable rows={resultSet ?? []} />
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
