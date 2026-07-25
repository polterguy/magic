import { useCallback, useEffect, useState } from 'react';
import CodeEditor from '../components/CodeEditor';
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

export default function Tasks() {

  const [tasks, setTasks] = useState<Task[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Task | null>(null);
  const [editorCode, setEditorCode] = useState('');
  const [description, setDescription] = useState('');
  const [isNew, setIsNew] = useState(false);
  const [newId, setNewId] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);
  const { confirm, prompt } = useDialog();

  const refresh = useCallback(async () => {
    try {
      const [taskList, taskCount] = await Promise.all([
        listTasks(page * PAGE_SIZE, PAGE_SIZE),
        countTasks(),
      ]);
      setTasks(taskList ?? []);
      setCount(taskCount.count);
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    }
  }, [page]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function select(task: Task) {
    try {
      const full = await getTask(task.id);
      setSelected(full);
      setEditorCode(full.hyperlambda ?? '');
      setDescription(full.description ?? '');
      setIsNew(false);
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    }
  }

  function startNew() {
    setSelected(null);
    setIsNew(true);
    setNewId('');
    setDescription('');
    setEditorCode(NEW_TASK_CODE);
  }

  async function save() {
    try {
      if (isNew) {
        if (!newId) {
          setFeedback({ text: 'Give the task a name', isError: true });
          return;
        }
        await createTask(newId, description, editorCode);
        setFeedback({ text: 'Task ' + newId + ' created', isError: false });
        setIsNew(false);
        await refresh();
        await select({ id: newId });
      } else if (selected) {
        await updateTask(selected.id, description, editorCode);
        setFeedback({ text: 'Task ' + selected.id + ' updated', isError: false });
      }
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    }
  }

  async function remove(task: Task) {
    if (!await confirm({
      title: 'Delete task?',
      message: task.id,
      confirmText: 'Delete',
      danger: true,
    })) {
      return;
    }
    try {
      await deleteTask(task.id);
      if (selected?.id === task.id) {
        setSelected(null);
      }
      await refresh();
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    }
  }

  async function execute(task: Task) {
    try {
      await executeTask(task.id);
      setFeedback({ text: 'Task ' + task.id + ' executed', isError: false });
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    }
  }

  const [scheduling, setScheduling] = useState(false);

  async function addSchedule(due: string | undefined, repeats: string | undefined) {
    if (!selected) {
      return;
    }
    try {
      await scheduleTask(selected.id, due, repeats);
      setScheduling(false);
      await select(selected);
      setFeedback({ text: 'Schedule added', isError: false });
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    }
  }

  async function removeSchedule(id: number) {
    try {
      await deleteSchedule(id);
      if (selected) {
        await select(selected);
      }
    } catch (err: any) {
      setFeedback({ text: err.message, isError: true });
    }
  }

  const pageCount = Math.ceil(count / PAGE_SIZE);
  const editing = isNew || selected;

  return (
    <>
      <div className="page-header">
        <h1>Task Manager</h1>
        <p>{count} scheduled or persisted tasks</p>
      </div>
      {feedback && (
        <div
          className={feedback.isError ? 'error-box' : 'success-box'}
          style={{ marginBottom: 12 }}>
          {feedback.text}
        </div>
      )}
      <div className="toolbar">
        <span className="spacer" />
        <button className="btn" onClick={startNew}>+ New task</button>
      </div>
      <div className="editor-split" style={{ alignItems: 'stretch' }}>
        <div className="card" style={{ padding: 0, overflow: 'auto', maxWidth: 420 }}>
          <table>
            <thead>
              <tr><th>Task</th><th style={{ width: 150 }}></th></tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr
                  key={task.id}
                  className="clickable"
                  onClick={() => select(task)}
                  style={selected?.id === task.id
                    ? { outline: '2px solid var(--accent)' }
                    : undefined}>
                  <td>
                    <div><strong>{task.id}</strong></div>
                    {task.description && <div className="muted">{task.description}</div>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        className="btn btn-secondary btn-small"
                        onClick={e => { e.stopPropagation(); execute(task); }}>
                        ▷
                      </button>
                      <button
                        className="btn btn-danger btn-small"
                        onClick={e => { e.stopPropagation(); remove(task); }}>
                        ✕
                      </button>
                    </div>
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
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 400 }}>
          {editing ? (
            <>
              <div className="toolbar">
                {isNew ? (
                  <input
                    type="text"
                    placeholder="task-name"
                    value={newId}
                    onChange={e => setNewId(e.target.value)} />
                ) : (
                  <strong>{selected!.id}</strong>
                )}
                <input
                  type="text"
                  placeholder="Description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  style={{ flex: 1 }} />
                <button className="btn" onClick={save}>Save</button>
              </div>
              {!isNew && (
                <div className="toolbar">
                  <span className="editor-pane-title" style={{ margin: 0 }}>Schedules</span>
                  {(selected!.schedules ?? []).map(schedule => (
                    <span className="chip" key={schedule.id}>
                      {schedule.repeats ?? new Date(schedule.due).toLocaleString()}
                      <button onClick={() => removeSchedule(schedule.id)}>✕</button>
                    </span>
                  ))}
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => setScheduling(true)}>
                    + Schedule
                  </button>
                </div>
              )}
              <CodeEditor
                value={editorCode}
                onChange={setEditorCode}
                mode="hyperlambda"
                onSave={save} />
            </>
          ) : (
            <div className="card muted">Select a task, or create a new one.</div>
          )}
        </div>
      </div>
      {scheduling && selected && (
        <ScheduleDialog
          taskId={selected.id}
          onClose={() => setScheduling(false)}
          onSave={addSchedule} />
      )}
    </>
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
            <select value={number} onChange={e => setNumber(Number(e.target.value))}>
              {REPEAT_NUMBERS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <select value={period} onChange={e => setPeriod(e.target.value)}>
              {REPEAT_PERIODS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
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
              placeholder="e.g. 10.20.15.22.22 or Sunday.15.22.22"
              value={pattern}
              onChange={e => setPattern(e.target.value)} />
            <span className="muted" style={{ fontSize: 12 }}>
              Formats: MM.dd.HH.mm.ss (months.days.hours.minutes.seconds) or
              ww.HH.mm.ss (weekday.hour.minute.second)
            </span>
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
