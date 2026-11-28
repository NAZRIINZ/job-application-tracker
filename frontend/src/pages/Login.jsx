// ============================================================
// Login.jsx - Login page
// ============================================================
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API_URL from '../api';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Form field values
  const [form, setForm] = useState({ email: '', password: '' });
  // Validation errors for fields
  const [errors, setErrors] = useState({});
  // Server‑side error (wrong credentials, etc.)
  const [apiError, setApiError] = useState('');
  // Show the “Resend verification” UI when login fails with 403
  const [showResend, setShowResend] = useState(false);
  // Message returned from the resend‑verification endpoint
  const [resendMessage, setResendMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  // Loading state while waiting for server response
  const [loading, setLoading] = useState(false);

  // -----------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------
  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear field‑level error when the user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setApiError('');
  }

  function validate() {
    const newErrors = {};
    if (!form.email.trim()) newErrors.email = 'Email is required';
    if (!form.password.trim()) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError('');
    setShowResend(false);
    setResendMessage('');

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        // Successful login – store token & navigate to dashboard
        login(data.token, data.user);
        navigate('/dashboard');
      } else {
        // Unverified email – show the resend UI
        if (response.status === 403) {
          setShowResend(true);
        }
        setApiError(data.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setApiError('Cannot connect to server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendLoading(true);
    setResendMessage('');
    try {
      const resp = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });
      const result = await resp.json();
      if (resp.ok && result.success) {
        setResendMessage(result.message || 'Verification email sent. Please check your inbox.');
      } else {
        setResendMessage(result.message || 'Failed to resend verification email.');
      }
    } catch (e) {
      setResendMessage('Error contacting server.');
    } finally {
      setResendLoading(false);
    }
  }

  // -----------------------------------------------------------
  // Render UI
  // -----------------------------------------------------------
  return (
    <>
      <style>{`
        .forgot-password-row {
          display: flex;
          justify-content: flex-end;
          margin-top: -10px;
          margin-bottom: 18px;
        }
        .forgot-password-row a {
          color: #1749b5;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
        }
        .forgot-password-row a:hover {
          color: #10398f;
          text-decoration: underline;
        }
      `}</style>

      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">💼</div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your JobTracker account</p>

          {/* Server error alert */}
          {apiError && (
            <div className="alert alert-danger">
              <span>⚠️</span> <span>{apiError}</span>
            </div>
          )}

          {/* Resend verification UI */}
          {showResend && (
            <div className="alert alert-info mb-3">
              <p>Your email is not verified. Please verify your email to continue.</p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleResend}
                disabled={resendLoading}
              >
                {resendLoading ? 'Sending...' : 'Resend Verification Email'}
              </button>
              {resendMessage && <p className="mt-2">{resendMessage}</p>}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address <span className="required">*</span>
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={`form-control ${errors.email ? 'error' : ''}`}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {errors.email && <p className="form-error">⚠ {errors.email}</p>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password <span className="required">*</span>
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className={`form-control ${errors.password ? 'error' : ''}`}
                placeholder="Your password"
                autoComplete="current-password"
              />
              {errors.password && <p className="form-error">⚠ {errors.password}</p>}
            </div>

            {/* Forgot Password */}
            <div className="forgot-password-row">
              <Link to="/forgot-password">Forgot Password?</Link>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
            >
              {loading ? 'Signing in...' : '→ Sign In'}
            </button>
          </form>

          {/* Demo credentials hint (kept commented) */}
          {/*
          <div className="alert alert-info mt-16" style={{ fontSize: '0.8rem' }}>
            <div>
              <strong>Demo Login:</strong><br />
              Email: test@example.com<br />
              Password: password123
            </div>
          </div>
          */}

          <div className="auth-footer">
            Don't have an account? <Link to="/register">Create one free →</Link>
          </div>
        </div>
      </div>
    </>
  );
}
