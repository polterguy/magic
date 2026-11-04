import { copyToClipboard, showToast } from '../../lib/toast';
import { TableSkeleton } from '../Skeleton';
import { type ConnectionRow, statusBadge } from './connections';

// The external connection strings, each with its live status and actions.
export default function ConnectionsTable(
  props: Readonly<{
    rows: ConnectionRow[];
    loading: boolean;
    managing: string | null;
    onManage: (row: ConnectionRow) => void;
    onCreateCatalog: (row: ConnectionRow) => void;
    onRemove: (row: ConnectionRow) => void;
  }>,
) {
  const { rows, loading, managing } = props;
  return (
    <div className="card" style={{ padding: 0, overflow: 'auto' }}>
      {loading ? (
        <TableSkeleton columns={5} />
      ) : (
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
                <td data-label="Name">
                  <strong>{row.name}</strong>
                </td>
                <td className="mono" data-label="Connection">
                  {row.connectionString}
                </td>
                <td data-label="Status">
                  <span className={statusBadge(row.status)}>{row.status}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-secondary btn-small"
                      disabled={row.status !== 'live' || managing !== null}
                      onClick={() => props.onManage(row)}
                    >
                      {managing === row.type + '/' + row.name ? 'Loading…' : 'Manage'}
                    </button>
                    <button
                      className="btn btn-secondary btn-small"
                      disabled={row.status !== 'live'}
                      onClick={() => props.onCreateCatalog(row)}
                    >
                      + Catalog
                    </button>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => {
                        void copyToClipboard(row.connectionString, 'The connection string');
                        showToast('Connection string copied');
                      }}
                    >
                      Copy
                    </button>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => props.onRemove(row)}
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
  );
}
