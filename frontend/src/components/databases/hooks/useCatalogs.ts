import { useState } from 'react';
import { showToast } from '../../../lib/toast';
import { showError } from '../../../lib/errors';
import { useDialog } from '../../../lib/useDialog';
import { type DatabaseMeta, createDatabase, dropDatabase, listDatabases } from '../../../lib/api';
import { CSTRING_NAME_PATTERN, type ConnectionRow } from '../connections';

/*
 * Catalog management on an external connection — create, list and delete
 * the databases it holds.
 */
export function useCatalogs(setBusy: (busy: boolean) => void) {
  const [managing, setManaging] = useState<string | null>(null);
  const [catalogs, setCatalogs] = useState<{ row: ConnectionRow; list: DatabaseMeta[] } | null>(
    null,
  );
  const { prompt } = useDialog();

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
      showToast('Catalog names accept alphanumeric characters and _', true);
      return;
    }
    setBusy(true);
    try {
      await createDatabase(row.type, row.name, catalogName);
      showToast('Catalog ' + catalogName + ' created');
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  async function manageCatalogs(row: ConnectionRow) {
    setManaging(row.type + '/' + row.name);
    try {
      const response = await listDatabases(row.type, row.name);
      setCatalogs({ row, list: response.databases ?? [] });
    } catch (err) {
      showError(err);
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
        showToast('Name did not match — nothing deleted', true);
      }
      return;
    }
    setBusy(true);
    try {
      await dropDatabase(row.type, row.name, catalog);
      await manageCatalogs(row);
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  return { managing, catalogs, setCatalogs, createCatalog, manageCatalogs, removeCatalog };
}
