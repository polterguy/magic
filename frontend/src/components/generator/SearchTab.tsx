import AiWaiter from '../AiWaiter';
import CallerRolesField from './CallerRolesField';
import EndpointNameFields from './EndpointNameFields';
import GeneratedEndpoint from './GeneratedEndpoint';
import SearchFilterToolbar from './SearchFilterToolbar';
import SearchLimitsToolbar from './SearchLimitsToolbar';
import SearchSourceToolbar from './SearchSourceToolbar';
import { useSearchTab } from './hooks/useSearchTab';

/*
 * Search endpoint tab - generates an HTTP endpoint that searches the training snippets of one
 * machine learning type by keyword, by meaning or both. Everything but the query is baked into
 * the endpoint, so callers cannot choose the type, the search mode or how much comes back.
 */
export default function SearchTab() {
  const search = useSearchTab();
  const {
    moduleName,
    setModuleName,
    endpointName,
    setEndpointName,
    verb,
    setVerb,
    type,
    roles,
    auth,
    setAuth,
    authOpen,
    setAuthOpen,
    busy,
    preview,
    generated,
    effective,
    generate,
  } = search;

  return (
    <>
      <div className="toolbar">
        <EndpointNameFields
          verbs={['get', 'post']}
          verb={verb}
          onVerb={setVerb}
          moduleName={moduleName}
          onModuleName={setModuleName}
          endpointName={endpointName}
          onEndpointName={setEndpointName}
        />
        <span className="spacer" />
        <button
          className="btn"
          onClick={generate}
          disabled={busy || !moduleName || !endpointName || !type}
        >
          {busy ? 'Generating…' : '⚙ Generate endpoint'}
        </button>
      </div>
      <SearchSourceToolbar search={search} />
      <SearchFilterToolbar search={search} />
      {/* Who may call the endpoint at all - empty leaves it public. */}
      <CallerRolesField
        roles={roles}
        auth={auth}
        setAuth={setAuth}
        authOpen={authOpen}
        setAuthOpen={setAuthOpen}
      />
      <SearchLimitsToolbar search={search} />
      <span className="muted" style={{ fontSize: 12 }}>
        The endpoint takes one argument, <span className="mono">query</span>, and everything else is
        fixed in it.{' '}
        {effective === 'bm25'
          ? 'Keyword search needs no OpenAI key, and costs nothing per call.'
          : 'Searching by meaning spends one OpenAI embedding on every call, so keep a rate limit on a public endpoint.'}
      </span>
      {preview && <GeneratedEndpoint preview={preview} generated={generated} />}
      {busy && <AiWaiter />}
    </>
  );
}
