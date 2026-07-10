import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import loginHero from '../assets/login-hero.png';
import {
  clearRegisterState,
  registerAdmin,
} from '../redux/slices/adminSlice';
import { getApiFieldError } from '../utils/apiErrors';
import { isValidEmail } from '../utils/formValidation';

function RegisterPage({ onSwitchToLogin }) {
  const dispatch = useDispatch();
  const {
    registerError,
    registerLoading,
    registerSuccessMessage,
  } = useSelector((state) => state.admin);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userRole, setUserRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    dispatch(clearRegisterState());

    return () => {
      dispatch(clearRegisterState());
    };
  }, [dispatch]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (!name.trim()) {
      nextErrors.name = 'Name is required.';
    }

    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    }

    if (!userRole.trim()) {
      nextErrors.user_role = 'User role is required.';
    }

    setValidationErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      await dispatch(
        registerAdmin({
          email: email.trim(),
          name: name.trim(),
          password,
          user_role: userRole.trim(),
        })
      ).unwrap();
      setPassword('');
    } catch {
      // Slice state carries the user-facing error details.
    }
  };

  const nameError = validationErrors.name || getApiFieldError(registerError, 'name');
  const emailError =
    validationErrors.email || getApiFieldError(registerError, 'email');
  const passwordError =
    validationErrors.password || getApiFieldError(registerError, 'password');
  const userRoleError =
    validationErrors.user_role || getApiFieldError(registerError, 'user_role');

  return (
    <section className="login-page login-page--register">
      <div className="login-page__visual">
        <img
          src={loginHero}
          alt="Connected OTA hardware devices"
          className="login-page__hero-image"
        />

        <div className="login-page__visual-overlay" />

        <div className="login-page__visual-copy">
          <div className="login-page__brand">
            <div className="login-page__brand-mark" aria-hidden="true">
              H
            </div>

            <div>
              <p className="login-page__brand-title">OTAHardware</p>
              <p className="login-page__brand-subtitle">Fleet Console</p>
            </div>
          </div>

          <p className="login-page__eyebrow">Fleet onboarding</p>
          <h1 className="login-page__headline">
            Launch your hardware workspace with secure access from day one.
          </h1>
          <p className="login-page__blurb">
            Create an operator account to manage firmware releases, monitor
            field updates, and coordinate deployments across every device
            target.
          </p>
        </div>
      </div>

      <div className="login-page__form-panel">
        <div className="login-card login-card--register">
          <p className="login-card__eyebrow">Create account</p>
          <h2 className="login-card__title">Start your fleet workspace</h2>
          <p className="login-card__subtitle">
            Set up your OTAHardware profile to begin managing releases and
            device operations.
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            {registerError?.message ? (
              <div className="alert alert-danger auth-alert" role="alert">
                {registerError.message}
              </div>
            ) : null}

            {registerSuccessMessage ? (
              <div className="alert alert-success auth-alert" role="alert">
                {registerSuccessMessage}
              </div>
            ) : null}

            <div className="mb-3">
              <label className="form-label login-form__label" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                type="text"
                className={`form-control login-form__input ${
                  nameError ? 'is-invalid' : ''
                }`}
                placeholder="Jane Doe"
                autoComplete="name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setValidationErrors((currentValue) => ({
                    ...currentValue,
                    name: '',
                  }));
                }}
                required
              />
              {nameError ? <div className="invalid-feedback">{nameError}</div> : null}
            </div>

            <div className="mb-3">
              <label
                className="form-label login-form__label"
                htmlFor="register-email"
              >
                Email
              </label>
              <input
                id="register-email"
                type="email"
                className={`form-control login-form__input ${
                  emailError ? 'is-invalid' : ''
                }`}
                placeholder="you@company.com"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setValidationErrors((currentValue) => ({
                    ...currentValue,
                    email: '',
                  }));
                }}
                required
              />
              {emailError ? (
                <div className="invalid-feedback">{emailError}</div>
              ) : null}
            </div>

            <div className="mb-3">
              <label
                className="form-label login-form__label"
                htmlFor="register-user-role"
              >
                User role
              </label>
              <input
                id="register-user-role"
                type="text"
                className={`form-control login-form__input ${
                  userRoleError ? 'is-invalid' : ''
                }`}
                placeholder="Enter the exact backend role value"
                value={userRole}
                onChange={(event) => {
                  setUserRole(event.target.value);
                  setValidationErrors((currentValue) => ({
                    ...currentValue,
                    user_role: '',
                  }));
                }}
                required
              />
              {userRoleError ? (
                <div className="invalid-feedback">{userRoleError}</div>
              ) : null}
              <div className="form-text login-form__hint">
                Use the backend’s exact `user_role` value so the API receives it
                unchanged.
              </div>
            </div>

            <div className="mb-4">
              <label
                className="form-label login-form__label"
                htmlFor="register-password"
              >
                Password
              </label>

              <div className="login-form__password-wrap">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-control login-form__input login-form__input--password ${
                    passwordError ? 'is-invalid' : ''
                  }`}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setValidationErrors((currentValue) => ({
                      ...currentValue,
                      password: '',
                    }));
                  }}
                  required
                />

                <button
                  type="button"
                  className="login-form__toggle"
                  onClick={() => setShowPassword((currentValue) => !currentValue)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i
                    className={`bi ${
                      showPassword ? 'bi-eye-slash' : 'bi-eye'
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </div>
              {passwordError ? (
                <div className="invalid-feedback d-block">{passwordError}</div>
              ) : null}
            </div>

            <button
              type="submit"
              className="btn login-form__submit w-100"
              disabled={registerLoading}
            >
              {registerLoading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="login-card__switch">
            Already have an account?
            <button
              type="button"
              className="login-card__switch-btn"
              onClick={onSwitchToLogin}
            >
              Sign in
            </button>
          </p>

          <p className="login-card__footnote">
            Access is tailored for release managers, operations teams, and
            device administrators.
          </p>
        </div>
      </div>
    </section>
  );
}

export default RegisterPage;
