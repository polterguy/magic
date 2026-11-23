import { countTasks, listTasks, Task } from '@shared/api';
import { usePagedList } from '@shared/hooks/usePagedList';
import { useState } from 'react';

import { PAGE_SIZE } from '../lib/constants';

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
