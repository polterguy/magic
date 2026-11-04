import AuthorisationField from './AuthorisationField';
import CrudGenerationOptions from './CrudGenerationOptions';
import CrudGetOptions from './CrudGetOptions';
import { ALL_VERBS, crudSummary } from './crudify';
import { CrudTabState } from './hooks/useCrudTab';
import UrlFields from './UrlFields';

// Everything about the endpoints to generate: URL, verbs, roles, options, and the Generate button.
export default function CrudOptionsCard({ crud }: Readonly<{ crud: CrudTabState }>) {
  const {
    selection,
    moduleName,
    setModuleName,
    singleTable,
    componentUrl,
    setComponentUrl,
    verbs,
    toggleVerb,
    roles,
    auth,
    setAuth,
    cache,
    setCache,
    publicCache,
    setPublicCache,
    selectedTables,
    plannedEndpoints,
    generate,
    busy,
  } = crud;
  return (
    <div className="card">
      <div className="form-grid" style={{ gap: 18 }}>
        <UrlFields
          database={selection.database}
          moduleName={moduleName}
          onModuleName={setModuleName}
          singleTable={singleTable}
          componentUrl={componentUrl}
          onComponentUrl={setComponentUrl}
        />
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>HTTP verbs</div>
          <div style={{ display: 'flex', gap: 14 }}>
            {ALL_VERBS.map(verb => (
              <label key={verb} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <input
                  type="checkbox"
                  checked={verbs.has(verb)}
                  onChange={() => toggleVerb(verb)}
                />
                {verb.toUpperCase()}
              </label>
            ))}
          </div>
        </div>
        <AuthorisationField roles={roles} auth={auth} onAuth={setAuth} />
        <CrudGetOptions crud={crud} />
        <CrudGenerationOptions crud={crud} />
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
            GET cache (seconds, 0 = off)
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <input
              type="number"
              value={cache}
              onChange={e => setCache(e.target.value)}
              style={{ width: 120 }}
            />
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={publicCache}
                onChange={e => setPublicCache(e.target.checked)}
              />{' '}
              Public cache
            </label>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderTop: '1px solid var(--border)',
            paddingTop: 14,
          }}
        >
          <span className="muted">
            {crudSummary(
              selectedTables.size,
              verbs.size,
              plannedEndpoints,
              moduleName || selection.database,
            )}
          </span>
          <span style={{ flex: 1 }} />
          <button
            className="btn"
            onClick={generate}
            disabled={busy || selectedTables.size === 0 || verbs.size === 0}
          >
            {busy ? 'Generating…' : '⚙ Generate backend'}
          </button>
        </div>
      </div>
    </div>
  );
}
