/*
 * Database-selection state and SQL helpers shared between SQL Studio and the
 * Generator — both walk the same type → connection-string → database cascade,
 * read and write the same snippet folder, and frame the same AI context.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  type DatabaseMeta,
  defaultDatabaseType,
  exportDdl,
  http,
  listDatabases,
  listFiles,
  type TableMeta,
} from './api';
import { errorMessage, showError } from './errors';

export function useDatabaseSelection(options?: { preferMagic?: boolean }) {
  const preferMagic = options?.preferMagic ?? false;
  const [searchParams] = useSearchParams();
  // Deep-link parameters from e.g. the Databases screen, consumed once.
  const deepLink = useRef({
    type: searchParams.get('dbType'),
    connectionString: searchParams.get('dbCString'),
    database: searchParams.get('dbName'),
  });
  const [types, setTypes] = useState<string[]>([]);
  const [type, setType] = useState('');
  const [connectionStrings, setConnectionStrings] = useState<string[]>([]);
  // The type whose connection strings are in connectionStrings.
  const [connectionsFor, setConnectionsFor] = useState<string | null>(null);
  const [connectionString, setConnectionString] = useState('');
  const [databasesMeta, setDatabasesMeta] = useState<DatabaseMeta[]>([]);
  const [database, setDatabase] = useState('');
  // The type and connection string the schema in databasesMeta was fetched for.
  const [schemaFor, setSchemaFor] = useState<string | null>(null);
  const [error, setError] = useState('');
  /*
   * Guards, one per fetch chain — a slow answer for a selection the user has
   * already moved away from must not paint over the current one.
   */
  const connectionsSeq = useRef(0);
  const schemaSeq = useRef(0);

  useEffect(() => {
    defaultDatabaseType()
      .then(response => {
        setTypes(response.options);
        setType(deepLink.current.type ?? response.default);
      })
      .catch((err: unknown) => {
        setError(errorMessage(err));
      });
  }, []);

  useEffect(() => {
    if (!type) {
      return;
    }
    const current = ++connectionsSeq.current;
    http
      .get<Record<string, string>>(
        '/magic/system/sql/connection-strings?databaseType=' + encodeURIComponent(type),
      )
      .then(response => {
        if (current !== connectionsSeq.current) {
          return;
        }
        setConnectionsFor(type);
        const names = Object.keys(response ?? {});
        setConnectionStrings(names);
        const wanted = deepLink.current.connectionString;
        deepLink.current.connectionString = null;
        if (wanted && names.includes(wanted)) {
          setConnectionString(wanted);
        } else {
          setConnectionString(names.includes('generic') ? 'generic' : (names[0] ?? ''));
        }
        if (names.length === 0) {
          setDatabasesMeta([]);
          setDatabase('');
        }
      })
      .catch(() => {
        if (current !== connectionsSeq.current) {
          return;
        }
        // A database type with no configured connection strings (e.g. the
        // config has it as null) — clear the selection, no scary error.
        setConnectionsFor(type);
        setConnectionStrings([]);
        setConnectionString('');
        setDatabasesMeta([]);
        setDatabase('');
      });
  }, [type]);

  useEffect(() => {
    if (!type || !connectionString) {
      return;
    }
    /*
     * This is the slowest fetch on the screen — it carries every database
     * plus its tables and columns, which feed the Designer and autocomplete —
     * and it is the third in a chain, so it is worth saying something.
     */
    const current = ++schemaSeq.current;
    listDatabases(type, connectionString)
      .then(response => {
        if (current !== schemaSeq.current) {
          return;
        }
        setSchemaFor(schemaKey(type, connectionString));
        const meta = response.databases ?? [];
        setDatabasesMeta(meta);
        const names = meta.map(db => db.name);
        const wanted = deepLink.current.database;
        deepLink.current.database = null;
        if (wanted && names.includes(wanted)) {
          setDatabase(wanted);
        } else if (preferMagic) {
          setDatabase(names.includes('magic') ? 'magic' : (names[0] ?? ''));
        } else {
          setDatabase(names.find(name => name !== 'magic') ?? names[0] ?? '');
        }
      })
      .catch(() => {
        if (current !== schemaSeq.current) {
          return;
        }
        setSchemaFor(schemaKey(type, connectionString));
        setDatabasesMeta([]);
        setDatabase('');
      });
  }, [type, connectionString, preferMagic]);

  // Refetches the schema in place — after DDL changes like new tables.
  const reloadSchema = useCallback(async () => {
    try {
      const response = await listDatabases(type, connectionString);
      setDatabasesMeta(response.databases ?? []);
    } catch (err) {
      showError(err);
    }
  }, [type, connectionString]);

  const selectedMeta = databasesMeta.find(db => db.name === database);
  /*
   * Loading states are derived from what has been fetched for the current selection, rather than
   * flagged on and off around each fetch. Without connections loaded the "none configured" notice
   * would flash while the type is still a round trip ahead of its connection strings.
   */
  const connectionsLoaded = error !== '' || connectionsFor === type;
  const schemaLoading =
    error === '' &&
    !(connectionsLoaded && connectionStrings.length === 0) &&
    schemaFor !== schemaKey(type, connectionString);

  return {
    types,
    type,
    setType,
    connectionStrings,
    connectionString,
    setConnectionString,
    databasesMeta,
    database,
    setDatabase,
    selectedMeta,
    error,
    reloadSchema,
    connectionsLoaded,
    schemaLoading,
    loading: !connectionsLoaded || schemaLoading,
  };
}

