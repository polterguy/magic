import { deleteTask, executeTask, Task } from '../../../lib/api';
import { showError } from '../../../lib/errors';
import { showToast } from '../../../lib/toast';
import { useDialog } from '../../../lib/useDialog';
import type { PagedList } from '../../../lib/usePagedList';

// Running and deleting tasks from the list, each confirmed first.
export function useTaskActions(list: PagedList<Task>, setWaiting: (waiting: boolean) => void) {
  const { confirm, confirmTyped } = useDialog();

  /*
   * Executing runs the task on the server right now, with whatever side
   * effects it has, so it's confirmed first.
   */
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
    setWaiting(true);
    try {
      await executeTask(task.id);
      showToast('Task ' + task.id + ' executed');
    } catch (err) {
      showError(err);
    } finally {
      setWaiting(false);
    }
  }

  async function remove(task: Task) {
    if (
      !(await confirmTyped({
        title: 'Delete task?',
        message:
          'This permanently deletes ' +
          task.id +
          ' and its Hyperlambda. Type the task name to confirm.',
        label: 'Task name',
        expected: task.id,
      }))
    ) {
      return;
    }
    setWaiting(true);
    try {
      await deleteTask(task.id);
      showToast('Task ' + task.id + ' deleted');
      list.refresh();
    } catch (err) {
      showError(err);
    } finally {
      setWaiting(false);
    }
  }

  return { execute, remove };
}
