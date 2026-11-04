import { Task } from '../../lib/api';
import { TableSkeleton } from '../Skeleton';
import { scheduleLabel } from './constants';

type Schedule = { id: number; due: string; repeats?: string };

// The task list, a skeleton until the first page lands.
export default function TasksTable(
  props: Readonly<{
    rows: Task[] | null;
    filter: string;
    onExecute: (task: Task) => void;
    onEdit: (id: string) => void;
    onSchedule: (task: Task) => void;
    onDelete: (task: Task) => void;
    onRemoveSchedule: (task: Task, schedule: Schedule) => void;
  }>,
) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'auto' }}>
      {props.rows === null ? (
        <TableSkeleton columns={5} />
      ) : (
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
            {props.rows.length === 0 && (
              <tr>
                <td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 24 }}>
                  {props.filter ? 'No tasks match your filter' : 'No tasks yet'}
                </td>
              </tr>
            )}
            {props.rows.map(task => (
              <tr key={task.id}>
                <td>
                  <strong>{task.id}</strong>
                </td>
                <td
                  className="truncate"
                  title={task.description}
                  style={{ maxWidth: 0 }}
                  data-label="Description"
                >
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
                            onClick={() => props.onRemoveSchedule(task, schedule)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="muted" data-label="Created">
                  {task.created ? task.created.slice(0, 10) : ''}
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button
                    className="btn btn-secondary btn-small"
                    title="Run this task on your server now"
                    onClick={() => props.onExecute(task)}
                  >
                    Execute
                  </button>{' '}
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => props.onEdit(task.id)}
                  >
                    Edit
                  </button>{' '}
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => props.onSchedule(task)}
                  >
                    Schedule
                  </button>{' '}
                  <button className="btn btn-danger btn-small" onClick={() => props.onDelete(task)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
