import { copyToClipboard, showToast } from '../lib/toast';
import Select from '../components/Select';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal, useDialog } from '../components/Dialogs';
import Tabs from '../components/Tabs';
import {
  addConnectionString,
  createDatabase,
  deleteConnectionString,
  dropDatabase,
  fileWithTokenUrl,
  listDatabases,
  loadConfig,
  testConnectionString,
  uploadDatabaseBackup,
} from '../lib/api';

const DB_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
const CSTRING_NAME_PATTERN = /^[a-zA-Z0-9_]+$/;

const EXTERNAL_TYPES = [
  { name: 'MySQL', type: 'mysql' },
  { name: 'PostgreSQL', type: 'pgsql' },
  { name: 'SQL Server', type: 'mssql' },
];

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

export default function Databases() {

  const [tab, setTab] = useState<'internal' | 'external'>('internal');

  return (
    <>
      <div className="page-header">
        <h1>Databases</h1>
        <p>Manage your SQLite databases, and connect to external databases</p>
      </div>
      <Tabs
        tabs={[
          { id: 'internal', label: 'Internal (SQLite)' },
          { id: 'external', label: 'External' },
        ]}
        active={tab}
        onChange={id => setTab(id as 'internal' | 'external')} />
      {tab === 'internal' ? <InternalTab /> : <ExternalTab />}
    </>
  );
}

/*
 * Internal SQLite databases — list, create, delete, backup up/down.
 */
