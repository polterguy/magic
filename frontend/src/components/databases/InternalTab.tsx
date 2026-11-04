import { Link } from 'react-router-dom';

import { fileWithTokenUrl } from '../../lib/api';
import AiWaiter from '../AiWaiter';
import { TableSkeleton } from '../Skeleton';
import { sqlStudioUrl } from './connections';
import { useSqliteDatabases } from './hooks/useSqliteDatabases';

/*
 * Internal SQLite databases — list, create, delete, backup up/down.
 */
export default function InternalTab() {
  const { databases, name, setName, busy, loading, create, remove, upload } = useSqliteDatabases();

  return (
    <>
      <div className="toolbar">
        {/* A form, so Enter in the name field creates the database. display:contents
            keeps the input and button as direct flex children of the toolbar. */}
        <form
          style={{ display: 'contents' }}
          onSubmit={e => {
            e.preventDefault();
            if (!busy && name) void create();
          }}
        >
          <input
            type="text"
            placeholder="New database name…"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ width: 260 }}
          />
          <button className="btn" type="submit" disabled={busy || !name}>
            Create
          </button>
        </form>
        <span className="spacer" />
        <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
          Upload backup{' '}
          <input
            type="file"
            accept=".db"
            style={{ display: 'none' }}
            onChange={e => {
              if (e.target.files?.[0]) {
                void upload(e.target.files[0]);
                e.target.value = '';
              }
            }}
          />
        </label>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        {loading ? (
          <TableSkeleton columns={3} />
        ) : (
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
                  <td>
                    <strong>{database.name}</strong>
                  </td>
                  <td data-label="Tables">{database.tables?.length ?? 0}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <Link
                        className="btn btn-secondary btn-small"
                        to={sqlStudioUrl('sqlite', 'generic', database.name)}
                      >
                        Edit
                      </Link>
                      <a
                        className="btn btn-secondary btn-small"
                        href={fileWithTokenUrl('/data/' + database.name + '.db')}
                        download
                      >
                        Backup
                      </a>
                      <button
                        className="btn btn-danger btn-small"
                        disabled={database.name === 'magic'}
                        onClick={() => remove(database.name)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {busy && <AiWaiter />}
    </>
  );
}
