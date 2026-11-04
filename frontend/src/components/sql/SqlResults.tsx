import type { SqlRow } from '../../lib/api';
import { exportCsv } from '../../lib/download';
import ResultTable from './ResultTable';

// One toolbar and table per result set of the last execution.
export default function SqlResults({ result }: Readonly<{ result: SqlRow[][] | null }>) {
  return (
    <>
      {result?.map((resultSet, index) => (
        // eslint-disable-next-line react/no-array-index-key -- result sets are identified only by their position in the response, and the whole list is replaced on each execution
        <div key={index} style={{ marginTop: 16 }}>
          <div className="toolbar" style={{ marginBottom: 6 }}>
            <span className="muted">{(resultSet ?? []).length} rows</span>
            <span className="spacer" />
            <button
              className="btn btn-secondary btn-small"
              disabled={(resultSet ?? []).length === 0}
              onClick={() => exportCsv(resultSet ?? [], 'sql-export.csv')}
            >
              Export as CSV
            </button>
          </div>
          <div className="card" style={{ overflow: 'auto', padding: 0 }}>
            <ResultTable rows={resultSet ?? []} />
          </div>
        </div>
      ))}
    </>
  );
}
