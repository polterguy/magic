import { listTasks } from '@core/api';
import type { PaletteEntry } from '@core/features';

/*
 * Every task, for the command palette. Picking one opens its editor on arrival — picking a name
 * means you wanted that one thing, not the list it lives in — and also filters, so closing the
 * editor leaves the row you came for on screen rather than page one.
 */
export async function paletteEntries(path: string): Promise<PaletteEntry[]> {
  const tasks = await listTasks(0, -1);
  return (tasks ?? []).map(task => ({
    group: 'Tasks',
    label: task.id,
    hint: task.description ?? undefined,
    to: path + '?edit=' + encodeURIComponent(task.id) + '&filter=' + encodeURIComponent(task.id),
  }));
}
