/*
 * Unit tests for the Task Manager's pure helpers — schedule labels, the
 * schedule dialog's validation and output, and the editor's dirty check.
 *
 * Run with `npm run test`. Node environment only.
 */

import { describe, expect, it } from 'vitest';

import { scheduleArgs, scheduleIsValid, scheduleLabel, taskIsDirty } from '../constants';

describe('scheduleLabel', () => {
  it('describes repeating schedules by their pattern', () => {
    expect(scheduleLabel({ due: '2026-01-01T00:00:00Z', repeats: '5.minutes' })).toBe(
      'every 5.minutes',
    );
  });

  it('shows the due date, localised, for one-off schedules', () => {
    const due = '2026-01-01T12:30:00Z';
    expect(scheduleLabel({ due })).toBe(new Date(due).toLocaleString());
  });

  it('treats an empty repeats as a one-off schedule', () => {
    const due = '2026-01-01T12:30:00Z';
    expect(scheduleLabel({ due, repeats: '' })).toBe(new Date(due).toLocaleString());
  });
});

describe('scheduleIsValid', () => {
  it('always accepts a simple repetition', () => {
    expect(scheduleIsValid('repeat', '', '')).toBe(true);
  });

  it('needs a date for a fixed schedule', () => {
    expect(scheduleIsValid('fixed', '', 'ignored')).toBe(false);
    expect(scheduleIsValid('fixed', '2026-01-01T10:00', '')).toBe(true);
  });

  it('needs a pattern for a custom schedule', () => {
    expect(scheduleIsValid('custom', '2026-01-01T10:00', '')).toBe(false);
    expect(scheduleIsValid('custom', '', '**.**.17.30.00')).toBe(true);
  });
});

describe('scheduleArgs', () => {
  it('sends a fixed date as an ISO due date with no repetition', () => {
    const due = '2026-01-01T10:00:00Z';
    expect(scheduleArgs('fixed', due, 5, 'minutes', 'x')).toEqual([
      new Date(due).toISOString(),
      undefined,
    ]);
  });

  it('sends a simple repetition as number.period', () => {
    expect(scheduleArgs('repeat', 'x', 15, 'hours', 'y')).toEqual([undefined, '15.hours']);
  });

  it('sends a custom pattern verbatim', () => {
    expect(scheduleArgs('custom', 'x', 5, 'minutes', 'Monday|Friday.09.00.00')).toEqual([
      undefined,
      'Monday|Friday.09.00.00',
    ]);
  });

  it('throws for a fixed date that does not parse', () => {
    expect(() => scheduleArgs('fixed', 'not a date', 5, 'minutes', '')).toThrow(RangeError);
  });
});

describe('taskIsDirty', () => {
  const saved = { description: 'd', code: 'c' };

  it('marks a new task dirty once it has a name', () => {
    expect(taskIsDirty(true, '', saved, saved)).toBe(false);
    expect(taskIsDirty(true, 'my-task', saved, saved)).toBe(true);
  });

  it('marks a new task dirty when its code changes, but not its description', () => {
    expect(taskIsDirty(true, '', { description: 'd', code: 'changed' }, saved)).toBe(true);
    expect(taskIsDirty(true, '', { description: 'changed', code: 'c' }, saved)).toBe(false);
  });

  it('marks an existing task dirty when its description or code changes', () => {
    expect(taskIsDirty(false, 'my-task', saved, saved)).toBe(false);
    expect(taskIsDirty(false, 'my-task', { description: 'x', code: 'c' }, saved)).toBe(true);
    expect(taskIsDirty(false, 'my-task', { description: 'd', code: 'x' }, saved)).toBe(true);
  });
});
