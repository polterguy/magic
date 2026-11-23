import CrudOptionRow from './CrudOptionRow';

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
    <CrudOptionRow
      label="URL"
      hint={
        props.singleTable
          ? 'Module and component the endpoints live under.'
          : 'Each table uses its own name — select one table to rename it.'
      }
    >
      <div className="url-group mono">
        <span className="url-group-fixed">/magic/</span>
        <input
          type="text"
          placeholder={props.database}
          aria-label="Module"
          title="Module segment of the URL — defaults to the database name"
          value={props.moduleName}
          onChange={e => props.onModuleName(e.target.value)}
        />
        <span className="url-group-fixed">/</span>
        <input
          type="text"
          placeholder="<table>"
          aria-label="Component"
          title={
            props.singleTable
              ? 'Component segment of the URL — defaults to the table name'
              : 'Editable when exactly one table is selected — otherwise each table uses its own name'
          }
          value={props.singleTable ? props.componentUrl : ''}
          disabled={!props.singleTable}
          onChange={e => props.onComponentUrl(e.target.value)}
        />
      </div>
    </CrudOptionRow>
  );
}
