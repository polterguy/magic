/*
 * The ‹ Prev / n of m / Next › block every server-paged table's toolbar
 * shows. Renders nothing when everything fits on one page.
 */

export default function Pagination(props: {
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
}) {

  if (props.pageCount <= 1) {
    return null;
  }
  return (
    <>
      <button
        className="btn btn-secondary btn-small"
        disabled={props.page === 0}
        onClick={() => props.onPage(props.page - 1)}>
        ‹ Prev
      </button>
      <span className="muted">{props.page + 1} / {props.pageCount}</span>
      <button
        className="btn btn-secondary btn-small"
        disabled={props.page >= props.pageCount - 1}
        onClick={() => props.onPage(props.page + 1)}>
        Next ›
      </button>
    </>
  );
}
