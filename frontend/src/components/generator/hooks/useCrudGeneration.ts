import { useRef, useState } from 'react';
import { showToast } from '../../../lib/toast';
import { errorMessage } from '../../../lib/errors';
import { DatabaseSelection } from '../../../lib/sql';
import { crudify } from '../../../lib/api';
import { ProgressLine } from '../../ProgressDialog';
import {
  ALL_VERBS,
  buildCrudifyPayload,
  canGenerate,
  endpointsForVerb,
  resolveLocks,
} from '../crudify';
import { ColumnLock, CrudDone, CrudTable, CrudifyOptions } from '../types';

// What a CRUD generation run reads from the rest of the tab.
export interface CrudGenerationContext {
  guided: boolean;
  selection: DatabaseSelection;
  tables: CrudTable[];
  selectedTables: Set<string>;
  verbs: Set<string>;
  singleTable: string | null;
  componentUrl: string;
  locks: Record<string, Record<string, ColumnLock>>;
  options: {
    auth: string[];
    logging: boolean;
    cache: string;
    publicCache: boolean;
    overwrite: boolean;
    paging: boolean;
    sorting: boolean;
    aggregate: boolean;
    distinct: boolean;
    search: boolean;
    verbose: boolean;
    moduleName: string;
    live: boolean;
    liveAudience: string;
    liveValues: string;
  };
}

/*
 * The CRUD tab's generation run: one crudify call per table and verb, fed into the
 * progress terminal, cancellable between calls, ending in the guided flow's done panel.
 */
