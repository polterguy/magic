import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { ClockIcon, ExchangeIcon, EyeIcon, ListIcon, UserIcon } from '../Icons';
import { MCP_ENDPOINT_WARNING } from './constants';

// One count in the strip — the whole tile is the link to its page.
function Kpi(
  props: Readonly<{
    to: string;
    icon: ReactNode;
    label: string;
    value: number | null;
    warn?: boolean;
    warning?: { title: string; onClick: () => void };
  }>,
) {
  return (
    <Link className={props.warn ? 'card kpi-link kpi-warn' : 'card kpi-link'} to={props.to}>
      <span className="kpi-icon" aria-hidden="true">
        {props.icon}
      </span>
      <div className={props.warn ? 'kpi-value warn' : 'kpi-value'}>{props.value ?? '…'}</div>
      <div className="kpi-label">{props.label}</div>
      {props.warning && (
        <button
          className="kpi-warn-btn"
          title={props.warning.title}
          onClick={event => {
            // The tile is a link — the warning must not navigate.
            event.preventDefault();
            event.stopPropagation();
            props.warning?.onClick();
          }}
        >
          !
        </button>
      )}
    </Link>
  );
}

// The row of numbers across the top of the dashboard, each linking to its page.
export default function KpiCards(
  props: Readonly<{
    endpoints: number | null;
    publicEndpoints: number | null;
    users: number | null;
    tasks: number | null;
    logItems: number | null;
    onEndpointWarning: () => void;
    onPublicEndpointWarning: () => void;
  }>,
) {
  const tooManyEndpoints = props.endpoints !== null && props.endpoints > MCP_ENDPOINT_WARNING;
  const anyPublic = props.publicEndpoints !== null && props.publicEndpoints > 0;
  return (
    <div className="kpi-grid">
      <Kpi
        to="/endpoints"
        icon={<ExchangeIcon />}
        label="Endpoints"
        value={props.endpoints}
        warn={tooManyEndpoints}
        warning={
          tooManyEndpoints
            ? {
                title: 'Too many endpoints for MCP clients — click for details',
                onClick: props.onEndpointWarning,
              }
            : undefined
        }
      />
      <Kpi
        to="/endpoints?publicOnly=1"
        icon={<EyeIcon />}
        label="Public endpoints"
        value={props.publicEndpoints}
        warn={anyPublic}
        warning={
          anyPublic
            ? {
                title: 'Public endpoints require no authentication — click for details',
                onClick: props.onPublicEndpointWarning,
              }
            : undefined
        }
      />
      <Kpi to="/user-roles-management" icon={<UserIcon />} label="Users" value={props.users} />
      <Kpi to="/task-manager" icon={<ClockIcon />} label="Tasks" value={props.tasks} />
      <Kpi to="/log" icon={<ListIcon />} label="Log items" value={props.logItems} />
    </div>
  );
}