export type DatabaseSelection = ReturnType<typeof useDatabaseSelection>;

function schemaKey(type: string, connectionString: string) {
  return type + '\n' + connectionString;
}

/*
 * SQL snippet files under /etc/{type}/templates/ — SQL Studio and the SQL
 * endpoint generator read and write the same folder.
 */
export function useSqlSnippets(type: string) {
  const [snippets, setSnippets] = useState<string[]>([]);
  useEffect(() => {
    if (!type) {
      return;
    }
    listFiles('/etc/' + type + '/templates/')
      .then(files => setSnippets((files ?? []).filter(file => file.endsWith('.sql'))))
      .catch(() => setSnippets([]));
  }, [type]);
  return { snippets, setSnippets };
}

/*
 * Table → columns map for Ctrl-Space SQL autocomplete.
 */
export function sqlHintTables(meta: DatabaseMeta | undefined): Record<string, string[]> {
  const tables: Record<string, string[]> = {};
  for (const table of meta?.tables ?? []) {
    tables[table.name] = (table.columns ?? []).map(column => column.name);
  }
  return tables;
}

/*
 * Context for the AI prompt bar, same as the old sql-view: the live schema
 * DDL when tables exist, the SQL dialect, the current editor code, plus any
 * declared endpoint arguments so the model knows it can reference them
 * as @name.
 */
export async function buildSqlAiContext(options: {
  type: string;
  connectionString: string;
  database: string;
  tables: TableMeta[];
  sql: string;
  args?: { name: string; type: string }[];
}): Promise<string> {
  const dialect =
    {
      sqlite: 'SQLite',
      mysql: 'MySQL',
      mssql: 'Microsoft SQL Server',
      pgsql: 'PostgreSQL',
    }[options.type] ?? options.type;
  let result = '';
  if (options.tables.length > 0) {
    const ddl = await exportDdl(
      options.type,
      options.connectionString,
      options.database,
      options.tables.map(table => table.name),
      true,
    );
    result += 'Current schema:\n\n' + ddl.result + '\n\n';
  }
  result += 'SQL dialect: ' + dialect + '\n\n';
  const declared = (options.args ?? []).filter(argument => argument.name);
  if (declared.length > 0) {
    result +=
      'Declared endpoint arguments, reference them in the SQL as @name: ' +
      declared.map(argument => argument.name + ' (' + argument.type + ')').join(', ') +
      '\n\n';
  }
  if (options.sql.length > 0) {
    result += 'Current code: \n\n' + options.sql;
  }
  if (options.tables.length > 0) {
    result +=
      '\n\n**IMPORTANT** - Return ONLY SQL! No ``` characters, or explanations, ' +
      'ONLY the SQL! In the next message you will be given a natural language query being ' +
      "a request from the user. Return only the RAW SQL that solves the user' problem";
  }
  return result;
}
