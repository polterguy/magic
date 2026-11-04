// The module and component segments of the URL the endpoints are generated under.
export default function UrlFields(
  props: Readonly<{
    database: string;
    moduleName: string;
    onModuleName: (name: string) => void;
    singleTable: string | null;
    componentUrl: string;
    onComponentUrl: (url: string) => void;
  }>,
) {
  return (
    <div>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>URL</div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Module…"
          title="Module segment of the URL — defaults to the database name"
          value={props.moduleName}
          onChange={e => props.onModuleName(e.target.value)}
          style={{ width: 160 }}
        />
        <span className="muted">/</span>
        <input
          type="text"
          placeholder="table name"
          title={
            props.singleTable
              ? 'Component segment of the URL — defaults to the table name'
              : 'Editable when exactly one table is selected — otherwise each table uses its own name'
          }
          value={props.singleTable ? props.componentUrl : ''}
          disabled={!props.singleTable}
          onChange={e => props.onComponentUrl(e.target.value)}
          style={{ width: 160 }}
        />
        <span className="muted mono" style={{ fontSize: 12 }}>
          → /magic/{props.moduleName || props.database}/
          {props.singleTable ? props.componentUrl || props.singleTable : '<table>'}
        </span>
      </div>
    </div>
  );
}
