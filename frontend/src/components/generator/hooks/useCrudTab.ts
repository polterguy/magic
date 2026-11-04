import { useEffect, useMemo, useState } from 'react';
import { useDatabaseSelection } from '../../../lib/sql';
import { listRoles, DatabaseMeta } from '../../../lib/api';
import {
  ALL_VERBS,
  buildCrudifyPayload,
  canGenerate,
  endpointsForVerb,
  resolveLocks,
} from '../crudify';
import { ColumnLock } from '../types';
import { useCrudGeneration } from './useCrudGeneration';

// CrudTab's state: the database and tables chosen, every crudify option, and the generation run.
export function useCrudTab(guided: boolean) {
  const selection = useDatabaseSelection();
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [verbs, setVerbs] = useState<Set<string>>(new Set(ALL_VERBS));
  const [roles, setRoles] = useState<string[]>([]);
  const [auth, setAuth] = useState<string[]>(['root', 'admin']);
  const [moduleName, setModuleName] = useState('');
  const [componentUrl, setComponentUrl] = useState('');
  const [logging, setLogging] = useState(true);
  const [cache, setCache] = useState('0');
  const [publicCache, setPublicCache] = useState(false);
  const [overwrite, setOverwrite] = useState(false);
  // Table -> column -> the lock the author chose, only where it differs from defaultLock().
  const [locks, setLocks] = useState<Record<string, Record<string, ColumnLock>>>({});
  const [live, setLive] = useState(false);
  const [liveAudience, setLiveAudience] = useState('inherited');
  const [liveValues, setLiveValues] = useState('');
  const [paging, setPaging] = useState(true);
  const [sorting, setSorting] = useState(true);
  const [aggregate, setAggregate] = useState(false);
  const [distinct, setDistinct] = useState(false);
  const [search, setSearch] = useState(false);
  const [verbose, setVerbose] = useState(false);

  useEffect(() => {
    listRoles()
      .then(list => setRoles((list ?? []).map(role => role.name)))
      .catch(() => {});
  }, []);

  /*
   * Reset selection, details and URL overrides when the database changes.
   * The guided flow preselects every table instead — its user's answer to
   * "which tables?" is almost always "all of them". Done during render, when
   * what the selection was last reset for changes, rather than in an effect.
   */
  const [resetFor, setResetFor] = useState<{
    database: string;
    meta: DatabaseMeta | undefined;
    guided: boolean;
  } | null>(null);
  if (
    resetFor?.database !== selection.database ||
    resetFor.meta !== selection.selectedMeta ||
    resetFor.guided !== guided
  ) {
    setResetFor({
      database: selection.database,
      meta: selection.selectedMeta,
      guided: guided,
    });
    setSelectedTables(
      guided
        ? new Set<string>((selection.selectedMeta?.tables ?? []).map(table => table.name))
        : new Set<string>(),
    );
    setExpandedTables(new Set());
    setLocks({});
    setModuleName(selection.database);
  }

  const tables = useMemo(() => selection.selectedMeta?.tables ?? [], [selection.selectedMeta]);
  const allSelected = tables.length > 0 && selectedTables.size === tables.length;
  const singleTable = selectedTables.size === 1 ? [...selectedTables][0] : null;

  // The component URL follows the single selected table until the user edits it.
  const [componentUrlFor, setComponentUrlFor] = useState<string | null | undefined>(undefined);
  if (componentUrlFor !== singleTable) {
    setComponentUrlFor(singleTable);
    setComponentUrl(singleTable ?? '');
  }

  function toggleTable(name: string) {
    const next = new Set(selectedTables);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    setSelectedTables(next);
  }

  /*
   * How many endpoint files the current selection would actually produce —
   * same rules generation uses, including skipping verbs a table can't
   * support, such as PUT and DELETE on a table without a primary key.
   */
  const plannedEndpoints = useMemo(() => {
    const options = { aggregate, distinct, search };
    let total = 0;
    for (const table of tables.filter(candidate => selectedTables.has(candidate.name))) {
      for (const verb of ALL_VERBS.filter(candidate => verbs.has(candidate))) {
        const payload = buildCrudifyPayload(
          selection.type,
          selection.connectionString,
          selection.database,
          table,
          verb,
          {
            ...options,
            auth,
            logging,
            cache: Number(cache),
            publicCache,
            overwrite,
            paging,
            sorting,
            verbose,
            moduleName,
            moduleUrl: null,
            locks: resolveLocks(locks[table.name], table),
          },
        );
        if (canGenerate(payload, verb)) {
          total += endpointsForVerb(verb, options);
        }
      }
    }
    return total;
  }, [
    tables,
    selectedTables,
    verbs,
    aggregate,
    distinct,
    search,
    selection.type,
    selection.connectionString,
    selection.database,
    auth,
    logging,
    cache,
    publicCache,
    overwrite,
    paging,
    sorting,
    verbose,
    moduleName,
    locks,
  ]);

  function toggleExpanded(name: string) {
    const next = new Set(expandedTables);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    setExpandedTables(next);
  }

  function setColumnLock(table: string, column: string, lock: ColumnLock) {
    setLocks({ ...locks, [table]: { ...locks[table], [column]: lock } });
  }

  function toggleVerb(verb: string) {
    const next = new Set(verbs);
    if (next.has(verb)) {
      next.delete(verb);
    } else {
      next.add(verb);
    }
    setVerbs(next);
  }

  const generation = useCrudGeneration({
    guided,
    selection,
    tables,
    selectedTables,
    verbs,
    singleTable,
    componentUrl,
    locks,
    options: {
      auth,
      logging,
      cache,
      publicCache,
      overwrite,
      paging,
      sorting,
      aggregate,
      distinct,
      search,
      verbose,
      moduleName,
      live,
      liveAudience,
      liveValues,
    },
  });

  return {
    selection,
    selectedTables,
    setSelectedTables,
    expandedTables,
    verbs,
    roles,
    auth,
    setAuth,
    moduleName,
    setModuleName,
    componentUrl,
    setComponentUrl,
    logging,
    setLogging,
    cache,
    setCache,
    publicCache,
    setPublicCache,
    overwrite,
    setOverwrite,
    locks,
    live,
    setLive,
    liveAudience,
    setLiveAudience,
    liveValues,
    setLiveValues,
    paging,
    setPaging,
    sorting,
    setSorting,
    aggregate,
    setAggregate,
    distinct,
    setDistinct,
    search,
    setSearch,
    verbose,
    setVerbose,
    tables,
    allSelected,
    singleTable,
    toggleTable,
    plannedEndpoints,
    toggleExpanded,
    setColumnLock,
    toggleVerb,
    ...generation,
  };
}

// Everything CrudTab's sections read and change.
export type CrudTabState = ReturnType<typeof useCrudTab>;
