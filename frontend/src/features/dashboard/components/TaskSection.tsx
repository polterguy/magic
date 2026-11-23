import { executeTask, listTasks, Task } from '@shared/api';
import { useDialog } from '@shared/hooks/useDialog';
import { showError } from '@shared/lib/errors';
import { showToast } from '@shared/lib/toast';
import { featureHref } from '@shared/shell/features';
import BusyLabel from '@shared/ui/BusyLabel';
import { ClockIcon } from '@shared/ui/Icons';
import Pagination from '@shared/ui/Pagination';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { TASK_PAGE_SIZE, taskPageCount } from '../lib/constants';

export default function TaskSection(
  props: Readonly<{
    // Total task count, so paging knows where the list ends.
    count: number | null;
  }>,
) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [page, setPage] = useState(0);
  const [running, setRunning] = useState<string | null>(null);
  const { confirm } = useDialog();

  useEffect(() => {
    listTasks(page * TASK_PAGE_SIZE, TASK_PAGE_SIZE)
      .then(list => setTasks(list ?? []))
      .catch(() => setTasks([]));
  }, [page]);

  async function execute(task: Task) {
    if (
      !(await confirm({
        title: 'Execute task?',
        message: task.id + ' will run on your server right now.',
        confirmText: 'Execute',
      }))
    ) {
      return;
    }
    setRunning(task.id);
    try {
      await executeTask(task.id);
      showToast('Task ' + task.id + ' executed');
    } catch (err) {
      showError(err);
    } finally {
      setRunning(null);
    }
  }

  // Hidden only when there genuinely are no tasks, not while paging.
  if (props.count === 0) {
    return null;
  }

  const pageCount = taskPageCount(props.count);
  const taskManager = featureHref('tasks');

  return (
    <section className="card dash-tasks">
      <div className="dash-section-head">
        <h2>Tasks</h2>
        {props.count !== null && <span className="dash-count">{props.count}</span>}
        {taskManager !== null && (
          <Link className="dash-section-link" to={taskManager}>
            Task Manager →
          </Link>
        )}
      </div>
      <p className="muted dash-section-text">
        Run one of your tasks now. The Task Manager is where you write and schedule them.
      </p>
      <ul className="dash-task-list">
        {tasks.map(task => (
          <li className="dash-task" key={task.id}>
            <span className="dash-task-icon" aria-hidden="true">
              <ClockIcon />
            </span>
            <span className="dash-task-text">
              <span className="dash-task-name">{task.id}</span>
              <span className="dash-task-description line-clamp">
                {task.description || 'No description'}
              </span>
            </span>
            <button
              className="btn btn-secondary btn-small"
              disabled={running === task.id}
              title={'Run ' + task.id + ' on your server now'}
              onClick={() => execute(task)}
            >
              <BusyLabel busy={running === task.id} label="▷ Execute" busyLabel="Running…" />
            </button>
          </li>
        ))}
      </ul>
      {pageCount > 1 && (
        <div className="pagination" style={{ marginTop: 14 }}>
          <Pagination page={page} pageCount={pageCount} onPage={setPage} />
        </div>
      )}
    </section>
  );
}
