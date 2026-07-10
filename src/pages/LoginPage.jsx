import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import loginHero from '../assets/login-hero.png';
import { clearLoginState, loginAdmin } from '../redux/slices/adminSlice';
import { setActivePage } from '../redux/slices/uiSlice';
import { getApiFieldError } from '../utils/apiErrors';
import { isValidEmail } from '../utils/formValidation';

function LoginPage({ onSwitchToRegister }) {
  const dispatch = useDispatch();
  const { loginError, loginLoading, loginSuccessMessage } = useSelector(
    (state) => state.admin
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    dispatch(clearLoginState());

    return () => {
      dispatch(clearLoginState());
    };
  }, [dispatch]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    }

    setValidationErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      await dispatch(
        loginAdmin({
          email: email.trim(),
          password,
        })
      ).unwrap();
      dispatch(setActivePage('devices'));
      setPassword('');
    } catch {
      // Slice state carries the user-facing error details.
    }
  };

  const emailError = validationErrors.email || getApiFieldError(loginError, 'email');
  const passwordError =
    validationErrors.password || getApiFieldError(loginError, 'password');

  return (
    <section className="login-page">
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

          <p className="login-page__eyebrow">Firmware operations</p>
          <h1 className="login-page__headline">
            Secure access to every deployment surface in your hardware fleet.
          </h1>
          <p className="login-page__blurb">
            Track releases, coordinate staging rollouts, and keep field devices
            aligned from a single operational workspace.
          </p>
        </div>
      </div>

      <div className="login-page__form-panel">
        <div className="login-card">
          <p className="login-card__eyebrow">Welcome back</p>
          <h2 className="login-card__title">Sign in to continue</h2>
          <p className="login-card__subtitle">
            Use your OTAHardware workspace credentials to enter the fleet
            console.
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            {loginError?.message ? (
              <div className="alert alert-danger auth-alert" role="alert">
                {loginError.message}
              </div>
            ) : null}

            {loginSuccessMessage ? (
              <div className="alert alert-success auth-alert" role="alert">
                {loginSuccessMessage}
              </div>
            ) : null}

            <div className="mb-3">
              <label className="form-label login-form__label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
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
              {emailError ? <div className="invalid-feedback">{emailError}</div> : null}
            </div>

            <div className="mb-4">
              <label
                className="form-label login-form__label"
                htmlFor="password"
              >
                Password
              </label>

              <div className="login-form__password-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-control login-form__input login-form__input--password ${
                    passwordError ? 'is-invalid' : ''
                  }`}
                  placeholder="Enter your password"
                  autoComplete="current-password"
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
              disabled={loginLoading}
            >
              {loginLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="login-card__switch">
            New to OTAHardware?
            <button
              type="button"
              className="login-card__switch-btn"
              onClick={onSwitchToRegister}
            >
              Create an account
            </button>
          </p>

          <p className="login-card__footnote">
            Protected access for release managers, device operators, and
            deployment teams.
          </p>
        </div>
      </div>
    </section>
  );
}

export default LoginPage;
