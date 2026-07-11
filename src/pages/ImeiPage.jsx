import { useEffect, useMemo, useState } from 'react';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';
import StatusBadge from '../components/common/StatusBadge';
import { createImeiApi, getImeiRecordsApi } from '../api/imeiApi';
import { extractCollection, extractPagination } from '../utils/apiData';
import {
  getApiFieldError,
  getApiSuccessMessage,
  toSerializableApiError,
} from '../utils/apiErrors';
import { hasValue, isValidImei } from '../utils/formValidation';

const imeiTabs = [
  { key: 'records', label: 'IMEI Records', icon: 'bi-table' },
  { key: 'create', label: 'Create IMEI', icon: 'bi-plus-square' },
];

const preferredRecordColumns = [
  'id',
  'imei',
  'mcu_id',
  'overall_result',
  'sim_reg',
  'gps',
  'timestamp',
];

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

function getRecordColumns(items) {
  const firstRecord = items.find(
    (item) => item && typeof item === 'object' && !Array.isArray(item)
  );

  if (!firstRecord) {
    return [];
  }

  const recordKeys = Object.keys(firstRecord);
  const prioritizedColumns = preferredRecordColumns.filter((column) =>
    recordKeys.includes(column)
  );

  return prioritizedColumns.length > 0 ? prioritizedColumns : recordKeys;
}

function getStatusMeta(value) {
  const normalizedValue = String(value ?? '').trim().toUpperCase();

  if (normalizedValue === 'PASSED') {
    return {
      label: 'Passed',
      variant: 'production',
    };
  }

  if (normalizedValue === 'FAILED') {
    return {
      label: 'Failed',
      variant: 'archived',
    };
  }

  return {
    label: normalizedValue || 'Pending',
    variant: 'staging',
  };
}

function getBinaryFlagMeta(value) {
  const normalizedValue = String(value ?? '').trim();

  if (normalizedValue === '1') {
    return {
      label: 'Yes',
      variant: 'production',
    };
  }

  if (normalizedValue === '0') {
    return {
      label: 'No',
      variant: 'archived',
    };
  }

  return {
    label: 'Pending',
    variant: 'staging',
  };
}

function renderRecordCell(record, columnKey) {
  const value = record?.[columnKey];

  if (columnKey === 'overall_result') {
    const status = getStatusMeta(value);

    return <StatusBadge label={status.label} variant={status.variant} />;
  }

  if (columnKey === 'sim_reg' || columnKey === 'gps') {
    const status = getBinaryFlagMeta(value);

    return <StatusBadge label={status.label} variant={status.variant} />;
  }

  if (columnKey === 'timestamp') {
    return formatDateTime(value);
  }

  return hasValue(value) ? String(value) : '—';
}

function formatColumnLabel(columnKey) {
  const labels = {
    id: 'Record ID',
    imei: 'IMEI',
    mcu_id: 'MCU ID',
    overall_result: 'Status',
    sim_reg: 'SIM Reg',
    gps: 'GPS',
    timestamp: 'Date Created',
  };

  return labels[columnKey] ?? columnKey.replace(/_/g, ' ');
}

