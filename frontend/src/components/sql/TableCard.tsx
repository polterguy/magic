import type { TableMeta } from '../../lib/api';

// One table in the Designer grid — its columns, foreign keys and actions.
export default function TableCard(
  props: Readonly<{
    table: TableMeta;
    onAddColumn: () => void;
    onViewDdl: () => void;
    onDropTable: () => void;
    onDropColumn: (columnName: string) => void;
  }>,
) {
  const { table } = props;
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
        <strong style={{ flex: 1 }}>{table.name}</strong>
        <button
          className="btn btn-secondary btn-small"
          title="Add column"
          onClick={props.onAddColumn}
        >
          + Col
        </button>
        <button className="btn btn-secondary btn-small" onClick={props.onViewDdl}>
          DDL
        </button>
        <button className="btn btn-danger btn-small" title="Drop table" onClick={props.onDropTable}>
          ✕
        </button>
      </div>
      {(table.columns ?? []).map(column => (
        <div
          key={column.name}
          className="col-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            padding: '2px 0',
          }}
        >
          <span style={{ width: 14, flexShrink: 0 }}>{column.primary ? '🔑' : ''}</span>
          <span
            style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}
            className={column.primary ? '' : 'muted'}
          >
            {column.name}
          </span>
          <span className="muted mono" style={{ fontSize: 12 }}>
            {column.db}
          </span>
          {/* Not-null marker in its own fixed slot, so the dots line up. */}
          <span
            className="mono"
            title={column.nullable ? 'Nullable' : 'Not null'}
            style={{
              width: 8,
              textAlign: 'center',
              flexShrink: 0,
              fontSize: 12,
              color: 'var(--text-soft)',
            }}
          >
            {column.nullable ? '' : '•'}
          </span>
          {/* Drop control always reserves its slot — empty for the primary
              key — so every row's type column ends at the same place. */}
          <span
            style={{
              width: 18,
              flexShrink: 0,
              display: 'inline-flex',
              justifyContent: 'center',
            }}
          >
            {!column.primary && (
              <button
                className="icon-btn danger col-drop"
                title="Drop column"
                onClick={() => props.onDropColumn(column.name)}
                style={{ padding: 2 }}
              >
                <span style={{ fontSize: 12 }}>✕</span>
              </button>
            )}
          </span>
        </div>
      ))}
      {(table.foreign_keys ?? []).length > 0 && (
        <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 6 }}>
          {(table.foreign_keys ?? []).map((fk, index: number) => (
            <div key={index} className="muted" style={{ fontSize: 12 }}>
              {fk.column} → {fk.foreign_table}.{fk.foreign_column}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
