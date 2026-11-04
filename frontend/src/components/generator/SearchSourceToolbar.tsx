import Select from '../Select';
import { SearchTabState } from './hooks/useSearchTab';

// What the endpoint searches: the machine learning type, how it searches it, and what each match returns.
export default function SearchSourceToolbar({ search }: Readonly<{ search: SearchTabState }>) {
  const { types, type, setType, retrieval, setRetrieval, result, setResult } = search;
  return (
    <div className="toolbar">
      <label
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        title="The machine learning type whose training snippets are searched"
      >
        Type
        <Select value={type} onChange={value => setType(value)}>
          <option value="">choose type…</option>
          {types.map(t => (
            <option key={t.type} value={t.type}>
              {t.type}
            </option>
          ))}
        </Select>
      </label>
      <label
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        title="How the endpoint searches. Keyword search needs no OpenAI key and costs nothing per call"
      >
        Search by
        <Select value={retrieval} onChange={value => setRetrieval(value)}>
          <option value="">the type&apos;s own setting</option>
          <option value="bm25">Keyword</option>
          <option value="mixed">Keyword and meaning</option>
          <option value="embeddings">Meaning</option>
        </Select>
      </label>
      <label
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        title="What each match gives out"
      >
        Returns
        <Select value={result} onChange={value => setResult(value)}>
          <option value="references">Prompt and URI</option>
          <option value="rows">Prompt, completion, URI and meta</option>
        </Select>
      </label>
    </div>
  );
}
