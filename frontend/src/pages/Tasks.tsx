import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import AiWaiter from '../components/AiWaiter';
import Pagination from '../components/Pagination';
import SearchInput from '../components/SearchInput';
import { useTaskActions } from '../components/tasks/hooks/useTaskActions';
import { useTaskEditor } from '../components/tasks/hooks/useTaskEditor';
import { useTaskList } from '../components/tasks/hooks/useTaskList';
import { useTaskSchedules } from '../components/tasks/hooks/useTaskSchedules';
import ScheduleDialog from '../components/tasks/ScheduleDialog';
import TaskDialog from '../components/tasks/TaskDialog';
import TasksTable from '../components/tasks/TasksTable';
import { showToast } from '../lib/toast';

export default function Tasks() {
  const [params, setParams] = useSearchParams();
  // Backend round-trips triggered by clicks — edit-fetch, execute, deletes.
  const [waiting, setWaiting] = useState(false);
  const { filter, setFilter, list } = useTaskList(params.get('filter') ?? '');
  const { editing, setEditing, openEdit, openNew } = useTaskEditor(params, setParams, setWaiting);
  const { execute, remove } = useTaskActions(list, setWaiting);
  const { scheduling, setScheduling, removeSchedule, addSchedule } = useTaskSchedules(
    list,
    setWaiting,
  );

  return (
    <>
      <div className="page-header">
        <h1>Task Manager</h1>
        <p>Hyperlambda tasks your server can run on demand or on a schedule</p>
      </div>
      <div className="toolbar">
        <SearchInput placeholder="Filter tasks…" value={filter} onChange={setFilter} />
        <span className="muted">{list.count} tasks</span>
        <span className="spacer" />
        <button className="btn" onClick={openNew}>
          + New task
        </button>
        <Pagination page={list.page} pageCount={list.pageCount} onPage={list.setPage} />
      </div>
      <TasksTable
        rows={list.rows}
        filter={filter}
        onExecute={execute}
        onEdit={openEdit}
        onSchedule={setScheduling}
        onDelete={remove}
        onRemoveSchedule={removeSchedule}
      />
      {editing && (
        <TaskDialog
          task={editing.task}
          isNew={editing.isNew}
          onClose={() => setEditing(null)}
          onSaved={(id, wasNew) => {
            setEditing(null);
            showToast('Task ' + id + (wasNew ? ' created' : ' updated'));
            list.refresh();
          }}
        />
      )}
      {scheduling && (
        <ScheduleDialog
          taskId={scheduling.id}
          onClose={() => setScheduling(null)}
          onSave={addSchedule}
        />
      )}
      {waiting && <AiWaiter />}
    </>
  );
}
