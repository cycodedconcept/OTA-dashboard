import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DashboardLayout from './components/layout/DashboardLayout';
import AdminAccessPage from './pages/AdminAccessPage';
import DevicesPage from './pages/DevicesPage';
import FirmwarePage from './pages/FirmwarePage';
import ImeiPage from './pages/ImeiPage';
import LoginPage from './pages/LoginPage';
import ProjectsPage from './pages/ProjectsPage';
import RegisterPage from './pages/RegisterPage';
import { setActivePage } from './redux/slices/uiSlice';
import { buildPageUrl, getPageFromLocation } from './utils/appRoutes';
import './App.css';

const pageComponents = {
  adminAccess: AdminAccessPage,
  devices: DevicesPage,
  firmware: FirmwarePage,
  imei: ImeiPage,
  projects: ProjectsPage,
};

function App() {
  const dispatch = useDispatch();
  const [authView, setAuthView] = useState('login');
  const { admin, token } = useSelector((state) => state.admin);
  const activePage = useSelector((state) => state.ui.activePage);
  const ActivePage = pageComponents[activePage] ?? DevicesPage;
  const isAuthenticated = Boolean(token || admin);

  useEffect(() => {
    const syncActivePage = () => {
      const nextPage = getPageFromLocation();

      dispatch(setActivePage(nextPage));

      if (typeof window !== 'undefined') {
        const canonicalUrl = buildPageUrl(
          nextPage,
          new URLSearchParams(window.location.search)
        );
        const currentUrl = `${window.location.pathname}${window.location.search}`;

        if (canonicalUrl !== currentUrl) {
          window.history.replaceState({}, '', canonicalUrl);
        }
      }
    };

    syncActivePage();
    window.addEventListener('popstate', syncActivePage);

    return () => {
      window.removeEventListener('popstate', syncActivePage);
    };
  }, [dispatch]);

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
