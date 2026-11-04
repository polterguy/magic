import { useState } from 'react';
import { usePagedList } from '../../../lib/usePagedList';
import { Task, countTasks, listTasks } from '../../../lib/api';
import { PAGE_SIZE } from '../constants';

// The filter box and the server-paged task list it narrows.
export function useTaskList(initialFilter: string) {
  const [filter, setFilter] = useState(initialFilter);

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

  return { filter, setFilter, list };
}
