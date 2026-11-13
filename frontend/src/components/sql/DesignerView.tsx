import { useMemo, useState } from 'react';

import type { TableMeta } from '../../lib/api';
import AddColumnDialog from './AddColumnDialog';
import DdlDialog from './DdlDialog';
import DesignerToolbar from './DesignerToolbar';
import type { SchemaDesigner } from './hooks/useSchemaDesigner';
import NewTableDialog from './NewTableDialog';
import { filterTables } from './schema';
import TableCard, { type ColumnTarget } from './TableCard';

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
  const [filter, setFilter] = useState('');
  const shown = filterTables(tables, filter);
  const knownTables = useMemo(() => new Set(tables.map(table => table.name)), [tables]);
  /*
   * Where a clicked reference points. A fresh object per click, so clicking the same reference
   * again scrolls and highlights again.
   */
  const [target, setTarget] = useState<{ table: string; column: ColumnTarget } | null>(null);

  function openTable(tableName: string, columnName: string) {
    // A filter that hides the target would leave nothing to go to.
    if (!shown.some(table => table.name === tableName)) {
      setFilter('');
    }
    setTarget({ table: tableName, column: { column: columnName } });
  }

  return (
    <>
      <DesignerToolbar
        tables={tables}
        shownCount={shown.length}
        filter={filter}
        onFilterChange={setFilter}
        database={database}
        connectionString={connectionString}
        onNewTable={() => setNewTable(true)}
        onImportCsv={designer.importCsv}
        onFlushCache={designer.flushCache}
        onViewDdl={designer.viewDdl}
      />
      {tables.length === 0 && (
        <p className="schema-empty">
          {database ? 'No tables in ' + database + ' yet. Create one with New table.' : ''}
        </p>
      )}
      {tables.length > 0 && shown.length === 0 && (
        <p className="schema-empty">No tables or columns match “{filter.trim()}”.</p>
      )}
      <div className="schema-grid">
        {shown.map(table => (
          <TableCard
            key={table.name}
            table={table}
            onAddColumn={() => setAddingColumn(table.name)}
            onViewDdl={() => designer.viewDdl([table.name], false, table.name + ' — DDL')}
            onDropTable={() => designer.dropTableConfirmed(table.name)}
            onDropColumn={columnName => designer.dropColumnConfirmed(table.name, columnName)}
            knownTables={knownTables}
            onOpenTable={openTable}
            target={target?.table === table.name ? target.column : null}
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
