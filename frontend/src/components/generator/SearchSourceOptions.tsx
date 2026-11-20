import { Link } from 'react-router-dom';

import Select from '../Select';
import CrudOptionRow from './CrudOptionRow';
import { SearchTabState } from './hooks/useSearchTab';

/*
 * Where the endpoint lives, the machine learning type it searches, how it searches it, and what
 * each match returns.
 */
export default function SearchSourceOptions({ search }: Readonly<{ search: SearchTabState }>) {
  const {
    verb,
    setVerb,
    moduleName,
    setModuleName,
    endpointName,
    setEndpointName,
    types,
    typesLoaded,
    type,
    setType,
    retrieval,
    setRetrieval,
    effective,
    result,
    setResult,
  } = search;
  return (
    <>
      <CrudOptionRow label="Endpoint" hint="The verb and URL callers reach it at.">
        <div className="crud-opt-inline">
          <Select value={verb} ariaLabel="Verb" onChange={value => setVerb(value)}>
            <option value="get">GET</option>
            <option value="post">POST</option>
          </Select>
          <div className="url-group mono">
            <span className="url-group-fixed">/magic/modules/</span>
            <input
              type="text"
              placeholder="module"
              aria-label="Module"
              title="The module the endpoint is generated into"
              value={moduleName}
              onChange={e => setModuleName(e.target.value)}
            />
            <span className="url-group-fixed">/</span>
            <input
              type="text"
              placeholder="search"
              aria-label="Endpoint name"
              value={endpointName}
              onChange={e => setEndpointName(e.target.value)}
            />
          </div>
        </div>
      </CrudOptionRow>
      <CrudOptionRow
        label="Type"
        hint="The machine learning type whose training snippets it searches."
      >
        {typesLoaded && types.length === 0 ? (
          <span className="muted">
            No machine learning types yet.{' '}
            <Link to="/machine-learning">Create one in Machine Learning</Link> first.
          </span>
        ) : (
          <div className="crud-opt-inline">
            <Select value={type} ariaLabel="Type" onChange={value => setType(value)}>
              <option value="">Choose a type…</option>
              {types.map(t => (
                <option key={t.type} value={t.type}>
                  {t.type}
                </option>
              ))}
            </Select>
          </div>
        )}
      </CrudOptionRow>
      <CrudOptionRow label="Search by" hint="Keyword search needs no OpenAI key.">
        <div className="crud-opt-inline">
          <Select value={retrieval} ariaLabel="Search by" onChange={value => setRetrieval(value)}>
            <option value="">The type&apos;s own setting</option>
            <option value="bm25">Keyword</option>
            <option value="mixed">Keyword and meaning</option>
            <option value="embeddings">Meaning</option>
          </Select>
          {effective === 'bm25' ? (
            <span className="opt-tag">Free per call</span>
          ) : (
            <span
              className="opt-tag opt-tag-warn"
              title="Every call embeds the query with OpenAI, so keep a rate limit on a public endpoint"
            >
              One OpenAI embedding per call
            </span>
          )}
        </div>
      </CrudOptionRow>
      <CrudOptionRow label="Returns" hint="What each match gives out.">
        <div className="crud-opt-inline">
          <Select value={result} ariaLabel="Returns" onChange={value => setResult(value)}>
            <option value="references">Prompt and URI</option>
            <option value="rows">Prompt, completion, URI and meta</option>
          </Select>
        </div>
      </CrudOptionRow>
    </>
  );
}
