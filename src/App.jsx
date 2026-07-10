import { useState } from 'react';
import { useSelector } from 'react-redux';
import DashboardLayout from './components/layout/DashboardLayout';
import AdminAccessPage from './pages/AdminAccessPage';
import DevicesPage from './pages/DevicesPage';
import DispensersPage from './pages/DispensersPage';
import LoginPage from './pages/LoginPage';
import ProjectsPage from './pages/ProjectsPage';
import RegisterPage from './pages/RegisterPage';
import LiveJobsPage from './pages/LiveJobsPage';
import ReleasesPage from './pages/ReleasesPage';
import './App.css';

const pageComponents = {
  adminAccess: AdminAccessPage,
  devices: DevicesPage,
  projects: ProjectsPage,
  releases: ReleasesPage,
  liveJobs: LiveJobsPage,
  dispensers: DispensersPage,
};

function App() {
  const [authView, setAuthView] = useState('login');
  const { admin, token } = useSelector((state) => state.admin);
  const activePage = useSelector((state) => state.ui.activePage);
  const ActivePage = pageComponents[activePage] ?? DevicesPage;
  const isAuthenticated = Boolean(token || admin);

  if (!isAuthenticated) {
    return authView === 'register' ? (
      <RegisterPage
        onSwitchToLogin={() => setAuthView('login')}
      />
    ) : (
      <LoginPage
        onSwitchToRegister={() => setAuthView('register')}
      />
    );
  }

  return (
    <DashboardLayout>
      <ActivePage />
    </DashboardLayout>
  );
}

export default App;
