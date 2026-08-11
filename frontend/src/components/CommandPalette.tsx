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
  to: string;
}

let dynamicCache: { from: string; commands: DynamicCommand[] } | null = null;

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
      label: endpoint.verb.toUpperCase() + ' ' + endpoint.path,
      to: '/endpoints?filter=' + encodeURIComponent(endpoint.path),
    })),
    ...[...moduleFiles, ...wwwFiles].map(file => ({
      group: 'Files',
      label: file,
      to: '/hyper-ide?open=' + encodeURIComponent(file),
    })),
    ...(tasks ?? []).map(task => ({
      group: 'Tasks',
      label: task.id,
      hint: task.description ?? undefined,
      to: '/task-manager',
    })),
    ...(models ?? []).map(model => ({
      group: 'Models',
      label: model.type,
      to: '/machine-learning',
    })),
  ];
  dynamicCache = { from: apiBaseUrl(), commands };
  return commands;
}

/*
 * Subsequence scorer: every query character must appear in order. Word
 * starts and adjacent matches score higher, earlier matches break ties.
 */
function score(query: string, candidate: string): number {
  const q = query.toLowerCase();
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

export default function CommandPalette(props: {
  // Guard-aware navigation supplied by Layout.
  go: (to: string) => void;
  // Extra commands only the layout can perform — theme, cloudlet, Frank.
  actions: { label: string; action: () => void }[];
  onClose: () => void;
}) {

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const [dynamic, setDynamic] = useState<DynamicCommand[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

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
        rank: score(query, command.label + ' ' + (command.hint ?? '')),
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
        <input
          autoFocus
          type="text"
          placeholder="Jump to a page, file, endpoint, task or model…"
          value={query}
          onChange={event => { setQuery(event.target.value); setSelected(0); }}
          onKeyDown={onKeyDown} />
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
                  <span className="palette-label">{command.label}</span>
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
