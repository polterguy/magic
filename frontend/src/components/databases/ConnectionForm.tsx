import Select from '../Select';
import { EXTERNAL_TYPES } from './connections';

// The toolbar that tests and adds a new external connection string.
export default function ConnectionForm(
  props: Readonly<{
    type: string;
    onTypeChange: (type: string) => void;
    name: string;
    onNameChange: (name: string) => void;
    connectionString: string;
    onConnectionStringChange: (connectionString: string) => void;
    busy: boolean;
    onTestOrConnect: (connectAfter: boolean) => void;
  }>,
) {
  const { type, name, connectionString, busy } = props;
  return (
    <div className="toolbar">
      <Select value={type} onChange={value => props.onTypeChange(value)}>
        {EXTERNAL_TYPES.map(entry => (
          <option key={entry.type} value={entry.type}>
            {entry.name}
          </option>
        ))}
      </Select>
      <input
        type="text"
        placeholder="Name…"
        value={name}
        onChange={e => props.onNameChange(e.target.value)}
        style={{ width: 140 }}
      />
      <input
        type="text"
        placeholder="Connection string with {database} placeholder…"
        value={connectionString}
        onChange={e => props.onConnectionStringChange(e.target.value)}
        style={{ flex: 1 }}
      />
      <button
        className="btn btn-secondary"
        onClick={() => props.onTestOrConnect(false)}
        disabled={busy}
      >
        Test
      </button>
      <button className="btn" onClick={() => props.onTestOrConnect(true)} disabled={busy}>
        Connect
      </button>
    </div>
  );
}
