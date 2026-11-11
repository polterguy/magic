import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { executeTask, listTasks, Task } from '../../lib/api';
import { showError } from '../../lib/errors';
import { showToast } from '../../lib/toast';
import { useDialog } from '../../lib/useDialog';
import { ClockIcon } from '../Icons';
import Pagination from '../Pagination';
import { TASK_PAGE_SIZE, taskPageCount } from './constants';

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

  return (
    <section className="card dash-tasks">
      <div className="dash-section-head">
        <h2>Tasks</h2>
        {props.count !== null && <span className="dash-count">{props.count}</span>}
        <Link className="dash-section-link" to="/task-manager">
          Task Manager →
        </Link>
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
              {running === task.id ? 'Running…' : '▷ Execute'}
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
