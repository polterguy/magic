/*
 * Constants and pure helpers behind the Task Manager — nothing here touches
 * the network, the DOM, or React.
 */

export const PAGE_SIZE = 10;

export const NEW_TASK_CODE = `/*
 * Task Hyperlambda goes here.
 */
log.info:Task executed
`;

export const REPEAT_NUMBERS = [5, 10, 15, 20, 25, 30];
export const REPEAT_PERIODS = ['seconds', 'minutes', 'hours', 'days', 'weeks', 'months'];

export type ScheduleMode = 'fixed' | 'repeat' | 'custom';

// "every 5.minutes" for repeating schedules, the due date for one-off ones.
export function scheduleLabel(schedule: { due: string; repeats?: string }) {
  return schedule.repeats ? 'every ' + schedule.repeats : new Date(schedule.due).toLocaleString();
}

// The active mode's value, present or not — the Schedule button follows it,
// rather than silently doing nothing when clicked with an empty value.
export function scheduleIsValid(mode: ScheduleMode, due: string, pattern: string) {
  return mode === 'repeat' || (mode === 'fixed' && !!due) || (mode === 'custom' && !!pattern);
}

/*
 * The [due, repeats] pair the schedule dialog saves for its active mode — a
 * fixed date goes out as an ISO timestamp, a simple repetition as
 * "<number>.<period>", and a custom pattern verbatim.
 */
export function scheduleArgs(
  mode: ScheduleMode,
  due: string,
  number: number,
  period: string,
  pattern: string,
): [string | undefined, string | undefined] {
  switch (mode) {
    case 'fixed':
      return [new Date(due).toISOString(), undefined];
    case 'repeat':
      return [undefined, number + '.' + period];
    case 'custom':
      return [undefined, pattern];
  }
}

/*
 * Whether the task editor holds unsaved work. A new task counts as dirty
 * once it has a name or its code differs from the template; an existing
 * one when its description or code differs from what was last saved.
 */
export function taskIsDirty(
  isNew: boolean,
  id: string,
  current: { description: string; code: string },
  saved: { description: string; code: string },
) {
  return isNew
    ? !!id || current.code !== saved.code
    : current.description !== saved.description || current.code !== saved.code;
}
