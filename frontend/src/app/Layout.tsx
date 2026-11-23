import { featureHref, features } from '@core/features';
import { getNavGuard, setNavGuard } from '@core/navGuard';
import { registerShellAction, useShellContributions } from '@core/shellActions';
import { createSocket } from '@core/socket';
import { openSupport } from '@core/support';
import { applyTheme, getTheme } from '@core/theme';
import { setToastListener } from '@core/toast';
import { useAuth } from '@core/useAuth';
import {
  ChevronIcon,
  DatabaseIcon,
  HelpIcon,
  KeyboardIcon,
  LogoutIcon,
  MoonIcon,
  SearchIcon,
  SunIcon,
} from '@shared/ui/Icons';
import { ReactNode, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';

import BackendsDialog from './BackendsDialog';
import CommandPalette from './CommandPalette';
import ShortcutsDialog from './ShortcutsDialog';

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  const { backend, logout, backends, version } = useAuth();
  const [switching, setSwitching] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const registered = features();
  const navigation = registered.flatMap(feature =>
    feature.nav && feature.path !== undefined ? [{ ...feature.nav, path: feature.path }] : [],
  );
  /*
   * Pages made of lists and tables say so in their manifest. On very wide screens their rows
   * stretch too far to scan, so the content area takes in its sides. Workspaces (SQL Studio,
   * Hyper IDE, Web Designer, Playground) keep every pixel.
   */
  const roomy = registered.some(feature => feature.roomy && feature.path === pathname);
  const shells = registered.flatMap(feature =>
    feature.shell ? [{ id: feature.id, Shell: feature.shell }] : [],
  );
  const profileHref = featureHref('profile');
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('magic2.navCollapsed') === 'true',
  );
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
   * Guard-aware navigation: pages with unsaved state register a guard, and
   * every programmatic jump — nav clicks and palette picks alike — asks it
   * before leaving.
   */
  const go = useCallback(
    (to: string) => {
      const guard = getNavGuard();
      if (!guard) {
        void navigate(to);
        return;
      }
      guard()
        .then(proceed => {
          if (proceed) {
            setNavGuard(null);
            void navigate(to);
          }
        })
        .catch(error => console.error('Navigation guard failed:', error));
    },
    [navigate],
  );

  function onNavClick(event: React.MouseEvent, to: string) {
    // Without a guard the NavLink's own SPA navigation is fine as it is.
    if (!getNavGuard()) {
      return;
    }
    event.preventDefault();
    go(to);
  }

  /*
   * The command palette. Captured at window level in the CAPTURE phase, so
   * Ctrl/Cmd+K opens it even while CodeMirror has focus — CodeMirror stops
   * propagation of key events it handles, but capture runs before it sees
   * anything.
   */
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { paletteActions, footerActions } = useShellContributions();
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        event.stopPropagation();
        setPaletteOpen(open => !open);
      } else if ((event.metaKey || event.ctrlKey) && event.key === '/') {
        event.preventDefault();
        event.stopPropagation();
        setShortcutsOpen(open => !open);
      }
    }
    globalThis.addEventListener('keydown', onKey, true);
    return () => globalThis.removeEventListener('keydown', onKey, true);
  }, []);

  // Lets the pages below open the palette this component owns.
  useEffect(() => registerShellAction('openPalette', () => setPaletteOpen(true)), []);

  /*
   * App-wide socket channel the backend pushes notifications through —
   * plugin installed, training done, vectorising done, etc. Same channel
   * and payload as the old dashboard: {type: 'success'|'error', message}.
   * Each message becomes its own toast so several can stack.
   */
  const [toasts, setToasts] = useState<
    { id: number; text: string; isError: boolean; logId?: number }[]
  >([]);
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
    timers.current.set(
      id,
      globalThis.setTimeout(
        () => {
          timers.current.delete(id);
          setToasts(current => current.filter(toast => toast.id !== id));
        },
        isError ? 10000 : 5000,
      ),
    );
  }, []);

  // Toasts raised from anywhere in the app — clipboard copies, and so on.
  useEffect(() => {
    setToastListener(toast => pushToast(toast.text, toast.isError, toast.logId));
    const pending = timers.current;
    return () => {
      setToastListener(null);
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, [pushToast]);

  useEffect(() => {
    if (!backendUrl || !backendToken) {
      return;
    }
    const connection = createSocket({ reconnect: true });
    connection.on('magic.backend.message', (raw: string) => {
      const args = JSON.parse(raw) as { type?: string; message: string };
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
      void started.finally(() => connection.stop().catch(() => {}));
    };
  }, [backendUrl, backendToken, pushToast]);

  const backendInfo = (
    <>
      <div className="backend-user">{backend?.username}</div>
      <div className="backend-url">{backend?.url.replace(/^https?:\/\//, '')}</div>
    </>
  );

  return (
    <div className={'shell' + (mobileNav ? ' nav-open' : '')}>
      {/* Phone-only top bar: the hamburger opens the drawer. Hidden on desktop. */}
      <div className="mobile-topbar">
        <button
          className="hamburger"
          aria-label="Open navigation"
          onClick={() => setMobileNav(true)}
        >
          <svg
            aria-hidden="true"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="brand-magic">magic</span>
      </div>
      {/* Dims the page behind the open drawer; tapping it closes the drawer. */}
      <div className="nav-backdrop" role="presentation" onClick={() => setMobileNav(false)} />
      <aside className={'sidebar' + (collapsed ? ' collapsed' : '') + (mobileNav ? ' open' : '')}>
        <div className="brand">
          <span className="brand-magic">magic</span>
          <span className="brand-version">{version}</span>
        </div>
        <nav>
          {navigation.map(({ path, label, Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={event => {
                onNavClick(event, path);
                setMobileNav(false);
              }}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              <span className="nav-icon">
                <Icon />
              </span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          {profileHref === null ? (
            <div className="backend-info">{backendInfo}</div>
          ) : (
            <NavLink
              to={profileHref}
              className="backend-info"
              style={{ textDecoration: 'none', color: 'inherit' }}
              title="Your profile"
              onClick={() => setMobileNav(false)}
            >
              {backendInfo}
            </NavLink>
          )}
          {/*
           * Tools (find, learn, ask), then environment (theme, cloudlet),
           * and logout isolated last — the one session-ending button never
           * sits between two casually-clicked ones.
           */}
          <div className="footer-actions">
            {footerActions.map(({ id, title, Icon, onClick }) => (
              <button
                key={id}
                className="btn btn-ghost btn-small"
                title={title}
                onClick={() => {
                  onClick();
                  setMobileNav(false);
                }}
              >
                <Icon />
              </button>
            ))}
            <button
              className="btn btn-ghost btn-small"
              title="Command palette — jump to any page, file or endpoint (Ctrl+K / Cmd+K)"
              onClick={() => {
                setPaletteOpen(true);
                setMobileNav(false);
              }}
            >
              <SearchIcon />
            </button>
            <button
              className="btn btn-ghost btn-small"
              title="Keyboard shortcuts (Ctrl+/ / Cmd+/)"
              onClick={() => {
                setShortcutsOpen(true);
                setMobileNav(false);
              }}
            >
              <KeyboardIcon />
            </button>
            <button
              className="btn btn-ghost btn-small"
              title="Ask Frank about Hyperlambda and Magic"
              onClick={() => {
                void openSupport();
                setMobileNav(false);
              }}
            >
              <HelpIcon />
            </button>
            <button
              className="btn btn-ghost btn-small"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              className="btn btn-ghost btn-small"
              title={'Switch cloudlet — ' + backends.length + ' signed in'}
              onClick={() => {
                setSwitching(true);
                setMobileNav(false);
              }}
            >
              <DatabaseIcon />
            </button>
            <button className="btn btn-ghost btn-small" title="Logout" onClick={logout}>
              <LogoutIcon />
            </button>
          </div>
        </div>
      </aside>
      {switching && <BackendsDialog onClose={() => setSwitching(false)} />}
      {paletteOpen && (
        <CommandPalette
          go={go}
          actions={[
            // What features offer while they are mounted — Chat Ops, the dashboard's tour.
            ...paletteActions,
            { label: 'Toggle light/dark theme', action: toggleTheme },
            { label: 'Switch cloudlet', action: () => setSwitching(true) },
            { label: 'Ask Frank for help', action: () => void openSupport() },
            { label: 'Keyboard shortcuts', action: () => setShortcutsOpen(true) },
          ]}
          onClose={() => setPaletteOpen(false)}
        />
      )}
      {shortcutsOpen && <ShortcutsDialog onClose={() => setShortcutsOpen(false)} />}
      <button
        className="nav-toggle"
        style={{ left: collapsed ? 0 : 256 }}
        title={collapsed ? 'Show navigation' : 'Hide navigation'}
        onClick={toggleCollapsed}
      >
        <span
          style={{
            display: 'flex',
            transform: collapsed ? undefined : 'rotate(180deg)',
          }}
        >
          <ChevronIcon />
        </span>
      </button>
      <main className={roomy ? 'content content-roomy' : 'content'}>{children}</main>
      {/* What features keep alive across pages, such as the Chat Ops drawer. */}
      <Suspense fallback={null}>
        {shells.map(({ id, Shell }) => (
          <Shell key={id} />
        ))}
      </Suspense>
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
              role={toast.isError ? 'alert' : undefined}
            >
              <span>
                {toast.text}
                {toast.logId && featureHref('log') !== null && (
                  // Backend errors carry the id of the log entry they wrote.
                  <Link
                    to={featureHref('log', '?id=' + toast.logId)!}
                    onClick={() => dismissToast(toast.id)}
                  >
                    View log entry →
                  </Link>
                )}
              </span>
              <button
                className="toast-close"
                title="Dismiss"
                onClick={() => dismissToast(toast.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
