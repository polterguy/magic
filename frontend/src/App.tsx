import { Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './lib/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import NoAccess from './pages/NoAccess';
import NotFound from './pages/NotFound';
import MagicLink, { MAGIC_LINK_PATH } from './pages/MagicLink';
import Setup from './pages/Setup';
import Dashboard from './pages/Dashboard';
import Playground from './pages/Playground';
import Files from './pages/Files';
import Sql from './pages/Sql';
import Databases from './pages/Databases';
import Configuration from './pages/Configuration';
import Profile from './pages/Profile';
import MachineLearning from './pages/MachineLearning';
import Plugins from './pages/Plugins';
import Generator from './pages/Generator';
import Endpoints from './pages/Endpoints';
import Users from './pages/Users';
import Tasks from './pages/Tasks';
import Log from './pages/Log';

export default function App() {

  const { authenticated, isRoot, setupNeeded } = useAuth();
  /*
   * Through the router rather than window.location, so this re-renders when
   * a page navigates — the magnetic link screen sends you to the dashboard
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

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/hyperlambda-playground" element={<Playground />} />
        <Route path="/hyper-ide" element={<Files />} />
        <Route path="/sql-studio" element={<Sql />} />
        <Route path="/databases" element={<Databases />} />
        <Route path="/generator" element={<Generator />} />
        <Route path="/endpoints" element={<Endpoints />} />
        <Route path="/user-roles-management" element={<Users />} />
        <Route path="/task-manager" element={<Tasks />} />
        <Route path="/configuration" element={<Configuration />} />
        <Route path="/user-profile" element={<Profile />} />
        <Route path="/machine-learning" element={<MachineLearning />} />
        <Route path="/plugins" element={<Plugins />} />
        <Route path="/log" element={<Log />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
