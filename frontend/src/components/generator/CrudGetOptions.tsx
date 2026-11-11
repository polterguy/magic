import CrudOptionRow, { OptionPill } from './CrudOptionRow';
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
    <CrudOptionRow label="Read options" hint="Arguments and extra endpoints for GET.">
      <div className="crud-opt-inline">
        <OptionPill label="Paging" checked={paging} onChange={setPaging} />
        <OptionPill label="Sorting" checked={sorting} onChange={setSorting} />
        <OptionPill label="Aggregate" checked={aggregate} onChange={setAggregate} />
        <OptionPill label="Distinct" checked={distinct} onChange={setDistinct} />
        <OptionPill label="Search" checked={search} onChange={setSearch} />
        {/*
         * Verbose adds the less common comparison operators (neq, mt, lt,
         * mteq, lteq) as filtering arguments, on top of the eq and like
         * arguments you always get.
         */}
        <OptionPill
          label="Verbose"
          checked={verbose}
          onChange={setVerbose}
          title="Add neq, mt, lt, mteq and lteq filtering arguments for every column"
        />
      </div>
    </CrudOptionRow>
  );
}
