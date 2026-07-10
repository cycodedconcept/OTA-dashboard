import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeSidebar } from '../../redux/slices/uiSlice';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

function DashboardLayout({ children }) {
  const dispatch = useDispatch();
  const isSidebarOpen = useSelector((state) => state.ui.isSidebarOpen);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        dispatch(closeSidebar());
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dispatch]);

  return (
    <div className="app-shell">
      <Sidebar />
      <button
        type="button"
        className={`sidebar-backdrop ${isSidebarOpen ? 'is-visible' : ''}`}
        aria-label="Close navigation"
        onClick={() => dispatch(closeSidebar())}
      />

      <div className="dashboard-main">
        <Topbar />
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;
