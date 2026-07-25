import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Playground from './pages/Playground';
import Files from './pages/Files';
import Sql from './pages/Sql';
import Endpoints from './pages/Endpoints';
import Users from './pages/Users';
import Tasks from './pages/Tasks';
import Log from './pages/Log';

export default function App() {

  const { authenticated } = useAuth();

  if (!authenticated) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/hyperlambda-playground" element={<Playground />} />
        <Route path="/hyper-ide" element={<Files />} />
        <Route path="/sql-studio" element={<Sql />} />
        <Route path="/endpoints" element={<Endpoints />} />
        <Route path="/user-roles-management" element={<Users />} />
        <Route path="/task-manager" element={<Tasks />} />
        <Route path="/log" element={<Log />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
