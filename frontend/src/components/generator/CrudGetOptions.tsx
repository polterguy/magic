import { CrudTabState } from './hooks/useCrudTab';

// The options only the GET endpoints take: paging, sorting, aggregates, distinct, search and verbose filters.
export default function CrudGetOptions({ crud }: Readonly<{ crud: CrudTabState }>) {
  const {
    paging,
    setPaging,
    sorting,
    setSorting,
    aggregate,
    setAggregate,
    distinct,
    setDistinct,
    search,
    setSearch,
    verbose,
    setVerbose,
  } = crud;
  return (
    <div>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Endpoints (GET)</div>
      <div
        style={{
          display: 'grid',
          // auto-fit so it collapses to fewer columns on a phone instead
          // of forcing a fixed 3-wide minimum that overflows.
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '6px 20px',
        }}
      >
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={paging} onChange={e => setPaging(e.target.checked)} />
          Paging
        </label>
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={sorting} onChange={e => setSorting(e.target.checked)} />
          Sorting
        </label>
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={aggregate}
            onChange={e => setAggregate(e.target.checked)}
          />
          Aggregate
        </label>
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={distinct} onChange={e => setDistinct(e.target.checked)} />
          Distinct
        </label>
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={search} onChange={e => setSearch(e.target.checked)} />
          Search
        </label>
        {/*
         * Verbose adds the less common comparison operators (neq, mt, lt,
         * mteq, lteq) as filtering arguments, on top of the eq and like
         * arguments you always get.
         */}
        <label
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          title="Add neq, mt, lt, mteq and lteq filtering arguments for every column"
        >
          <input type="checkbox" checked={verbose} onChange={e => setVerbose(e.target.checked)} />
          Verbose
        </label>
      </div>
    </div>
  );
}
