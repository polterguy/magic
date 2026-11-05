import { Task } from '../../lib/api';
import { showToast } from '../../lib/toast';
import AiPrompt from '../AiPrompt';
import CodeEditor from '../CodeEditor';
import { Modal } from '../Dialogs';
import { useTaskDialog } from './hooks/useTaskDialog';

export default function TaskDialog(
  props: Readonly<{
    task: Task;
    isNew: boolean;
    onClose: () => void;
    onSaved: (id: string, wasNew: boolean) => void;
  }>,
) {
  const {
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
  } = useTaskDialog(props);

  return (
    <Modal
      width={1100}
      onClose={close}
      onSubmit={() => {
        if (!busy && (!props.isNew || id)) void save();
      }}
    >
      <h2>{props.isNew ? 'New task' : 'Edit ' + props.task.id}</h2>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <input
          type="text"
          placeholder="task-name"
          data-initial-focus={props.isNew || undefined}
          autoComplete="off"
          // The name is the task's identifier, so it can't be changed.
          readOnly={!props.isNew}
          value={id}
          onChange={e => setId(e.target.value)}
          style={{ width: 260 }}
        />
        <input
          type="text"
          placeholder="Description"
          autoComplete="off"
          value={description}
          onChange={e => setDescription(e.target.value)}
          style={{ flex: 1 }}
        />
      </div>
      <div style={{ height: '55vh', display: 'flex', flexDirection: 'column' }}>
        <CodeEditor
          value={code}
          onChange={setCode}
          mode="hyperlambda"
          onSave={save}
          undoableEditId={codeEditId}
        />
      </div>
      <AiPrompt
        fileType="hl"
        getOldCode={() => code}
        session="task-editor.editor"
        onResult={value => {
          setCode(value);
          bumpCodeEditId();
        }}
        onError={message => showToast(message, true)}
        style={{ marginTop: 8 }}
      />
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={close}>
          Close
        </button>
        <button className="btn" onClick={save} disabled={busy || (props.isNew && !id)}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Modal>
  );
}
