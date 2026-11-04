import { useEffect, useState } from 'react';
import { showToast } from '../../../lib/toast';
import { showError } from '../../../lib/errors';
import { useDialog } from '../../../lib/useDialog';
import { useSort } from '../../../lib/sort';
import { usePagedList } from '../../../lib/usePagedList';
import { exportCsv } from '../../../lib/download';
import { User, countUsers, deleteUser, listUsers, loadConfig } from '../../../lib/api';
import { PAGE_SIZE } from '../constants';
import { userCsvRow } from '../helpers';

/*
 * The users tab's data: the filtered, sorted, paged user list, whether
 * invites can be sent, and the delete and export actions.
 */
export function useUserList() {
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useSort();
  const [waiting, setWaiting] = useState(false);
  const { confirmTyped } = useDialog();

  /*
   * Inviting emails a sign-in link, which needs a configured SMTP server —
   * null until the answer arrives, so the button doesn't flicker.
   */
  const [smtpReady, setSmtpReady] = useState<boolean | null>(null);
  useEffect(() => {
    loadConfig()
      .then(config => setSmtpReady(!!config?.magic?.smtp?.host))
      .catch(() => setSmtpReady(false));
  }, []);

  const list = usePagedList<User>({
    load: async (offset, limit) => {
      const [rows, count] = await Promise.all([
        listUsers(filter, offset, limit, sort),
        countUsers(filter),
      ]);
      return { rows: rows ?? [], count: count.count };
    },
    pageSize: PAGE_SIZE,
    filter,
    deps: [sort],
  });

  /*
   * Deleting a user is permanent, so it follows the old dashboard's rule of
   * having the user type the username to confirm.
   */
  async function removeUser(username: string) {
    if (
      !(await confirmTyped({
        title: 'Delete user?',
        message: 'This permanently deletes ' + username + '. Type the username to confirm.',
        label: 'Username',
        expected: username,
      }))
    ) {
      return;
    }
    setWaiting(true);
    try {
      await deleteUser(username);
      showToast(username + ' deleted');
      list.refresh();
    } catch (err) {
      showError(err);
    } finally {
      setWaiting(false);
    }
  }

  /*
   * Exports every user matching the current filter — not just the visible
   * page — by fetching with limit -1, which the backend treats as unlimited.
   */
  async function exportUsers() {
    setWaiting(true);
    try {
      const all = (await listUsers(filter, 0, -1, sort)) ?? [];
      exportCsv(all.map(userCsvRow), 'users.csv');
    } catch (err) {
      showError(err);
    } finally {
      setWaiting(false);
    }
  }

  return {
    filter,
    setFilter,
    sort,
    setSort,
    waiting,
    smtpReady,
    list,
    removeUser,
    exportUsers,
  };
}
