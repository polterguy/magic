import { useCallback, useEffect, useState } from 'react';
import { showToast } from '../../../lib/toast';
import { showError } from '../../../lib/errors';
import { useDialog } from '../../../lib/useDialog';
import {
  type DatabaseMeta,
  createDatabase,
  dropDatabase,
  listDatabases,
  uploadDatabaseBackup,
} from '../../../lib/api';
import { DB_NAME_PATTERN } from '../connections';

/*
 * Internal SQLite databases — list, create, delete, backup up/down.
 */
export function useSqliteDatabases() {
  const [databases, setDatabases] = useState<DatabaseMeta[]>([]);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const { prompt } = useDialog();

  const refresh = useCallback(
    () =>
      listDatabases('sqlite', 'generic')
        .then(response => setDatabases(response.databases ?? []))
        .catch((err: unknown) => showError(err))
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function create() {
    if (!DB_NAME_PATTERN.test(name)) {
      showToast('Database names accept alphanumeric characters, - and _', true);
      return;
    }
    setBusy(true);
    try {
      await createDatabase('sqlite', 'generic', name);
      showToast('Database ' + name + ' created');
      setName('');
      await refresh();
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  async function remove(database: string) {
    const typed = await prompt({
      title: 'Delete database?',
      message: 'This cannot be undone. Type the database name to confirm.',
      label: 'Database name',
      confirmText: 'Delete',
    });
    if (typed !== database) {
      if (typed !== null) {
        showToast('Name did not match — nothing deleted', true);
      }
      return;
    }
    setBusy(true);
    try {
      await dropDatabase('sqlite', 'generic', database);
      showToast('Database ' + database + ' deleted');
      await refresh();
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  async function upload(file: File) {
    if (!file.name.endsWith('.db')) {
      showToast('Backups must be .db files', true);
      return;
    }
    setBusy(true);
    try {
      await uploadDatabaseBackup(file);
      showToast('Backup ' + file.name + ' uploaded');
      await refresh();
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  return { databases, name, setName, busy, loading, create, remove, upload };
}
