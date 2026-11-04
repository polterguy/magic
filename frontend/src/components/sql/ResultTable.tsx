import type { SqlRow } from '../../lib/api';
import { MAX_RENDERED_ROWS, formatCell } from './results';

export default function ResultTable({ rows }: Readonly<{ rows: SqlRow[] }>) {
  if (rows.length === 0) {
    return (
      <div className="muted" style={{ padding: 16 }}>
        Empty result set
      </div>
    );
  }
  const columns = Object.keys(rows[0]);
  const visible = rows.length > MAX_RENDERED_ROWS ? rows.slice(0, MAX_RENDERED_ROWS) : rows;
  return (
    <>
      <table className="sql-result">
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((row, index) => (
            <tr key={index}>
              {columns.map(column => (
                <td className="mono" key={column} data-label={column}>
                  {formatCell(row[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > MAX_RENDERED_ROWS && (
        <div className="muted" style={{ padding: 12 }}>
          Showing the first {MAX_RENDERED_ROWS} of {rows.length} rows — export as CSV to get all of
          them.
        </div>
      )}
    </>
  );
}
