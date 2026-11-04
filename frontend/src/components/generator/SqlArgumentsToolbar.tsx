import Select from '../Select';
import { SqlEndpointTabState } from './hooks/useSqlEndpointTab';

// The SQL's arguments, and the saved snippets and .sql files it can be loaded from.
export default function SqlArgumentsToolbar({ sql }: Readonly<{ sql: SqlEndpointTabState }>) {
  const { args, setArgs, snippets, openSnippet, importSqlFile } = sql;
  return (
    <div className="toolbar">
      <div style={{ fontWeight: 600, fontSize: 13 }}>Arguments:</div>
      {args.map((argument, index) => (
        <span key={index} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="name"
            value={argument.name}
            onChange={e =>
              setArgs(
                args.map((candidate, i) =>
                  i === index ? { ...candidate, name: e.target.value } : candidate,
                ),
              )
            }
            style={{ width: 120 }}
          />
          <Select
            value={argument.type}
            onChange={value =>
              setArgs(
                args.map((candidate, i) =>
                  i === index ? { ...candidate, type: value } : candidate,
                ),
              )
            }
          >
            {['string', 'long', 'int', 'decimal', 'double', 'bool', 'date'].map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
          <button
            className="btn btn-danger btn-small"
            onClick={() => setArgs(args.filter((_, i) => i !== index))}
          >
            ✕
          </button>
        </span>
      ))}
      <button
        className="btn btn-secondary btn-small"
        onClick={() => setArgs([...args, { name: '', type: 'string' }])}
      >
        + Argument
      </button>
      <span className="muted" style={{ fontSize: 12 }}>
        Reference arguments in SQL as @name
      </span>
      <span className="spacer" />
      <Select value="" onChange={value => openSnippet(value)}>
        <option value="">Load snippet…</option>
        {snippets.map(snippet => (
          <option key={snippet} value={snippet}>
            {snippet.substring(snippet.lastIndexOf('/') + 1)}
          </option>
        ))}
      </Select>
      <label className="btn btn-secondary btn-small" style={{ cursor: 'pointer' }}>
        Import .sql
        <input
          type="file"
          accept=".sql"
          style={{ display: 'none' }}
          onChange={e => {
            if (e.target.files?.[0]) {
              importSqlFile(e.target.files[0]);
              e.target.value = '';
            }
          }}
        />
      </label>
    </div>
  );
}
