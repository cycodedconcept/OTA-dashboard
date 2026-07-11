import { useDispatch, useSelector } from 'react-redux';
import { logoutAdmin } from '../../redux/slices/adminSlice';
import { closeSidebar, setActivePage } from '../../redux/slices/uiSlice';
import { navigateToPage } from '../../utils/appRoutes';

const navigationItems = [
  { key: 'devices', label: 'Devices', icon: 'bi-hdd-network' },
  { key: 'projects', label: 'Projects', icon: 'bi-kanban' },
  { key: 'firmware', label: 'Firmware', icon: 'bi-cpu' },
  { key: 'imei', label: 'IMEI', icon: 'bi-sim' },
];

function Sidebar() {
  const dispatch = useDispatch();
  const { activePage, isSidebarOpen } = useSelector((state) => state.ui);

  function handlePageChange(pageKey) {
    dispatch(setActivePage(pageKey));
    navigateToPage(pageKey);
    dispatch(closeSidebar());
  }

  function handleLogout() {
    dispatch(closeSidebar());
    dispatch(logoutAdmin());
  }

  function renderSidebarLabel(icon, label) {
    return (
      <span className="sidebar-nav__content">
        <i className={`bi ${icon} sidebar-nav__icon`} aria-hidden="true" />
        <span>{label}</span>
      </span>
    );
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
            {renderSidebarLabel(item.icon, item.label)}
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
            {renderSidebarLabel('bi-gear', 'Settings')}
          </button>

          <button
            type="button"
            className="sidebar-nav__item sidebar-nav__item--logout text-start"
            onClick={handleLogout}
          >
            {renderSidebarLabel('bi-box-arrow-right', 'Logout')}
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
