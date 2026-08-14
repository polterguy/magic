/*
 * The command palette — Ctrl/Cmd+K anywhere, one input fuzzy-matching
 * everything reachable: sections, files, endpoints, tasks, ML models, and a
 * handful of actions. Layout owns the shortcut (captured at window level, so
 * it fires even while CodeMirror has focus) and passes a guard-aware
 * navigate, so palette jumps respect unsaved-changes guards like nav clicks.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { SECTIONS } from './sections';
import {
  apiBaseUrl,
  listEndpoints,
  listFilesRecursively,
  listTasks,
  mlTypes,
} from '../lib/api';

export interface PaletteCommand {
  group: string;
  label: string;
  // Extra text the query also matches against, shown dimmed after the label.
  hint?: string;
  // HTTP verb, rendered as the Endpoints page's coloured badge.
  verb?: string;
  action: () => void;
}

/*
 * The dynamic entries, fetched once per backend on first open and cached —
 * the palette must feel instant the second time. A failed source contributes
 * nothing rather than breaking the palette.
 */
interface DynamicCommand {
  group: string;
  label: string;
  hint?: string;
  // HTTP verb, rendered as the Endpoints page's coloured badge.
  verb?: string;
  to: string;
}

let dynamicCache: { from: string; commands: DynamicCommand[] } | null = null;

/*
 * The last filter, kept for the session so reopening the palette resumes
 * where it left off — the second visit to a long file path is the one that
 * hurts. The text opens selected, so typing still replaces it outright.
 */
let lastQuery = '';

async function loadDynamic(): Promise<DynamicCommand[]> {
  if (dynamicCache && dynamicCache.from === apiBaseUrl()) {
    return dynamicCache.commands;
  }
  const [endpoints, moduleFiles, wwwFiles, tasks, models] = await Promise.all([
    listEndpoints().catch(() => []),
    listFilesRecursively('/modules/', false).catch(() => []),
    listFilesRecursively('/etc/', false).catch(() => []),
    listTasks(0, -1).catch(() => []),
    mlTypes().catch(() => []),
  ]);
  const commands = [
    ...endpoints.map(endpoint => ({
      group: 'Endpoints',
      label: endpoint.path,
      verb: endpoint.verb.toUpperCase(),
      // The verb travels along, so the Endpoints page can expand and scroll
      // to the exact row rather than just filtering to it.
      to: '/endpoints?filter=' + encodeURIComponent(endpoint.path) +
        '&expand=' + encodeURIComponent(endpoint.verb),
    })),
    ...[...moduleFiles, ...wwwFiles].map(file => ({
      group: 'Files',
      label: file,
      to: '/hyper-ide?open=' + encodeURIComponent(file),
    })),
    // Both of these open their editor on arrival, the same way endpoints
    // expand their row — picking a name here means you wanted that one thing,
    // not the list it lives in. Tasks also filter, so closing the editor
    // leaves the row you came for on screen rather than page one.
    ...(tasks ?? []).map(task => ({
      group: 'Tasks',
      label: task.id,
      hint: task.description ?? undefined,
      to: '/task-manager?edit=' + encodeURIComponent(task.id) +
        '&filter=' + encodeURIComponent(task.id),
    })),
    /*
     * Two ways in per model, told apart by their group rather than by a
     * decorated label — the name you are searching for stays the thing you
     * read, under a heading that says what happens when you pick it.
     */
    ...(models ?? []).flatMap(model => [
      {
        group: 'Models',
        label: model.type,
        hint: 'Edit model',
        to: '/machine-learning?tab=types&edit=' + encodeURIComponent(model.type),
      },
      {
        group: 'Training data',
        label: model.type,
        hint: 'Training snippets for this model',
        to: '/machine-learning?tab=training&type=' + encodeURIComponent(model.type),
      },
    ]),
  ];
  dynamicCache = { from: apiBaseUrl(), commands };
  return commands;
}

/*
 * Subsequence scorer: every query character must appear in order. Word
 * starts and adjacent matches score higher, earlier matches break ties.
 * Whitespace separates terms rather than matching literally, so
 * "get log list" finds "GET magic/system/log/list".
 */
function score(query: string, candidate: string): number {
  const q = query.toLowerCase().replace(/\s+/g, '');
  const c = candidate.toLowerCase();
  let total = 0;
  let index = 0;
  let previous = -2;
  for (const char of q) {
    const at = c.indexOf(char, index);
    if (at === -1) {
      return -1;
    }
    total += at === previous + 1 ? 3 : 1;
    if (at === 0 || /[\s/._-]/.test(c[at - 1])) {
      total += 2;
    }
    previous = at;
    index = at + 1;
  }
  return total - c.length / 100;
}

/*
 * The character positions the query greedily matches inside the text — the
 * same walk the scorer takes — so results can show WHY they matched.
 * Characters the text doesn't carry are skipped rather than failing, since
 * the query may have matched partly against the verb or hint.
 */
