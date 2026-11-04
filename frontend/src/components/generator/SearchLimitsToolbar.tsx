import { SearchTabState } from './hooks/useSearchTab';

// The endpoint's rate limit, how long callers may cache it, and overwriting.
export default function SearchLimitsToolbar({ search }: Readonly<{ search: SearchTabState }>) {
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
    <div className="toolbar">
      <label
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        title="Calls an IP may make per window - root is exempt. 0 means no limit"
      >
        Rate limit
        <input
          type="number"
          value={rateLimit}
          onChange={e => setRateLimit(e.target.value)}
          style={{ width: 70 }}
        />
      </label>
      <label
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        title="Window length in seconds"
      >
        Window&nbsp;s
        <input
          type="number"
          value={rateWindow}
          onChange={e => setRateWindow(e.target.value)}
          style={{ width: 70 }}
        />
      </label>
      <label
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        title="How long the caller may cache an answer. 0 means not at all"
      >
        Cache&nbsp;s
        <input
          type="number"
          value={cacheSeconds}
          onChange={e => setCacheSeconds(e.target.value)}
          style={{ width: 70 }}
        />
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input type="checkbox" checked={overwrite} onChange={e => setOverwrite(e.target.checked)} />
        Overwrite
      </label>
    </div>
  );
}
