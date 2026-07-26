/*
 * Shown for any route the dashboard doesn't have. Rendered rather than
 * silently redirecting to the dashboard, so a mistyped or stale link says
 * what happened instead of pretending it went somewhere.
 */

import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', margin: 'auto', padding: 40 }}>
      <div style={{
        fontSize: 96,
        fontWeight: 800,
        lineHeight: 1,
        color: 'var(--accent-soft)',
      }}>
        404
      </div>
      <h1 style={{ marginTop: 8 }}>There's nothing here</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        The page you asked for doesn't exist in this dashboard.
      </p>
      <Link className="btn" to="/" style={{ marginTop: 16, textDecoration: 'none' }}>
        Back to the dashboard
      </Link>
    </div>
  );
}
