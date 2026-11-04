import { Link } from 'react-router-dom';

import { MCP_ENDPOINT_WARNING } from './constants';

// The row of numbers across the top of the dashboard, each linking to its page.
export default function KpiCards(
  props: Readonly<{
    version: string;
    endpoints: number | null;
    publicEndpoints: number | null;
    users: number | null;
    tasks: number | null;
    logItems: number | null;
    onEndpointWarning: () => void;
    onPublicEndpointWarning: () => void;
  }>,
) {
  const { endpoints, publicEndpoints } = props;
  return (
    <div className="kpi-grid">
      <div className="card">
        <div className="kpi-value">{props.version}</div>
        <div className="kpi-label">Magic version</div>
      </div>
      <Link className="card kpi-link" to="/endpoints">
        <div
          className={
            endpoints !== null && endpoints > MCP_ENDPOINT_WARNING ? 'kpi-value warn' : 'kpi-value'
          }
        >
          {endpoints ?? '…'}
        </div>
        <div className="kpi-label">Endpoints</div>
        {endpoints !== null && endpoints > MCP_ENDPOINT_WARNING && (
          <button
            className="kpi-warn-btn"
            title="Too many endpoints for MCP clients — click for details"
            onClick={event => {
              // The card is a link now — the warning must not navigate.
              event.preventDefault();
              event.stopPropagation();
              props.onEndpointWarning();
            }}
          >
            !
          </button>
        )}
      </Link>
      <Link className="card kpi-link" to="/endpoints?publicOnly=1">
        <div
          className={
            publicEndpoints !== null && publicEndpoints > 0 ? 'kpi-value warn' : 'kpi-value'
          }
        >
          {publicEndpoints ?? '…'}
        </div>
        <div className="kpi-label">Public endpoints</div>
        {publicEndpoints !== null && publicEndpoints > 1 && (
          <button
            className="kpi-warn-btn"
            title="Public endpoints require no authentication — click for details"
            onClick={event => {
              // The card is a link now — the warning must not navigate.
              event.preventDefault();
              event.stopPropagation();
              props.onPublicEndpointWarning();
            }}
          >
            !
          </button>
        )}
      </Link>
      <Link className="card kpi-link" to="/user-roles-management">
        <div className="kpi-value">{props.users ?? '…'}</div>
        <div className="kpi-label">Users</div>
      </Link>
      <Link className="card kpi-link" to="/task-manager">
        <div className="kpi-value">{props.tasks ?? '…'}</div>
        <div className="kpi-label">Tasks</div>
      </Link>
      <Link className="card kpi-link" to="/log">
        <div className="kpi-value">{props.logItems ?? '…'}</div>
        <div className="kpi-label">Log items</div>
      </Link>
    </div>
  );
}
