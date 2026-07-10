import { useDispatch, useSelector } from 'react-redux';
import { setDevicesSearchTerm } from '../../redux/slices/devicesSlice';
import { setProjectsSearchTerm } from '../../redux/slices/projectsSlice';
import { setSearchTerm } from '../../redux/slices/releasesSlice';
import { toggleSidebar } from '../../redux/slices/uiSlice';

function Topbar() {
  const dispatch = useDispatch();
  const { activePage, isSidebarOpen } = useSelector((state) => state.ui);
  const devicesSearchTerm = useSelector((state) => state.devices.searchTerm);
  const projectsSearchTerm = useSelector((state) => state.projects.searchTerm);
  const searchTerm = useSelector((state) => state.releases.searchTerm);
  const searchConfig = {
    devices: {
      onChange: (value) => dispatch(setDevicesSearchTerm(value)),
      placeholder: 'Search devices...',
      value: devicesSearchTerm,
    },
    projects: {
      onChange: (value) => dispatch(setProjectsSearchTerm(value)),
      placeholder: 'Search projects...',
      value: projectsSearchTerm,
    },
    releases: {
      onChange: (value) => dispatch(setSearchTerm(value)),
      placeholder: 'Search releases...',
      value: searchTerm,
    },
  };
  const activeSearch = searchConfig[activePage];

  return (
    <header className="dashboard-topbar">
      <div className="topbar__leading">
        <button
          type="button"
          className="topbar__menu-btn"
          aria-label="Toggle navigation"
          aria-controls="app-sidebar"
          aria-expanded={isSidebarOpen}
          onClick={() => dispatch(toggleSidebar())}
        >
          <i className="bi bi-list" aria-hidden="true" />
        </button>

        <div className="topbar__project">
          <span className="topbar__project-prefix">project</span>
          <span className="topbar__project-range">2299..3292</span>
        </div>
      </div>

      <div className="topbar__actions">
        <span className="topbar__status">9/12 on latest</span>

        <input
          type="search"
          className="form-control topbar__search"
          placeholder={activeSearch?.placeholder ?? 'Search...'}
          aria-label={activeSearch?.placeholder ?? 'Search'}
          value={activeSearch?.value ?? ''}
          onChange={(event) => activeSearch?.onChange(event.target.value)}
          disabled={!activeSearch}
        />
      </div>
    </header>
  );
}

export default Topbar;
