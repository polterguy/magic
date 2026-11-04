import { useMemo, useRef, useState } from 'react';
import type { EditorView } from '@codemirror/view';
import AiWaiter from '../components/AiWaiter';
import Tabs from '../components/Tabs';
import { CardGridSkeleton } from '../components/Skeleton';
import { useSessionState } from '../lib/useSessionState';
import { useEditToken } from '../lib/editor';
import { buildSqlAiContext, sqlHintTables, useDatabaseSelection } from '../lib/sql';
import DesignerView from '../components/sql/DesignerView';
import SnippetToolbar from '../components/sql/SnippetToolbar';
import SqlEditorArea from '../components/sql/SqlEditorArea';
import SqlHeader from '../components/sql/SqlHeader';
import SqlResults from '../components/sql/SqlResults';
import { useSchemaDesigner } from '../components/sql/hooks/useSchemaDesigner';
import { useSqlExecution } from '../components/sql/hooks/useSqlExecution';
import { useSqlGenerator } from '../components/sql/hooks/useSqlGenerator';
import { useSqlHistory } from '../components/sql/hooks/useSqlHistory';
import { useSqlSnippetFiles } from '../components/sql/hooks/useSqlSnippetFiles';

export default function Sql() {
  // Prefers magic — the SQL editor's most common target, unlike the
  // generators which deliberately avoid it.
  const selection = useDatabaseSelection({ preferMagic: true });
  const { type, connectionString, database } = selection;
  // The editor's buffer outlives the page — leaving and coming back restores
  // it, instead of a discard-changes dialog standing in the way.
  const [sql, setSql] = useSessionState('magic2.sql-studio.sql', '');
  // Bumped alongside setSql whenever the whole buffer is deliberately
  // replaced (generate, load snippet, load history, import), so that
  // replacement becomes one undo step instead of bypassing undo entirely.
  const [sqlEditId, bumpSqlEditId] = useEditToken();
  // What the editor last loaded or saved — differing content means unsaved changes.
  const [savedSql, setSavedSql] = useSessionState('magic2.sql-studio.saved', '');
  // Click-triggered round-trips outside Run — DDL exports, schema changes,
  // imports and snippet I/O.
  const [waiting, setWaiting] = useState(false);
  const [view, setView] = useState<'sql' | 'tables'>('sql');
  const editorRef = useRef<EditorView | null>(null);

  const tables = selection.selectedMeta?.tables ?? [];
  const reloadSchema = selection.reloadSchema;

  const snippetFiles = useSqlSnippetFiles({
    type,
    sql,
    savedSql,
    setSql,
    setSavedSql,
    bumpSqlEditId,
    setWaiting,
  });

  function createAiContext() {
    return buildSqlAiContext({ type, connectionString, database, tables, sql });
  }

  const generator = useSqlGenerator({ editorRef, createAiContext, setSql, bumpSqlEditId });
  const designer = useSchemaDesigner({
    type,
    connectionString,
    database,
    reloadSchema,
    setWaiting,
  });

  // Table → columns map for Ctrl-Space SQL autocomplete.
  const hintTables = useMemo(() => sqlHintTables(selection.selectedMeta), [selection.selectedMeta]);

  const { history, pushHistory, openHistory } = useSqlHistory(setSql, bumpSqlEditId);
  const execution = useSqlExecution({
    type,
    connectionString,
    database,
    sql,
    editorRef,
    pushHistory,
  });

  return (
    <>
      <SqlHeader
        selection={selection}
        view={view}
        sql={sql}
        safeMode={execution.safeMode}
        onSafeModeChange={execution.setSafeMode}
        aiConfigured={generator.aiConfigured}
        generating={generator.generating}
        hasSelection={generator.hasSelection}
        onGenerate={generator.generateFromSelection}
        busy={execution.busy}
        onExecute={execution.execute}
      />
      <Tabs
        tabs={[
          { id: 'sql', label: 'SQL' },
          { id: 'tables', label: 'Designer' },
        ]}
        active={view}
        onChange={id => setView(id as 'sql' | 'tables')}
      />
      {selection.connectionsLoaded && selection.connectionStrings.length === 0 && (
        <div className="info-box" style={{ marginBottom: 12 }}>
          No connection strings are configured for {type}. Add one under Databases → External.
        </div>
      )}
      {selection.schemaLoading && view === 'tables' && <CardGridSkeleton />}
      {view === 'tables' && !selection.schemaLoading && (
        <DesignerView
          type={type}
          connectionString={connectionString}
          database={database}
          tables={tables}
          designer={designer}
        />
      )}
      {view === 'sql' && (
        <>
          <SnippetToolbar
            snippets={snippetFiles.snippets}
            selectedSnippet={snippetFiles.selectedSnippet}
            onOpenSnippet={snippetFiles.openSnippet}
            history={history}
            onOpenHistory={openHistory}
            onSaveSnippet={snippetFiles.saveSnippet}
            onImportSqlFile={snippetFiles.importSqlFile}
          />
          <SqlEditorArea
            sql={sql}
            setSql={setSql}
            sqlEditId={sqlEditId}
            bumpSqlEditId={bumpSqlEditId}
            hintTables={hintTables}
            editorRef={editorRef}
            onExecute={execution.execute}
            onSelectionChange={generator.setHasSelection}
            createAiContext={createAiContext}
          />
        </>
      )}
      {view === 'sql' && <SqlResults result={execution.result} />}
      {(waiting || generator.generating) && <AiWaiter />}
    </>
  );
}
