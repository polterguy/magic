import { createTask, Task, updateTask } from '@core/api';
import { showError } from '@core/errors';
import { showToast } from '@core/toast';
import { useDialog } from '@shared/hooks/useDialog';
import { useEditToken } from '@shared/lib/editor';
import { useState } from 'react';

import { taskIsDirty } from '../lib/constants';

// The task editor's fields, its unsaved-changes guard, and saving.
export function useTaskDialog(
  props: Readonly<{
    task: Task;
    isNew: boolean;
    onClose: () => void;
    onSaved: (id: string, wasNew: boolean) => void;
  }>,
) {
  const [id, setId] = useState(props.task.id);
  const [description, setDescription] = useState(props.task.description ?? '');
  const [code, setCode] = useState(props.task.hyperlambda ?? '');
  const [codeEditId, bumpCodeEditId] = useEditToken();
  const [saved, setSaved] = useState({
    description: props.task.description ?? '',
    code: props.task.hyperlambda ?? '',
  });
  const [busy, setBusy] = useState(false);
  const { confirm } = useDialog();

  const dirty = taskIsDirty(props.isNew, id, { description, code }, saved);

  async function close() {
    if (
      dirty &&
      !(await confirm({
        title: 'Discard unsaved changes?',
        message: (id || 'This task') + ' has unsaved changes.',
        confirmText: 'Discard',
        danger: true,
      }))
    ) {
      return;
    }
    props.onClose();
  }

  async function save() {
    if (props.isNew && !id) {
      showToast('Give the task a name', true);
      return;
    }
    setBusy(true);
    try {
      if (props.isNew) {
        await createTask(id, description, code);
      } else {
        await updateTask(id, description, code);
      }
      setSaved({ description, code });
      props.onSaved(id, props.isNew);
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  return {
    id,
    setId,
    description,
    setDescription,
    code,
    setCode,
    codeEditId,
    bumpCodeEditId,
    busy,
    close,
    save,
  };
}
