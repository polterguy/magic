import { useState } from 'react';
import Select from '../Select';
import DateTimePicker from '../DateTimePicker';
import { Modal } from '../Dialogs';
import {
  REPEAT_NUMBERS,
  REPEAT_PERIODS,
  type ScheduleMode,
  scheduleArgs,
  scheduleIsValid,
} from './constants';

/*
 * The old dashboard's 3-mode schedule dialog: fixed date, simple repetition,
 * or a custom repetition pattern.
 */
export default function ScheduleDialog(
  props: Readonly<{
    taskId: string;
    onClose: () => void;
    onSave: (due: string | undefined, repeats: string | undefined) => void;
  }>,
) {
  const [mode, setMode] = useState<ScheduleMode>('repeat');
  const [due, setDue] = useState('');
  const [number, setNumber] = useState(5);
  const [period, setPeriod] = useState('minutes');
  const [pattern, setPattern] = useState('');

  // The active mode's value, present or not — the Schedule button follows it,
  // rather than silently doing nothing when clicked with an empty value.
  const valid = scheduleIsValid(mode, due, pattern);

  function save() {
    if (!valid) {
      return;
    }
    props.onSave(...scheduleArgs(mode, due, number, period, pattern));
  }

  return (
    <Modal onClose={props.onClose} onSubmit={save}>
      <h2>Schedule {props.taskId}</h2>
      <div className="form-grid">
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <input type="radio" checked={mode === 'fixed'} onChange={() => setMode('fixed')} />
          Once, at a fixed date
        </label>
        {mode === 'fixed' && (
          <DateTimePicker value={due} onChange={setDue} placeholder="Pick a date and time" />
        )}
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <input type="radio" checked={mode === 'repeat'} onChange={() => setMode('repeat')} />
          Repeating
        </label>
        {mode === 'repeat' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Select value={String(number)} onChange={value => setNumber(Number(value))}>
              {REPEAT_NUMBERS.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
            <Select value={period} onChange={value => setPeriod(value)}>
              {REPEAT_PERIODS.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </div>
        )}
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <input type="radio" checked={mode === 'custom'} onChange={() => setMode('custom')} />
          Custom repetition pattern
        </label>
        {mode === 'custom' && (
          <>
            <input
              type="text"
              placeholder="e.g. **.**.17.30.00 or Monday|Friday.09.00.00"
              value={pattern}
              onChange={e => setPattern(e.target.value)}
            />
            <PatternHelp />
          </>
        )}
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>
          Cancel
        </button>
        <button className="btn" onClick={save} disabled={!valid}>
          Schedule
        </button>
      </div>
    </Modal>
  );
}

// The custom pattern's syntax, with worked examples.
function PatternHelp() {
  return (
    <div className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>
      <div>
        <strong>MM.dd.HH.mm.ss</strong> — months.days.hours.minutes.seconds
      </div>
      <div>
        <strong>ww.HH.mm.ss</strong> — weekdays.hours.minutes.seconds
      </div>
      <div style={{ marginTop: 6 }}>
        Use <strong className="mono">**</strong> as a wildcard for the months, days or weekdays
        part, meaning &quot;every one of them&quot;. Give several values with{' '}
        <strong className="mono">|</strong> between them. Hours, minutes and seconds are always
        exact — they take no wildcard.
      </div>
      <div style={{ marginTop: 6 }}>
        <span className="mono">**.**.17.30.00</span> — every day at 17:30
        <br />
        <span className="mono">**.01|15.02.00.00</span> — the 1st and 15th of every month at 02:00
        <br />
        <span className="mono">01|07.01.00.00.00</span> — 1 January and 1 July at midnight
        <br />
        <span className="mono">Monday|Friday.09.00.00</span> — Mondays and Fridays at 09:00
        <br />
        <span className="mono">**.22.00.00</span> — every weekday at 22:00
      </div>
    </div>
  );
}
