import { fileWithTokenUrl } from '@shared/api';
import { httpUrl } from '@shared/auth/backend';
import AiWaiter from '@shared/ui/AiWaiter';
import FeatureLink from '@shared/ui/FeatureLink';
import { TableSkeleton } from '@shared/ui/Skeleton';

import { useSqliteDatabases } from '../hooks/useSqliteDatabases';
import { sqlStudioQuery } from '../lib/connections';

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
                      <FeatureLink
                        feature="sql"
                        suffix={sqlStudioQuery('sqlite', 'generic', database.name)}
                        className="btn btn-secondary btn-small"
                      >
                        Edit
                      </FeatureLink>
                      <a
                        className="btn btn-secondary btn-small"
                        href={httpUrl(fileWithTokenUrl('/data/' + database.name + '.db'))}
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
