import { useEffect, useState } from 'react';
import {
  countEndpoints,
  countLog,
  countPublicEndpoints,
  countTasks,
  countUsers,
} from '../../../lib/api';

// The numbers on the dashboard's KPI cards, null until each one answers.
export function useDashboardCounts() {
  const [endpoints, setEndpoints] = useState<number | null>(null);
  const [publicEndpoints, setPublicEndpoints] = useState<number | null>(null);
  const [users, setUsers] = useState<number | null>(null);
  const [tasks, setTasks] = useState<number | null>(null);
  const [logItems, setLogItems] = useState<number | null>(null);

  useEffect(() => {
    countEndpoints()
      .then(r => setEndpoints(r.count))
      .catch(() => {});
    countPublicEndpoints()
      .then(r => setPublicEndpoints(r.count))
      .catch(() => {});
    countUsers('')
      .then(r => setUsers(r.count))
      .catch(() => {});
    countTasks()
      .then(r => setTasks(r.count))
      .catch(() => {});
    countLog()
      .then(r => setLogItems(r.count))
      .catch(() => {});
  }, []);

  return { endpoints, publicEndpoints, users, tasks, logItems };
}
