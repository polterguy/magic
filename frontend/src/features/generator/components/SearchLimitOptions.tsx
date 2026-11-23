import { SearchTabState } from '../hooks/useSearchTab';
import CrudOptionRow, { OptionPill } from './CrudOptionRow';

// The endpoint's rate limit, how long callers may cache an answer, and overwriting.
export default function SearchLimitOptions({ search }: Readonly<{ search: SearchTabState }>) {
  const {
    rateLimit,
    setRateLimit,
    rateWindow,
    setRateWindow,
    cacheSeconds,
    setCacheSeconds,
    overwrite,
    setOverwrite,
  } = search;
  return (
    <>
      <CrudOptionRow
        label="Rate limit"
        hint="Calls per IP in each window. Root is exempt, 0 turns it off."
      >
        <div className="crud-opt-inline">
          <div className="unit-group">
            <input
              type="number"
              min={0}
              aria-label="Rate limit"
              value={rateLimit}
              onChange={e => setRateLimit(e.target.value)}
            />
            <span className="unit-group-unit">calls</span>
          </div>
          <span className="muted">per</span>
          <div className="unit-group">
            <input
              type="number"
              min={1}
              aria-label="Rate limit window in seconds"
              value={rateWindow}
              onChange={e => setRateWindow(e.target.value)}
            />
            <span className="unit-group-unit">sec</span>
          </div>
        </div>
      </CrudOptionRow>
      <CrudOptionRow label="Generation" hint="Caching of answers, and how the file is written.">
        <div className="crud-opt-inline">
          <div className="unit-group" title="How long callers may cache an answer. 0 turns it off">
            <span className="unit-group-unit unit-group-prefix">Cache</span>
            <input
              type="number"
              min={0}
              aria-label="Cache in seconds"
              value={cacheSeconds}
              onChange={e => setCacheSeconds(e.target.value)}
            />
            <span className="unit-group-unit">sec</span>
          </div>
          <OptionPill label="Overwrite existing file" checked={overwrite} onChange={setOverwrite} />
        </div>
      </CrudOptionRow>
    </>
  );
}