function highlight(text: string, query: string) {
  if (!query.trim()) {
    return text;
  }
  const positions = new Set<number>();
  const lower = text.toLowerCase();
  let index = 0;
  for (const char of query.toLowerCase().replace(/\s+/g, '')) {
    const at = lower.indexOf(char, index);
    if (at === -1) {
      continue;
    }
    positions.add(at);
    index = at + 1;
  }
  if (positions.size === 0) {
    return text;
  }
  return [...text].map((char, at) =>
    positions.has(at) ? <b key={at}>{char}</b> : char);
}

export default function CommandPalette(props: {
  // Guard-aware navigation supplied by Layout.
  go: (to: string) => void;
  // Extra commands only the layout can perform — theme, cloudlet, Frank.
  actions: { label: string; action: () => void }[];
  onClose: () => void;
}) {

  const [query, setQuery] = useState(lastQuery);
  const [selected, setSelected] = useState(0);
  const [dynamic, setDynamic] = useState<DynamicCommand[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    lastQuery = query;
  }, [query]);

  // Opens with the remembered filter selected, so typing replaces it.
  useEffect(() => {
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadDynamic().then(commands => {
      if (!cancelled) {
        setDynamic(commands);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const commands: PaletteCommand[] = useMemo(() => [
    ...SECTIONS.map(section => ({
      group: 'Go to',
      label: section.label,
      action: () => props.go(section.to),
    })),
    ...props.actions.map(entry => ({
      group: 'Actions',
      label: entry.label,
      action: entry.action,
    })),
    ...dynamic.map(entry => ({
      group: entry.group,
      label: entry.label,
      hint: entry.hint,
      verb: entry.verb,
      action: () => props.go(entry.to),
    })),
  ], [dynamic, props.go, props.actions]);

  const matches = useMemo(() => {
    if (!query.trim()) {
      // Empty query shows the navigation and actions, not thousands of files.
      return commands.filter(command =>
        command.group === 'Go to' || command.group === 'Actions');
    }
    const ranked = commands
      .map(command => ({
        command,
        rank: score(
          query,
          (command.verb ? command.verb + ' ' : '') +
            command.label + ' ' + (command.hint ?? '')),
      }))
      .filter(entry => entry.rank >= 0)
      .sort((left, right) => right.rank - left.rank)
      .slice(0, 40)
      .map(entry => entry.command);
    /*
     * Ranking interleaves groups, which would repeat their headers — so the
     * groups keep the order their best hit earned, and rows regroup under
     * one header each.
     */
    const groups: string[] = [];
    for (const command of ranked) {
      if (!groups.includes(command.group)) {
        groups.push(command.group);
      }
    }
    return groups.flatMap(group => ranked.filter(command => command.group === group));
  }, [query, commands]);

  // Clamp the selection when the result set shrinks under it.
  useEffect(() => {
    setSelected(current => Math.min(current, Math.max(0, matches.length - 1)));
  }, [matches.length]);

  useEffect(() => {
    listRef.current?.querySelector('.palette-row.selected')
      ?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  function run(command: PaletteCommand) {
    props.onClose();
    command.action();
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelected(current => Math.min(current + 1, matches.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelected(current => Math.max(current - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (matches[selected]) {
        run(matches[selected]);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      props.onClose();
    }
  }

  // Group headers appear when the group changes, preserving rank order.
  let previousGroup = '';

  return (
    <div className="palette-backdrop" onMouseDown={props.onClose}>
      <div
        className="palette"
        role="dialog"
        aria-label="Command palette"
        onMouseDown={event => event.stopPropagation()}>
        <div className="palette-input">
          <span className="palette-prompt" aria-hidden="true">&gt;</span>
          <input
            ref={inputRef}
            autoFocus
            type="text"
            placeholder="Jump to a page, file, endpoint, task or model…"
            value={query}
            onChange={event => { setQuery(event.target.value); setSelected(0); }}
            onKeyDown={onKeyDown} />
        </div>
        <div className="palette-list" ref={listRef}>
          {matches.length === 0 && (
            <div className="palette-empty">Nothing matches</div>
          )}
          {matches.map((command, index) => {
            const header = command.group !== previousGroup ? command.group : null;
            previousGroup = command.group;
            return (
              <div key={command.group + command.label + index}>
                {header && <div className="palette-group">{header}</div>}
                <div
                  className={'palette-row' + (index === selected ? ' selected' : '')}
                  onMouseMove={() => setSelected(index)}
                  onClick={() => run(command)}>
                  {command.verb && (
                    <span className={'badge badge-' + command.verb.toLowerCase()}>
                      {command.verb}
                    </span>
                  )}
                  {command.group === 'Files' && command.label.includes('/')
                    ? (
                      // The directory whispers, the filename talks.
                      <span className="palette-label">
                        <span className="palette-file-dir">
                          {command.label.substring(0, command.label.lastIndexOf('/') + 1)}
                        </span>
                        <span className="palette-file-name">
                          {highlight(
                            command.label.substring(command.label.lastIndexOf('/') + 1),
                            query)}
                        </span>
                      </span>
                    )
                    : <span className="palette-label">{highlight(command.label, query)}</span>}
                  {command.hint && <span className="palette-hint">{command.hint}</span>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="palette-footer">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
