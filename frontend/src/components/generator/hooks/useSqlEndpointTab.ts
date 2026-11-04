import { useEffect, useMemo, useState } from 'react';
import { showToast } from '../../../lib/toast';
import { showError } from '../../../lib/errors';
import { useEditToken } from '../../../lib/editor';
import {
  buildSqlAiContext,
  sqlHintTables,
  useDatabaseSelection,
  useSqlSnippets,
} from '../../../lib/sql';
import { customSqlEndpoint, listRoles, loadFile } from '../../../lib/api';

// SqlEndpointTab's state: the database, the endpoint's name and arguments, its SQL, and generating it.
export function useSqlEndpointTab() {
  const selection = useDatabaseSelection();
  const [roles, setRoles] = useState<string[]>([]);
  const [auth, setAuth] = useState<string[]>(['root', 'admin']);
  const [authOpen, setAuthOpen] = useState(false);
  const [verb, setVerb] = useState('get');
  const [moduleName, setModuleName] = useState('');
  const [endpointName, setEndpointName] = useState('custom-sql');
  const [args, setArgs] = useState<{ name: string; type: string }[]>([]);
  const [sql, setSql] = useState('');
  const [sqlEditId, bumpSqlEditId] = useEditToken();
  const [overwrite, setOverwrite] = useState(false);
  const [busy, setBusy] = useState(false);
  // The same saved-snippets folder SQL Studio reads and writes.
  const { snippets } = useSqlSnippets(selection.type);

  useEffect(() => {
    listRoles()
      .then(list => setRoles((list ?? []).map(role => role.name)))
      .catch(() => {});
  }, []);

  async function openSnippet(filename: string) {
    if (!filename) {
      return;
    }
    try {
      setSql(await loadFile(filename));
      bumpSqlEditId();
    } catch (err) {
      showError(err);
    }
  }

  function importSqlFile(file: File) {
    void file.text().then(text => {
      setSql(text);
      bumpSqlEditId();
    });
  }

  // The module name follows the selected database, adjusted during render when it changes.
  const [moduleNameFor, setModuleNameFor] = useState('');
  if (moduleNameFor !== selection.database) {
    setModuleNameFor(selection.database);
    if (selection.database) {
      setModuleName(selection.database);
    }
  }

  const hintTables = useMemo(() => sqlHintTables(selection.selectedMeta), [selection.selectedMeta]);

  function createAiContext() {
    return buildSqlAiContext({
      type: selection.type,
      connectionString: selection.connectionString,
      database: selection.database,
      tables: selection.selectedMeta?.tables ?? [],
      sql,
      args,
    });
  }

  async function generate() {
    if (!sql.trim() || !moduleName || !endpointName) {
      showToast('Provide SQL, a module name, and an endpoint name', true);
      return;
    }
    setBusy(true);
    try {
      await customSqlEndpoint({
        databaseType: selection.type,
        database: selection.database,
        authorization: auth.join(','),
        moduleName,
        endpointName,
        verb,
        sql,
        arguments: args
          .filter(argument => argument.name)
          .map(argument => argument.name + ':' + argument.type)
          .join('\n'),
        overwrite,
      });
      showToast('Endpoint magic/' + moduleName + '/' + endpointName + ' created');
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  return {
    selection,
    roles,
    auth,
    setAuth,
    authOpen,
    setAuthOpen,
    verb,
    setVerb,
    moduleName,
    setModuleName,
    endpointName,
    setEndpointName,
    args,
    setArgs,
    sql,
    setSql,
    sqlEditId,
    bumpSqlEditId,
    overwrite,
    setOverwrite,
    busy,
    snippets,
    openSnippet,
    importSqlFile,
    hintTables,
    createAiContext,
    generate,
  };
}

// Everything the tab's sections read and change.
export type SqlEndpointTabState = ReturnType<typeof useSqlEndpointTab>;
