/*
 * Content-shaped loading placeholders. Use one of these instead of
 * `spinner-panel` wherever the real content underneath is a table, list, or
 * card grid — previewing the shape keeps the page from jumping once data
 * lands. Keep the plain `.spinner` for status text and action-in-flight
 * overlays (AiWaiter, button busy-text, streaming text), which have no
 * content shape to preview.
 */

export function SkeletonBar(props: { width?: string | number; height?: number }) {
  return (
    <span
      className="skeleton-bar"
      style={{ width: props.width ?? '100%', height: props.height ?? 12 }} />
  );
}

// Fills a `<table><tbody>` with placeholder rows matching the real column
// count. Drop it inside the same `.card`/`<table>` wrapper the real table
// uses, in place of the table's own `<tbody>`.
export function TableSkeleton(props: { columns: number; rows?: number }) {
  const rowCount = props.rows ?? 6;
  return (
    <table className="skeleton-table">
      <tbody>
        {Array.from({ length: rowCount }).map((_, row) => (
          <tr className="skeleton-row" key={row}>
            {Array.from({ length: props.columns }).map((_, col) => (
              <td key={col}>
                <SkeletonBar width={col === 0 ? '60%' : '85%'} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// A stack of label/sublabel rows, each optionally followed by a button-shaped
// placeholder — the shape of a filterable pick-list (AI functions, widgets).
export function ListSkeleton(props: { rows?: number; withAction?: boolean }) {
  const rowCount = props.rows ?? 5;
  return (
    <>
      {Array.from({ length: rowCount }).map((_, row) => (
        <div className="skeleton-list-row" key={row}>
          <div className="skeleton-list-row-text">
            <SkeletonBar width="40%" height={13} />
            <SkeletonBar width="70%" height={11} />
          </div>
          {props.withAction && <SkeletonBar width={70} height={28} />}
        </div>
      ))}
    </>
  );
}

// A grid of card-shaped placeholders — the Bazar plugin grid's shape.
export function CardGridSkeleton(props: { cards?: number }) {
  const cardCount = props.cards ?? 6;
  return (
    <div className="skeleton-card-grid">
      {Array.from({ length: cardCount }).map((_, i) => (
        <div className="card skeleton-card" key={i}>
          <SkeletonBar width="60%" height={16} />
          <SkeletonBar width="100%" />
          <SkeletonBar width="90%" />
          <SkeletonBar width={90} height={28} />
        </div>
      ))}
    </div>
  );
}

// A stack of module-header-shaped bars — the Endpoints module-list shape.
export function ModuleListSkeleton(props: { modules?: number }) {
  const moduleCount = props.modules ?? 5;
  return (
    <>
      {Array.from({ length: moduleCount }).map((_, i) => (
        <div className="card skeleton-module" key={i} style={{ marginBottom: 10 }}>
          <SkeletonBar width={18} height={18} />
          <SkeletonBar width="22%" height={14} />
          <SkeletonBar width="14%" height={12} />
        </div>
      ))}
    </>
  );
}
