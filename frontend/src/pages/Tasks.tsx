import { showToast } from '../lib/toast';
import Select from '../components/Select';
import SearchInput from '../components/SearchInput';
import { useCallback, useEffect, useState } from 'react';
import CodeEditor from '../components/CodeEditor';
import AiPrompt from '../components/AiPrompt';
import { Modal, useDialog } from '../components/Dialogs';
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

/*
 * Notifications go to the toast stack. An inline banner is part of the page,
 * so showing one pushed everything below it down — the editors and grids
 * jumped under the pointer. Toasts float above the page instead.
 */
function setFeedback(value: { text: string; isError: boolean } | null) {
  if (value) {
    showToast(value.text, value.isError);
  }
}

export default function Tasks() {

  const [tasks, setTasks] = useState<Task[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState<{ task: Task; isNew: boolean } | null>(null);
  const [scheduling, setScheduling] = useState<Task | null>(null);
  const { confirm, prompt } = useDialog();

  const refresh = useCallback(async () => {
    try {
      const [taskList, taskCount] = await Promise.all([
        listTasks(page * PAGE_SIZE, PAGE_SIZE, filter),
        countTasks(filter),
      ]);
      setTasks(taskList ?? []);
      setCount(taskCount.count);
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    }
  }, [page, filter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // The list doesn't carry the Hyperlambda, so editing fetches the full task.
  async function openEdit(task: Task) {
    try {
      setEditing({ task: await getTask(task.id), isNew: false });
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    }
  }

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
    try {
      await executeTask(task.id);
      setFeedback({ text: 'Task ' + task.id + ' executed', isError: false });
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    }
  }

  async function remove(task: Task) {
    const typed = await prompt({
      title: 'Delete task?',
      message: 'This permanently deletes ' + task.id +
        ' and its Hyperlambda. Type the task name to confirm.',
      label: 'Task name',
      confirmText: 'Delete',
    });
    if (typed === null) {
      return;
    }
    if (typed !== task.id) {
      setFeedback({ text: 'Name did not match — nothing deleted', isError: true });
      return;
    }
    try {
      await deleteTask(task.id);
      setFeedback({ text: 'Task ' + task.id + ' deleted', isError: false });
      await refresh();
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    }
  }

  async function removeSchedule(id: number) {
    try {
      await deleteSchedule(id);
      await refresh();
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    }
  }

  async function addSchedule(due: string | undefined, repeats: string | undefined) {
    if (!scheduling) {
      return;
    }
    try {
      await scheduleTask(scheduling.id, due, repeats);
      setScheduling(null);
      setFeedback({ text: 'Schedule added to ' + scheduling.id, isError: false });
      await refresh();
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    }
  }

  const pageCount = Math.ceil(count / PAGE_SIZE);

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
          onChange={value => { setFilter(value); setPage(0); }} />
        <span className="muted">{count} tasks</span>
        <span className="spacer" />
        <button className="btn" onClick={openNew}>+ New task</button>
      </div>
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
            {tasks.map(task => (
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
                            onClick={() => removeSchedule(schedule.id)}>
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
                    onClick={() => openEdit(task)}>
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
        {pageCount > 1 && (
          <div className="pagination" style={{ padding: 12 }}>
            <button
              className="btn btn-secondary btn-small"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}>
              ‹ Prev
            </button>
            <span className="muted">{page + 1} / {pageCount}</span>
            <button
              className="btn btn-secondary btn-small"
              disabled={page >= pageCount - 1}
              onClick={() => setPage(page + 1)}>
              Next ›
            </button>
          </div>
        )}
      </div>
      {editing && (
        <TaskDialog
          task={editing.task}
          isNew={editing.isNew}
          onClose={() => setEditing(null)}
          onSaved={async (id, wasNew) => {
            setEditing(null);
            setFeedback({
              text: 'Task ' + id + (wasNew ? ' created' : ' updated'),
              isError: false,
            });
            await refresh();
          }}
          onError={message => setFeedback({ text: message, isError: true })} />
      )}
      {scheduling && (
        <ScheduleDialog
          taskId={scheduling.id}
          onClose={() => setScheduling(null)}
          onSave={addSchedule} />
      )}
    </>
  );
}

function TaskDialog(props: {
  task: Task;
  isNew: boolean;
  onClose: () => void;
  onSaved: (id: string, wasNew: boolean) => void;
  onError: (message: string) => void;
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
      props.onError('Give the task a name');
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
      props.onError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal width={1100} onClose={close}>
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

  function save() {
    switch (mode) {
      case 'fixed':
        if (due) {
          props.onSave(new Date(due).toISOString(), undefined);
        }
        break;
      case 'repeat':
        props.onSave(undefined, number + '.' + period);
        break;
      case 'custom':
        if (pattern) {
          props.onSave(undefined, pattern);
        }
        break;
    }
  }

  return (
    <Modal onClose={props.onClose}>
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
          <input
            type="datetime-local"
            value={due}
            onChange={e => setDue(e.target.value)} />
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
        <button className="btn" onClick={save}>Schedule</button>
      </div>
    </Modal>
  );
}
