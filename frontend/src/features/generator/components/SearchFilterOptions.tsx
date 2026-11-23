import { SearchTabState } from '../hooks/useSearchTab';
import CrudOptionRow from './CrudOptionRow';

// How many matches come back and how close they must be, and the URI and meta they are narrowed to.
export default function SearchFilterOptions({ search }: Readonly<{ search: SearchTabState }>) {
  const { limit, setLimit, threshold, setThreshold, uri, setUri, meta, setMeta } = search;
  return (
    <>
      <CrudOptionRow
        label="Matches"
        hint="The most it returns, and how close a match must be. Lower thresholds are stricter."
      >
        <div className="crud-opt-inline">
          <div className="unit-group" title="The most matches returned">
            <input
              type="number"
              min={1}
              aria-label="Limit"
              value={limit}
              onChange={e => setLimit(e.target.value)}
            />
            <span className="unit-group-unit">matches</span>
          </div>
          <div
            className="unit-group"
            title="Similarity cutoff between 0 and 1. Blank uses the type's own threshold"
          >
            <input
              type="number"
              min={0}
              max={1}
              step={0.05}
              placeholder="default"
              aria-label="Threshold"
              value={threshold}
              onChange={e => setThreshold(e.target.value)}
            />
            <span className="unit-group-unit">threshold</span>
          </div>
        </div>
      </CrudOptionRow>
      <CrudOptionRow
        label="Filters"
        hint={
          <>
            Only matches from this URI, or whose meta fits this pattern. <code>%</code> matches any
            text. Blank allows any.
          </>
        }
      >
        <div className="crud-opt-inline">
          <div
            className="unit-group"
            title="Only matches belonging to exactly this URL or reference"
          >
            <span className="unit-group-unit unit-group-prefix">URI</span>
            <input
              type="text"
              placeholder="any"
              aria-label="URI"
              value={uri}
              onChange={e => setUri(e.target.value)}
            />
          </div>
          <div
            className="unit-group"
            title="Only matches whose meta fits this pattern, such as FACT ==> %"
          >
            <span className="unit-group-unit unit-group-prefix">Meta</span>
            <input
              type="text"
              placeholder="any"
              aria-label="Meta"
              value={meta}
              onChange={e => setMeta(e.target.value)}
            />
          </div>
        </div>
      </CrudOptionRow>
    </>
  );
}
