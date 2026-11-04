import { Link } from 'react-router-dom';
import { Modal } from '../Dialogs';
import type { DatabaseMeta } from '../../lib/api';
import { type ConnectionRow, sqlStudioUrl } from './connections';

// The catalogs (databases) of one external connection.
export default function CatalogsDialog(
  props: Readonly<{
    catalogs: { row: ConnectionRow; list: DatabaseMeta[] };
    onClose: () => void;
    onRemove: (row: ConnectionRow, catalog: string) => void;
  }>,
) {
  const { catalogs } = props;
  return (
    <Modal width={700} onClose={props.onClose}>
      <h2>
        Catalogs — {catalogs.row.name} ({catalogs.row.type})
      </h2>
      <div style={{ maxHeight: '55vh', overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th style={{ width: 100 }}>Tables</th>
              <th style={{ width: 200 }}></th>
            </tr>
          </thead>
          <tbody>
            {catalogs.list.map(catalog => (
              <tr key={catalog.name}>
                <td>
                  <strong>{catalog.name}</strong>
                </td>
                <td data-label="Tables">{catalog.tables?.length ?? 0}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <Link
                      className="btn btn-secondary btn-small"
                      to={sqlStudioUrl(catalogs.row.type, catalogs.row.name, catalog.name)}
                      onClick={props.onClose}
                    >
                      Edit
                    </Link>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => props.onRemove(catalogs.row, catalog.name)}
                    >
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
        <button className="btn" onClick={props.onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
}
