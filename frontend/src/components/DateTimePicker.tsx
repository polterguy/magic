/*
 * A themed date (and optionally time) picker that replaces the native
 * <input type="date"> / <input type="datetime-local">. The native calendar
 * popup is an OS widget whose selected-day, time column and Clear/Today links
 * always paint in the system accent (blue on macOS) — accent-color does not
 * reach them — so it can never match the monochrome brand. This renders its own
 * popover into a portal (never clipped by a modal) and reuses the themed Select
 * for the hour/minute fields.
 *
 * Value in and out is the same string the native controls use — "YYYY-MM-DD"
 * in `dateOnly` mode, otherwise "YYYY-MM-DDThh:mm", in local time — so callers
 * keep parsing it with new Date(value).
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Select from './Select';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function toValue(d: Date, dateOnly: boolean) {
  return dateOnly ? ymd(d) : `${ymd(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Parses "YYYY-MM-DD" with an optional "Thh:mm" as local time; null if unparseable.
function parseValue(v: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(v);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0));
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// Midnight of the given day, for day-granularity comparisons (e.g. the min bound).
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export default function DateTimePicker(props: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  // Date-only: no time row, value is "YYYY-MM-DD", and picking a day closes.
  dateOnly?: boolean;
  // Earliest selectable day, "YYYY-MM-DD"; earlier days are disabled.
  min?: string;
}) {

  const dateOnly = !!props.dateOnly;
  const selected = useMemo(() => parseValue(props.value), [props.value]);
  const minTime = useMemo(() => {
    const d = props.min ? parseValue(props.min) : null;
    return d ? startOfDay(d) : null;
  }, [props.min]);

  const [open, setOpen] = useState(false);
  // Fixed-position anchor for the portal popover, clamped to stay in the viewport.
  const [box, setBox] = useState<{ top: number; left: number } | null>(null);
  // The month on view, and the time being composed (kept even before a day is picked).
  const [view, setView] = useState(() => selected ?? new Date());
  const [time, setTime] = useState(() => ({
    h: selected ? selected.getHours() : 0,
    min: selected ? selected.getMinutes() : 0,
  }));

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  function place() {
    const t = triggerRef.current;
    if (!t) return;
    const r = t.getBoundingClientRect();
    const margin = 8;
    // The popover is a fixed-width calendar (its own width, not the trigger's),
    // measured once mounted, with sensible estimates before the first paint.
    const h = popRef.current?.offsetHeight ?? 360;
    const w = popRef.current?.offsetWidth ?? 288;
    let top = r.bottom + 4;
    if (top + h > window.innerHeight - margin) {
      top = Math.max(margin, window.innerHeight - margin - h);
    }
    let left = r.left;
    if (left + w > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - margin - w);
    }
    setBox({ top, left });
  }

  function openPop() {
    if (props.disabled) return;
    setView(selected ?? new Date());
    if (selected) setTime({ h: selected.getHours(), min: selected.getMinutes() });
    place();
    setOpen(true);
  }

  // Re-measure once the popover has painted, so the clamp uses its real height.
  useLayoutEffect(() => { if (open) place(); }, [open]);

  useEffect(() => {
    if (!open) return;
    const reflow = () => place();
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !popRef.current?.contains(t)) setOpen(false);
    };
    window.addEventListener('scroll', reflow, true);
    window.addEventListener('resize', reflow);
    document.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('scroll', reflow, true);
      window.removeEventListener('resize', reflow);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  // The grid, starting on the Monday on/before the 1st, trimmed to the weeks the
  // month actually spans (5 or 6) so the popover is no taller than it needs to be.
  const cells = useMemo(() => {
    const offset = (new Date(view.getFullYear(), view.getMonth(), 1).getDay() + 6) % 7;
    const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    const weeks = Math.ceil((offset + days) / 7);
    const start = new Date(view.getFullYear(), view.getMonth(), 1 - offset);
    return Array.from({ length: weeks * 7 }, (_, i) =>
      new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }, [view]);

  function emit(day: Date, t: { h: number; min: number }) {
    props.onChange(toValue(new Date(day.getFullYear(), day.getMonth(), day.getDate(), t.h, t.min), dateOnly));
  }

  const disabledDay = (d: Date) => minTime !== null && startOfDay(d) < minTime;

  function pickDay(day: Date) {
    if (disabledDay(day)) return;
    setView(day);
    emit(day, time);
    // Nothing left to set once the day is chosen, so close.
    if (dateOnly) setOpen(false);
  }

  function setPart(part: 'h' | 'min', n: number) {
    const next = { ...time, [part]: n };
    setTime(next);
    if (selected) emit(selected, next);
  }

  const today = new Date();
  const label = selected
    ? `${pad(selected.getDate())}/${pad(selected.getMonth() + 1)}/${selected.getFullYear()}` +
      (dateOnly ? '' : `, ${pad(selected.getHours())}:${pad(selected.getMinutes())}`)
    : (props.placeholder ?? (dateOnly ? 'Pick a date' : 'Pick a date and time'));

  return (
    <div className={'dtp' + (props.disabled ? ' disabled' : '')}>
      <button
        ref={triggerRef}
        type="button"
        className="dtp-trigger"
        disabled={props.disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openPop())}>
        <span className={'dtp-value' + (selected ? '' : ' placeholder')}>{label}</span>
        <span className="dtp-icon" aria-hidden="true">▦</span>
      </button>

      {open && box && createPortal(
        <div
          ref={popRef}
          className="dtp-pop"
          style={{ position: 'fixed', top: box.top, left: box.left }}>

          <div className="dtp-head">
            <button
              type="button"
              className="dtp-nav"
              title="Previous month"
              onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}>‹</button>
            <span className="dtp-month">{MONTHS[view.getMonth()]} {view.getFullYear()}</span>
            <button
              type="button"
              className="dtp-nav"
              title="Next month"
              onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}>›</button>
          </div>

          <div className="dtp-grid dtp-dow">
            {WEEKDAYS.map((d, i) => <span key={i} className="dtp-dow-cell">{d}</span>)}
          </div>
          <div className="dtp-grid">
            {cells.map((d, i) => (
              <button
                key={i}
                type="button"
                disabled={disabledDay(d)}
                className={'dtp-day'
                  + (d.getMonth() === view.getMonth() ? '' : ' muted')
                  + (selected && sameDay(d, selected) ? ' selected' : '')
                  + (sameDay(d, today) ? ' today' : '')}
                onClick={() => pickDay(d)}>
                {d.getDate()}
              </button>
            ))}
          </div>

          {!dateOnly && (
            <div className="dtp-time">
              <span className="dtp-time-label">Time</span>
              <Select value={pad(time.h)} onChange={v => setPart('h', Number(v))}>
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={pad(h)}>{pad(h)}</option>
                ))}
              </Select>
              <span className="dtp-colon">:</span>
              <Select value={pad(time.min)} onChange={v => setPart('min', Number(v))}>
                {Array.from({ length: 60 }, (_, m) => (
                  <option key={m} value={pad(m)}>{pad(m)}</option>
                ))}
              </Select>
            </div>
          )}

          <div className="dtp-foot">
            <button
              type="button"
              className="dtp-link"
              onClick={() => { props.onChange(''); setOpen(false); }}>Clear</button>
            <button
              type="button"
              className="dtp-link"
              onClick={() => {
                const n = new Date();
                setView(n);
                setTime({ h: n.getHours(), min: n.getMinutes() });
                emit(n, { h: n.getHours(), min: n.getMinutes() });
                if (dateOnly) setOpen(false);
              }}>{dateOnly ? 'Today' : 'Now'}</button>
            <button
              type="button"
              className="dtp-link strong"
              onClick={() => setOpen(false)}>Done</button>
          </div>
        </div>,
        document.body)}
    </div>
  );
}
