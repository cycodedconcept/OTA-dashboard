import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import UploadDropzone from '../components/common/UploadDropzone';
import {
  createFirmwareApi,
  getOtaDevicesApi,
  uploadFirmwareApi,
} from '../api/firmwareApi';
import { getAllDevices } from '../redux/slices/devicesSlice';
import { getProjects } from '../redux/slices/projectsSlice';
import { buildPageUrl } from '../utils/appRoutes';
import {
  extractCollection,
  extractPagination,
  pickFirstDefined,
} from '../utils/apiData';
import {
  getApiSuccessMessage,
  toSerializableApiError,
} from '../utils/apiErrors';
import { hasValue } from '../utils/formValidation';

const firmwareTabs = [
  { key: 'create', label: 'Create Firmware', icon: 'bi-file-earmark-plus' },
  { key: 'upload', label: 'Upload Firmware', icon: 'bi-cloud-arrow-up' },
  { key: 'otaDevices', label: 'OTA Devices', icon: 'bi-hdd-network' },
];

const preferredOtaColumns = [
  'source_id',
  'mcu_id',
  'device_id',
  'imei',
  'device_ime',
];

const defaultFirmwareTab = 'otaDevices';

const validTabKeys = new Set(firmwareTabs.map((tab) => tab.key));

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

function formatColumnLabel(columnKey) {
  return columnKey
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (character) => character.toUpperCase());
}

