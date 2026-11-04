import { DatabaseSelection } from '../../lib/sql';
import Select from '../Select';

export default function DatabaseSelectors({
  selection,
}: Readonly<{ selection: DatabaseSelection }>) {
  return (
    <>
      <Select value={selection.type} onChange={value => selection.setType(value)}>
        {selection.types.map((option: string) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
      <Select
        value={selection.connectionString}
        onChange={value => selection.setConnectionString(value)}
      >
        {selection.connectionStrings.map((option: string) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
      <Select value={selection.database} onChange={value => selection.setDatabase(value)}>
        {selection.databasesMeta.map(db => (
          <option key={db.name} value={db.name}>
            {db.name}
          </option>
        ))}
      </Select>
      {selection.loading && <div className="spinner" />}
      {!selection.loading && selection.type && selection.connectionStrings.length === 0 && (
        <span className="muted">No connection strings configured for {selection.type}.</span>
      )}
    </>
  );
}
