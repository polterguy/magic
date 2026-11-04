import { useState } from 'react';
import { showToast } from '../../../lib/toast';
import { showError } from '../../../lib/errors';
import { useDialog } from '../../../lib/useDialog';
import {
  addColumn,
  addForeignKey,
  addTable,
  dropColumn,
  dropTable,
  exportDdl,
  flushSchemaCache,
  importCsvFile,
} from '../../../lib/api';
import type { ColumnPayload } from '../schema';

/*
 * The Designer's schema changes — new tables and columns, drops, CSV imports,
 * DDL exports and flushing the server's schema cache.
 */
export function useSchemaDesigner(
  options: Readonly<{
    type: string;
    connectionString: string;
    database: string;
    reloadSchema: () => Promise<void>;
    setWaiting: (waiting: boolean) => void;
  }>,
) {
  const { type, connectionString, database, reloadSchema, setWaiting } = options;
  const [ddl, setDdl] = useState<{ title: string; sql: string } | null>(null);
  const [newTable, setNewTable] = useState(false);
  const [addingColumn, setAddingColumn] = useState<string | null>(null);
  const { confirm, confirmTyped } = useDialog();

  async function flushCache() {
    if (
      !(await confirm({
        title: 'Flush server-side cache?',
        message:
          'This clears the cached database schema on the server, then reloads the ' +
          'page so the dashboard picks up the fresh schema everywhere. Any unsaved changes ' +
          'in the editor will be lost.',
        confirmText: 'Flush and reload',
      }))
    ) {
      return;
    }
    setWaiting(true);
    try {
      await flushSchemaCache(type, connectionString);
      window.location.reload();
    } catch (err) {
      showError(err);
      setWaiting(false);
    }
  }

  async function importCsv(file: File) {
    setWaiting(true);
    try {
      await importCsvFile(type, connectionString, database, file);
      showToast('Importing ' + file.name + " — you'll be notified when it completes");
    } catch (err) {
      showError(err);
    } finally {
      setWaiting(false);
    }
  }

  async function dropTableConfirmed(tableName: string) {
    if (
      !(await confirmTyped({
        title: 'Drop table?',
        message: 'This permanently deletes ' + tableName + '. Type the table name to confirm.',
        label: 'Table name',
        expected: tableName,
        confirmText: 'Drop',
        mismatch: 'Name did not match — nothing dropped',
      }))
    ) {
      return;
    }
    setWaiting(true);
    try {
      await dropTable(type, connectionString, database, tableName);
      showToast('Table ' + tableName + ' dropped');
      await reloadSchema();
    } catch (err) {
      showError(err);
    } finally {
      setWaiting(false);
    }
  }

  async function dropColumnConfirmed(tableName: string, columnName: string) {
    if (
      !(await confirm({
        title: 'Drop column?',
        message: tableName + '.' + columnName + ' will be permanently removed.',
        confirmText: 'Drop',
        danger: true,
      }))
    ) {
      return;
    }
    setWaiting(true);
    try {
      await dropColumn(type, connectionString, database, tableName, columnName);
      showToast('Column ' + columnName + ' dropped');
      await reloadSchema();
    } catch (err) {
      showError(err);
    } finally {
      setWaiting(false);
    }
  }

  async function viewDdl(tables: string[], full: boolean, title: string) {
    setWaiting(true);
    try {
      const response = await exportDdl(type, connectionString, database, tables, full);
      setDdl({ title, sql: response.result });
    } catch (err) {
      showError(err);
    } finally {
      setWaiting(false);
    }
  }

  async function createTable(tableName: string, pkName: string, pkType: string, pkLength: number) {
    setWaiting(true);
    try {
      await addTable(type, connectionString, database, tableName, pkName, pkType, pkLength);
      setNewTable(false);
      showToast('Table ' + tableName + ' created');
      await reloadSchema();
    } catch (err) {
      showError(err);
    } finally {
      setWaiting(false);
    }
  }

  // Adds to the table whose add-column dialog is open.
  async function submitColumn(tableName: string, payload: ColumnPayload) {
    setWaiting(true);
    try {
      const target = {
        databaseType: type,
        connectionString,
        databaseName: database,
        tableName,
      };
      if (payload.foreignTable) {
        await addForeignKey(target, { ...payload, foreignTable: payload.foreignTable });
      } else {
        await addColumn(target, payload);
      }
      setAddingColumn(null);
      showToast('Column ' + payload.columnName + ' added');
      await reloadSchema();
    } catch (err) {
      showError(err);
    } finally {
      setWaiting(false);
    }
  }

  return {
    ddl,
    setDdl,
    newTable,
    setNewTable,
    addingColumn,
    setAddingColumn,
    flushCache,
    importCsv,
    dropTableConfirmed,
    dropColumnConfirmed,
    viewDdl,
    createTable,
    submitColumn,
  };
}

export type SchemaDesigner = ReturnType<typeof useSchemaDesigner>;
