import { ReactNode, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { getVersion } from '../lib/api';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '⌂' },
  { to: '/playground', label: 'Playground', icon: '▷' },
  { to: '/files', label: 'Files', icon: '🗀' },
  { to: '/sql', label: 'SQL', icon: '⛁' },
  { to: '/endpoints', label: 'Endpoints', icon: '⇄' },
  { to: '/users', label: 'Users & roles', icon: '👤' },
  { to: '/tasks', label: 'Tasks', icon: '🕒' },
  { to: '/log', label: 'Log', icon: '≣' },
];

export default function Layout({ children }: { children: ReactNode }) {

  const { backend, logout } = useAuth();
  const [version, setVersion] = useState('');

  useEffect(() => {
    getVersion().then(response => setVersion(response.version)).catch(() => {});
  }, []);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-magic">magic</span>
          <span className="brand-version">{version}</span>
        </div>
        <nav>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="backend-info" title={backend?.url}>
            <div className="backend-user">{backend?.username}</div>
            <div className="backend-url">{backend?.url.replace(/^https?:\/\//, '')}</div>
          </div>
          <button className="btn btn-ghost" onClick={logout}>Logout</button>
        </div>
      </aside>
      <main className="content">
        {children}
      </main>
    </div>
  );
}