export function useCrudGeneration(context: CrudGenerationContext) {
  const { guided, selection, tables, selectedTables, verbs, singleTable, componentUrl, locks } =
    context;
  const {
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
  } = context.options;
  const [busy, setBusy] = useState(false);
  // The guided flow's third step: what generation produced, and where it lives.
  const [done, setDone] = useState<CrudDone | null>(null);
  // The generation terminal — null while closed, one line per table/verb while open.
  const [feed, setFeed] = useState<ProgressLine[] | null>(null);
  const [progressText, setProgressText] = useState('');
  // Checked between crudify calls — Cancel keeps what was already generated.
  const cancelRequested = useRef(false);
  // Guided mode's done panel, revealed once the finished terminal is closed.
  const pendingDone = useRef<CrudDone | null>(null);

  // Closing a running terminal means "stop" — the loop notices between calls.
  function closeFeed() {
    if (busy) {
      cancelRequested.current = true;
      return;
    }
    setFeed(null);
    if (pendingDone.current) {
      setDone(pendingDone.current);
      pendingDone.current = null;
    }
  }

  // What is wrong with what is about to be generated, if anything.
  function generationProblem(targets: CrudTable[], active: string[]) {
    if (targets.length === 0 || active.length === 0) {
      return 'Select at least one table and one verb';
    }
    for (const table of targets) {
      const blank = (table.columns ?? []).find(
        column =>
          !column.primary &&
          locks[table.name]?.[column.name]?.mode === 'custom' &&
          !locks[table.name][column.name].slot.trim(),
      );
      if (blank) {
        return 'Enter the slot ' + table.name + '.' + blank.name + ' is locked to';
      }
    }
    if (live && liveAudience !== 'inherited' && !liveValues.trim()) {
      return "Enter who should be notified, or choose the endpoint's own roles";
    }
    return null;
  }

  // Generates every verb of every table, stopping at a failure or when cancelled, and says how far it got.
  async function generateAll(
    targets: CrudTable[],
    active: string[],
    options: Omit<CrudifyOptions, 'locks'>,
    push: (type: string, message: string) => void,
  ) {
    const total = targets.length * active.length;
    let step = 0;
    let loc = 0;
    let generated = 0;
    for (const table of targets) {
      for (const verb of active) {
        if (cancelRequested.current) {
          push('warning', 'Cancelled — the ' + generated + ' endpoints generated so far are kept.');
          return { generated, loc, failed: false };
        }
        step++;
        setProgressText(step + ' of ' + total);
        const outcome = await generateVerb(table, verb, options, push);
        if (outcome === 'failed') {
          /*
           * One crudify call per verb per table — a failure mid-loop must
           * say WHERE it stopped, and how much had already been generated,
           * or there's no telling which endpoints exist.
           */
          push('warning', generated + ' endpoints were generated before the failure.');
          return { generated, loc, failed: true };
        }
        if (outcome !== 'skipped') {
          loc += outcome.loc;
          generated += outcome.count;
        }
      }
    }
    return { generated, loc, failed: false };
  }

  // Generates one verb for one table, reporting on it, and what came of it.
  async function generateVerb(
    table: CrudTable,
    verb: string,
    options: Omit<CrudifyOptions, 'locks'>,
    push: (type: string, message: string) => void,
  ): Promise<{ count: number; loc: number } | 'skipped' | 'failed'> {
    const payload = buildCrudifyPayload(
      selection.type,
      selection.connectionString,
      selection.database,
      table,
      verb,
      { ...options, locks: resolveLocks(locks[table.name], table) },
    );
    if (!canGenerate(payload, verb)) {
      // Surfacing what used to be silently skipped — the answer to "why
      // did I get fewer endpoints than tables × verbs?".
      push(
        'warning',
        verb.toUpperCase() +
          ' ' +
          table.name +
          ' — skipped, ' +
          (payload.args.primary.length === 0 && (verb === 'put' || verb === 'delete')
            ? 'no primary key'
            : 'no columns for this verb'),
      );
      return 'skipped';
    }
    try {
      const response = await crudify(payload);
      const count = endpointsForVerb(verb, options);
      push(
        'information',
        verb.toUpperCase() +
          ' ' +
          table.name +
          ' — ' +
          count +
          (count === 1 ? ' endpoint, ' : ' endpoints, ') +
          (response.loc ?? 0) +
          ' lines',
      );
      return { count, loc: response.loc ?? 0 };
    } catch (err) {
      push('error', verb.toUpperCase() + ' ' + table.name + ' — ' + errorMessage(err));
      return 'failed';
    }
  }

  async function generate() {
    const targets = tables.filter(table => selectedTables.has(table.name));
    const active = ALL_VERBS.filter(candidate => verbs.has(candidate));
    const problem = generationProblem(targets, active);
    if (problem) {
      showToast(problem, true);
      return;
    }
    setBusy(true);
    cancelRequested.current = false;
    pendingDone.current = null;
    const options = {
      auth,
      logging,
      cache: Number(cache),
      publicCache,
      overwrite,
      paging,
      sorting,
      aggregate,
      distinct,
      search,
      verbose,
      moduleName,
      moduleUrl: singleTable ? componentUrl : null,
      live,
      liveAudience,
      liveValues,
    };
    /*
     * Every unit of progress is a resolved promise in this very loop, so the
     * terminal is fed directly — no socket channel, nothing to fake.
     */
    const lines: ProgressLine[] = [];
    const push = (type: string, message: string) => {
      lines.push({ type, message });
      setFeed([...lines]);
    };
    setFeed([]);
    const started = Date.now();
    const { generated, loc, failed } = await generateAll(targets, active, options, push);
    if (!failed && !cancelRequested.current) {
      const elapsed = ((Date.now() - started) / 1000).toFixed(1);
      push(
        'success',
        'Done — ' +
          generated +
          ' endpoints, ' +
          loc +
          ' lines of Hyperlambda, in ' +
          elapsed +
          's → /magic/' +
          (moduleName || selection.database) +
          '/',
      );
      if (guided) {
        pendingDone.current = { generated, loc, module: moduleName || selection.database };
      }
    }
    setBusy(false);
  }

  // Cancel keeps what was already generated — the loop notices between calls.
  function requestCancel() {
    cancelRequested.current = true;
  }

  return { busy, done, setDone, feed, progressText, closeFeed, generate, requestCancel };
}
