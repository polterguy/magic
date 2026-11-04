import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Pagination from '../Pagination';
import { useDialog } from '../../lib/useDialog';
import { Task, executeTask, listTasks } from '../../lib/api';
import { showToast } from '../../lib/toast';
import { showError } from '../../lib/errors';
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
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Tasks</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Run one of your tasks now. <Link to="/task-manager">Task Manager</Link> is where you write
        and schedule them.
      </p>
      <div className="guide-grid">
        {tasks.map(task => (
          <div className="guide-card task-card" key={task.id}>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="guide-title">{task.id}</span>
              <span className="guide-text line-clamp">{task.description || 'No description'}</span>
            </span>
            <button
              className="btn btn-secondary btn-small"
              disabled={running === task.id}
              title={'Run ' + task.id + ' on your server now'}
              onClick={() => execute(task)}
            >
              {running === task.id ? 'Running…' : '▷ Execute'}
            </button>
          </div>
        ))}
      </div>
      {pageCount > 1 && (
        <div className="pagination" style={{ marginTop: 14 }}>
          <Pagination page={page} pageCount={pageCount} onPage={setPage} />
        </div>
      )}
    </div>
  );
}
