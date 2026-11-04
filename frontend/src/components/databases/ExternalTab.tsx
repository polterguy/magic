import AiWaiter from '../AiWaiter';
import CatalogsDialog from './CatalogsDialog';
import ConnectionForm from './ConnectionForm';
import ConnectionsTable from './ConnectionsTable';
import { useCatalogs } from './hooks/useCatalogs';
import { useExternalConnections } from './hooks/useExternalConnections';

/*
 * External databases — connection strings with live status, add/test/delete,
 * and catalog management.
 */
export default function ExternalTab() {
  const connections = useExternalConnections();
  const { managing, catalogs, setCatalogs, createCatalog, manageCatalogs, removeCatalog } =
    useCatalogs(connections.setBusy);

  return (
    <>
      <ConnectionForm
        type={connections.type}
        onTypeChange={connections.setType}
        name={connections.name}
        onNameChange={connections.setName}
        connectionString={connections.connectionString}
        onConnectionStringChange={connections.setConnectionString}
        busy={connections.busy}
        onTestOrConnect={connections.testOrConnect}
      />
      <ConnectionsTable
        rows={connections.rows}
        loading={connections.loading}
        managing={managing}
        onManage={manageCatalogs}
        onCreateCatalog={createCatalog}
        onRemove={connections.remove}
      />
      {catalogs && (
        <CatalogsDialog
          catalogs={catalogs}
          onClose={() => setCatalogs(null)}
          onRemove={removeCatalog}
        />
      )}
      {connections.busy && <AiWaiter />}
    </>
  );
}