function ImeiPage() {
  const [activeTab, setActiveTab] = useState('records');
  const [formValues, setFormValues] = useState({
    imei: '',
    mcuId: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [createError, setCreateError] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createSuccessMessage, setCreateSuccessMessage] = useState('');
  const [recordsState, setRecordsState] = useState({
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

  async function loadRecords(page = recordsState.pagination.currentPage) {
    setRecordsState((currentValue) => ({
      ...currentValue,
      error: null,
      loading: true,
    }));

    try {
      const payload = await getImeiRecordsApi(page);
      const items = extractCollection(payload, ['data']);
      const pagination = extractPagination(payload, page);

      setRecordsState({
        error: null,
        items,
        loading: false,
        pagination,
      });
    } catch (error) {
      setRecordsState((currentValue) => ({
        ...currentValue,
        error: toSerializableApiError(error, 'Unable to retrieve IMEI records.'),
        loading: false,
      }));
    }
  }

  useEffect(() => {
    loadRecords(1);
  }, []);

  const recordColumns = useMemo(
    () => getRecordColumns(recordsState.items),
    [recordsState.items]
  );

  const summary = useMemo(() => {
    const passedCount = recordsState.items.filter(
      (item) => String(item?.overall_result ?? '').trim().toUpperCase() === 'PASSED'
    ).length;
    const failedCount = recordsState.items.filter(
      (item) => String(item?.overall_result ?? '').trim().toUpperCase() === 'FAILED'
    ).length;

    return {
      failedCount,
      passedCount,
      recordCount: recordsState.items.length,
      totalCount: recordsState.pagination.total ?? recordsState.items.length,
    };
  }, [recordsState.items, recordsState.pagination.total]);

  async function handleCreateSubmit(event) {
    event.preventDefault();

    const nextErrors = {};
    const normalizedImei = formValues.imei.trim();
    const normalizedMcuId = formValues.mcuId.trim();

    if (!normalizedImei) {
      nextErrors.imei = 'IMEI is required.';
    } else if (!isValidImei(normalizedImei)) {
      nextErrors.imei = 'IMEI must contain only numeric characters.';
    }

    if (!normalizedMcuId) {
      nextErrors.mcuId = 'MCU ID is required.';
    }

    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setCreateLoading(true);
    setCreateError(null);
    setCreateSuccessMessage('');

    try {
      const response = await createImeiApi({
        imei: normalizedImei,
        mcu_id: normalizedMcuId,
      });

      setCreateSuccessMessage(
        getApiSuccessMessage(response, 'IMEI record created successfully.')
      );
      setFormValues({
        imei: '',
        mcuId: '',
      });
      setFormErrors({});
      await loadRecords(1);
    } catch (error) {
      setCreateError(toSerializableApiError(error, 'Unable to create IMEI record.'));
    } finally {
      setCreateLoading(false);
    }
  }

  function handleInputChange(fieldName, value) {
    setFormValues((currentValue) => ({
      ...currentValue,
      [fieldName]: value,
    }));
    setFormErrors((currentValue) => ({
      ...currentValue,
      [fieldName]: '',
    }));
    setCreateError(null);
    setCreateSuccessMessage('');
  }

  const imeiFieldError =
    formErrors.imei || getApiFieldError(createError, 'imei');
  const mcuIdFieldError =
    formErrors.mcuId || getApiFieldError(createError, 'mcu_id');

  return (
    <section className="page-section imei-page">
      <div className="page-section__header mb-4">
        <div className="page-section__heading">
          <p className="page-section__eyebrow">Identity</p>
          <h2 className="page-section__title">IMEI</h2>
          <p className="page-section__subtitle">
            Create IMEI to MCU mappings and review recorded hardware test results.
          </p>
        </div>

        <div className="page-section__actions">
          <div className="devices-metric-pill">
            <span className="devices-metric-pill__value">{summary.totalCount}</span>
            total records
          </div>
          <div className="devices-metric-pill">
            <span className="devices-metric-pill__value">{summary.passedCount}</span>
            passed
          </div>
          <div className="devices-metric-pill">
            <span className="devices-metric-pill__value">{summary.failedCount}</span>
            failed
          </div>
        </div>
      </div>

      <div className="firmware-tabs mb-4" role="tablist" aria-label="IMEI sections">
        {imeiTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`btn devices-action-btn firmware-tabs__button ${
              activeTab === tab.key ? 'is-active' : ''
            }`}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="firmware-tabs__button-content">
              <i className={`bi ${tab.icon} firmware-tabs__icon`} aria-hidden="true" />
              <span>{tab.label}</span>
            </span>
          </button>
        ))}
      </div>

      {activeTab === 'create' ? (
        <div className="surface-card devices-form-card">
          <div className="mb-4">
            <p className="devices-form-card__eyebrow">Create</p>
            <h3 className="devices-form-card__title">Create IMEI record</h3>
            <p className="devices-form-card__subtitle">
              Submit a numeric IMEI value and its MCU ID using the existing OTA API.
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
              <label className="form-label login-form__label" htmlFor="imei-value">
                IMEI
              </label>
              <input
                id="imei-value"
                type="text"
                className={`form-control login-form__input ${
                  imeiFieldError ? 'is-invalid' : ''
                }`}
                value={formValues.imei}
                onChange={(event) =>
                  handleInputChange('imei', event.target.value)
                }
                placeholder="Enter the IMEI value"
                inputMode="numeric"
              />
              {imeiFieldError ? (
                <div className="invalid-feedback">{imeiFieldError}</div>
              ) : null}
            </div>

            <div className="col-12 col-lg-6">
              <label className="form-label login-form__label" htmlFor="imei-mcu-id">
                MCU ID
              </label>
              <input
                id="imei-mcu-id"
                type="text"
                className={`form-control login-form__input ${
                  mcuIdFieldError ? 'is-invalid' : ''
                }`}
                value={formValues.mcuId}
                onChange={(event) =>
                  handleInputChange('mcuId', event.target.value)
                }
                placeholder="Enter the MCU ID"
              />
              {mcuIdFieldError ? (
                <div className="invalid-feedback">{mcuIdFieldError}</div>
              ) : null}
            </div>

            <div className="col-12">
              <div className="devices-form-card__selected">
                <p className="devices-form-card__selected-label">Validation</p>
                <p className="devices-form-card__selected-value">
                  Numeric IMEI values are accepted
                </p>
                <p className="devices-form-card__selected-meta">
                  Live IMEI records currently show numeric values with varying
                  lengths, so the form validates digits without assuming one fixed length.
                </p>
              </div>
            </div>

            <div className="col-12">
              <button
                type="submit"
                className="btn login-form__submit"
                disabled={createLoading}
              >
                {createLoading ? 'Creating IMEI...' : 'Create IMEI'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {activeTab === 'records' ? (
        <div className="surface-card devices-table-card">
          <div className="firmware-ota-card__header">
            <div>
              <p className="devices-form-card__eyebrow">Records</p>
              <h3 className="devices-form-card__title">IMEI Records</h3>
              <p className="devices-form-card__subtitle">
                The table uses the real IMEI record fields returned by the API,
                including `imei`, `mcu_id`, `overall_result`, and `timestamp`.
              </p>
            </div>

            <div className="d-flex flex-wrap gap-2">
              <button
                type="button"
                className="btn releases-action-btn"
                onClick={() => loadRecords(recordsState.pagination.currentPage)}
                disabled={recordsState.loading}
              >
                {recordsState.loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {recordsState.error?.message ? (
            <div className="alert alert-warning mx-3 mt-3 mb-0" role="alert">
              {recordsState.error.message}
            </div>
          ) : null}

          {recordsState.loading && recordsState.items.length === 0 ? (
            <div className="p-4">
              <div className="d-flex align-items-center gap-3 text-muted">
                <div
                  className="spinner-border spinner-border-sm text-success"
                  role="status"
                />
                Fetching IMEI records...
              </div>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table devices-table align-middle mb-0">
                  <thead>
                    <tr>
                      {recordColumns.length > 0 ? (
                        recordColumns.map((column) => (
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
                    {recordsState.items.length > 0 ? (
                      recordsState.items.map((record) => (
                        <tr key={record.id ?? `${record.imei}-${record.mcu_id}`}>
                          {recordColumns.map((column) => (
                            <td
                              key={column}
                              className={
                                column === 'imei' || column === 'mcu_id'
                                  ? 'devices-table__device'
                                  : ''
                              }
                            >
                              {renderRecordCell(record, column)}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={Math.max(recordColumns.length, 1)}
                          className="devices-table__empty-cell"
                        >
                          <EmptyState
                            title="No IMEI records to display"
                            description="Create an IMEI record or refresh this table once the backend returns data."
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="firmware-ota-card__footer">
                {recordsState.loading && recordsState.items.length > 0 ? (
                  <div className="d-flex align-items-center gap-2 text-muted">
                    <div
                      className="spinner-border spinner-border-sm text-success"
                      role="status"
                    />
                    Refreshing IMEI records...
                  </div>
                ) : (
                  <span className="devices-form-card__selected-meta">
                    Page {recordsState.pagination.currentPage} of{' '}
                    {recordsState.pagination.lastPage}
                    {recordsState.pagination.total
                      ? ` • ${recordsState.pagination.total} total records`
                      : ''}
                  </span>
                )}

                <Pagination
                  currentPage={recordsState.pagination.currentPage}
                  lastPage={recordsState.pagination.lastPage}
                  onPageChange={loadRecords}
                  isLoading={recordsState.loading}
                />
              </div>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}

export default ImeiPage;
