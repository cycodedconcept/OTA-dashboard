import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import EmptyState from '../components/common/EmptyState';
import {
  clearRegisterDeviceState,
  clearSelectedDevice,
  clearUpdateDeviceState,
  getAllDevices,
  registerDevice,
  setSelectedDevice,
  updateDevice,
} from '../redux/slices/devicesSlice';
import { getProjects } from '../redux/slices/projectsSlice';
import { pickFirstDefined } from '../utils/apiData';
import { getApiFieldError } from '../utils/apiErrors';
import { hasValue } from '../utils/formValidation';

function parseBackendDate(value) {
  if (!hasValue(value)) {
    return null;
  }

  const parsedDate = new Date(value);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatDateTime(value) {
  const parsedDate = parseBackendDate(value);

  if (!parsedDate) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsedDate);
}

function formatRelativeTime(value) {
  const parsedDate = parseBackendDate(value);

  if (!parsedDate) {
    return 'Unknown';
  }

  const difference = Date.now() - parsedDate.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (difference < minute) {
    return 'just now';
  }

  if (difference < hour) {
    return `${Math.round(difference / minute)} min ago`;
  }

  if (difference < day) {
    return `${Math.round(difference / hour)} hr ago`;
  }

  return `${Math.round(difference / day)} day${difference >= 2 * day ? 's' : ''} ago`;
}

function getDeviceRecordId(device) {
  return pickFirstDefined(device, ['id']);
}

function getDeviceIdentifier(device) {
  return pickFirstDefined(device, ['device_id']);
}

function getDeviceProjectId(device) {
  return pickFirstDefined(device, ['project_id']);
}

function getProjectIdentity(project) {
  return pickFirstDefined(project, ['project_id', 'id']);
}

function getProjectName(project) {
  return (
    pickFirstDefined(project, ['project_name', 'create_project', 'name']) ??
    'Untitled project'
  );
}

function buildProjectOptions(projects) {
  const optionMap = new Map();

  projects.forEach((project) => {
    const projectId = getProjectIdentity(project);

    if (!hasValue(projectId)) {
      return;
    }

    optionMap.set(String(projectId), {
      label: getProjectName(project),
      value: String(projectId),
    });
  });

  return [...optionMap.values()];
}

function normalizeDevice(device, projectNameMap) {
  const recordId = getDeviceRecordId(device);
  const deviceId = getDeviceIdentifier(device);
  const projectId = getDeviceProjectId(device);
  const projectName =
    pickFirstDefined(device, ['project_name']) ||
    (hasValue(projectId) ? projectNameMap.get(String(projectId)) : null);
  const createdAt = pickFirstDefined(device, ['created_at']);
  const updatedAt = pickFirstDefined(device, ['updated_at']);

  return {
    createdAt,
    deviceId: hasValue(deviceId) ? String(deviceId) : 'Unavailable',
    projectId: hasValue(projectId) ? String(projectId) : null,
    projectLabel: projectName || (hasValue(projectId) ? `Project #${projectId}` : 'Unassigned'),
    raw: device,
    recordId: hasValue(recordId) ? String(recordId) : null,
    updatedAt,
  };
}

function getPulseTone(device) {
  const updatedAt = parseBackendDate(device.updatedAt);

  if (!device.projectId) {
    return 'devices-pulse-grid__dot--muted';
  }

  if (!updatedAt) {
    return 'devices-pulse-grid__dot--steady';
  }

  const age = Date.now() - updatedAt.getTime();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  if (age <= 6 * hour) {
    return 'devices-pulse-grid__dot--fresh';
  }

  if (age <= day) {
    return 'devices-pulse-grid__dot--active';
  }

  if (age <= 7 * day) {
    return 'devices-pulse-grid__dot--watch';
  }

  return 'devices-pulse-grid__dot--idle';
}

