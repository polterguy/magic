import { features } from '@core/features';
import { useAuth } from '@core/useAuth';
import { lazy, Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import Login from './auth/Login';
import MagicLink, { MAGIC_LINK_PATH } from './auth/MagicLink';
import NoAccess from './auth/NoAccess';
import Setup from './auth/Setup';
import NotFound from './NotFound';

/*
 * Everything behind the login gate is code-split per route — CodeMirror, the
 * ML suite and SignalR together dwarf the auth screens, and none of it should
 * ride along on the login page's first paint. The auth-flow screens above
 * stay eager: they ARE the first paint.
 */
const Layout = lazy(() => import('./Layout'));

export default function App() {
  const { authenticated, isRoot, setupNeeded, backend } = useAuth();
  /*
   * Through the router rather than window.location, so this re-renders when
   * a page navigates — the magic link screen sends you to the dashboard
   * once the token checks out, and nothing else would notice the change.
   */
  const { pathname } = useLocation();

  /*
   * Ahead of every gate: a sign in link has to work whether or not somebody
   * is already signed in, and to a different cloudlet than the one they are
   * looking at.
   */
  if (pathname === MAGIC_LINK_PATH) {
    return <MagicLink />;
  }

  if (!authenticated) {
    return <Login />;
  }

  /*
   * Gate before the layout mounts — the layout opens a socket and the pages
   * fetch on mount, and every one of those would fail without root.
   */
  if (!isRoot) {
    return <NoAccess />;
  }

  /*
   * A backend that hasn't been set up has a placeholder JWT secret and
   * accepts root/root, so nothing behind this is trustworthy until the
   * account has a real password.
   */
  if (setupNeeded) {
    return <Setup />;
  }

  /*
   * Keyed on the backend, so switching cloudlets tears the whole thing down
   * and builds it again. Every page fetches on mount, and none of them watch
   * for the backend changing underneath them - without this you keep looking
   * at the previous cloudlet's files, tables and results.
   */
  return (
    <Suspense
      fallback={
        <div className="spinner-panel" style={{ height: '100vh' }}>
          <div className="spinner" />
        </div>
      }
    >
      <Layout key={backend?.url}>
        <Routes>
          {/* Every page comes from a feature manifest, lazily loaded like the layout. */}
          {features().map(({ id, path, page: Page }) =>
            path !== undefined && Page ? <Route key={id} path={path} element={<Page />} /> : null,
          )}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </Suspense>
  );
}
