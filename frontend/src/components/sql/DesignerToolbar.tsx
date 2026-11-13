import type { TableMeta } from '../../lib/api';
import SearchInput from '../SearchInput';

export default function DesignerToolbar(
  props: Readonly<{
    tables: TableMeta[];
    // How many tables the filter leaves.
    shownCount: number;
    filter: string;
    onFilterChange: (filter: string) => void;
    database: string;
    connectionString: string;
    onNewTable: () => void;
    onImportCsv: (file: File) => Promise<void>;
    onFlushCache: () => void;
    onViewDdl: (tables: string[], full: boolean, title: string) => void;
  }>,
) {
  const { tables, database, connectionString, filter, shownCount } = props;
  const total = tables.length + (tables.length === 1 ? ' table' : ' tables');
  const count = filter.trim() ? shownCount + ' of ' + total : total + ' in ' + database;
  return (
    <div className="toolbar">
      {tables.length > 0 && (
        <SearchInput
          value={filter}
          onChange={props.onFilterChange}
          placeholder="Filter tables or columns…"
          label="Filter tables or columns"
          style={{ width: 260 }}
        />
      )}
      <span className="muted">{count}</span>
      <span className="spacer" />
      <button className="btn btn-small" onClick={props.onNewTable}>
        + New table
      </button>
      <label
        className={'btn btn-secondary btn-small' + (database ? '' : ' disabled')}
        style={{ cursor: database ? 'pointer' : 'not-allowed' }}
        title="Create a table from a CSV file, named after the file"
      >
        Import .csv{' '}
        <input
          type="file"
          accept=".csv"
          disabled={!database}
          style={{ display: 'none' }}
          onChange={e => {
            if (e.target.files?.[0]) {
              void props.onImportCsv(e.target.files[0]);
              e.target.value = '';
            }
          }}
        />
      </label>
      <button
        className="btn btn-secondary btn-small"
        title="Flush the server-side schema cache and reload"
        disabled={!connectionString}
        onClick={props.onFlushCache}
      >
        Flush cache
      </button>
      <button
        className="btn btn-secondary btn-small"
        onClick={() =>
          props.onViewDdl(
            tables.map(table => table.name),
            true,
            database + ' — full DDL',
          )
        }
      >
        Database DDL
      </button>
    </div>
  );
}
