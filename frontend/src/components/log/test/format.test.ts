/*
 * Unit tests for the Log page's formatting helpers.
 *
 * Run with `npm run test`. Node environment only.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { isoDate, timeAgo } from '../format';

const NOW = new Date('2026-01-01T00:00:00.000Z').getTime();
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('timeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts seconds, singular and plural', () => {
    expect(timeAgo(ago(0))).toBe('0 seconds ago');
    expect(timeAgo(ago(SECOND))).toBe('1 second ago');
    expect(timeAgo(ago(11 * SECOND))).toBe('11 seconds ago');
  });

  it('moves up a unit once rounding reaches the next one', () => {
    expect(timeAgo(ago(59.4 * SECOND))).toBe('59 seconds ago');
    expect(timeAgo(ago(59.6 * SECOND))).toBe('1 minute ago');
    expect(timeAgo(ago(3 * MINUTE))).toBe('3 minutes ago');
    expect(timeAgo(ago(59.5 * MINUTE))).toBe('1 hour ago');
    expect(timeAgo(ago(5 * HOUR))).toBe('5 hours ago');
    expect(timeAgo(ago(DAY))).toBe('1 day ago');
    expect(timeAgo(ago(6 * DAY))).toBe('6 days ago');
  });

  it('counts weeks up to four, then months', () => {
    expect(timeAgo(ago(7 * DAY))).toBe('1 week ago');
    expect(timeAgo(ago(31 * DAY))).toBe('4 weeks ago');
    expect(timeAgo(ago(32 * DAY))).toBe('1 month ago');
    expect(timeAgo(ago(90 * DAY))).toBe('3 months ago');
  });

  it('counts years from twelve rounded months', () => {
    expect(timeAgo(ago(344 * DAY))).toBe('11 months ago');
    expect(timeAgo(ago(345 * DAY))).toBe('1 year ago');
    expect(timeAgo(ago(800 * DAY))).toBe('2 years ago');
  });

  it('clamps timestamps in the future to zero', () => {
    expect(timeAgo(new Date(NOW + HOUR).toISOString())).toBe('0 seconds ago');
  });

  it('gives "NaN years ago" for an unparseable timestamp', () => {
    expect(timeAgo('not a date')).toBe('NaN years ago');
  });
});

describe('isoDate', () => {
  it('formats as ISO 8601 in UTC with milliseconds trimmed', () => {
    expect(isoDate('2026-03-04T05:06:07.890Z')).toBe('2026-03-04T05:06:07Z');
  });

  it('converts offsets to UTC', () => {
    expect(isoDate('2026-03-04T05:06:07+02:00')).toBe('2026-03-04T03:06:07Z');
  });

  it('throws on an unparseable timestamp', () => {
    expect(() => isoDate('not a date')).toThrow(RangeError);
  });
});
