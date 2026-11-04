import type { TableMeta } from '../../lib/api';
import type { SchemaDesigner } from './hooks/useSchemaDesigner';
import AddColumnDialog from './AddColumnDialog';
import DdlDialog from './DdlDialog';
import DesignerToolbar from './DesignerToolbar';
import NewTableDialog from './NewTableDialog';
import TableCard from './TableCard';

/*
 * The Designer tab — the selected database's tables as cards, with the
 * dialogs that change them.
 */
export default function DesignerView(
  props: Readonly<{
    type: string;
    connectionString: string;
    database: string;
    tables: TableMeta[];
    designer: SchemaDesigner;
  }>,
) {
  const { type, connectionString, database, tables, designer } = props;
  const { ddl, setDdl, newTable, setNewTable, addingColumn, setAddingColumn } = designer;
  return (
    <>
      <DesignerToolbar
        tables={tables}
        database={database}
        connectionString={connectionString}
        onNewTable={() => setNewTable(true)}
        onImportCsv={designer.importCsv}
        onFlushCache={designer.flushCache}
        onViewDdl={designer.viewDdl}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 14,
          overflow: 'auto',
        }}
      >
        {tables.map(table => (
          <TableCard
            key={table.name}
            table={table}
            onAddColumn={() => setAddingColumn(table.name)}
            onViewDdl={() => designer.viewDdl([table.name], false, table.name + ' — DDL')}
            onDropTable={() => designer.dropTableConfirmed(table.name)}
            onDropColumn={columnName => designer.dropColumnConfirmed(table.name, columnName)}
          />
        ))}
      </div>
      {newTable && (
        <NewTableDialog onClose={() => setNewTable(false)} onCreate={designer.createTable} />
      )}
      {addingColumn && (
        <AddColumnDialog
          databaseType={type}
          tableName={addingColumn}
          tables={tables}
          onClose={() => setAddingColumn(null)}
          onSubmit={payload => designer.submitColumn(addingColumn, payload)}
        />
      )}
      {ddl && <DdlDialog ddl={ddl} onClose={() => setDdl(null)} />}
    </>
  );
}
