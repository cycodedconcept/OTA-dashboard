import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  assignAdminPrivileges,
  clearAssignPrivilegesState,
  clearUpdatePasswordState,
  updateAdminPassword,
} from '../redux/slices/adminSlice';
import { getApiFieldError } from '../utils/apiErrors';
import { hasValue } from '../utils/formValidation';

function AdminAccessPage() {
  const dispatch = useDispatch();
  const {
    admin,
    token,
    assignPrivilegesError,
    assignPrivilegesLoading,
    assignPrivilegesSuccessMessage,
    updatePasswordError,
    updatePasswordLoading,
    updatePasswordSuccessMessage,
  } = useSelector((state) => state.admin);
  const derivedAdminId = admin?.id ?? admin?.admin_id ?? '';
  const derivedAdminIdValue = derivedAdminId ? String(derivedAdminId) : '';
  const [password, setPassword] = useState('');
  const [passwordAdminId, setPasswordAdminId] = useState(derivedAdminIdValue);
  const [role, setRole] = useState('');
  const [roleAdminId, setRoleAdminId] = useState(derivedAdminIdValue);
  const [openPanel, setOpenPanel] = useState(null);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [privilegeErrors, setPrivilegeErrors] = useState({});

  useEffect(() => {
    dispatch(clearUpdatePasswordState());
    dispatch(clearAssignPrivilegesState());

    return () => {
      dispatch(clearUpdatePasswordState());
      dispatch(clearAssignPrivilegesState());
    };
  }, [dispatch]);

  useEffect(() => {
    if (derivedAdminIdValue && !passwordAdminId) {
      setPasswordAdminId(derivedAdminIdValue);
    }

    if (derivedAdminIdValue && !roleAdminId) {
      setRoleAdminId(derivedAdminIdValue);
    }
  }, [derivedAdminIdValue, passwordAdminId, roleAdminId]);

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    const resolvedAdminId = derivedAdminIdValue || passwordAdminId.trim();

    if (!hasValue(password)) {
      nextErrors.password = 'Password is required.';
    }

    if (!hasValue(resolvedAdminId)) {
      nextErrors.admin_id = 'Admin ID is required.';
    }

    setPasswordErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      await dispatch(
        updateAdminPassword({
          admin_id: resolvedAdminId,
          password,
        })
      ).unwrap();
      setPassword('');
    } catch {
      // Slice state carries the user-facing error details.
    }
  };

  const handlePrivilegesSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (!hasValue(role)) {
      nextErrors.role = 'Role is required.';
    }

    if (!hasValue(roleAdminId)) {
      nextErrors.admin_id = 'Admin ID is required.';
    }

    setPrivilegeErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      await dispatch(
        assignAdminPrivileges({
          admin_id: roleAdminId.trim(),
          role: role.trim(),
        })
      ).unwrap();
      setRole('');
    } catch {
      // Slice state carries the user-facing error details.
    }
  };

  const passwordAdminIdError =
    passwordErrors.admin_id || getApiFieldError(updatePasswordError, 'admin_id');
  const passwordFieldError =
    passwordErrors.password || getApiFieldError(updatePasswordError, 'password');
  const roleAdminIdError =
    privilegeErrors.admin_id || getApiFieldError(assignPrivilegesError, 'admin_id');
  const roleFieldError =
    privilegeErrors.role || getApiFieldError(assignPrivilegesError, 'role');

  return (
    <section className="page-section admin-access-page">
      <div className="d-flex flex-column gap-2 mb-4">
        <p className="page-section__eyebrow">Administration</p>
        <h2 className="page-section__title">Settings</h2>
        <p className="page-section__subtitle">
          Manage authenticated admin credentials and backend privilege updates.
        </p>
      </div>

      <div className="row g-4 align-items-start">
        <div className="col-12 col-xxl-4">
          <div className="surface-card admin-access-card h-100">
            <p className="admin-access-card__eyebrow">Current session</p>
            <h3 className="admin-access-card__title">Authenticated admin</h3>

            <div className="admin-access-summary">
              <div className="admin-access-summary__row">
                <span className="admin-access-summary__label">Name</span>
                <span className="admin-access-summary__value">
                  {admin?.name || 'Not provided by backend'}
                </span>
              </div>

              <div className="admin-access-summary__row">
                <span className="admin-access-summary__label">Email</span>
                <span className="admin-access-summary__value">
                  {admin?.email || 'Not provided by backend'}
                </span>
              </div>

              <div className="admin-access-summary__row">
                <span className="admin-access-summary__label">Admin ID</span>
                <span className="admin-access-summary__value">
                  {derivedAdminIdValue || 'Unavailable'}
                </span>
              </div>

              <div className="admin-access-summary__row">
                <span className="admin-access-summary__label">Role</span>
                <span className="admin-access-summary__value">
                  {admin?.user_role || admin?.role || 'Unavailable'}
                </span>
              </div>

              <div className="admin-access-summary__row">
                <span className="admin-access-summary__label">Token</span>
                <span className="admin-access-summary__value">
                  {token ? 'Stored in local session' : 'Not detected in response'}
                </span>
              </div>
            </div>

            {!token ? (
              <div className="alert alert-warning mt-3 mb-0" role="alert">
                The backend login success payload still needs confirmation if no
                bearer token is extracted. Protected admin endpoints require that
                token.
              </div>
            ) : null}
          </div>
        </div>

        <div className="col-12 col-xxl-8">
          <div className="devices-action-bar mb-4">
            <button
              type="button"
              className={`btn devices-action-btn ${
                openPanel === 'password' ? 'is-active' : ''
              }`}
              onClick={() =>
                setOpenPanel((currentValue) =>
                  currentValue === 'password' ? null : 'password'
                )
              }
            >
              {openPanel === 'password'
                ? 'Hide password form'
                : 'Update password'}
            </button>

            <button
              type="button"
              className={`btn devices-action-btn ${
                openPanel === 'privileges' ? 'is-active' : ''
              }`}
              onClick={() =>
                setOpenPanel((currentValue) =>
                  currentValue === 'privileges' ? null : 'privileges'
                )
              }
            >
              {openPanel === 'privileges'
                ? 'Hide privileges form'
                : 'Assign privileges'}
            </button>
          </div>

          {openPanel === 'password' ? (
            <div className="surface-card admin-access-card mb-4">
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-start gap-3 mb-3">
                <div>
                  <p className="admin-access-card__eyebrow">Security</p>
                  <h3 className="admin-access-card__title">Update password</h3>
                  <p className="admin-access-card__subtitle">
                    Submit a new password using the backend’s authenticated admin
                    update endpoint.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn releases-action-btn"
                  onClick={() => setOpenPanel(null)}
                >
                  Close
                </button>
              </div>

              {updatePasswordError?.message ? (
                <div className="alert alert-danger auth-alert" role="alert">
                  {updatePasswordError.message}
                </div>
              ) : null}

              {updatePasswordSuccessMessage ? (
                <div className="alert alert-success auth-alert" role="alert">
                  {updatePasswordSuccessMessage}
                </div>
              ) : null}

              <form className="login-form mt-4" onSubmit={handlePasswordSubmit}>
                {derivedAdminIdValue ? (
                  <div className="admin-access-card__meta mb-3">
                    Using authenticated admin ID:{' '}
                    <span className="admin-access-card__code">
                      {derivedAdminIdValue}
                    </span>
                  </div>
                ) : (
                  <div className="mb-3">
                    <label
                      className="form-label login-form__label"
                      htmlFor="password-admin-id"
                    >
                      Admin ID
                    </label>
                    <input
                      id="password-admin-id"
                      type="text"
                      className={`form-control login-form__input ${
                        passwordAdminIdError ? 'is-invalid' : ''
                      }`}
                      value={passwordAdminId}
                      onChange={(event) => {
                        setPasswordAdminId(event.target.value);
                        setPasswordErrors((currentValue) => ({
                          ...currentValue,
                          admin_id: '',
                        }));
                      }}
                      placeholder="Enter the admin ID"
                    />
                    {passwordAdminIdError ? (
                      <div className="invalid-feedback">
                        {passwordAdminIdError}
                      </div>
                    ) : null}
                  </div>
                )}

                <div className="mb-4">
                  <label
                    className="form-label login-form__label"
                    htmlFor="admin-password"
                  >
                    New password
                  </label>
                  <input
                    id="admin-password"
                    type="password"
                    className={`form-control login-form__input ${
                      passwordFieldError ? 'is-invalid' : ''
                    }`}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setPasswordErrors((currentValue) => ({
                        ...currentValue,
                        password: '',
                      }));
                    }}
                    placeholder="Enter a secure new password"
                    autoComplete="new-password"
                  />
                  {passwordFieldError ? (
                    <div className="invalid-feedback">{passwordFieldError}</div>
                  ) : null}
                </div>

                <button
                  type="submit"
                  className="btn login-form__submit w-100"
                  disabled={updatePasswordLoading}
                >
                  {updatePasswordLoading
                    ? 'Updating password...'
                    : 'Update password'}
                </button>
              </form>
            </div>
          ) : null}

          {openPanel === 'privileges' ? (
            <div className="surface-card admin-access-card">
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-start gap-3 mb-3">
                <div>
                  <p className="admin-access-card__eyebrow">Permissions</p>
                  <h3 className="admin-access-card__title">Assign privileges</h3>
                  <p className="admin-access-card__subtitle">
                    Provide the exact backend role value and target admin ID for
                    privilege updates.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn releases-action-btn"
                  onClick={() => setOpenPanel(null)}
                >
                  Close
                </button>
              </div>

              {assignPrivilegesError?.message ? (
                <div className="alert alert-danger auth-alert" role="alert">
                  {assignPrivilegesError.message}
                </div>
              ) : null}

              {assignPrivilegesSuccessMessage ? (
                <div className="alert alert-success auth-alert" role="alert">
                  {assignPrivilegesSuccessMessage}
                </div>
              ) : null}

              <form className="login-form mt-4" onSubmit={handlePrivilegesSubmit}>
                <div className="mb-3">
                  <label
                    className="form-label login-form__label"
                    htmlFor="assign-role"
                  >
                    Role
                  </label>
                  <input
                    id="assign-role"
                    type="text"
                    className={`form-control login-form__input ${
                      roleFieldError ? 'is-invalid' : ''
                    }`}
                    value={role}
                    onChange={(event) => {
                      setRole(event.target.value);
                      setPrivilegeErrors((currentValue) => ({
                        ...currentValue,
                        role: '',
                      }));
                    }}
                    placeholder="Enter the exact backend role value"
                  />
                  {roleFieldError ? (
                    <div className="invalid-feedback">{roleFieldError}</div>
                  ) : null}
                  <div className="form-text login-form__hint">
                    Use the backend’s exact role value. The frontend does not
                    transform or rename it.
                  </div>
                </div>

                <div className="mb-4">
                  <label
                    className="form-label login-form__label"
                    htmlFor="assign-admin-id"
                  >
                    Admin ID
                  </label>
                  <input
                    id="assign-admin-id"
                    type="text"
                    className={`form-control login-form__input ${
                      roleAdminIdError ? 'is-invalid' : ''
                    }`}
                    value={roleAdminId}
                    onChange={(event) => {
                      setRoleAdminId(event.target.value);
                      setPrivilegeErrors((currentValue) => ({
                        ...currentValue,
                        admin_id: '',
                      }));
                    }}
                    placeholder="Enter the target admin ID"
                  />
                  {roleAdminIdError ? (
                    <div className="invalid-feedback">{roleAdminIdError}</div>
                  ) : null}
                </div>

                <button
                  type="submit"
                  className="btn login-form__submit w-100"
                  disabled={assignPrivilegesLoading}
                >
                  {assignPrivilegesLoading
                    ? 'Assigning privileges...'
                    : 'Assign privileges'}
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default AdminAccessPage;
