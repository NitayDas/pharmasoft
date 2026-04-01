import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './LoginPage.css';

// ─── Sub-components ───────────────────────────────────────────

function BrandMark() {
  return (
    <div className="lp-brand-mark">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    </div>
  );
}

function LeftPanel({ mounted }) {
  const features = [
    'Real-time stock tracking',
    'Prescription management',
    'Role-based access control',
    'Sales & billing reports',
  ];

  return (
    <div className="lp-left">
      <div className="lp-glow" aria-hidden="true" />
      <div className="lp-glow-top" aria-hidden="true" />

      {/* Brand */}
      <div className={`lp-brand${mounted ? ' in' : ''}`}>
        <BrandMark />
        <div>
          <div className="lp-brand-name">MediShop</div>
          <div className="lp-brand-sub">Pharmacy System</div>
        </div>
      </div>

      {/* Headline */}
      <div className={`lp-headline${mounted ? ' in' : ''}`}>
        <h1>
          Smart tools<br />
          for <span>modern</span><br />
          pharmacies.
        </h1>
        <p>
          Manage inventory, prescriptions, and billing
          from one unified dashboard — built for speed
          and compliance.
        </p>
        <div className="lp-pills">
          {features.map((f) => (
            <span className="lp-pill" key={f}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className={`lp-stats${mounted ? ' in' : ''}`}>
        {[
          { num: '99', suffix: '%', label: 'Uptime SLA' },
          { num: '40', suffix: 'k+', label: 'Rx processed' },
          { num: '3', suffix: 'x', label: 'Faster billing' },
        ].map(({ num, suffix, label }) => (
          <div key={label}>
            <div className="lp-stat-num">
              {num}<span>{suffix}</span>
            </div>
            <div className="lp-stat-label">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorAlert({ message }) {
  return (
    <div className="lp-error" role="alert">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {message}
    </div>
  );
}

function InputIcon({ children }) {
  return <span className="lp-input-icon">{children}</span>;
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.8-3.5 5-5 8-5s6.2 1.5 8 5" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function EyeIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

// ─── Assigned credentials quick-fill ────────────────────────
const DEMO_CREDS = [
  { label: 'Username', value: 'admin' },
  { label: 'Password', value: 'Admin@1234' },
];

function DemoBox({ onFillUsername, onFillPassword }) {
  const handlers = [onFillUsername, onFillPassword];
  return (
    <div className="lp-demo" aria-label="Assigned credentials">
      <div className="lp-demo-head">Assigned credentials</div>
      {DEMO_CREDS.map(({ label, value }, i) => (
        <div className="lp-demo-row" key={label}>
          <b>{label}</b>
          <code>{value}</code>
          <button
            type="button"
            className="lp-fill-btn"
            onClick={() => handlers[i](value)}
            aria-label={`Fill ${label}`}
          >
            Fill
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [mounted,  setMounted]  = useState(false);

  const { user, login, loading, error, setError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await login(username, password);
      navigate('/dashboard', { replace: true });
    } catch {
      // error is set in AuthContext
    }
  };

  const clearError = () => setError(null);

  return (
    <div className="lp-page">
      <LeftPanel mounted={mounted} />

      {/* ── Right: Form ── */}
      <div className={`lp-right${mounted ? ' in' : ''}`}>
        <div className="lp-form-box">

          <div className="lp-form-eyebrow">Secure Portal</div>
          <h2 className="lp-form-title">Welcome back</h2>
          <p className="lp-form-sub">
            Sign in with your username to access your pharmacy dashboard
            and manage your operations.
          </p>

          {error && <ErrorAlert message={error} />}

          <form onSubmit={handleSubmit} noValidate>
            {/* Username */}
            <div className="lp-field">
              <label className="lp-label" htmlFor="username">
                Username
              </label>
              <div className="lp-input-wrap">
                <InputIcon><UserIcon /></InputIcon>
                <input
                  id="username"
                  type="text"
                  className={`lp-input${error ? ' has-error' : ''}`}
                  placeholder="admin"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); clearError(); }}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="lp-field">
              <label className="lp-label" htmlFor="password">
                Password
                <a href="/forgot-password" className="lp-forgot">
                  Forgot password?
                </a>
              </label>
              <div className="lp-input-wrap">
                <InputIcon><LockIcon /></InputIcon>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className={`lp-input${error ? ' has-error' : ''}`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError(); }}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="lp-eye-btn"
                  onClick={() => setShowPass((s) => !s)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon open={showPass} />
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="lp-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="lp-spinner" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowIcon />
                </>
              )}
            </button>
          </form>

          <div className="lp-divider">assigned access</div>

          <DemoBox
            onFillUsername={setUsername}
            onFillPassword={setPassword}
          />

          <p className="lp-footer-note">
            Accounts are created and assigned by a superuser.
          </p>
        </div>
      </div>
    </div>
  );
}
