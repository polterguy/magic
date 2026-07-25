import { useEffect, useState } from 'react';
import { countLog, countTasks, countUsers, getVersion, listEndpoints } from '../lib/api';
import { useAuth } from '../lib/AuthContext';

export default function Dashboard() {

  const { backend } = useAuth();
  const [version, setVersion] = useState('…');
  const [endpoints, setEndpoints] = useState<number | null>(null);
  const [users, setUsers] = useState<number | null>(null);
  const [tasks, setTasks] = useState<number | null>(null);
  const [logItems, setLogItems] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getVersion().then(r => setVersion(r.version)).catch(e => setError(e.message));
    listEndpoints().then(r => setEndpoints(r.length)).catch(() => {});
    countUsers('').then(r => setUsers(r.count)).catch(() => {});
    countTasks().then(r => setTasks(r.count)).catch(() => {});
    countLog().then(r => setLogItems(r.count)).catch(() => {});
  }, []);

  return (
    <>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Connected to {backend?.url} as {backend?.username}</p>
      </div>
      {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="kpi-grid">
        <div className="card">
          <div className="kpi-value">{version}</div>
          <div className="kpi-label">Magic version</div>
        </div>
        <div className="card">
          <div className="kpi-value">{endpoints ?? '…'}</div>
          <div className="kpi-label">Endpoints</div>
        </div>
        <div className="card">
          <div className="kpi-value">{users ?? '…'}</div>
          <div className="kpi-label">Users</div>
        </div>
        <div className="card">
          <div className="kpi-value">{tasks ?? '…'}</div>
          <div className="kpi-label">Tasks</div>
        </div>
        <div className="card">
          <div className="kpi-value">{logItems ?? '…'}</div>
          <div className="kpi-label">Log items</div>
        </div>
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Welcome</h2>
        <p className="muted">
          This is the React edition of the Magic dashboard. Use the Hyperlambda
          Playground to execute Hyperlambda, Hyper IDE to edit anything on your
          server, SQL Studio to query your databases, and the manage sections to
          administer endpoints, users, tasks, and your server log.
        </p>
      </div>
    </>
  );
}
