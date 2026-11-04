import { Link } from 'react-router-dom';

import ProgressDialog from '../ProgressDialog';
import { TableSkeleton } from '../Skeleton';
import CrudOptionsCard from './CrudOptionsCard';
import CrudTablePicker from './CrudTablePicker';
import DatabaseSelectors from './DatabaseSelectors';
import DonePanel from './DonePanel';
import { useCrudTab } from './hooks/useCrudTab';
import WizardSteps from './WizardSteps';

// The CRUD backend generator: pick a database's tables, and crudify every verb of each.
export default function CrudTab(props: Readonly<{ guided: boolean }>) {
  const crud = useCrudTab(props.guided);
  const {
    selection,
    auth,
    selectedTables,
    moduleName,
    done,
    setDone,
    feed,
    busy,
    progressText,
    closeFeed,
    requestCancel,
  } = crud;

  // Done panel showing after generation — the guided flow's final step.
  if (props.guided && done) {
    return <DonePanel done={done} auth={auth} onMore={() => setDone(null)} />;
  }

  return (
    <>
      {props.guided && <WizardSteps step={selectedTables.size > 0 ? 2 : 1} />}
      {selection.error && (
        <div className="error-box" style={{ marginBottom: 12 }}>
          {selection.error}
        </div>
      )}
      {/*
       * Guided visitors without a database of their own have nothing useful
       * to generate from — send them to create one first, without blocking
       * the screen for those who want Magic's internal database anyway.
       */}
      {props.guided &&
        !selection.loading &&
        !selection.databasesMeta.some(db => db.name !== 'magic') && (
          <div className="info-box" style={{ marginBottom: 12 }}>
            No database of your own yet — <Link to="/databases">create or connect one</Link> first,
            then come back here.
          </div>
        )}
      <div className="toolbar">
        <DatabaseSelectors selection={selection} />
      </div>
      {selection.loading && (
        <div
          className="card gen-table-card"
          style={{ padding: 0, overflow: 'auto', maxWidth: 460 }}
        >
          <TableSkeleton columns={2} />
        </div>
      )}
      {!selection.loading && !selection.database && (
        <div className="info-box">Select a database with tables to generate a CRUD backend.</div>
      )}
      {!selection.loading && !!selection.database && (
        <div className="editor-split" style={{ flex: 'unset', alignItems: 'flex-start' }}>
          <CrudTablePicker crud={crud} />
          <CrudOptionsCard crud={crud} />
        </div>
      )}
      {feed !== null && (
        <ProgressDialog
          title="Generating your backend"
          label={'/modules/' + (moduleName || selection.database) + '/'}
          lines={feed}
          progress={busy ? progressText : undefined}
          actions={
            busy && (
              <button className="btn btn-secondary" onClick={requestCancel}>
                Cancel
              </button>
            )
          }
          onClose={closeFeed}
        />
      )}
    </>
  );
}
