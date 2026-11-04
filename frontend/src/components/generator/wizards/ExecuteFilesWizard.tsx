import SearchInput from '../../SearchInput';
import { useExecuteFiles } from '../hooks/useExecuteFiles';
import { WizardProps } from '../types';
import FileDescriptionTooltip from './FileDescriptionTooltip';

/*
 * Wizard granting [execute-file]/[io.file.execute] against specific files under
 * /modules/ — the only tree admins author business logic in. The chosen file's own
 * code is NOT re-sandboxed once its path clears the pin (it runs with the whitelist
 * lifted), so this hands the role everything that file can reach, not just "permission
 * to call it" — the note below says so. Candidates come from the existing recursive
 * file listing endpoint, filtered client-side to Hyperlambda files.
 */
export default function ExecuteFilesWizard(props: WizardProps) {
  const {
    loading,
    filter,
    setFilter,
    chosen,
    setChosen,
    tooltip,
    setTooltip,
    descLoading,
    shown,
    count,
    allShownChosen,
    toggleShown,
    add,
    toggleDescription,
  } = useExecuteFiles(props);

  return (
    <div className="card" style={{ padding: 10, marginBottom: 6 }}>
      <div className="toolbar" style={{ marginBottom: 6 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>Execute files</div>
        <span className="spacer" />
        <button className="btn btn-small" onClick={add} disabled={count === 0}>
          Add
        </button>
        <button className="btn btn-secondary btn-small" onClick={props.onCancel}>
          Close
        </button>
      </div>
      <div className="toolbar" style={{ marginBottom: 6 }}>
        <SearchInput placeholder="Filter files…" value={filter} onChange={setFilter} />
        {shown.length > 0 && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
            <input
              type="checkbox"
              checked={allShownChosen}
              onChange={e => toggleShown(e.target.checked)}
            />
            {filter
              ? 'Select all filtered (' + shown.length + ')'
              : 'Select all (' + shown.length + ')'}
          </label>
        )}
        {count > 0 && (
          <span className="muted" style={{ fontSize: 12 }}>
            {count} selected
          </span>
        )}
      </div>
      <div
        className="card"
        style={{ maxHeight: 180, overflow: 'auto', padding: '6px 14px 6px 6px' }}
      >
        {loading && (
          <span className="muted" style={{ fontSize: 12 }}>
            loading…
          </span>
        )}
        {!loading && shown.length === 0 && (
          <span className="muted" style={{ fontSize: 12 }}>
            No .hl files found under /modules/.
          </span>
        )}
        {shown.map(path => (
          <label
            key={path}
            className="checkbox-row wizard-pick-row"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
          >
            <input
              type="checkbox"
              checked={!!chosen[path]}
              onChange={e => setChosen({ ...chosen, [path]: e.target.checked })}
            />
            <span className="mono">{path}</span>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              title="Show this file's file-level comment"
              style={{ marginLeft: 'auto', padding: '0 6px', minWidth: 20 }}
              onClick={e => toggleDescription(path, e)}
            >
              {descLoading === path ? '…' : '?'}
            </button>
          </label>
        ))}
      </div>
      <span className="muted" style={{ fontSize: 12 }}>
        Pins <span className="mono">execute-file</span>,{' '}
        <span className="mono">io.file.execute</span> and <span className="mono">io.file.load</span>{' '}
        to each chosen path, so a caller can read a file&apos;s source to learn how to execute it.
        This is how a role gets complex domain logic without being granted the raw slots that logic
        uses (data.read and so on): once a path is admitted its own code runs fully trusted, not
        re-sandboxed — only whitelist files whose logic, and source, you have reviewed for this
        role.
      </span>
      {tooltip && <FileDescriptionTooltip tooltip={tooltip} onClose={() => setTooltip(null)} />}
    </div>
  );
}
