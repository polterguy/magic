import { SearchTabState } from './hooks/useSearchTab';

// How many matches come back, and the threshold, URI and meta they are narrowed to.
export default function SearchFilterToolbar({ search }: Readonly<{ search: SearchTabState }>) {
  const { limit, setLimit, threshold, setThreshold, uri, setUri, meta, setMeta } = search;
  return (
    <div className="toolbar">
      <label
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        title="The most matches returned"
      >
        Limit
        <input
          type="number"
          value={limit}
          onChange={e => setLimit(e.target.value)}
          style={{ width: 70 }}
        />
      </label>
      <label
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        title="Similarity cutoff between 0 and 1, where lower is stricter. Blank uses the type's own"
      >
        Threshold
        <input
          type="number"
          step={0.05}
          placeholder="type's"
          value={threshold}
          onChange={e => setThreshold(e.target.value)}
          style={{ width: 80 }}
        />
      </label>
      <label
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        title="Only matches belonging to exactly this URL or reference"
      >
        URI
        <input
          type="text"
          placeholder="any"
          value={uri}
          onChange={e => setUri(e.target.value)}
          style={{ width: 200 }}
        />
      </label>
      <label
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        title="Only matches whose meta fits this pattern, where % matches any text, such as FACT ==> %"
      >
        Meta
        <input
          type="text"
          placeholder="any"
          value={meta}
          onChange={e => setMeta(e.target.value)}
          style={{ width: 200 }}
        />
      </label>
    </div>
  );
}
