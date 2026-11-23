import type { DatabaseMeta } from '@shared/api';
import { Modal } from '@shared/ui/Dialogs';
import FeatureLink from '@shared/ui/FeatureLink';

import { type ConnectionRow, sqlStudioQuery } from '../lib/connections';

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
    <Modal
      size="lg"
      onClose={props.onClose}
      title="Catalogs"
      subtitle={'The databases of ' + catalogs.row.name + ' (' + catalogs.row.type + ').'}
      actions={
        <button className="btn" onClick={props.onClose}>
          Close
        </button>
      }
    >
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
                  <FeatureLink
                    feature="sql"
                    suffix={sqlStudioQuery(catalogs.row.type, catalogs.row.name, catalog.name)}
                    className="btn btn-secondary btn-small"
                    onClick={props.onClose}
                  >
                    Edit
                  </FeatureLink>
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
    </Modal>
  );
}
