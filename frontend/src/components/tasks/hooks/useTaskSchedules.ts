import { useState } from 'react';
import { Task, deleteSchedule, scheduleTask } from '../../../lib/api';
import { useDialog } from '../../../lib/useDialog';
import { showToast } from '../../../lib/toast';
import { showError } from '../../../lib/errors';
import type { PagedList } from '../../../lib/usePagedList';
import { scheduleLabel } from '../constants';

// Adding schedules to a task through the schedule dialog, and removing them.
export function useTaskSchedules(list: PagedList<Task>, setWaiting: (waiting: boolean) => void) {
  const [scheduling, setScheduling] = useState<Task | null>(null);
  const { confirm } = useDialog();

  /*
   * Removing a schedule silently unschedules a possibly-production job, and
   * the schedule itself is gone for good — so it's confirmed first.
   */
  async function removeSchedule(
    task: Task,
    schedule: { id: number; due: string; repeats?: string },
  ) {
    if (
      !(await confirm({
        title: 'Remove schedule?',
        message: task.id + ' will no longer run ' + scheduleLabel(schedule) + '.',
        confirmText: 'Remove',
        danger: true,
      }))
    ) {
      return;
    }
    setWaiting(true);
    try {
      await deleteSchedule(schedule.id);
      list.refresh();
    } catch (err) {
      showError(err);
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
    } catch (err) {
      showError(err);
    } finally {
      setWaiting(false);
    }
  }

  return { scheduling, setScheduling, removeSchedule, addSchedule };
}