function DevicesPage() {
  const dispatch = useDispatch();
  const {
    items,
    searchTerm,
    selectedDevice,
    getDevicesError,
    getDevicesLoading,
    registerDeviceError,
    registerDeviceLoading,
    registerDeviceSuccessMessage,
    updateDeviceError,
    updateDeviceLoading,
    updateDeviceSuccessMessage,
  } = useSelector((state) => state.devices);
  const { items: projectItems, getProjectsError, getProjectsLoading } =
    useSelector((state) => state.projects);
  const token = useSelector((state) => state.admin.token);
  const [activeFilter, setActiveFilter] = useState('all');
  const [projectId, setProjectId] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [editDeviceId, setEditDeviceId] = useState('');
  const [openPanel, setOpenPanel] = useState(null);
  const [registerErrors, setRegisterErrors] = useState({});
  const [updateErrors, setUpdateErrors] = useState({});

  function closeModal() {
    setOpenPanel(null);
    setRegisterErrors({});
    setUpdateErrors({});
    dispatch(clearRegisterDeviceState());
    dispatch(clearUpdateDeviceState());
  }

  function openRegisterModal() {
    dispatch(clearRegisterDeviceState());
    setRegisterErrors({});
    setOpenPanel('register');
  }

  function openUpdateModal() {
    dispatch(clearUpdateDeviceState());
    setUpdateErrors({});
    setOpenPanel('update');
  }

  useEffect(() => {
    dispatch(getAllDevices());
    dispatch(getProjects());
    dispatch(clearRegisterDeviceState());
    dispatch(clearUpdateDeviceState());

    return () => {
      dispatch(clearSelectedDevice());
      dispatch(clearRegisterDeviceState());
      dispatch(clearUpdateDeviceState());
    };
  }, [dispatch]);

  useEffect(() => {
    if (!openPanel) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpenPanel(null);
        setRegisterErrors({});
        setUpdateErrors({});
        dispatch(clearRegisterDeviceState());
        dispatch(clearUpdateDeviceState());
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dispatch, openPanel]);

  const projectOptions = useMemo(
    () => buildProjectOptions(projectItems),
    [projectItems]
  );

  const projectNameMap = useMemo(() => {
    const nextMap = new Map();

    projectOptions.forEach((option) => {
      nextMap.set(option.value, option.label);
    });

    return nextMap;
  }, [projectOptions]);

  const normalizedDevices = useMemo(
    () => items.map((item) => normalizeDevice(item, projectNameMap)),
    [items, projectNameMap]
  );

  const selectedNormalizedDevice = useMemo(
    () =>
      selectedDevice ? normalizeDevice(selectedDevice, projectNameMap) : null,
    [projectNameMap, selectedDevice]
  );

  useEffect(() => {
    setEditDeviceId(selectedNormalizedDevice?.deviceId ?? '');
  }, [selectedNormalizedDevice]);

  const summary = useMemo(() => {
    const linkedCount = normalizedDevices.filter((item) => item.projectId).length;
    const recentCount = normalizedDevices.filter((item) => {
      const parsedDate = parseBackendDate(item.updatedAt);

      if (!parsedDate) {
        return false;
      }

      return Date.now() - parsedDate.getTime() <= 24 * 60 * 60 * 1000;
    }).length;

    return {
      linkedCount,
      recentCount,
      totalCount: normalizedDevices.length,
      unassignedCount: normalizedDevices.filter((item) => !item.projectId).length,
    };
  }, [normalizedDevices]);

  const filters = useMemo(
    () => [
      { key: 'all', label: 'All', count: summary.totalCount },
      { key: 'linked', label: 'Linked', count: summary.linkedCount },
      { key: 'unassigned', label: 'Unassigned', count: summary.unassignedCount },
      { key: 'recent', label: 'Recent', count: summary.recentCount },
    ],
    [summary]
  );

  const filteredDevices = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return normalizedDevices.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        [item.deviceId, item.projectLabel, item.projectId, item.recordId]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));

      if (!matchesSearch) {
        return false;
      }

      if (activeFilter === 'linked') {
        return Boolean(item.projectId);
      }

      if (activeFilter === 'unassigned') {
        return !item.projectId;
      }

      if (activeFilter === 'recent') {
        const parsedDate = parseBackendDate(item.updatedAt);

        return (
          parsedDate &&
          Date.now() - parsedDate.getTime() <= 24 * 60 * 60 * 1000
        );
      }

      return true;
    });
  }, [activeFilter, normalizedDevices, searchTerm]);

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (!projectId) {
      nextErrors.project_id = 'Project is required.';
    }

    if (!deviceId.trim()) {
      nextErrors.device_id = 'Device ID is required.';
    }

    setRegisterErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      await dispatch(
        registerDevice({
          device_id: deviceId.trim(),
          project_id: projectId,
        })
      ).unwrap();

      setDeviceId('');
      setProjectId('');
      closeModal();
      dispatch(getAllDevices());
    } catch {
      // Slice state carries the user-facing error details.
    }
  };

  const handleUpdateSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    const recordId = selectedNormalizedDevice?.recordId;

    if (!recordId) {
      nextErrors.id = 'Select a device before updating it.';
    }

    if (!editDeviceId.trim()) {
      nextErrors.device_id = 'Device ID is required.';
    }

    setUpdateErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || !recordId) {
      return;
    }

    try {
      await dispatch(
        updateDevice({
          device_id: editDeviceId.trim(),
          id: recordId,
        })
      ).unwrap();

      closeModal();
      dispatch(getAllDevices());
    } catch {
      // Slice state carries the user-facing error details.
    }
  };

  const registerProjectError =
    registerErrors.project_id || getApiFieldError(registerDeviceError, 'project_id');
  const registerDeviceFieldError =
    registerErrors.device_id || getApiFieldError(registerDeviceError, 'device_id');
  const updateDeviceFieldError =
    updateErrors.device_id || getApiFieldError(updateDeviceError, 'device_id');
  const updateRecordError =
    updateErrors.id || getApiFieldError(updateDeviceError, 'id');

  return (
    <section className="page-section devices-page">
      <div className="page-section__header mb-4">
        <div className="page-section__heading">
          <p className="page-section__eyebrow">Fleet</p>
          <h2 className="page-section__title">Devices</h2>
          <p className="page-section__subtitle">
            {summary.totalCount} registered device
            {summary.totalCount === 1 ? '' : 's'} across your OTA fleet.
          </p>
        </div>

        <div className="page-section__actions">
          <button
            type="button"
            className="btn devices-action-btn devices-action-btn--primary"
            onClick={openRegisterModal}
          >
            Register device
          </button>
        </div>
      </div>

      {!token ? (
        <div className="alert alert-warning mb-4" role="alert">
          Devices endpoints require a bearer token. Sign in with a backend
          response that returns a token before device requests can succeed.
        </div>
      ) : null}

      <div className="surface-card devices-pulse-card mb-4">
        <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
          <div>
            <h3 className="devices-pulse-card__title">Fleet pulse</h3>
            <p className="devices-pulse-card__subtitle">
              One square per registered device, coloured by project assignment
              and recent activity.
            </p>
          </div>

          <div className="devices-pulse-card__metrics">
            <div className="devices-metric-pill">
              <span className="devices-metric-pill__value">
                {summary.linkedCount}
              </span>
              linked
            </div>
            <div className="devices-metric-pill">
              <span className="devices-metric-pill__value">
                {summary.recentCount}
              </span>
              recent
            </div>
          </div>
        </div>

        <div className="devices-pulse-grid" aria-label="Device fleet pulse">
          {normalizedDevices.length > 0 ? (
            normalizedDevices.map((item, index) => (
              <span
                key={`${item.recordId ?? item.deviceId}-${index}`}
                className={`devices-pulse-grid__dot ${getPulseTone(item)}`}
                title={`${item.deviceId} • ${item.projectLabel}`}
              />
            ))
          ) : (
            <p className="devices-pulse-grid__empty">
              Device activity squares will appear here once authenticated data is
              available.
            </p>
          )}
        </div>
      </div>

      <div className="devices-filter-bar mb-3" role="tablist" aria-label="Device filters">
        {filters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            className={`devices-filter-chip ${
              activeFilter === filter.key ? 'is-active' : ''
            }`}
            onClick={() => setActiveFilter(filter.key)}
          >
            {filter.label} ({filter.count})
          </button>
        ))}
      </div>

      {getDevicesError?.message ? (
        <div className="alert alert-warning mb-4" role="alert">
          {getDevicesError.message}
        </div>
      ) : null}

      {getDevicesLoading && normalizedDevices.length === 0 ? (
        <div className="surface-card">
          <div className="d-flex align-items-center gap-3 text-muted">
            <div className="spinner-border spinner-border-sm text-success" role="status" />
            Fetching device inventory...
          </div>
        </div>
      ) : (
        <div className="surface-card devices-table-card">
          <div className="table-responsive">
            <table className="table devices-table align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col">Device ID</th>
                  <th scope="col">Project</th>
                  <th scope="col">Record ID</th>
                  <th scope="col">Created</th>
                  <th scope="col">Updated</th>
                  <th scope="col" className="text-end">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredDevices.length > 0 ? (
                  filteredDevices.map((item) => (
                    <tr
                      key={`${item.recordId ?? item.deviceId}-${item.projectId ?? 'device'}`}
                      className={
                        selectedNormalizedDevice?.recordId === item.recordId
                          ? 'is-selected'
                          : ''
                      }
                    >
                      <td className="devices-table__device">{item.deviceId}</td>
                      <td>{item.projectLabel}</td>
                      <td>{item.recordId || 'Unavailable'}</td>
                      <td>{formatDateTime(item.createdAt)}</td>
                      <td>
                        <div className="d-flex flex-column">
                          <span>{formatDateTime(item.updatedAt)}</span>
                          <span className="devices-table__meta">
                            {formatRelativeTime(item.updatedAt)}
                          </span>
                        </div>
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm releases-action-btn"
                          onClick={() => {
                            dispatch(setSelectedDevice(item.raw));
                            openUpdateModal();
                          }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="devices-table__empty-cell">
                      <EmptyState
                        title="No device records to show"
                        description={
                          searchTerm || activeFilter !== 'all'
                            ? 'Try a different search term or filter to find the device you need.'
                            : 'Register a device to populate the fleet inventory table.'
                        }
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {openPanel === 'register' ? (
        <div className="dashboard-modal" role="presentation" onClick={closeModal}>
          <div
            className="dashboard-modal__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="register-device-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="surface-card devices-form-card dashboard-modal__card">
              <div className="dashboard-modal__header">
                <div>
                  <p className="devices-form-card__eyebrow">Register</p>
                  <h3
                    id="register-device-modal-title"
                    className="devices-form-card__title"
                  >
                    Add a new device
                  </h3>
                  <p className="devices-form-card__subtitle">
                    Attach a device record to an existing project using the
                    backend’s `project_id` and `device_id` contract.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-close dashboard-modal__close"
                  aria-label="Close"
                  onClick={closeModal}
                />
              </div>

              {registerDeviceError?.message ? (
                <div className="alert alert-danger auth-alert" role="alert">
                  {registerDeviceError.message}
                </div>
              ) : null}

              {registerDeviceSuccessMessage ? (
                <div className="alert alert-success auth-alert" role="alert">
                  {registerDeviceSuccessMessage}
                </div>
              ) : null}

              <form className="login-form mt-4" onSubmit={handleRegisterSubmit}>
                <div className="mb-3">
                  <label
                    className="form-label login-form__label"
                    htmlFor="register-device-project"
                  >
                    Project
                  </label>
                  <select
                    id="register-device-project"
                    className={`form-select login-form__input ${
                      registerProjectError ? 'is-invalid' : ''
                    }`}
                    value={projectId}
                    onChange={(event) => {
                      setProjectId(event.target.value);
                      setRegisterErrors((currentValue) => ({
                        ...currentValue,
                        project_id: '',
                      }));
                    }}
                    disabled={getProjectsLoading || projectOptions.length === 0}
                  >
                    <option value="">
                      {getProjectsLoading
                        ? 'Loading projects...'
                        : projectOptions.length > 0
                          ? 'Select a project'
                          : 'No projects available'}
                    </option>
                    {projectOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {registerProjectError ? (
                    <div className="invalid-feedback">{registerProjectError}</div>
                  ) : null}
                  {getProjectsError?.message ? (
                    <div className="form-text login-form__hint text-danger">
                      {getProjectsError.message}
                    </div>
                  ) : null}
                </div>

                <div className="mb-4">
                  <label
                    className="form-label login-form__label"
                    htmlFor="register-device-id"
                  >
                    Device ID
                  </label>
                  <input
                    id="register-device-id"
                    type="text"
                    className={`form-control login-form__input ${
                      registerDeviceFieldError ? 'is-invalid' : ''
                    }`}
                    value={deviceId}
                    onChange={(event) => {
                      setDeviceId(event.target.value);
                      setRegisterErrors((currentValue) => ({
                        ...currentValue,
                        device_id: '',
                      }));
                    }}
                    placeholder="Enter the hardware device identifier"
                  />
                  {registerDeviceFieldError ? (
                    <div className="invalid-feedback">
                      {registerDeviceFieldError}
                    </div>
                  ) : null}
                </div>

                <button
                  type="submit"
                  className="btn login-form__submit w-100"
                  disabled={registerDeviceLoading}
                >
                  {registerDeviceLoading ? 'Registering device...' : 'Register device'}
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {openPanel === 'update' ? (
        <div className="dashboard-modal" role="presentation" onClick={closeModal}>
          <div
            className="dashboard-modal__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="update-device-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="surface-card devices-form-card dashboard-modal__card">
              <div className="dashboard-modal__header">
                <div>
                  <p className="devices-form-card__eyebrow">Update</p>
                  <h3
                    id="update-device-modal-title"
                    className="devices-form-card__title"
                  >
                    Edit selected device
                  </h3>
                  <p className="devices-form-card__subtitle">
                    Choose a row in the table, then submit the updated
                    `device_id` against that record’s immutable backend `id`.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-close dashboard-modal__close"
                  aria-label="Close"
                  onClick={closeModal}
                />
              </div>

              {updateDeviceError?.message ? (
                <div className="alert alert-danger auth-alert" role="alert">
                  {updateDeviceError.message}
                </div>
              ) : null}

              {updateDeviceSuccessMessage ? (
                <div className="alert alert-success auth-alert" role="alert">
                  {updateDeviceSuccessMessage}
                </div>
              ) : null}

              {selectedNormalizedDevice ? (
                <form className="login-form mt-4" onSubmit={handleUpdateSubmit}>
                  <div className="devices-form-card__selected mb-3">
                    <p className="devices-form-card__selected-label">
                      Selected record
                    </p>
                    <p className="devices-form-card__selected-value">
                      {selectedNormalizedDevice.deviceId}
                    </p>
                    <p className="devices-form-card__selected-meta">
                      Record ID {selectedNormalizedDevice.recordId || 'Unavailable'} •{' '}
                      {selectedNormalizedDevice.projectLabel}
                    </p>
                  </div>

                  <div className="mb-4">
                    <label
                      className="form-label login-form__label"
                      htmlFor="update-device-id"
                    >
                      Device ID
                    </label>
                    <input
                      id="update-device-id"
                      type="text"
                      className={`form-control login-form__input ${
                        updateDeviceFieldError || updateRecordError
                          ? 'is-invalid'
                          : ''
                      }`}
                      value={editDeviceId}
                      onChange={(event) => {
                        setEditDeviceId(event.target.value);
                        setUpdateErrors((currentValue) => ({
                          ...currentValue,
                          device_id: '',
                          id: '',
                        }));
                      }}
                      placeholder="Update the device identifier"
                    />
                    {updateDeviceFieldError || updateRecordError ? (
                      <div className="invalid-feedback d-block">
                        {updateDeviceFieldError || updateRecordError}
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="submit"
                    className="btn login-form__submit w-100"
                    disabled={updateDeviceLoading}
                  >
                    {updateDeviceLoading ? 'Updating device...' : 'Update device'}
                  </button>
                </form>
              ) : (
                <div className="devices-form-card__empty">
                  Select a device from the table below to edit its `device_id`.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default DevicesPage;
