import type { DatabaseSelection } from '../../lib/sql';
import { SparkIcon } from '../Icons';
import Select from '../Select';

/*
 * The page header — the type → connection string → database cascade, plus
 * the SQL tab's execution controls.
 */
export default function SqlHeader(
  props: Readonly<{
    selection: DatabaseSelection;
    view: 'sql' | 'tables';
    sql: string;
    safeMode: boolean;
    onSafeModeChange: (safeMode: boolean) => void;
    aiConfigured: boolean;
    generating: boolean;
    hasSelection: boolean;
    onGenerate: () => void;
    busy: boolean;
    onExecute: () => void;
  }>,
) {
  const { selection, view, sql, safeMode, aiConfigured, generating, hasSelection, busy } = props;
  const { type, connectionString, database } = selection;
  return (
    <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div className="page-title">
        <h1>SQL Studio</h1>
        <p>Execute SQL towards your databases, and design them</p>
      </div>
      <div className="page-tools">
        <Select value={type} onChange={selection.setType}>
          {selection.types.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
        <Select value={connectionString} onChange={selection.setConnectionString}>
          {selection.connectionStrings.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
        <Select value={database} onChange={selection.setDatabase}>
          {selection.databasesMeta.map(db => (
            <option key={db.name} value={db.name}>
              {db.name}
            </option>
          ))}
        </Select>
        {/*
         * Executing is the SQL tab's business — the Designer has no buffer to
         * run and no rows to cap. The database Selects stay, since the
         * Designer needs them.
         */}
        {view === 'sql' && (
          <>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={safeMode}
                onChange={e => props.onSafeModeChange(e.target.checked)}
              />{' '}
              Safe mode
            </label>
            {aiConfigured && (
              <button
                className="btn btn-secondary btn-small"
                title="Run the selected text through the SQL generator"
                onClick={props.onGenerate}
                disabled={generating || !hasSelection}
              >
                <SparkIcon />
                {generating ? 'Generating…' : 'Generate'}
              </button>
            )}
            {/*
             * Empty buffer means nothing to run — and no selection either,
             * since a selection is always a substring of [sql]. The keyboard
             * shortcut bypasses this, so execute() keeps its own guard.
             */}
            <button
              className="btn"
              onClick={props.onExecute}
              disabled={busy || !database || !sql.trim()}
            >
              {busy ? 'Running…' : '▷ Run'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
