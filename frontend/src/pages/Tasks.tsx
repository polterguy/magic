import { showToast } from '../lib/toast';
import Select from '../components/Select';
import DateTimePicker from '../components/DateTimePicker';
import SearchInput from '../components/SearchInput';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor';
import AiPrompt from '../components/AiPrompt';
import AiWaiter from '../components/AiWaiter';
import Pagination from '../components/Pagination';
import { Modal, useDialog } from '../components/Dialogs';
import { usePagedList } from '../lib/usePagedList';
import {
  Task,
  countTasks,
  createTask,
  deleteSchedule,
  deleteTask,
  executeTask,
  getTask,
  listTasks,
  scheduleTask,
  updateTask,
} from '../lib/api';

const PAGE_SIZE = 10;

const NEW_TASK_CODE = `/*
 * Task Hyperlambda goes here.
 */
log.info:Task executed
`;

// "every 5.minutes" for repeating schedules, the due date for one-off ones.
function scheduleLabel(schedule: { due: string; repeats?: string }) {
  return schedule.repeats
    ? 'every ' + schedule.repeats
    : new Date(schedule.due).toLocaleString();
}

export default function Tasks() {

  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState(params.get('filter') ?? '');
  const [editing, setEditing] = useState<{ task: Task; isNew: boolean } | null>(null);
  const [scheduling, setScheduling] = useState<Task | null>(null);
  // Backend round-trips triggered by clicks — edit-fetch, execute, deletes.
  const [waiting, setWaiting] = useState(false);
  const { confirm, confirmTyped } = useDialog();

  const list = usePagedList<Task>({
    load: async (offset, limit) => {
      const [rows, count] = await Promise.all([
        listTasks(offset, limit, filter),
        countTasks(filter),
      ]);
      return { rows: rows ?? [], count: count.count };
    },
    pageSize: PAGE_SIZE,
    filter,
  });

  // The list doesn't carry the Hyperlambda, so editing fetches the full task.
  async function openEdit(id: string) {
    setWaiting(true);
    try {
      setEditing({ task: await getTask(id), isNew: false });
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setWaiting(false);
    }
  }

  /*
   * The command palette links straight at one task. Opening it is a one-shot —
   * the parameters are dropped once used, so a refresh, or closing the editor
   * and navigating back, does not reopen the dialog.
   */
  const deepLinked = useRef(false);
  useEffect(() => {
    const id = params.get('edit');
    if (!id || deepLinked.current) {
      return;
    }
    deepLinked.current = true;
    openEdit(id);
    params.delete('edit');
    setParams(params, { replace: true });
  }, [params, setParams]);

  function openNew() {
    setEditing({
      task: { id: '', description: '', hyperlambda: NEW_TASK_CODE },
      isNew: true,
    });
  }

  /*
   * Executing runs the task on the server right now, with whatever side
   * effects it has, so it's confirmed first.
   */
  async function execute(task: Task) {
    if (!await confirm({
      title: 'Execute task?',
      message: task.id + ' will run on your server right now.',
      confirmText: 'Execute',
    })) {
      return;
    }
    setWaiting(true);
    try {
      await executeTask(task.id);
      showToast('Task ' + task.id + ' executed');
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setWaiting(false);
    }
  }

  async function remove(task: Task) {
    if (!await confirmTyped({
      title: 'Delete task?',
      message: 'This permanently deletes ' + task.id +
        ' and its Hyperlambda. Type the task name to confirm.',
      label: 'Task name',
      expected: task.id,
    })) {
      return;
    }
    setWaiting(true);
    try {
      await deleteTask(task.id);
      showToast('Task ' + task.id + ' deleted');
      list.refresh();
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setWaiting(false);
    }
  }

  /*
   * Removing a schedule silently unschedules a possibly-production job, and
   * the schedule itself is gone for good — so it's confirmed first.
   */
  async function removeSchedule(task: Task, schedule: { id: number; due: string; repeats?: string }) {
    if (!await confirm({
      title: 'Remove schedule?',
      message: task.id + ' will no longer run ' + scheduleLabel(schedule) + '.',
      confirmText: 'Remove',
      danger: true,
    })) {
      return;
    }
    setWaiting(true);
    try {
      await deleteSchedule(schedule.id);
      list.refresh();
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setWaiting(false);
    }
  }

  async function addSchedule(due: string | undefined, repeats: string | undefined) {
    if (!scheduling) {
      return;
    }
    setWaiting(true);
    try {
      await scheduleTask(scheduling.id, due, repeats);
      setScheduling(null);
      showToast('Schedule added to ' + scheduling.id);
      list.refresh();
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setWaiting(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Task Manager</h1>
        <p>Hyperlambda tasks your server can run on demand or on a schedule</p>
      </div>
      <div className="toolbar">
        <SearchInput
          placeholder="Filter tasks…"
          value={filter}
          onChange={setFilter} />
        <span className="muted">{list.count} tasks</span>
        <span className="spacer" />
        <button className="btn" onClick={openNew}>+ New task</button>
        <Pagination page={list.page} pageCount={list.pageCount} onPage={list.setPage} />
      </div>
      {list.rows === null ? (
        <div className="spinner-panel">
          <div className="spinner" />
          <span className="muted">Loading tasks…</span>
        </div>
      ) : (
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: 260 }}>Name</th>
              <th>Description</th>
              <th style={{ width: 260 }}>Schedules</th>
              <th style={{ width: 120 }}>Created</th>
              <th style={{ width: 300 }}></th>
            </tr>
          </thead>
          <tbody>
            {list.rows.length === 0 && (
              <tr>
                <td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 24 }}>
                  {filter ? 'No tasks match your filter' : 'No tasks yet'}
                </td>
              </tr>
            )}
            {list.rows.map(task => (
              <tr key={task.id}>
                <td><strong>{task.id}</strong></td>
                <td
                  className="truncate"
                  title={task.description}
                  style={{ maxWidth: 0 }}
                  data-label="Description">
                  {task.description || <span className="muted">—</span>}
                </td>
                <td data-label="Schedules">
                  {(task.schedules ?? []).length === 0 ? (
                    <span className="muted">not scheduled</span>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(task.schedules ?? []).map(schedule => (
                        <span className="chip" key={schedule.id}>
                          {scheduleLabel(schedule)}
                          <button
                            title="Remove schedule"
                            onClick={() => removeSchedule(task, schedule)}>
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="muted" data-label="Created">
                  {task.created ? task.created.substring(0, 10) : ''}
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button
                    className="btn btn-secondary btn-small"
                    title="Run this task on your server now"
                    onClick={() => execute(task)}>
                    Execute
                  </button>
                  {' '}
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => openEdit(task.id)}>
                    Edit
                  </button>
                  {' '}
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => setScheduling(task)}>
                    Schedule
                  </button>
                  {' '}
                  <button
                    className="btn btn-danger btn-small"
                    onClick={() => remove(task)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
      {editing && (
        <TaskDialog
          task={editing.task}
          isNew={editing.isNew}
          onClose={() => setEditing(null)}
          onSaved={(id, wasNew) => {
            setEditing(null);
            showToast('Task ' + id + (wasNew ? ' created' : ' updated'));
            list.refresh();
          }} />
      )}
      {scheduling && (
        <ScheduleDialog
          taskId={scheduling.id}
          onClose={() => setScheduling(null)}
          onSave={addSchedule} />
      )}
      {waiting && <AiWaiter />}
    </>
  );
}

function TaskDialog(props: {
  task: Task;
  isNew: boolean;
  onClose: () => void;
  onSaved: (id: string, wasNew: boolean) => void;
}) {

  const [id, setId] = useState(props.task.id);
  const [description, setDescription] = useState(props.task.description ?? '');
  const [code, setCode] = useState(props.task.hyperlambda ?? '');
  const [saved, setSaved] = useState({
    description: props.task.description ?? '',
    code: props.task.hyperlambda ?? '',
  });
  const [busy, setBusy] = useState(false);
  const { confirm } = useDialog();

  const dirty = props.isNew
    ? !!id || code !== saved.code
    : description !== saved.description || code !== saved.code;

  async function close() {
    if (dirty && !await confirm({
      title: 'Discard unsaved changes?',
      message: (id || 'This task') + ' has unsaved changes.',
      confirmText: 'Discard',
      danger: true,
    })) {
      return;
    }
    props.onClose();
  }

  async function save() {
    if (props.isNew && !id) {
      showToast('Give the task a name', true);
      return;
    }
    setBusy(true);
    try {
      if (props.isNew) {
        await createTask(id, description, code);
      } else {
        await updateTask(id, description, code);
      }
      setSaved({ description, code });
      props.onSaved(id, props.isNew);
    } catch (err: any) {
      showToast(err.message, true, err.logId);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      width={1100}
      onClose={close}
      onSubmit={() => { if (!busy && (!props.isNew || id)) save(); }}>
      <h2>{props.isNew ? 'New task' : 'Edit ' + props.task.id}</h2>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <input
          type="text"
          placeholder="task-name"
          autoFocus={props.isNew}
          autoComplete="off"
          // The name is the task's identifier, so it can't be changed.
          readOnly={!props.isNew}
          value={id}
          onChange={e => setId(e.target.value)}
          style={{ width: 260 }} />
        <input
          type="text"
          placeholder="Description"
          autoComplete="off"
          value={description}
          onChange={e => setDescription(e.target.value)}
          style={{ flex: 1 }} />
      </div>
      <div style={{ height: '55vh', display: 'flex', flexDirection: 'column' }}>
        <CodeEditor value={code} onChange={setCode} mode="hyperlambda" onSave={save} />
      </div>
      <AiPrompt
        fileType="hl"
        getContext={() => code}
        session="task-editor.editor"
        onResult={setCode}
        onError={message => showToast(message, true)}
        style={{ marginTop: 8 }} />
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={close}>Close</button>
        <button className="btn" onClick={save} disabled={busy || (props.isNew && !id)}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Modal>
  );
}

const REPEAT_NUMBERS = [5, 10, 15, 20, 25, 30];
const REPEAT_PERIODS = ['seconds', 'minutes', 'hours', 'days', 'weeks', 'months'];

/*
 * The old dashboard's 3-mode schedule dialog: fixed date, simple repetition,
 * or a custom repetition pattern.
 */
function ScheduleDialog(props: {
  taskId: string;
  onClose: () => void;
  onSave: (due: string | undefined, repeats: string | undefined) => void;
}) {

  const [mode, setMode] = useState<'fixed' | 'repeat' | 'custom'>('repeat');
  const [due, setDue] = useState('');
  const [number, setNumber] = useState(5);
  const [period, setPeriod] = useState('minutes');
  const [pattern, setPattern] = useState('');

  // The active mode's value, present or not — the Schedule button follows it,
  // rather than silently doing nothing when clicked with an empty value.
  const valid =
    mode === 'repeat' ||
    (mode === 'fixed' && !!due) ||
    (mode === 'custom' && !!pattern);

  function save() {
    if (!valid) {
      return;
    }
    switch (mode) {
      case 'fixed':
        props.onSave(new Date(due).toISOString(), undefined);
        break;
      case 'repeat':
        props.onSave(undefined, number + '.' + period);
        break;
      case 'custom':
        props.onSave(undefined, pattern);
        break;
    }
  }

  return (
    <Modal onClose={props.onClose} onSubmit={save}>
      <h2>Schedule {props.taskId}</h2>
      <div className="form-grid">
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <input
            type="radio"
            checked={mode === 'fixed'}
            onChange={() => setMode('fixed')} />
          Once, at a fixed date
        </label>
        {mode === 'fixed' && (
          <DateTimePicker
            value={due}
            onChange={setDue}
            placeholder="Pick a date and time" />
        )}
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <input
            type="radio"
            checked={mode === 'repeat'}
            onChange={() => setMode('repeat')} />
          Repeating
        </label>
        {mode === 'repeat' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Select value={String(number)} onChange={value => setNumber(Number(value))}>
              {REPEAT_NUMBERS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Select>
            <Select value={period} onChange={value => setPeriod(value)}>
              {REPEAT_PERIODS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Select>
          </div>
        )}
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <input
            type="radio"
            checked={mode === 'custom'}
            onChange={() => setMode('custom')} />
          Custom repetition pattern
        </label>
        {mode === 'custom' && (
          <>
            <input
              type="text"
              placeholder="e.g. **.**.17.30.00 or Monday|Friday.09.00.00"
              value={pattern}
              onChange={e => setPattern(e.target.value)} />
            <div className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>
              <div>
                <strong>MM.dd.HH.mm.ss</strong> — months.days.hours.minutes.seconds
              </div>
              <div>
                <strong>ww.HH.mm.ss</strong> — weekdays.hours.minutes.seconds
              </div>
              <div style={{ marginTop: 6 }}>
                Use <strong className="mono">**</strong> as a wildcard for the months,
                days or weekdays part, meaning "every one of them". Give several values
                with <strong className="mono">|</strong> between them. Hours, minutes and
                seconds are always exact — they take no wildcard.
              </div>
              <div style={{ marginTop: 6 }}>
                <span className="mono">**.**.17.30.00</span> — every day at 17:30<br />
                <span className="mono">**.01|15.02.00.00</span> — the 1st and 15th of every
                month at 02:00<br />
                <span className="mono">01|07.01.00.00.00</span> — 1 January and 1 July at
                midnight<br />
                <span className="mono">Monday|Friday.09.00.00</span> — Mondays and Fridays
                at 09:00<br />
                <span className="mono">**.22.00.00</span> — every weekday at 22:00
              </div>
            </div>
          </>
        )}
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={props.onClose}>Cancel</button>
        <button className="btn" onClick={save} disabled={!valid}>Schedule</button>
      </div>
    </Modal>
  );
}