function InternalTab() {

  const [databases, setDatabases] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const { prompt } = useDialog();

  const refresh = useCallback(async () => {
    try {
      const response = await listDatabases('sqlite', 'generic');
      setDatabases(response.databases ?? []);
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function show(text: string, isError = false) {
    setFeedback({ text, isError });
  }

  async function create() {
    if (!DB_NAME_PATTERN.test(name)) {
      show('Database names accept alphanumeric characters, - and _', true);
      return;
    }
    setBusy(true);
    try {
      await createDatabase('sqlite', 'generic', name);
      show('Database ' + name + ' created');
      setName('');
      await refresh();
    } catch (err: any) {
      show(err.message, true);
    } finally {
      setBusy(false);
    }
  }

  async function remove(database: string) {
    const typed = await prompt({
      title: 'Delete database?',
      message: 'This cannot be undone. Type the database name to confirm.',
      label: 'Database name',
      confirmText: 'Delete',
    });
    if (typed !== database) {
      if (typed !== null) {
        show('Name did not match — nothing deleted', true);
      }
      return;
    }
    try {
      await dropDatabase('sqlite', 'generic', database);
      show('Database ' + database + ' deleted');
      await refresh();
    } catch (err: any) {
      show(err.message, true);
    }
  }

  async function upload(file: File) {
    if (!file.name.endsWith('.db')) {
      show('Backups must be .db files', true);
      return;
    }
    setBusy(true);
    try {
      await uploadDatabaseBackup(file);
      show('Backup ' + file.name + ' uploaded');
      await refresh();
    } catch (err: any) {
      show(err.message, true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="toolbar">
        {/* A form, so Enter in the name field creates the database. display:contents
            keeps the input and button as direct flex children of the toolbar. */}
        <form
          style={{ display: 'contents' }}
          onSubmit={e => { e.preventDefault(); if (!busy && name) create(); }}>
          <input
            type="text"
            placeholder="New database name…"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ width: 260 }} />
          <button className="btn" type="submit" disabled={busy || !name}>
            Create
          </button>
        </form>
        <span className="spacer" />
        <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
          Upload backup
          <input
            type="file"
            accept=".db"
            style={{ display: 'none' }}
            onChange={e => {
              if (e.target.files?.[0]) {
                upload(e.target.files[0]);
                e.target.value = '';
              }
            }} />
        </label>
      </div>
      {loading && (
        <div className="spinner-panel">
          <div className="spinner" />
          <span className="muted">Loading databases…</span>
        </div>
      )}
      {!loading && (
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th style={{ width: 100 }}>Tables</th>
              <th style={{ width: 320 }}></th>
            </tr>
          </thead>
          <tbody>
            {databases.map(database => (
              <tr key={database.name}>
                <td><strong>{database.name}</strong></td>
                <td data-label="Tables">{database.tables?.length ?? 0}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <Link
                      className="btn btn-secondary btn-small"
                      to={'/sql-studio?dbType=sqlite&dbCString=generic&dbName=' + database.name}>
                      Edit
                    </Link>
                    <a
                      className="btn btn-secondary btn-small"
                      href={fileWithTokenUrl('/data/' + database.name + '.db')}
                      download>
                      Backup
                    </a>
                    <button
                      className="btn btn-danger btn-small"
                      disabled={database.name === 'magic'}
                      onClick={() => remove(database.name)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </>
  );
}

interface ConnectionRow {
  type: string;
  name: string;
  connectionString: string;
  status: 'testing' | 'live' | 'down';
}

/*
 * External databases — connection strings with live status, add/test/delete,
 * and catalog management.
 */
function ExternalTab() {

  const [rows, setRows] = useState<ConnectionRow[]>([]);
  const [type, setType] = useState('mysql');
  const [name, setName] = useState('');
  const [connectionString, setConnectionString] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [managing, setManaging] = useState<string | null>(null);
  const [catalogs, setCatalogs] = useState<{ row: ConnectionRow; list: any[] } | null>(null);
  const { confirm, prompt } = useDialog();

  const refresh = useCallback(async () => {
    try {
      const config = await loadConfig();
      const found: ConnectionRow[] = [];
      for (const dbType of EXTERNAL_TYPES.map(entry => entry.type)) {
        const connections = config?.magic?.databases?.[dbType] ?? {};
        for (const key of Object.keys(connections)) {
          found.push({
            type: dbType,
            name: key,
            connectionString: connections[key],
            status: 'testing',
          });
        }
      }
      setRows(found);
      for (const row of found) {
        testConnectionString(row.type, row.connectionString)
          .then(response => updateStatus(row, response.result === 'success' ? 'live' : 'down'))
          .catch(() => updateStatus(row, 'down'));
      }
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    } finally {
      setLoading(false);
    }
  }, []);

  function updateStatus(row: ConnectionRow, status: 'live' | 'down') {
    setRows(current => current.map(candidate =>
      candidate.type === row.type && candidate.name === row.name
        ? { ...candidate, status }
        : candidate));
  }

  useEffect(() => {
    refresh();
  }, [refresh]);

  function show(text: string, isError = false) {
    setFeedback({ text, isError });
  }

  async function testOrConnect(connectAfter: boolean) {
    if (!name || !connectionString) {
      show('Give the connection a name and a connection string', true);
      return;
    }
    if (!connectionString.includes('{database}')) {
      show('The connection string must contain the {database} placeholder', true);
      return;
    }
    if (!CSTRING_NAME_PATTERN.test(name)) {
      show('Connection names accept alphanumeric characters and _', true);
      return;
    }
    if (rows.some(row => row.type === type && row.name === name)) {
      show('That name is already in use for ' + type, true);
      return;
    }
    setBusy(true);
    try {
      const test = await testConnectionString(type, connectionString);
      if (test.result !== 'success') {
        show(test.message ?? 'Could not connect', true);
        return;
      }
      if (!connectAfter) {
        show('Connection succeeded');
        return;
      }
      let useAsDefault = false;
      if (name === 'generic') {
        useAsDefault = await confirm({
          title: 'Use as default database?',
          message: 'Should this connection become your default database?',
          confirmText: 'Yes',
        });
      }
      await addConnectionString(type, name, connectionString, useAsDefault);
      show('Connected — ' + name + ' added');
      setName('');
      setConnectionString('');
      await refresh();
    } catch (err: any) {
      show(err.message, true);
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: ConnectionRow) {
    const typed = await prompt({
      title: 'Delete connection?',
      message: 'Type the connection name to confirm.',
      label: 'Connection name',
      confirmText: 'Delete',
    });
    if (typed !== row.name) {
      if (typed !== null) {
        show('Name did not match — nothing deleted', true);
      }
      return;
    }
    try {
      await deleteConnectionString(row.type, row.name);
      show('Connection ' + row.name + ' deleted');
      await refresh();
    } catch (err: any) {
      show(err.message, true);
    }
  }

  async function createCatalog(row: ConnectionRow) {
    const catalogName = await prompt({
      title: 'Create catalog',
      message: row.type + ' — ' + row.name,
      label: 'Catalog name',
      confirmText: 'Create',
    });
    if (!catalogName) {
      return;
    }
    if (!CSTRING_NAME_PATTERN.test(catalogName)) {
      show('Catalog names accept alphanumeric characters and _', true);
      return;
    }
    try {
      await createDatabase(row.type, row.name, catalogName);
      show('Catalog ' + catalogName + ' created');
    } catch (err: any) {
      show(err.message, true);
    }
  }

  async function manageCatalogs(row: ConnectionRow) {
    setManaging(row.type + '/' + row.name);
    try {
      const response = await listDatabases(row.type, row.name);
      setCatalogs({ row, list: response.databases ?? [] });
    } catch (err: any) {
      show(err.message, true);
    } finally {
      setManaging(null);
    }
  }

  async function removeCatalog(row: ConnectionRow, catalog: string) {
    const typed = await prompt({
      title: 'Delete catalog?',
      message: 'Type the catalog name to confirm.',
      label: 'Catalog name',
      confirmText: 'Delete',
    });
    if (typed !== catalog) {
      if (typed !== null) {
        show('Name did not match — nothing deleted', true);
      }
      return;
    }
    try {
      await dropDatabase(row.type, row.name, catalog);
      await manageCatalogs(row);
    } catch (err: any) {
      show(err.message, true);
    }
  }

  return (
    <>
      <div className="toolbar">
        <Select value={type} onChange={value => setType(value)}>
          {EXTERNAL_TYPES.map(entry => (
            <option key={entry.type} value={entry.type}>{entry.name}</option>
          ))}
        </Select>
        <input
          type="text"
          placeholder="Name…"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ width: 140 }} />
        <input
          type="text"
          placeholder="Connection string with {database} placeholder…"
          value={connectionString}
          onChange={e => setConnectionString(e.target.value)}
          style={{ flex: 1 }} />
        <button className="btn btn-secondary" onClick={() => testOrConnect(false)} disabled={busy}>
          Test
        </button>
        <button className="btn" onClick={() => testOrConnect(true)} disabled={busy}>
          Connect
        </button>
      </div>
      {loading && (
        <div className="spinner-panel">
          <div className="spinner" />
          <span className="muted">Loading connections…</span>
        </div>
      )}
      {!loading && (
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: 90 }}>Type</th>
              <th style={{ width: 140 }}>Name</th>
              <th>Connection string</th>
              <th style={{ width: 90 }}>Status</th>
              <th style={{ width: 330 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  You have not connected to any external databases.
                </td>
              </tr>
            )}
            {rows.map(row => (
              <tr key={row.type + '/' + row.name}>
                <td data-label="Type">{row.type}</td>
                <td data-label="Name"><strong>{row.name}</strong></td>
                <td className="mono" data-label="Connection">{row.connectionString}</td>
                <td data-label="Status">
                  <span className={'badge ' +
                    (row.status === 'live' ? 'badge-get'
                      : row.status === 'down' ? 'badge-error' : 'badge-debug')}>
                    {row.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-secondary btn-small"
                      disabled={row.status !== 'live' || managing !== null}
                      onClick={() => manageCatalogs(row)}>
                      {managing === row.type + '/' + row.name ? 'Loading…' : 'Manage'}
                    </button>
                    <button
                      className="btn btn-secondary btn-small"
                      disabled={row.status !== 'live'}
                      onClick={() => createCatalog(row)}>
                      + Catalog
                    </button>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => {
                        copyToClipboard(row.connectionString, 'The connection string');
                        show('Connection string copied');
                      }}>
                      Copy
                    </button>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => remove(row)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
      {catalogs && (
        <Modal width={700} onClose={() => setCatalogs(null)}>
          <h2>Catalogs — {catalogs.row.name} ({catalogs.row.type})</h2>
          <div style={{ maxHeight: '55vh', overflow: 'auto' }}>
            <table>
              <thead>
                <tr><th>Name</th><th style={{ width: 100 }}>Tables</th><th style={{ width: 200 }}></th></tr>
              </thead>
              <tbody>
                {catalogs.list.map(catalog => (
                  <tr key={catalog.name}>
                    <td><strong>{catalog.name}</strong></td>
                    <td data-label="Tables">{catalog.tables?.length ?? 0}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <Link
                          className="btn btn-secondary btn-small"
                          to={'/sql-studio?dbType=' + catalogs.row.type +
                            '&dbCString=' + catalogs.row.name +
                            '&dbName=' + catalog.name}
                          onClick={() => setCatalogs(null)}>
                          Edit
                        </Link>
                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => removeCatalog(catalogs.row, catalog.name)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setCatalogs(null)}>Close</button>
          </div>
        </Modal>
      )}
    </>
  );
}
