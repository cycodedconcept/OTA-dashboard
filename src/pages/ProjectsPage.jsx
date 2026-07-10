import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import EmptyState from '../components/common/EmptyState';
import {
  clearCreateProjectState,
  clearSelectedProject,
  clearUpdateProjectState,
  createProject,
  getProjects,
  setSelectedProject,
  updateProject,
} from '../redux/slices/projectsSlice';
import { pickFirstDefined } from '../utils/apiData';
import { getApiFieldError } from '../utils/apiErrors';

function parseBackendDate(value) {
  if (!value) {
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

function normalizeProject(project) {
  return {
    createdAt: pickFirstDefined(project, ['created_at']),
    name:
      pickFirstDefined(project, ['project_name', 'create_project', 'name']) ??
      'Untitled project',
    projectId: pickFirstDefined(project, ['project_id', 'id']),
    raw: project,
    updatedAt: pickFirstDefined(project, ['updated_at']),
  };
}

function ProjectsPage() {
  const dispatch = useDispatch();
  const {
    items,
    searchTerm,
    selectedProject,
    getProjectsError,
    getProjectsLoading,
    createProjectError,
    createProjectLoading,
    createProjectSuccessMessage,
    updateProjectError,
    updateProjectLoading,
    updateProjectSuccessMessage,
  } = useSelector((state) => state.projects);
  const token = useSelector((state) => state.admin.token);
  const [projectName, setProjectName] = useState('');
  const [editProjectName, setEditProjectName] = useState('');
  const [openPanel, setOpenPanel] = useState(null);
  const [createErrors, setCreateErrors] = useState({});
  const [updateErrors, setUpdateErrors] = useState({});

  function closeModal() {
    setOpenPanel(null);
    setCreateErrors({});
    setUpdateErrors({});
    dispatch(clearCreateProjectState());
    dispatch(clearUpdateProjectState());
  }

  function openCreateModal() {
    dispatch(clearCreateProjectState());
    setCreateErrors({});
    setOpenPanel('create');
  }

  function openUpdateModal() {
    dispatch(clearUpdateProjectState());
    setUpdateErrors({});
    setOpenPanel('update');
  }

  useEffect(() => {
    dispatch(getProjects());
    dispatch(clearCreateProjectState());
    dispatch(clearUpdateProjectState());

    return () => {
      dispatch(clearSelectedProject());
      dispatch(clearCreateProjectState());
      dispatch(clearUpdateProjectState());
    };
  }, [dispatch]);

  useEffect(() => {
    if (!openPanel) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpenPanel(null);
        setCreateErrors({});
        setUpdateErrors({});
        dispatch(clearCreateProjectState());
        dispatch(clearUpdateProjectState());
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dispatch, openPanel]);

  const normalizedProjects = useMemo(
    () => items.map((item) => normalizeProject(item)),
    [items]
  );

  const selectedNormalizedProject = useMemo(
    () => (selectedProject ? normalizeProject(selectedProject) : null),
    [selectedProject]
  );

  useEffect(() => {
    setEditProjectName(selectedNormalizedProject?.name ?? '');
  }, [selectedNormalizedProject]);

  const filteredProjects = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return normalizedProjects.filter((item) => {
      if (!normalizedSearch) {
        return true;
      }

      return [item.name, item.projectId]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));
    });
  }, [normalizedProjects, searchTerm]);

  const handleCreateProject = async (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (!projectName.trim()) {
      nextErrors.project_name = 'Project name is required.';
    }

    setCreateErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      await dispatch(
        createProject({
          project_name: projectName.trim(),
        })
      ).unwrap();

      setProjectName('');
      closeModal();
      dispatch(getProjects());
    } catch {
      // Slice state carries the user-facing error details.
    }
  };

  const handleUpdateProject = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    const projectId = selectedNormalizedProject?.projectId;

    if (!projectId) {
      nextErrors.project_id = 'Select a project before updating it.';
    }

    if (!editProjectName.trim()) {
      nextErrors.project_name = 'Project name is required.';
    }

    setUpdateErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || !projectId) {
      return;
    }

    try {
      await dispatch(
        updateProject({
          project_id: projectId,
          project_name: editProjectName.trim(),
        })
      ).unwrap();

      closeModal();
      dispatch(getProjects());
    } catch {
      // Slice state carries the user-facing error details.
    }
  };

  const createProjectFieldError =
    createErrors.project_name ||
    getApiFieldError(createProjectError, 'project_name') ||
    getApiFieldError(createProjectError, 'create_project');
  const updateProjectFieldError =
    updateErrors.project_name ||
    getApiFieldError(updateProjectError, 'project_name');
  const updateProjectIdError =
    updateErrors.project_id || getApiFieldError(updateProjectError, 'project_id');

  return (
    <section className="page-section projects-page">
      <div className="page-section__header mb-4">
        <div className="page-section__heading">
          <p className="page-section__eyebrow">Portfolio</p>
          <h2 className="page-section__title">Projects</h2>
          <p className="page-section__subtitle">
            {normalizedProjects.length} project
            {normalizedProjects.length === 1 ? '' : 's'} available for device
            registration.
          </p>
        </div>

        <div className="page-section__actions">
          <button
            type="button"
            className="btn devices-action-btn devices-action-btn--primary"
            onClick={openCreateModal}
          >
            Create project
          </button>
        </div>
      </div>

      {!token ? (
        <div className="alert alert-warning mb-4" role="alert">
          Project endpoints require a bearer token. Complete login with a valid
          token response before attempting project requests.
        </div>
      ) : null}

      {getProjectsError?.message ? (
        <div className="alert alert-warning mb-4" role="alert">
          {getProjectsError.message}
        </div>
      ) : null}

      {getProjectsLoading && normalizedProjects.length === 0 ? (
        <div className="surface-card">
          <div className="d-flex align-items-center gap-3 text-muted">
            <div className="spinner-border spinner-border-sm text-success" role="status" />
            Fetching projects...
          </div>
        </div>
      ) : (
        <div className="surface-card devices-table-card">
          <div className="table-responsive">
            <table className="table devices-table align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col">Project</th>
                  <th scope="col">Project ID</th>
                  <th scope="col">Created</th>
                  <th scope="col">Updated</th>
                  <th scope="col" className="text-end">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((item, index) => (
                    <tr
                      key={`${item.projectId ?? item.name}-${index}`}
                      className={
                        selectedNormalizedProject?.projectId === item.projectId
                          ? 'is-selected'
                          : ''
                      }
                    >
                      <td className="devices-table__device">{item.name}</td>
                      <td>{item.projectId || 'Unavailable'}</td>
                      <td>{formatDateTime(item.createdAt)}</td>
                      <td>{formatDateTime(item.updatedAt)}</td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm releases-action-btn"
                          onClick={() => {
                            dispatch(setSelectedProject(item.raw));
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
                    <td colSpan="5" className="devices-table__empty-cell">
                      <EmptyState
                        title="No projects to display"
                        description={
                          searchTerm
                            ? 'Try a different search term to find the project you need.'
                            : 'Create a project to start organizing device registrations.'
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

      {openPanel === 'create' ? (
        <div className="dashboard-modal" role="presentation" onClick={closeModal}>
          <div
            className="dashboard-modal__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-project-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="surface-card devices-form-card dashboard-modal__card">
              <div className="dashboard-modal__header">
                <div>
                  <p className="devices-form-card__eyebrow">Create</p>
                  <h3
                    id="create-project-modal-title"
                    className="devices-form-card__title"
                  >
                    Create project
                  </h3>
                  <p className="devices-form-card__subtitle">
                    This is submitted with the backend field name
                    `project_name`, while still keeping the older
                    `create_project` fallback for compatibility.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-close dashboard-modal__close"
                  aria-label="Close"
                  onClick={closeModal}
                />
              </div>

              {createProjectError?.message ? (
                <div className="alert alert-danger auth-alert" role="alert">
                  {createProjectError.message}
                </div>
              ) : null}

              {createProjectSuccessMessage ? (
                <div className="alert alert-success auth-alert" role="alert">
                  {createProjectSuccessMessage}
                </div>
              ) : null}

              <form className="login-form mt-4" onSubmit={handleCreateProject}>
                <div className="mb-4">
                  <label
                    className="form-label login-form__label"
                    htmlFor="create-project-name"
                  >
                    Project Name
                  </label>
                  <input
                    id="create-project-name"
                    type="text"
                    className={`form-control login-form__input ${
                      createProjectFieldError ? 'is-invalid' : ''
                    }`}
                    value={projectName}
                    onChange={(event) => {
                      setProjectName(event.target.value);
                      setCreateErrors((currentValue) => ({
                        ...currentValue,
                        project_name: '',
                        create_project: '',
                      }));
                    }}
                    placeholder="Enter the project name"
                  />
                  {createProjectFieldError ? (
                    <div className="invalid-feedback">
                      {createProjectFieldError}
                    </div>
                  ) : null}
                </div>

                <button
                  type="submit"
                  className="btn login-form__submit w-100"
                  disabled={createProjectLoading}
                >
                  {createProjectLoading ? 'Creating project...' : 'Create project'}
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
            aria-labelledby="update-project-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="surface-card devices-form-card dashboard-modal__card">
              <div className="dashboard-modal__header">
                <div>
                  <p className="devices-form-card__eyebrow">Update</p>
                  <h3
                    id="update-project-modal-title"
                    className="devices-form-card__title"
                  >
                    Edit selected project
                  </h3>
                  <p className="devices-form-card__subtitle">
                    Select a project below, then submit the new `project_name`
                    against the backend’s `project_id`.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-close dashboard-modal__close"
                  aria-label="Close"
                  onClick={closeModal}
                />
              </div>

              {updateProjectError?.message ? (
                <div className="alert alert-danger auth-alert" role="alert">
                  {updateProjectError.message}
                </div>
              ) : null}

              {updateProjectSuccessMessage ? (
                <div className="alert alert-success auth-alert" role="alert">
                  {updateProjectSuccessMessage}
                </div>
              ) : null}

              {selectedNormalizedProject ? (
                <form className="login-form mt-4" onSubmit={handleUpdateProject}>
                  <div className="devices-form-card__selected mb-3">
                    <p className="devices-form-card__selected-label">
                      Selected project
                    </p>
                    <p className="devices-form-card__selected-value">
                      {selectedNormalizedProject.name}
                    </p>
                    <p className="devices-form-card__selected-meta">
                      Project ID {selectedNormalizedProject.projectId || 'Unavailable'}
                    </p>
                  </div>

                  <div className="mb-4">
                    <label
                      className="form-label login-form__label"
                      htmlFor="update-project-name"
                    >
                      Project Name
                    </label>
                    <input
                      id="update-project-name"
                      type="text"
                      className={`form-control login-form__input ${
                        updateProjectFieldError || updateProjectIdError
                          ? 'is-invalid'
                          : ''
                      }`}
                      value={editProjectName}
                      onChange={(event) => {
                        setEditProjectName(event.target.value);
                        setUpdateErrors((currentValue) => ({
                          ...currentValue,
                          project_id: '',
                          project_name: '',
                        }));
                      }}
                      placeholder="Enter the updated project name"
                    />
                    {updateProjectFieldError || updateProjectIdError ? (
                      <div className="invalid-feedback d-block">
                        {updateProjectFieldError || updateProjectIdError}
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="submit"
                    className="btn login-form__submit w-100"
                    disabled={updateProjectLoading}
                  >
                    {updateProjectLoading ? 'Updating project...' : 'Update project'}
                  </button>
                </form>
              ) : (
                <div className="devices-form-card__empty">
                  Select a project from the table below to rename it.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default ProjectsPage;
