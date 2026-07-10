import { useDispatch, useSelector } from 'react-redux';
import { logoutAdmin } from '../../redux/slices/adminSlice';
import { closeSidebar, setActivePage } from '../../redux/slices/uiSlice';

const navigationItems = [
  { key: 'devices', label: 'Devices' },
  { key: 'projects', label: 'Projects' },
  { key: 'releases', label: 'Releases' },
  { key: 'liveJobs', label: 'Live jobs' },
  { key: 'dispensers', label: 'Dispensers' },
];

function Sidebar() {
  const dispatch = useDispatch();
  const { activePage, isSidebarOpen } = useSelector((state) => state.ui);

  function handlePageChange(pageKey) {
    dispatch(setActivePage(pageKey));
    dispatch(closeSidebar());
  }

  function handleLogout() {
    dispatch(closeSidebar());
    dispatch(logoutAdmin());
  }

  return (
    <aside
      id="app-sidebar"
      className={`app-sidebar d-flex flex-column ${
        isSidebarOpen ? 'is-open' : ''
      }`}
    >
      <div className="sidebar-brand">
        <div className="sidebar-brand__mark" aria-hidden="true">
          H
        </div>
        <div>
          <p className="sidebar-brand__title">OTAHardware</p>
          <p className="sidebar-brand__subtitle">Fleet Console</p>
        </div>
      </div>

      <nav className="d-flex flex-column gap-2" aria-label="Primary">
        {navigationItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`sidebar-nav__item text-start ${
              activePage === item.key ? 'is-active' : ''
            }`}
            onClick={() => handlePageChange(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-utility-nav d-flex flex-column gap-2">
          <button
            type="button"
            className={`sidebar-nav__item text-start ${
              activePage === 'adminAccess' ? 'is-active' : ''
            }`}
            onClick={() => handlePageChange('adminAccess')}
          >
            Settings
          </button>

          <button
            type="button"
            className="sidebar-nav__item sidebar-nav__item--logout text-start"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        <div className="sidebar-workspace">
          <div className="sidebar-workspace__row">
            <div className="sidebar-workspace__icon" aria-hidden="true">
              H
            </div>
            <div>
              <p className="sidebar-workspace__label">Hardware Staging</p>
              <p className="sidebar-workspace__value">staging-api.gasflo.africa</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
