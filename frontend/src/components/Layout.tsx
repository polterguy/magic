import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { createSocket } from '../lib/socket';
import { useAuth } from '../lib/AuthContext';
import { getVersion } from '../lib/api';
import { getNavGuard, setNavGuard } from '../lib/navGuard';
import { setToastListener } from '../lib/toast';
import { DatabaseIcon, LogoutIcon, MoonIcon, RobotIcon, SunIcon } from './Icons';
import { ChevronIcon } from './Icons';
import { applyTheme, getTheme } from '../lib/theme';
import BackendsDialog from './BackendsDialog';
import { openSupport } from '../lib/support';
import { SECTIONS } from './sections';

export default function Layout({ children }: { children: ReactNode }) {

  const { backend, logout, backends } = useAuth();
  const [switching, setSwitching] = useState(false);
  const navigate = useNavigate();
  const [version, setVersion] = useState('');
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('magic2.navCollapsed') === 'true');
  // Separate from the desktop collapse: the phone drawer, closed by default.
  const [mobileNav, setMobileNav] = useState(false);

  function toggleCollapsed() {
    localStorage.setItem('magic2.navCollapsed', String(!collapsed));
    setCollapsed(!collapsed);
  }

  const [theme, setTheme] = useState(getTheme);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
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
  const [toasts, setToasts] = useState<{ id: number; text: string; isError: boolean; logId?: number }[]>([]);
  const nextToastId = useRef(0);
  // Auto-dismiss timer per toast, so dismissing by hand also stops its timer.
  const timers = useRef(new Map<number, number>());
  const backendUrl = backend?.url;
  const backendToken = backend?.token;

  function dismissToast(id: number) {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts(current => current.filter(toast => toast.id !== id));
  }

  const pushToast = useCallback((text: string, isError: boolean, logId?: number) => {
    const id = ++nextToastId.current;
    setToasts(current => [...current, { id, text, isError, logId }]);
    timers.current.set(id, window.setTimeout(() => {
      timers.current.delete(id);
      setToasts(current => current.filter(toast => toast.id !== id));
    }, isError ? 10000 : 5000));
  }, []);

  // Toasts raised from anywhere in the app — clipboard copies, and so on.
  useEffect(() => {
    setToastListener(toast => pushToast(toast.text, toast.isError, toast.logId));
    return () => {
      setToastListener(null);
      timers.current.forEach(clearTimeout);
      timers.current.clear();
    };
  }, [pushToast]);

  useEffect(() => {
    if (!backendUrl || !backendToken) {
      return;
    }
    const connection = createSocket({ reconnect: true });
    connection.on('magic.backend.message', (raw: string) => {
      const args = JSON.parse(raw);
      switch (args.type) {
        case 'success':
        case 'error':
          pushToast(args.message, args.type === 'error');
          break;
      }
    });
    // Only stop once start() has settled — calling stop() while start() is
    // still pending (React StrictMode's double-invoke does exactly that) logs
    // "Failed to start the HttpConnection before stop() was called."
    const started = connection.start().catch(() => {});
    return () => {
      started.finally(() => connection.stop().catch(() => {}));
    };
  }, [backendUrl, backendToken, pushToast]);

  return (
    <div className={'shell' + (mobileNav ? ' nav-open' : '')}>
      {/* Phone-only top bar: the hamburger opens the drawer. Hidden on desktop. */}
      <div className="mobile-topbar">
        <button
          className="hamburger"
          aria-label="Open navigation"
          onClick={() => setMobileNav(true)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="brand-magic">magic</span>
      </div>
      {/* Dims the page behind the open drawer; tapping it closes the drawer. */}
      <div className="nav-backdrop" onClick={() => setMobileNav(false)} />
      <aside className={'sidebar' + (collapsed ? ' collapsed' : '') + (mobileNav ? ' open' : '')}>
        <div className="brand">
          <span className="brand-magic">magic</span>
          <span className="brand-version">{version}</span>
        </div>
        <nav>
          {SECTIONS.map(section => (
            <NavLink
              key={section.to}
              to={section.to}
              end={section.to === '/'}
              onClick={event => { onNavClick(event, section.to); setMobileNav(false); }}
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <span className="nav-icon"><section.Icon /></span>
              {section.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <NavLink
            to="/user-profile"
            className="backend-info"
            style={{ textDecoration: 'none', color: 'inherit' }}
            title="Your profile"
            onClick={() => setMobileNav(false)}>
            <div className="backend-user">{backend?.username}</div>
            <div className="backend-url">{backend?.url.replace(/^https?:\/\//, '')}</div>
          </NavLink>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-ghost btn-small"
              title="Logout"
              onClick={logout}>
              <LogoutIcon />
            </button>
            <button
              className="btn btn-ghost btn-small"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={toggleTheme}>
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              className="btn btn-ghost btn-small"
              title="Ask Frank about Hyperlambda and Magic"
              onClick={() => { openSupport(); setMobileNav(false); }}>
              <RobotIcon />
            </button>
            <button
              className="btn btn-ghost btn-small"
              title={'Switch cloudlet — ' + backends.length + ' signed in'}
              onClick={() => { setSwitching(true); setMobileNav(false); }}>
              <DatabaseIcon />
            </button>
          </div>
        </div>
      </aside>
      {switching && <BackendsDialog onClose={() => setSwitching(false)} />}
      <button
        className="nav-toggle"
        style={{ left: collapsed ? 0 : 256 }}
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
        /*
         * The app's only feedback channel, so screen readers must hear it —
         * polite for successes, and role=alert (assertive) per error toast.
         */
        <div className="toast-stack" role="status" aria-live="polite">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={'toast' + (toast.isError ? ' error' : '')}
              role={toast.isError ? 'alert' : undefined}>
              <span>
                {toast.text}
                {toast.logId && (
                  // Backend errors carry the id of the log entry they wrote.
                  <Link
                    to={'/log?id=' + toast.logId}
                    onClick={() => dismissToast(toast.id)}>
                    View log entry →
                  </Link>
                )}
              </span>
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
