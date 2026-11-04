import { copyToClipboard } from '../../lib/toast';
import { CopyIcon } from '../Icons';
import type { LogItem } from '../../lib/api';
import { isoDate, timeAgo } from './format';

/*
 * One entry in the log — its row, and below it when expanded, its meta
 * information and exception.
 */
export default function LogRow(
  props: Readonly<{
    item: LogItem;
    // The entry a deep link pointed at, marked so the visitor can spot it.
    highlighted: boolean;
    expanded: boolean;
    onToggle: () => void;
  }>,
) {
  const { item } = props;
  const meta = Object.entries(item.meta ?? {});
  // Rows carrying a stack trace and/or meta information have something to reveal.
  const canExpand = !!item.exception || meta.length > 0;
  return (
    <>
      <tr
        className={(canExpand ? 'clickable' : '') + (props.highlighted ? ' log-target' : '')}
        tabIndex={canExpand ? 0 : undefined}
        aria-expanded={canExpand ? props.expanded : undefined}
        onClick={canExpand ? props.onToggle : undefined}
        onKeyDown={
          canExpand
            ? event => {
                if (
                  event.target === event.currentTarget &&
                  (event.key === 'Enter' || event.key === ' ')
                ) {
                  event.preventDefault();
                  props.onToggle();
                }
              }
            : undefined
        }
      >
        <td className="mono" data-label="When">
          {timeAgo(item.created)}
        </td>
        <td className="mono muted" data-label="Timestamp">
          {isoDate(item.created)}
        </td>
        <td data-label="Type">
          <span className={'badge badge-' + item.type.toLowerCase()}>{item.type}</span>
        </td>
        <td data-label="Content">{item.content}</td>
        <td className="log-caret-cell" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
          {meta.length > 0 && (
            <span
              className="log-meta-pill"
              title={meta.length + ' meta value' + (meta.length === 1 ? '' : 's')}
            >
              {meta.length}
            </span>
          )}
          {canExpand && <span className="log-caret">{props.expanded ? '▾' : '▸'}</span>}
        </td>
      </tr>
      {props.expanded && (
        <tr>
          <td colSpan={5}>
            {meta.length > 0 && (
              <div className="log-meta">
                {meta.map(([key, value]) => (
                  <div key={key} className="log-meta-row">
                    <span className="log-meta-key mono">{key}</span>
                    <span className="log-meta-value">{value}</span>
                  </div>
                ))}
              </div>
            )}
            {item.exception && (
              <div style={{ position: 'relative' }}>
                <button
                  className="icon-btn"
                  title="Copy exception"
                  style={{ position: 'absolute', top: 6, right: 6 }}
                  onClick={() => copyToClipboard(item.exception!, 'Exception')}
                >
                  <CopyIcon />
                </button>
                <pre
                  className="result-json"
                  style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', paddingRight: 44 }}
                >
                  {item.exception}
                </pre>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
