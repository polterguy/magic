import { useCallback, useEffect, useState } from 'react';
import { showToast } from '../../../lib/toast';
import { showError } from '../../../lib/errors';
import { useDialog } from '../../../lib/useDialog';
import {
  addConnectionString,
  deleteConnectionString,
  loadConfig,
  testConnectionString,
} from '../../../lib/api';
import { type ConnectionRow, connectionError, connectionRows, withStatus } from '../connections';

/*
 * External databases — connection strings with live status, and adding,
 * testing and deleting them.
 */
export function useExternalConnections() {
  const [rows, setRows] = useState<ConnectionRow[]>([]);
  const [type, setType] = useState('mysql');
  const [name, setName] = useState('');
  const [connectionString, setConnectionString] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const { confirm, prompt } = useDialog();

  const refresh = useCallback(
    () =>
      loadConfig()
        .then(config => {
          const found = connectionRows(config);
          setRows(found);
          const updateStatus = (row: ConnectionRow, status: 'live' | 'down') => {
            setRows(current => withStatus(current, row, status));
          };
          for (const row of found) {
            testConnectionString(row.type, row.connectionString)
              .then(response => updateStatus(row, response.result === 'success' ? 'live' : 'down'))
              .catch(() => updateStatus(row, 'down'));
          }
        })
        .catch((err: unknown) => showError(err))
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function testOrConnect(connectAfter: boolean) {
    const error = connectionError(type, name, connectionString, rows);
    if (error) {
      showToast(error, true);
      return;
    }
    setBusy(true);
    try {
      const test = await testConnectionString(type, connectionString);
      if (test.result !== 'success') {
        showToast(test.message ?? 'Could not connect', true);
        return;
      }
      if (!connectAfter) {
        showToast('Connection succeeded');
        return;
      }
      let useAsDefault = false;
      if (name === 'generic') {
        useAsDefault = await confirm({
          title: 'Use as default database?',
          message: 'Should this connection become your default database?',
          confirmText: 'Yes',
        });
      }
      await addConnectionString(type, name, connectionString, useAsDefault);
      showToast('Connected — ' + name + ' added');
      setName('');
      setConnectionString('');
      await refresh();
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: ConnectionRow) {
    const typed = await prompt({
      title: 'Delete connection?',
      message: 'Type the connection name to confirm.',
      label: 'Connection name',
      confirmText: 'Delete',
    });
    if (typed !== row.name) {
      if (typed !== null) {
        showToast('Name did not match — nothing deleted', true);
      }
      return;
    }
    setBusy(true);
    try {
      await deleteConnectionString(row.type, row.name);
      showToast('Connection ' + row.name + ' deleted');
      await refresh();
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  return {
    rows,
    type,
    setType,
    name,
    setName,
    connectionString,
    setConnectionString,
    busy,
    setBusy,
    loading,
    testOrConnect,
    remove,
  };
}