function stringifyValue(value) {
  if (!hasValue(value)) {
    return '—';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? JSON.stringify(value) : '—';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

function truncateText(value, maxLength = 84) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

function parseDeviceIdsInput(value) {
  return [...new Set(
    String(value ?? '')
      .split(/[\n,]+/)
      .map((entry) => entry.trim())
      .filter(Boolean)
  )];
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

function getDeviceIdentifier(device) {
  return pickFirstDefined(device, ['device_id', 'id']);
}

function getDeviceProjectId(device) {
  return pickFirstDefined(device, ['project_id']);
}

function buildProjectOptions(projects) {
  const options = new Map();

  projects.forEach((project) => {
    const projectId = getProjectIdentity(project);

    if (!hasValue(projectId)) {
      return;
    }

    options.set(String(projectId), {
      label: getProjectName(project),
      value: String(projectId),
    });
  });

  return [...options.values()];
}

function buildDeviceOptions(devices, projectNameMap) {
  const options = new Map();

  devices.forEach((device) => {
    const deviceId = getDeviceIdentifier(device);

    if (!hasValue(deviceId)) {
      return;
    }

    const projectId = getDeviceProjectId(device);
    const projectLabel = hasValue(projectId)
      ? projectNameMap.get(String(projectId)) ?? `Project #${projectId}`
      : 'Unassigned';

    options.set(String(deviceId), {
      label: String(deviceId),
      projectId: hasValue(projectId) ? String(projectId) : null,
      projectLabel,
      updatedAt: pickFirstDefined(device, ['updated_at', 'created_at']),
      value: String(deviceId),
    });
  });

  return [...options.values()];
}

function getOtaTableColumns(items) {
  const firstRecord = items.find(
    (item) => item && typeof item === 'object' && !Array.isArray(item)
  );

  if (!firstRecord) {
    return [];
  }

  const recordKeys = Object.keys(firstRecord);
  const prioritizedColumns = preferredOtaColumns.filter((column) =>
    recordKeys.includes(column)
  );
  const remainingColumns = recordKeys.filter(
    (column) => !prioritizedColumns.includes(column)
  );

  return [...prioritizedColumns, ...remainingColumns];
}

function readFirmwareLocationState() {
  if (typeof window === 'undefined') {
    return {
      page: 1,
      tab: defaultFirmwareTab,
    };
  }

  const params = new URLSearchParams(window.location.search);
  const pageValue = Number.parseInt(params.get('page'), 10);
  const nextTab = params.get('tab');

  return {
    page: Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1,
    tab: validTabKeys.has(nextTab) ? nextTab : defaultFirmwareTab,
  };
}

function updateFirmwareLocation(tab, page, replace = false) {
  if (typeof window === 'undefined') {
    return;
  }

  const params = new URLSearchParams(window.location.search);

  params.set('tab', tab);

  if (tab === 'otaDevices') {
    params.set('page', String(page));
  } else {
    params.delete('page');
  }

  const nextUrl = buildPageUrl('firmware', params);

  window.history[replace ? 'replaceState' : 'pushState']({}, '', nextUrl);
}

function downloadBlobFile(file, filename) {
  const objectUrl = URL.createObjectURL(file);
  const anchor = document.createElement('a');

  anchor.href = objectUrl;
  anchor.download = filename || `firmware-${Date.now()}.bin`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 0);
}

function FirmwarePage() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.admin.token);
  const projectItems = useSelector((state) => state.projects.items);
  const deviceItems = useSelector((state) => state.devices.items);
  const [locationState, setLocationState] = useState(() =>
    readFirmwareLocationState()
  );
  const [createForm, setCreateForm] = useState({
    deviceId: '',
    projectId: '',
  });
  const [createErrors, setCreateErrors] = useState({});
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccessMessage, setCreateSuccessMessage] = useState('');
  const [uploadForm, setUploadForm] = useState({
    CRC: '',
    files: [],
    manualDeviceIds: '',
    projectId: '',
    selectedDeviceIds: [],
    version: '',
  });
  const [uploadErrors, setUploadErrors] = useState({});
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState('');
  const [otaRefreshKey, setOtaRefreshKey] = useState(0);
  const [otaState, setOtaState] = useState({
    error: null,
    items: [],
    loading: false,
    pagination: {
      currentPage: 1,
      lastPage: 1,
      perPage: null,
      total: null,
    },
  });

  useEffect(() => {
    dispatch(getProjects());
    dispatch(getAllDevices());
  }, [dispatch]);

  useEffect(() => {
    const syncLocationState = () => {
      setLocationState(readFirmwareLocationState());
    };

    syncLocationState();
    window.addEventListener('popstate', syncLocationState);

    return () => {
      window.removeEventListener('popstate', syncLocationState);
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadOtaDevices() {
      setOtaState((currentValue) => ({
        ...currentValue,
        error: null,
        loading: true,
      }));

      try {
        const payload = await getOtaDevicesApi(locationState.page);
        const items = extractCollection(payload, ['data']);
        const pagination = extractPagination(payload, locationState.page);

        if (isCancelled) {
          return;
        }

        setOtaState({
          error: null,
          items,
          loading: false,
          pagination,
        });
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setOtaState((currentValue) => ({
          ...currentValue,
          error: toSerializableApiError(error, 'Unable to retrieve OTA devices.'),
          loading: false,
        }));
      }
    }

    loadOtaDevices();

    return () => {
      isCancelled = true;
    };
  }, [locationState.page, otaRefreshKey, token]);

  const projectOptions = useMemo(
    () => buildProjectOptions(projectItems),
    [projectItems]
  );

  const projectNameMap = useMemo(() => {
    const nextMap = new Map();

    projectOptions.forEach((project) => {
      nextMap.set(project.value, project.label);
    });

    return nextMap;
  }, [projectOptions]);

  const deviceOptions = useMemo(
    () => buildDeviceOptions(deviceItems, projectNameMap),
    [deviceItems, projectNameMap]
  );

  const deviceOptionsById = useMemo(() => {
    const nextMap = new Map();

    deviceOptions.forEach((device) => {
      nextMap.set(device.value, device);
    });

    return nextMap;
  }, [deviceOptions]);

  const manualUploadDeviceIds = useMemo(
    () => parseDeviceIdsInput(uploadForm.manualDeviceIds),
    [uploadForm.manualDeviceIds]
  );

  const selectedUploadDeviceIds = useMemo(
    () =>
      [...new Set([...uploadForm.selectedDeviceIds, ...manualUploadDeviceIds])].sort(
        (leftDeviceId, rightDeviceId) => leftDeviceId.localeCompare(rightDeviceId)
      ),
    [manualUploadDeviceIds, uploadForm.selectedDeviceIds]
  );

  const selectedProject = projectOptions.find(
    (project) => project.value === createForm.projectId
  );
  const selectedDevice = deviceOptionsById.get(createForm.deviceId) ?? null;
  const uploadProject = projectOptions.find(
    (project) => project.value === uploadForm.projectId
  );
  const otaColumns = useMemo(() => getOtaTableColumns(otaState.items), [otaState.items]);

  function handleTabChange(tabKey) {
    setLocationState((currentValue) => ({
      ...currentValue,
      tab: tabKey,
    }));
    updateFirmwareLocation(tabKey, locationState.page, false);
  }

  function handleOtaPageChange(nextPage) {
    setLocationState({
      page: nextPage,
      tab: 'otaDevices',
    });
    updateFirmwareLocation('otaDevices', nextPage, false);
  }

  function toggleDeviceSelection(deviceId) {
    setUploadForm((currentValue) => {
      const nextSelectedDeviceIds = currentValue.selectedDeviceIds.includes(deviceId)
        ? currentValue.selectedDeviceIds.filter(
            (selectedDeviceId) => selectedDeviceId !== deviceId
          )
        : [...currentValue.selectedDeviceIds, deviceId];

      return {
        ...currentValue,
        selectedDeviceIds: nextSelectedDeviceIds,
      };
    });
    setUploadErrors((currentValue) => ({
      ...currentValue,
      deviceIds: '',
    }));
  }

  function handleCreateInputChange(fieldName, value) {
    setCreateForm((currentValue) => ({
      ...currentValue,
      [fieldName]: value,
    }));
    setCreateErrors((currentValue) => ({
      ...currentValue,
      [fieldName]: '',
    }));
    setCreateError(null);
    setCreateSuccessMessage('');
  }

  function handleUploadInputChange(fieldName, value) {
    setUploadForm((currentValue) => ({
      ...currentValue,
      [fieldName]: value,
    }));
    setUploadErrors((currentValue) => ({
      ...currentValue,
      [fieldName]: '',
    }));
    setUploadError(null);
    setUploadSuccessMessage('');
  }

  async function handleCreateSubmit(event) {
    event.preventDefault();

    const nextErrors = {};

    if (!createForm.projectId.trim()) {
      nextErrors.projectId = 'Project ID is required.';
    }

    if (!createForm.deviceId.trim()) {
      nextErrors.deviceId = 'Device ID is required.';
    }

    setCreateErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setCreateLoading(true);
    setCreateError(null);
    setCreateSuccessMessage('');

    try {
      const response = await createFirmwareApi({
        device_id: createForm.deviceId.trim(),
        project_id: createForm.projectId.trim(),
      });

      if (response?.file instanceof Blob) {
        downloadBlobFile(response.file, response.filename);
        setCreateSuccessMessage(
          response.message || 'Firmware file is ready and the download has started.'
        );
      } else {
        setCreateSuccessMessage(
          getApiSuccessMessage(response, 'Firmware request completed successfully.')
        );
      }

      setOtaRefreshKey((currentValue) => currentValue + 1);
    } catch (error) {
      setCreateError(toSerializableApiError(error, 'Unable to create firmware.'));
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleUploadSubmit(event) {
    event.preventDefault();

    const nextErrors = {};

    if (!uploadForm.projectId.trim()) {
      nextErrors.projectId = 'Project ID is required.';
    }

    if (!uploadForm.version.trim()) {
      nextErrors.version = 'Firmware version is required.';
    }

    if (!uploadForm.CRC.trim()) {
      nextErrors.CRC = 'CRC is required.';
    }

    if (uploadForm.files.length === 0) {
      nextErrors.files = 'Select at least one firmware file.';
    }

    if (selectedUploadDeviceIds.length === 0) {
      nextErrors.deviceIds = 'Select or enter at least one device ID.';
    }

    setUploadErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setUploadLoading(true);
    setUploadError(null);
    setUploadProgress(0);
    setUploadSuccessMessage('');

    try {
      const response = await uploadFirmwareApi(
        {
          CRC: uploadForm.CRC.trim(),
          deviceIds: selectedUploadDeviceIds,
          files: uploadForm.files,
          project_id: uploadForm.projectId.trim(),
          version: uploadForm.version.trim(),
        },
        (progressEvent) => {
          if (progressEvent.lengthComputable) {
            setUploadProgress(progressEvent.percent ?? 0);
          } else {
            setUploadProgress(null);
          }
        }
      );

      setUploadSuccessMessage(
        getApiSuccessMessage(response, 'Firmware uploaded successfully.')
      );
      setUploadForm({
        CRC: '',
        files: [],
        manualDeviceIds: '',
        projectId: '',
        selectedDeviceIds: [],
        version: '',
      });
      setUploadErrors({});
      setOtaRefreshKey((currentValue) => currentValue + 1);
    } catch (error) {
      setUploadError(toSerializableApiError(error, 'Unable to upload firmware.'));
    } finally {
      setUploadLoading(false);
    }
  }

  const createProjectFieldError = createErrors.projectId;
  const createDeviceFieldError = createErrors.deviceId;
  const uploadProjectFieldError = uploadErrors.projectId;
  const uploadVersionFieldError = uploadErrors.version;
  const uploadCrcFieldError = uploadErrors.CRC;
  const uploadFilesFieldError = uploadErrors.files;
  const uploadDeviceFieldError = uploadErrors.deviceIds;

  return (
    <section className="page-section firmware-page">
      <div className="page-section__header mb-4">
        <div className="page-section__heading">
          <p className="page-section__eyebrow">Firmware</p>
          <h2 className="page-section__title">Firmware</h2>
          <p className="page-section__subtitle">
            Generate files, upload binaries, and review OTA device records from
            one workspace.
          </p>
        </div>

        <div className="page-section__actions">
          <div className="devices-metric-pill">
            <span className="devices-metric-pill__value">{projectOptions.length}</span>
            projects
          </div>
          <div className="devices-metric-pill">
            <span className="devices-metric-pill__value">{deviceOptions.length}</span>
            devices
          </div>
          <div className="devices-metric-pill">
            <span className="devices-metric-pill__value">
              {otaState.pagination.total ?? otaState.items.length}
            </span>
            OTA rows
          </div>
        </div>
      </div>

      {!token ? (
        <div className="alert alert-warning mb-4" role="alert">
          Firmware endpoints require a bearer token. Sign in with a valid token
          response before running firmware or OTA device requests.
        </div>
      ) : null}

      <div className="firmware-tabs mb-4" role="tablist" aria-label="Firmware sections">
        {firmwareTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`btn devices-action-btn firmware-tabs__button ${
              locationState.tab === tab.key ? 'is-active' : ''
            }`}
            role="tab"
            aria-selected={locationState.tab === tab.key}
            onClick={() => handleTabChange(tab.key)}
          >
            <span className="firmware-tabs__button-content">
              <i className={`bi ${tab.icon} firmware-tabs__icon`} aria-hidden="true" />
              <span>{tab.label}</span>
            </span>
          </button>
        ))}
      </div>

      {locationState.tab === 'create' ? (
        <div className="surface-card devices-form-card">
          <div className="mb-4">
            <p className="devices-form-card__eyebrow">Create</p>
            <h3 className="devices-form-card__title">Create firmware file</h3>
            <p className="devices-form-card__subtitle">
              Submit a `project_id` and `device_id` to request a firmware file
              from the existing OTA backend.
            </p>
          </div>

          {createError?.message ? (
            <div className="alert alert-danger auth-alert" role="alert">
              {createError.message}
            </div>
          ) : null}

          {createSuccessMessage ? (
            <div className="alert alert-success auth-alert" role="alert">
              {createSuccessMessage}
            </div>
          ) : null}

          <form className="row g-4" onSubmit={handleCreateSubmit}>
            <div className="col-12 col-lg-6">
              <label
                className="form-label login-form__label"
                htmlFor="firmware-create-project"
              >
                Project ID
              </label>
              <input
                id="firmware-create-project"
                list="firmware-project-options"
                type="text"
                className={`form-control login-form__input ${
                  createProjectFieldError ? 'is-invalid' : ''
                }`}
                value={createForm.projectId}
                onChange={(event) =>
                  handleCreateInputChange('projectId', event.target.value)
                }
                placeholder="Select or enter a project ID"
              />
              <datalist id="firmware-project-options">
                {projectOptions.map((project) => (
                  <option key={project.value} value={project.value}>
                    {project.label}
                  </option>
                ))}
              </datalist>
              {createProjectFieldError ? (
                <div className="invalid-feedback">{createProjectFieldError}</div>
              ) : null}
            </div>

            <div className="col-12 col-lg-6">
              <label
                className="form-label login-form__label"
                htmlFor="firmware-create-device"
              >
                Device ID
              </label>
              <input
                id="firmware-create-device"
                list="firmware-device-options"
                type="text"
                className={`form-control login-form__input ${
                  createDeviceFieldError ? 'is-invalid' : ''
                }`}
                value={createForm.deviceId}
                onChange={(event) =>
                  handleCreateInputChange('deviceId', event.target.value)
                }
                placeholder="Select or enter a device ID"
              />
              <datalist id="firmware-device-options">
                {deviceOptions.map((device) => (
                  <option key={device.value} value={device.value}>
                    {device.projectLabel}
                  </option>
                ))}
              </datalist>
              {createDeviceFieldError ? (
                <div className="invalid-feedback">{createDeviceFieldError}</div>
              ) : null}
            </div>

            <div className="col-12">
              <div className="row g-3">
                <div className="col-12 col-lg-6">
                  <div className="devices-form-card__selected h-100">
                    <p className="devices-form-card__selected-label">
                      Matched project
                    </p>
                    <p className="devices-form-card__selected-value">
                      {selectedProject?.label || 'No matching project yet'}
                    </p>
                    <p className="devices-form-card__selected-meta">
                      Project ID {createForm.projectId.trim() || '—'}
                    </p>
                  </div>
                </div>

                <div className="col-12 col-lg-6">
                  <div className="devices-form-card__selected h-100">
                    <p className="devices-form-card__selected-label">
                      Matched device
                    </p>
                    <p className="devices-form-card__selected-value">
                      {selectedDevice?.label || 'No matching device yet'}
                    </p>
                    <p className="devices-form-card__selected-meta">
                      {selectedDevice?.projectLabel || 'Project assignment unavailable'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12">
              <button
                type="submit"
                className="btn login-form__submit"
                disabled={createLoading}
              >
                {createLoading ? 'Creating firmware...' : 'Create firmware'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {locationState.tab === 'upload' ? (
        <div className="surface-card devices-form-card">
          <div className="mb-4">
            <p className="devices-form-card__eyebrow">Upload</p>
            <h3 className="devices-form-card__title">Upload firmware package</h3>
            <p className="devices-form-card__subtitle">
              Attach one or more files, target a project, select multiple device
              IDs, and submit the version plus CRC in one multipart request.
            </p>
          </div>

          {uploadError?.message ? (
            <div className="alert alert-danger auth-alert" role="alert">
              {uploadError.message}
            </div>
          ) : null}

          {uploadSuccessMessage ? (
            <div className="alert alert-success auth-alert" role="alert">
              {uploadSuccessMessage}
            </div>
          ) : null}

          <form className="row g-4" onSubmit={handleUploadSubmit}>
            <div className="col-12 col-xl-6">
              <UploadDropzone
                accept=".bin,.hex,.zip,.img,.fw"
                disabled={uploadLoading}
                files={uploadForm.files}
                helperText="Every selected file is appended with the key `files[]`."
                inputId="firmware-upload-files"
                label="Firmware files"
                multiple
                onChange={(event) => {
                  handleUploadInputChange(
                    'files',
                    [...(event.target.files ?? [])]
                  );
                }}
                title="Choose one or more firmware files"
              />
              {uploadFilesFieldError ? (
                <div className="invalid-feedback d-block">
                  {uploadFilesFieldError}
                </div>
              ) : null}
            </div>

            <div className="col-12 col-xl-6">
              <div className="row g-3">
                <div className="col-12">
                  <label
                    className="form-label login-form__label"
                    htmlFor="firmware-upload-project"
                  >
                    Project ID
                  </label>
                  <input
                    id="firmware-upload-project"
                    list="firmware-upload-project-options"
                    type="text"
                    className={`form-control login-form__input ${
                      uploadProjectFieldError ? 'is-invalid' : ''
                    }`}
                    value={uploadForm.projectId}
                    onChange={(event) =>
                      handleUploadInputChange('projectId', event.target.value)
                    }
                    placeholder="Select or enter a project ID"
                  />
                  <datalist id="firmware-upload-project-options">
                    {projectOptions.map((project) => (
                      <option key={project.value} value={project.value}>
                        {project.label}
                      </option>
                    ))}
                  </datalist>
                  {uploadProjectFieldError ? (
                    <div className="invalid-feedback">
                      {uploadProjectFieldError}
                    </div>
                  ) : null}
                </div>

                <div className="col-12 col-sm-6">
                  <label
                    className="form-label login-form__label"
                    htmlFor="firmware-upload-version"
                  >
                    Version
                  </label>
                  <input
                    id="firmware-upload-version"
                    type="text"
                    className={`form-control login-form__input ${
                      uploadVersionFieldError ? 'is-invalid' : ''
                    }`}
                    value={uploadForm.version}
                    onChange={(event) =>
                      handleUploadInputChange('version', event.target.value)
                    }
                    placeholder="e.g. 1.0.7"
                  />
                  {uploadVersionFieldError ? (
                    <div className="invalid-feedback">
                      {uploadVersionFieldError}
                    </div>
                  ) : null}
                </div>

                <div className="col-12 col-sm-6">
                  <label
                    className="form-label login-form__label"
                    htmlFor="firmware-upload-crc"
                  >
                    CRC
                  </label>
                  <input
                    id="firmware-upload-crc"
                    type="text"
                    className={`form-control login-form__input ${
                      uploadCrcFieldError ? 'is-invalid' : ''
                    }`}
                    value={uploadForm.CRC}
                    onChange={(event) =>
                      handleUploadInputChange('CRC', event.target.value)
                    }
                    placeholder="Enter the CRC value"
                  />
                  {uploadCrcFieldError ? (
                    <div className="invalid-feedback">{uploadCrcFieldError}</div>
                  ) : null}
                </div>

                <div className="col-12">
                  <div className="devices-form-card__selected h-100">
                    <p className="devices-form-card__selected-label">
                      Selected project
                    </p>
                    <p className="devices-form-card__selected-value">
                      {uploadProject?.label || 'No matching project yet'}
                    </p>
                    <p className="devices-form-card__selected-meta">
                      Project ID {uploadForm.projectId.trim() || '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-xl-5">
              <label
                className="form-label login-form__label"
                htmlFor="firmware-upload-manual-devices"
              >
                Additional device IDs
              </label>
              <textarea
                id="firmware-upload-manual-devices"
                className="form-control login-form__input firmware-textarea"
                value={uploadForm.manualDeviceIds}
                onChange={(event) =>
                  handleUploadInputChange('manualDeviceIds', event.target.value)
                }
                placeholder="Enter device IDs separated by commas or new lines"
                rows="6"
              />
              <p className="devices-form-card__subtitle mt-2">
                Every listed value is appended separately with the key
                `device_id[]`.
              </p>
            </div>

            <div className="col-12 col-xl-7">
              <div className="firmware-device-picker">
                <div className="firmware-device-picker__header">
                  <div>
                    <p className="devices-form-card__selected-label mb-0">
                      Available device IDs
                    </p>
                    <p className="devices-form-card__selected-meta mt-2">
                      Select from the current device registry or add more IDs
                      manually.
                    </p>
                  </div>

                  <div className="devices-action-bar">
                    <button
                      type="button"
                      className="btn releases-action-btn"
                      onClick={() =>
                        setUploadForm((currentValue) => ({
                          ...currentValue,
                          selectedDeviceIds: deviceOptions.map(
                            (device) => device.value
                          ),
                        }))
                      }
                      disabled={uploadLoading || deviceOptions.length === 0}
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      className="btn releases-action-btn"
                      onClick={() =>
                        setUploadForm((currentValue) => ({
                          ...currentValue,
                          selectedDeviceIds: [],
                        }))
                      }
                      disabled={
                        uploadLoading || uploadForm.selectedDeviceIds.length === 0
                      }
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {deviceOptions.length > 0 ? (
                  <div className="firmware-device-picker__list">
                    {deviceOptions.map((device) => {
                      const isSelected = uploadForm.selectedDeviceIds.includes(
                        device.value
                      );

                      return (
                        <label
                          key={device.value}
                          className={`firmware-device-picker__option ${
                            isSelected ? 'is-selected' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="form-check-input mt-0"
                            checked={isSelected}
                            onChange={() => toggleDeviceSelection(device.value)}
                            disabled={uploadLoading}
                          />

                          <div>
                            <p className="firmware-device-picker__value">
                              {device.value}
                            </p>
                            <p className="firmware-device-picker__meta">
                              {device.projectLabel}
                              {device.updatedAt
                                ? ` • Updated ${formatDateTime(device.updatedAt)}`
                                : ''}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="devices-form-card__empty">
                    Registered device IDs will appear here after the existing
                    device list loads.
                  </p>
                )}
              </div>

              {uploadDeviceFieldError ? (
                <div className="invalid-feedback d-block mt-2">
                  {uploadDeviceFieldError}
                </div>
              ) : null}
            </div>

            <div className="col-12">
              <div className="devices-form-card__selected">
                <p className="devices-form-card__selected-label">
                  Selected device IDs ({selectedUploadDeviceIds.length})
                </p>
                {selectedUploadDeviceIds.length > 0 ? (
                  <div className="firmware-selection-chips">
                    {selectedUploadDeviceIds.map((deviceId) => (
                      <span key={deviceId} className="devices-metric-pill">
                        {deviceId}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="devices-form-card__selected-meta mt-2">
                    No device IDs selected yet.
                  </p>
                )}
              </div>
            </div>

            <div className="col-12">
              {uploadLoading ? (
                <div className="firmware-progress mb-3" role="status" aria-live="polite">
                  <div className="firmware-progress__track">
                    <div
                      className="firmware-progress__fill"
                      style={{
                        width:
                          uploadProgress === null
                            ? '100%'
                            : `${Math.min(Math.max(uploadProgress, 0), 100)}%`,
                      }}
                    />
                  </div>
                  <p className="firmware-progress__label">
                    {uploadProgress === null
                      ? 'Uploading firmware...'
                      : `Uploading firmware... ${uploadProgress}%`}
                  </p>
                </div>
              ) : null}

              <button
                type="submit"
                className="btn login-form__submit"
                disabled={uploadLoading}
              >
                {uploadLoading ? 'Uploading firmware...' : 'Upload firmware'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {locationState.tab === 'otaDevices' ? (
        <div className="surface-card devices-table-card">
          <div className="firmware-ota-card__header">
            <div>
              <p className="devices-form-card__eyebrow">Inventory</p>
              <h3 className="devices-form-card__title">OTA Devices</h3>
              <p className="devices-form-card__subtitle">
                Table columns are generated from the actual response keys
                returned by the OTA devices endpoint.
              </p>
            </div>

            <div className="firmware-ota-card__summary">
              <div className="devices-metric-pill">
                <span className="devices-metric-pill__value">
                  {otaState.pagination.currentPage}
                </span>
                current page
              </div>
              <div className="devices-metric-pill">
                <span className="devices-metric-pill__value">
                  {otaState.pagination.lastPage}
                </span>
                last page
              </div>
              {otaState.pagination.perPage ? (
                <div className="devices-metric-pill">
                  <span className="devices-metric-pill__value">
                    {otaState.pagination.perPage}
                  </span>
                  per page
                </div>
              ) : null}
            </div>
          </div>

          {otaState.error?.message ? (
            <div className="alert alert-warning mx-3 mt-3 mb-0" role="alert">
              {otaState.error.message}
            </div>
          ) : null}

          {otaState.loading && otaState.items.length === 0 ? (
            <div className="p-4">
              <div className="d-flex align-items-center gap-3 text-muted">
                <div
                  className="spinner-border spinner-border-sm text-success"
                  role="status"
                />
                Fetching OTA devices...
              </div>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table devices-table align-middle mb-0">
                  <thead>
                    <tr>
                      {otaColumns.length > 0 ? (
                        otaColumns.map((column) => (
                          <th key={column} scope="col">
                            {formatColumnLabel(column)}
                          </th>
                        ))
                      ) : (
                        <th scope="col">No data</th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {otaState.items.length > 0 ? (
                      otaState.items.map((item, index) => (
                        <tr
                          key={`ota-row-${
                            pickFirstDefined(item, ['id', 'device_id', 'ota_device_id']) ??
                            index
                          }`}
                        >
                          {otaColumns.map((column) => {
                            const value = stringifyValue(item?.[column]);
                            const displayValue = truncateText(value);

                            return (
                              <td
                                key={column}
                                className={/(_id|^id$)/i.test(column) ? 'devices-table__device' : ''}
                                title={value !== '—' ? value : undefined}
                              >
                                {displayValue}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={Math.max(otaColumns.length, 1)}
                          className="devices-table__empty-cell"
                        >
                          <EmptyState
                            title="No OTA devices to display"
                            description="Authenticated OTA device records will appear here when the endpoint returns data for the selected page."
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="firmware-ota-card__footer">
                {otaState.loading && otaState.items.length > 0 ? (
                  <div className="d-flex align-items-center gap-2 text-muted">
                    <div
                      className="spinner-border spinner-border-sm text-success"
                      role="status"
                    />
                    Refreshing OTA devices...
                  </div>
                ) : (
                  <span className="devices-form-card__selected-meta">
                    Page {otaState.pagination.currentPage} of{' '}
                    {otaState.pagination.lastPage}
                    {otaState.pagination.total
                      ? ` • ${otaState.pagination.total} total records`
                      : ''}
                  </span>
                )}

                <Pagination
                  currentPage={otaState.pagination.currentPage}
                  lastPage={otaState.pagination.lastPage}
                  onPageChange={handleOtaPageChange}
                  isLoading={otaState.loading}
                />
              </div>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}

export default FirmwarePage;
