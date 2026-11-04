import { useEffect, useRef, useState } from 'react';

import {
  EndpointMeta,
  getHyperlambdaArguments,
  listEndpointsDetailed,
  listFilesRecursively,
  loadFile,
} from '../../../lib/api';
import { showToast } from '../../../lib/toast';
import {
  endpointKey,
  extractFileComment,
  formatEndpointMeta,
  formatFallbackMeta,
  TOOLTIP_WIDTH,
} from '../endpointMeta';
import { WizardProps } from '../types';

// The description tooltip ExecuteFilesWizard shows for one file, and where it is anchored.
export interface FileTooltip {
  path: string;
  text: string;
  x: number;
  y: number;
}

// ExecuteFilesWizard's state: the candidate files, the picks, and the lazily loaded descriptions.
export function useExecuteFiles(props: WizardProps) {
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [chosen, setChosen] = useState<Record<string, boolean>>({});
  // The description + arguments currently shown as a tooltip, and where to anchor it;
  // resolved lazily on click and cached per path so re-opening the same file is instant.
  const [tooltip, setTooltip] = useState<FileTooltip | null>(null);
  const [descLoading, setDescLoading] = useState<string | null>(null);
  const descCache = useRef<Record<string, string>>({});
  // One /magic/system/endpoints/list fetch, keyed by {path, verb} — the same backend-
  // computed description/argument metadata the Web Designer and OpenAPI spec use, so an
  // endpoint file's tooltip costs no extra request once this has loaded.
  const endpointsByKey = useRef<Record<string, EndpointMeta>>({});

  useEffect(() => {
    listFilesRecursively('/modules/', true)
      .then(list => setFiles(list.filter(path => path.endsWith('.hl'))))
      .catch(() => showToast('Could not load module files', true))
      .finally(() => setLoading(false));
    listEndpointsDetailed()
      .then(list => {
        const map: Record<string, EndpointMeta> = {};
        for (const entry of list) {
          map[entry.path + '|' + entry.verb] = entry;
        }
        endpointsByKey.current = map;
      })
      .catch(() => {}); // best-effort — the per-file fallback still works without it
  }, []);

  const shown = files.filter(path => !filter || path.toLowerCase().includes(filter.toLowerCase()));
  const count = Object.values(chosen).filter(Boolean).length;
  const allShownChosen = shown.length > 0 && shown.every(path => chosen[path]);

  // Ticks or unticks every file the filter currently shows, leaving other picks untouched.
  function toggleShown(on: boolean) {
    const next = { ...chosen };
    for (const path of shown) {
      next[path] = on;
    }
    setChosen(next);
  }

  function add() {
    const picked = Object.keys(chosen).filter(path => chosen[path]);
    if (picked.length === 0) {
      showToast('Pick at least one file', true);
      return;
    }
    const lines = picked.flatMap(path => [
      'execute-file:' + path,
      'io.file.execute:' + path,
      'io.file.load:' + path,
    ]);
    props.onAdd(lines);
  }

  async function toggleDescription(path: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (tooltip?.path === path) {
      setTooltip(null);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    // Right-aligns the tooltip to the icon, then clamps it to stay inside the viewport —
    // the icon sits at the far right of its row, so left-aligning it would run off-screen.
    const x = Math.max(
      8,
      Math.min(rect.right - TOOLTIP_WIDTH, window.innerWidth - TOOLTIP_WIDTH - 8),
    );
    const position = { x, y: rect.bottom + 4 };
    const cached = descCache.current[path];
    if (cached !== undefined) {
      setTooltip({ path, text: cached, ...position });
      return;
    }
    const key = endpointKey(path);
    const meta = key ? endpointsByKey.current[key] : undefined;
    if (meta) {
      const text = formatEndpointMeta(meta);
      descCache.current[path] = text;
      setTooltip({ path, text, ...position });
      return;
    }
    setDescLoading(path);
    try {
      const content = await loadFile(path);
      const description = extractFileComment(content) ?? 'No file-level comment.';
      const args = await getHyperlambdaArguments(content);
      const text = formatFallbackMeta(description, args);
      descCache.current[path] = text;
      setTooltip({ path, text, ...position });
    } catch {
      showToast('Could not load ' + path, true);
    } finally {
      setDescLoading(null);
    }
  }

  return {
    loading,
    filter,
    setFilter,
    chosen,
    setChosen,
    tooltip,
    setTooltip,
    descLoading,
    shown,
    count,
    allShownChosen,
    toggleShown,
    add,
    toggleDescription,
  };
}
