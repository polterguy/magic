/*
 * Pure formatting helpers for the Log page.
 */

/* "11 seconds ago", "3 minutes ago", … up through years. */
export function timeAgo(created: string): string {
  const diff = Math.max(0, Date.now() - new Date(created).getTime());
  const s = Math.round(diff / 1000);
  const fmt = (n: number, unit: string) => n + ' ' + unit + (n === 1 ? '' : 's') + ' ago';
  if (s < 60) return fmt(s, 'second');
  const m = Math.round(s / 60);
  if (m < 60) return fmt(m, 'minute');
  const h = Math.round(m / 60);
  if (h < 24) return fmt(h, 'hour');
  const d = Math.round(h / 24);
  if (d < 7) return fmt(d, 'day');
  const w = Math.round(d / 7);
  if (w < 5) return fmt(w, 'week');
  const mo = Math.round(d / 30);
  if (mo < 12) return fmt(mo, 'month');
  return fmt(Math.round(d / 365), 'year');
}

/* Exact time as ISO 8601 (UTC), milliseconds trimmed. */
export function isoDate(created: string): string {
  return new Date(created).toISOString().replace(/\.\d{3}Z$/, 'Z');
}
