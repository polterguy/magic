import { useCallback, useEffect, useRef, useState } from 'react';
import type { SetURLSearchParams } from 'react-router-dom';
import { Task, getTask } from '../../../lib/api';
import { showError } from '../../../lib/errors';
import { NEW_TASK_CODE } from '../constants';

// Which task the editor dialog has open, if any, and the ways of opening it.
export function useTaskEditor(
  params: URLSearchParams,
  setParams: SetURLSearchParams,
  setWaiting: (waiting: boolean) => void,
) {
  const [editing, setEditing] = useState<{ task: Task; isNew: boolean } | null>(null);

  /*
   * The list doesn't carry the Hyperlambda, so editing fetches the full task.
   * Memoised on [setWaiting] — a state setter, so stable — which keeps the
   * deep-link effect below firing only when the URL parameters change.
   */
  const openEdit = useCallback(
    async (id: string) => {
      setWaiting(true);
      try {
        setEditing({ task: await getTask(id), isNew: false });
      } catch (err) {
        showError(err);
      } finally {
        setWaiting(false);
      }
    },
    [setWaiting],
  );

  /*
   * The command palette links straight at one task. Opening it is a one-shot —
   * the parameters are dropped once used, so a refresh, or closing the editor
   * and navigating back, does not reopen the dialog.
   */
  const deepLinked = useRef(false);
  useEffect(() => {
    const id = params.get('edit');
    if (!id || deepLinked.current) {
      return;
    }
    deepLinked.current = true;
    void openEdit(id);
    params.delete('edit');
    setParams(params, { replace: true });
  }, [params, setParams, openEdit]);

  function openNew() {
    setEditing({
      task: { id: '', description: '', hyperlambda: NEW_TASK_CODE },
      isNew: true,
    });
  }

  return { editing, setEditing, openEdit, openNew };
}
