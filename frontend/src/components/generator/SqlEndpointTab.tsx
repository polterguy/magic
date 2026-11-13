import { showToast } from '../../lib/toast';
import AiPrompt from '../AiPrompt';
import AiWaiter from '../AiWaiter';
import BusyLabel from '../BusyLabel';
import CodeEditor from '../CodeEditor';
import DatabaseSelectors from './DatabaseSelectors';
import EndpointNameFields from './EndpointNameFields';
import { useSqlEndpointTab } from './hooks/useSqlEndpointTab';
import SqlArgumentsToolbar from './SqlArgumentsToolbar';
import SqlAuthToolbar from './SqlAuthToolbar';

// The SQL endpoint generator: publishes a SQL statement, with its arguments, as an endpoint.
export default function SqlEndpointTab() {
  const state = useSqlEndpointTab();
  const {
    selection,
    verb,
    setVerb,
    moduleName,
    setModuleName,
    endpointName,
    setEndpointName,
    sql,
    setSql,
    sqlEditId,
    bumpSqlEditId,
    busy,
    hintTables,
    createAiContext,
    generate,
  } = state;

  return (
    <>
      {selection.error && (
        <div className="error-box" style={{ marginBottom: 12 }}>
          {selection.error}
        </div>
      )}
      <div className="toolbar">
        <DatabaseSelectors selection={selection} />
        <EndpointNameFields
          verbs={['get', 'post', 'put', 'delete', 'patch']}
          verb={verb}
          onVerb={setVerb}
          moduleName={moduleName}
          onModuleName={setModuleName}
          endpointName={endpointName}
          onEndpointName={setEndpointName}
        />
        <span className="spacer" />
        <button className="btn" onClick={generate} disabled={busy || !selection.database}>
          <BusyLabel busy={busy} label="⚙ Generate endpoint" busyLabel="Generating…" />
        </button>
      </div>
      <SqlAuthToolbar sql={state} />
      <SqlArgumentsToolbar sql={state} />
      <div style={{ height: 280, display: 'flex', flexDirection: 'column' }}>
        <CodeEditor
          value={sql}
          onChange={setSql}
          mode="text/x-sql"
          hintTables={hintTables}
          undoableEditId={sqlEditId}
        />
      </div>
      <AiPrompt
        fileType="sql"
        getContext={createAiContext}
        session="generator-sql.editor"
        onResult={value => {
          setSql(value);
          bumpSqlEditId();
        }}
        onError={message => showToast(message, true)}
        style={{ marginTop: 8 }}
      />
      {busy && <AiWaiter />}
    </>
  );
}
