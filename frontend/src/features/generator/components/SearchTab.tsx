import AiWaiter from '@shared/ui/AiWaiter';
import BusyLabel from '@shared/ui/BusyLabel';

import { useSearchTab } from '../hooks/useSearchTab';
import AuthorisationField from './AuthorisationField';
import GeneratedEndpoint from './GeneratedEndpoint';
import SearchFilterOptions from './SearchFilterOptions';
import SearchLimitOptions from './SearchLimitOptions';
import SearchSourceOptions from './SearchSourceOptions';

const RETRIEVAL_NAMES: Record<string, string> = {
  bm25: 'keyword',
  mixed: 'keyword and meaning',
  embeddings: 'meaning',
};

/*
 * Search endpoint tab - generates an HTTP endpoint that searches the training snippets of one
 * machine learning type by keyword, by meaning or both. Everything but the query is baked into
 * the endpoint, so callers cannot choose the type, the search mode or how much comes back.
 *
 * Laid out as one options card, like the CRUD tab's: a labelled row per setting, and a footer
 * summing up the endpoint next to the Generate button.
 */
export default function SearchTab() {
  const search = useSearchTab();
  const {
    moduleName,
    endpointName,
    verb,
    type,
    limit,
    roles,
    auth,
    setAuth,
    effective,
    busy,
    preview,
    generated,
    generate,
  } = search;

  let missing = '';
  if (!moduleName) {
    missing = 'a module name';
  } else if (!endpointName) {
    missing = 'an endpoint name';
  } else if (!type) {
    missing = 'a type';
  }
  const ready = !missing;

  return (
    <>
      <div className="card crud-opts" style={{ maxWidth: 900 }}>
        <div className="crud-opts-body">
          <SearchSourceOptions search={search} />
          <SearchFilterOptions search={search} />
          <AuthorisationField roles={roles} auth={auth} onAuth={setAuth} />
          <SearchLimitOptions search={search} />
        </div>
        <div className="crud-opts-footer">
          <span className={ready ? 'crud-opts-summary' : 'crud-opts-summary muted'}>
            {ready ? (
              <>
                <span className="mono">
                  {verb.toUpperCase()} /magic/modules/{moduleName}/{endpointName}
                </span>{' '}
                searches <span className="mono">{type}</span> by{' '}
                {RETRIEVAL_NAMES[effective] ?? effective}, returning up to {Number(limit) || 5}.
              </>
            ) : (
              'Choose ' + missing + ' to generate the endpoint.'
            )}
          </span>
          <button className="btn" onClick={generate} disabled={busy || !ready}>
            <BusyLabel busy={busy} label="⚙ Generate endpoint" busyLabel="Generating…" />
          </button>
        </div>
      </div>
      {preview && <GeneratedEndpoint preview={preview} generated={generated} />}
      {busy && <AiWaiter />}
    </>
  );
}
