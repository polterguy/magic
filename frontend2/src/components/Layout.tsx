import { ReactNode, useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { HttpTransportType, HubConnectionBuilder } from '@microsoft/signalr';
import { useAuth } from '../lib/AuthContext';
import { getVersion } from '../lib/api';
import { getNavGuard, setNavGuard } from '../lib/navGuard';
import { ChevronIcon } from './Icons';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '⌂' },
  { to: '/hyper-ide', label: 'Hyper IDE', icon: '🗀' },
  { to: '/hyperlambda-playground', label: 'Playground', icon: '▷' },
  { to: '/sql-studio', label: 'SQL Studio', icon: '⛁' },
  { to: '/databases', label: 'Databases', icon: '⛃' },
  { to: '/generator', label: 'Generator', icon: '⚙' },
  { to: '/endpoints', label: 'Endpoints', icon: '⇄' },
  { to: '/user-roles-management', label: 'Users & roles', icon: '👤' },
  { to: '/task-manager', label: 'Task Manager', icon: '🕒' },
  { to: '/machine-learning', label: 'Machine Learning', icon: '✳' },
  { to: '/plugins', label: 'Plugins', icon: '🧩' },
  { to: '/configuration', label: 'Configuration', icon: '⚙' },
  { to: '/log', label: 'Log', icon: '≣' },
];

export default function Layout({ children }: { children: ReactNode }) {

  const { backend, logout } = useAuth();
  const navigate = useNavigate();
  const [version, setVersion] = useState('');
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('magic2.navCollapsed') === 'true');

  function toggleCollapsed() {
    localStorage.setItem('magic2.navCollapsed', String(!collapsed));
    setCollapsed(!collapsed);
  }

  /*
   * Pages with unsaved state register a guard — intercept nav clicks and
   * ask before leaving.
   */
  function onNavClick(event: React.MouseEvent, to: string) {
    const guard = getNavGuard();
    if (!guard) {
      return;
    }
    event.preventDefault();
    guard().then(proceed => {
      if (proceed) {
        setNavGuard(null);
        navigate(to);
      }
    });
  }

  useEffect(() => {
    getVersion().then(response => setVersion(response.version)).catch(() => {});
  }, []);

  /*
   * App-wide socket channel the backend pushes notifications through —
   * plugin installed, training done, vectorising done, etc. Same channel
   * and payload as the old dashboard: {type: 'success'|'error', message}.
   * Each message becomes its own toast so several can stack.
   */
  const [toasts, setToasts] = useState<{ id: number; text: string; isError: boolean }[]>([]);
  const nextToastId = useRef(0);
  const backendUrl = backend?.url;
  const backendToken = backend?.token;

  function dismissToast(id: number) {
    setToasts(current => current.filter(toast => toast.id !== id));
  }

  useEffect(() => {
    if (!backendUrl || !backendToken) {
      return;
    }
    const connection = new HubConnectionBuilder()
      .withUrl(backendUrl + '/sockets', {
        accessTokenFactory: () => backendToken,
        skipNegotiation: true,
        transport: HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .build();
    const timers: number[] = [];
    connection.on('magic.backend.message', (raw: string) => {
      const args = JSON.parse(raw);
      switch (args.type) {
        case 'success':
        case 'error': {
          const id = ++nextToastId.current;
          const isError = args.type === 'error';
          setToasts(current => [...current, { id, text: args.message, isError }]);
          timers.push(window.setTimeout(
            () => setToasts(current => current.filter(toast => toast.id !== id)),
            isError ? 10000 : 5000));
          break;
        }
      }
    });
    connection.start().catch(() => {});
    return () => {
      timers.forEach(clearTimeout);
      connection.stop();
    };
  }, [backendUrl, backendToken]);

  return (
    <div className="shell">
      {!collapsed && <aside className="sidebar">
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
              onClick={event => onNavClick(event, item.to)}
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <NavLink
            to="/user-profile"
            className="backend-info"
            style={{ textDecoration: 'none', color: 'inherit' }}
            title="Your profile">
            <div className="backend-user">{backend?.username}</div>
            <div className="backend-url">{backend?.url.replace(/^https?:\/\//, '')}</div>
          </NavLink>
          <button className="btn btn-ghost" onClick={logout}>Logout</button>
        </div>
      </aside>}
      <button
        className="nav-toggle"
        style={{ left: collapsed ? 0 : 220 }}
        title={collapsed ? 'Show navigation' : 'Hide navigation'}
        onClick={toggleCollapsed}>
        <span style={{
          display: 'flex',
          transform: collapsed ? undefined : 'rotate(180deg)',
        }}>
          <ChevronIcon />
        </span>
      </button>
      <main className="content">
        {children}
      </main>
      {toasts.length > 0 && (
        <div className="toast-stack">
          {toasts.map(toast => (
            <div key={toast.id} className={'toast' + (toast.isError ? ' error' : '')}>
              <span>{toast.text}</span>
              <button
                className="toast-close"
                title="Dismiss"
                onClick={() => dismissToast(toast.id)}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
