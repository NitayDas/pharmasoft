import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [mounted, setMounted]   = useState(false);
  const { user, login, loading, error, setError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch {}
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --teal:    #0d9488;
          --teal-dk: #0f766e;
          --teal-lt: #ccfbf1;
          --slate:   #0f172a;
          --muted:   #64748b;
          --border:  #e2e8f0;
          --white:   #ffffff;
          --err:     #ef4444;
          --amber:   #f59e0b;
        }

        body { background: #f0fdfa; font-family: 'DM Sans', sans-serif; }

        .page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        /* ── Left panel ── */
        .panel-left {
          background: linear-gradient(155deg, #0d9488 0%, #0f766e 40%, #065f46 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px;
          position: relative;
          overflow: hidden;
          opacity: 0;
          transform: translateX(-30px);
          transition: opacity .7s ease, transform .7s ease;
        }
        .panel-left.in { opacity: 1; transform: translateX(0); }

        /* Decorative circles */
        .panel-left::before {
          content: '';
          position: absolute;
          width: 400px; height: 400px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,.1);
          top: -100px; right: -100px;
        }
        .panel-left::after {
          content: '';
          position: absolute;
          width: 250px; height: 250px;
          border-radius: 50%;
          background: rgba(255,255,255,.05);
          bottom: 60px; left: -80px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 64px;
          position: relative; z-index: 1;
        }
        .brand-icon {
          width: 52px; height: 52px;
          background: rgba(255,255,255,.15);
          border-radius: 14px;
          display: grid;
          place-items: center;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,.2);
        }
        .brand-icon svg { width: 28px; height: 28px; }
        .brand-name {
          font-family: 'DM Serif Display', serif;
          font-size: 26px;
          color: #fff;
          letter-spacing: -.3px;
        }
        .brand-tag {
          font-size: 11px;
          color: rgba(255,255,255,.6);
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-top: 1px;
        }

        .hero-heading {
          font-family: 'DM Serif Display', serif;
          font-size: 44px;
          line-height: 1.15;
          color: #fff;
          margin-bottom: 20px;
          position: relative; z-index: 1;
        }
        .hero-heading em { font-style: italic; color: #99f6e4; }

        .hero-sub {
          font-size: 16px;
          line-height: 1.7;
          color: rgba(255,255,255,.7);
          max-width: 380px;
          margin-bottom: 52px;
          position: relative; z-index: 1;
        }

        .features {
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: relative; z-index: 1;
        }
        .feature {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .feature-dot {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: rgba(255,255,255,.12);
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border: 1px solid rgba(255,255,255,.15);
        }
        .feature-dot svg { width: 18px; height: 18px; color: #6ee7b7; }
        .feature-text { font-size: 14px; color: rgba(255,255,255,.8); }

        /* ── Right panel ── */
        .panel-right {
          background: #fff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 60px 48px;
          opacity: 0;
          transform: translateX(30px);
          transition: opacity .7s ease .15s, transform .7s ease .15s;
        }
        .panel-right.in { opacity: 1; transform: translateX(0); }

        .form-box {
          width: 100%;
          max-width: 400px;
        }

        .form-header { margin-bottom: 40px; }
        .form-eyebrow {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--teal);
          margin-bottom: 10px;
        }
        .form-title {
          font-family: 'DM Serif Display', serif;
          font-size: 34px;
          color: var(--slate);
          line-height: 1.2;
        }
        .form-sub {
          font-size: 14px;
          color: var(--muted);
          margin-top: 8px;
          line-height: 1.6;
        }

        /* Fields */
        .field { margin-bottom: 22px; }
        .field label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: var(--slate);
          margin-bottom: 8px;
        }

        .input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 14px;
          color: #94a3b8;
          display: grid; place-items: center;
          pointer-events: none;
        }
        .input-icon svg { width: 17px; height: 17px; }

        .field input {
          width: 100%;
          padding: 13px 14px 13px 42px;
          border: 1.5px solid var(--border);
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: var(--slate);
          background: #f8fafc;
          outline: none;
          transition: border-color .2s, background .2s, box-shadow .2s;
        }
        .field input:focus {
          border-color: var(--teal);
          background: #fff;
          box-shadow: 0 0 0 3px rgba(13,148,136,.12);
        }
        .field input.error-field { border-color: var(--err); }

        .toggle-pass {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          display: grid; place-items: center;
          padding: 4px;
          border-radius: 6px;
          transition: color .15s;
        }
        .toggle-pass:hover { color: var(--teal); }
        .toggle-pass svg { width: 17px; height: 17px; }

        .field-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
        }
        .forgot {
          font-size: 13px;
          color: var(--teal);
          text-decoration: none;
          font-weight: 500;
          transition: color .15s;
        }
        .forgot:hover { color: var(--teal-dk); text-decoration: underline; }

        /* Error alert */
        .alert-err {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-left: 3px solid var(--err);
          border-radius: 8px;
          padding: 12px 14px;
          font-size: 13px;
          color: #dc2626;
          margin-bottom: 22px;
          display: flex;
          align-items: center;
          gap: 8px;
          animation: shake .3s ease;
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25%      { transform: translateX(-4px); }
          75%      { transform: translateX(4px); }
        }

        /* Submit btn */
        .btn-login {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, var(--teal) 0%, #0f766e 100%);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          letter-spacing: .3px;
          transition: opacity .2s, transform .15s, box-shadow .2s;
          box-shadow: 0 4px 14px rgba(13,148,136,.35);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 6px;
        }
        .btn-login:hover:not(:disabled) {
          opacity: .92;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(13,148,136,.4);
        }
        .btn-login:active { transform: translateY(0); }
        .btn-login:disabled { opacity: .65; cursor: not-allowed; }

        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Divider */
        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 24px 0;
          color: #cbd5e1;
          font-size: 12px;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        /* Demo credentials */
        .demo-box {
          background: var(--teal-lt);
          border: 1px solid #99f6e4;
          border-radius: 10px;
          padding: 14px 16px;
        }
        .demo-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--teal-dk);
          margin-bottom: 8px;
        }
        .demo-creds {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .demo-row {
          font-size: 13px;
          color: #0f766e;
          display: flex;
          gap: 6px;
        }
        .demo-row span:first-child { font-weight: 500; min-width: 70px; }
        .demo-row button {
          background: none; border: none;
          font-size: 12px; color: var(--teal);
          cursor: pointer; text-decoration: underline;
          padding: 0; margin-left: auto;
          font-family: 'DM Sans', sans-serif;
        }

        /* Footer */
        .form-footer {
          margin-top: 28px;
          text-align: center;
          font-size: 13px;
          color: var(--muted);
        }
        .form-footer a {
          color: var(--teal);
          font-weight: 500;
          text-decoration: none;
        }
        .form-footer a:hover { text-decoration: underline; }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .page { grid-template-columns: 1fr; }
          .panel-left { display: none; }
          .panel-right { padding: 40px 24px; }
        }
      `}</style>

      <div className="page">

        {/* ── Left ── */}
        <div className={`panel-left${mounted ? ' in' : ''}`}>
          <div className="brand">
            <div className="brand-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:'#fff'}}>
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <div>
              <div className="brand-name">MediShop</div>
              <div className="brand-tag">Pharmacy System</div>
            </div>
          </div>

          <h1 className="hero-heading">
            Your trusted<br/>
            <em>medical inventory</em><br/>
            platform
          </h1>
          <p className="hero-sub">
            Streamline prescriptions, stock management, and billing for your pharmacy — all in one secure place.
          </p>

          <div className="features">
            {[
              { label: 'Real-time stock tracking & alerts',
                icon: <path d="M3 3h18v18H3zM9 9h6M9 12h6M9 15h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/> },
              { label: 'Prescription & billing management',
                icon: <><path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></> },
              { label: 'Role-based secure access control',
                icon: <><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></> },
            ].map((f, i) => (
              <div className="feature" key={i}>
                <div className="feature-dot">
                  <svg viewBox="0 0 24 24" fill="none">{f.icon}</svg>
                </div>
                <span className="feature-text">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right ── */}
        <div className={`panel-right${mounted ? ' in' : ''}`}>
          <div className="form-box">
            <div className="form-header">
              <div className="form-eyebrow">Secure Portal</div>
              <h2 className="form-title">Sign in to<br/>your account</h2>
              <p className="form-sub">Enter your credentials to access the pharmacy dashboard.</p>
            </div>

            {error && (
              <div className="alert-err">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="field">
                <label htmlFor="email">Email address</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/>
                    </svg>
                  </span>
                  <input
                    id="email" type="email"
                    placeholder="admin@medishop.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(null); }}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="password">Password</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                  </span>
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(null); }}
                    autoComplete="current-password"
                    required
                  />
                  <button type="button" className="toggle-pass" onClick={() => setShowPass(!showPass)}>
                    {showPass
                      ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                <div className="field-footer">
                  <span/>
                  <button type="button" className="forgot" onClick={() => {}}>
                    Forgot password?
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-login" disabled={loading}>
                {loading
                  ? <><div className="spinner"/> Signing in…</>
                  : <>
                      Sign In
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </>
                }
              </button>
            </form>

            <div className="divider">Demo credentials</div>

            <div className="demo-box">
              <div className="demo-label">Quick fill</div>
              <div className="demo-creds">
                {[
                  { label: 'Email:', value: 'admin@medishop.com' },
                  { label: 'Password:', value: 'Admin@1234' },
                ].map((row, i) => (
                  <div className="demo-row" key={i}>
                    <span>{row.label}</span>
                    <span>{row.value}</span>
                    <button onClick={() => i === 0 ? setEmail(row.value) : setPassword(row.value)}>
                      fill
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <p className="form-footer">
              New to MediShop? <a href="/register">Create an account</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
