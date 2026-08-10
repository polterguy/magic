/*
 * History tab — requests towards your models.
 */

import { useEffect, useState } from 'react';
import Pagination from '../../components/Pagination';
import Select from '../../components/Select';
import { mlRequests, mlRequestsCount } from '../../lib/api';
import { usePagedList } from '../../lib/usePagedList';

export default function HistoryTab(props: {
  types: any[];
}) {

  const PAGE_SIZE = 15;
  const [type, setType] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (!type && props.types.length > 0) {
      setType(props.types[0].type);
    }
  }, [props.types, type]);

  const list = usePagedList<any>({
    load: async (offset, limit) => {
      // No type selected yet — nothing to ask the backend for.
      if (!type) {
        return { rows: [], count: 0 };
      }
      const [rows, total] = await Promise.all([
        mlRequests(type, offset, limit),
        mlRequestsCount(type),
      ]);
      return { rows: rows ?? [], count: total.count };
    },
    pageSize: PAGE_SIZE,
    deps: [type],
  });

  return (
    <>
      <div className="toolbar">
        <Select value={type} onChange={value => setType(value)}>
          {props.types.map(candidate => (
            <option key={candidate.type} value={candidate.type}>{candidate.type}</option>
          ))}
        </Select>
        <span className="spacer" />
        <Pagination page={list.page} pageCount={list.pageCount} onPage={list.setPage} />
      </div>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        {list.rows === null ? (
          <div className="spinner-panel"><div className="spinner" /></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 170 }}>When</th>
                <th>Prompt</th>
              </tr>
            </thead>
            <tbody>
              {list.rows.map(request => (
                <RequestRow
                  key={request.id}
                  request={request}
                  expanded={expanded === request.id}
                  onToggle={() => setExpanded(expanded === request.id ? null : request.id)} />
              ))}
              {list.rows.length === 0 && (
                <tr>
                  <td className="muted" colSpan={2}>No requests yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

/*
 * Conversation content is whatever a visitor typed into the chatbot, and the
 * backend stores and returns it verbatim — it does not HTML encode. It is
 * therefore rendered as JSX text, which React escapes, so markup arrives on
 * screen as visible characters and never as live HTML. Never render any of
 * these values through dangerouslySetInnerHTML.
 */
function RequestRow(props: { request: any; expanded: boolean; onToggle: () => void }) {
  return (
    <>
      <tr
        className="clickable"
        tabIndex={0}
        aria-expanded={props.expanded}
        onClick={props.onToggle}
        onKeyDown={event => {
          if (event.target === event.currentTarget &&
              (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            props.onToggle();
          }
        }}>
        <td className="mono" data-label="When">{new Date(props.request.created).toLocaleString()}</td>
        <td data-label="Prompt" style={{
          maxWidth: 620,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {props.request.prompt}
        </td>
      </tr>
      {props.expanded && (
        <tr>
          <td colSpan={2}>
            <pre className="result-json" style={{ whiteSpace: 'pre-wrap' }}>
              {props.request.completion}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}
