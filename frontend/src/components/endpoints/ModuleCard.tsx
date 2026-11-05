import type { RefObject } from 'react';
import { Fragment } from 'react';

import type { Endpoint } from '../../lib/api';
import { BracesIcon, ChevronIcon } from '../Icons';
import type { InvokeResult } from '../InvokePanel';
import InvokePanel from '../InvokePanel';
import type { ModuleGroup } from './helpers';
import { sourceFile } from './helpers';

/*
 * One module on the Endpoints page — a header that expands it, and a table
 * of its endpoints, each of which opens its invoke panel below its row.
 */
export default function ModuleCard(
  props: Readonly<{
    group: ModuleGroup;
    open: boolean;
    onToggle: () => void;
    // The "verb path" key of the endpoint whose invoke panel is open.
    expanded: string | null;
    setExpanded: (key: string | null) => void;
    // The row key to bring into view when it appears — consumed by its ref.
    scrollTarget: RefObject<string | null>;
    onResult: (result: InvokeResult) => void;
    onDebug: (endpoint: Endpoint, args: Record<string, unknown>) => Promise<void>;
    onEdit: (endpoint: Endpoint) => void;
    onOpenApi: (target: string) => Promise<void>;
  }>,
) {
  const { group, expanded, setExpanded, scrollTarget } = props;
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 10 }}>
      <div
        className={'module-header' + (group.system ? ' system' : '')}
        tabIndex={0}
        role="button" // NOSONAR -- holds the card's own action buttons, which a <button> cannot nest
        aria-expanded={props.open}
        onClick={props.onToggle}
        onKeyDown={event => {
          if (
            event.target === event.currentTarget &&
            (event.key === 'Enter' || event.key === ' ')
          ) {
            event.preventDefault();
            props.onToggle();
          }
        }}
      >
        <span className="tree-chevron">
          <ChevronIcon open={props.open} />
        </span>
        <strong>{group.name}</strong>
        {group.system && <span className="badge badge-debug">system</span>}
        <span className="muted">
          {group.endpoints.length} endpoint{group.endpoints.length === 1 ? '' : 's'}
        </span>
        <span style={{ flex: 1 }} />
        <button
          className="icon-btn"
          title={'OpenAPI specification for ' + group.folder}
          onClick={e => {
            e.stopPropagation();
            void props.onOpenApi(group.folder);
          }}
        >
          <BracesIcon />
        </button>
      </div>
      {props.open && (
        <table>
          <tbody>
            {group.endpoints.map(endpoint => {
              const key = endpoint.verb + ' ' + endpoint.path;
              return (
                <Fragment key={key}>
                  <tr
                    className="clickable"
                    tabIndex={0}
                    ref={element => {
                      // One-shot: the palette's deep link lands here.
                      if (element && scrollTarget.current === key) {
                        scrollTarget.current = null;
                        element.scrollIntoView({ block: 'center' });
                      }
                    }}
                    onClick={() => setExpanded(expanded === key ? null : key)}
                    onKeyDown={event => {
                      if (
                        event.target === event.currentTarget &&
                        (event.key === 'Enter' || event.key === ' ')
                      ) {
                        event.preventDefault();
                        setExpanded(expanded === key ? null : key);
                      }
                    }}
                  >
                    <td className="verb-cell" style={{ width: 90 }}>
                      <span className={'badge badge-' + endpoint.verb.toLowerCase()}>
                        {endpoint.verb}
                      </span>
                    </td>
                    <td className="mono" data-label="Path">
                      {endpoint.path}
                    </td>
                    <td style={{ textAlign: 'right' }} data-label="Auth">
                      <span className="role-chips">
                        {(endpoint.auth ?? []).map(role => (
                          <span className="chip" key={role}>
                            {role}
                          </span>
                        ))}
                      </span>
                    </td>
                  </tr>
                  {expanded === key && (
                    <tr>
                      <td colSpan={3} style={{ background: 'var(--accent-soft)', padding: 12 }}>
                        <div className="card" style={{ padding: 16 }}>
                          <InvokePanel
                            endpoint={endpoint}
                            onResult={props.onResult}
                            onDebug={args => props.onDebug(endpoint, args)}
                            onEdit={() => props.onEdit(endpoint)}
                            onOpenApi={() => props.onOpenApi(sourceFile(endpoint))}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
