// ============================================================
// Login.jsx - Login page
// ============================================================
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API_URL from '../api'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  // Form field values
  const [form, setForm]       = useState({ email: '', password: '' })
  // Error messages
  const [errors, setErrors]   = useState({})
  // Server error (wrong credentials, etc.)
  const [apiError, setApiError] = useState('')
  // Loading state while waiting for server response
  const [loading, setLoading] = useState(false)

  // Update form field on change
  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    // Clear field-level error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
    setApiError('')
  }

  // Validate form before submitting
  function validate() {
    const newErrors = {}
    if (!form.email.trim())    newErrors.email    = 'Email is required'
    if (!form.password.trim()) newErrors.password = 'Password is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()                 // Prevent default form submission (page reload)
    if (!validate()) return             // Stop if validation fails

    setLoading(true)
    setApiError('')

    try {
      // Send POST request to the backend
        const response = await fetch(`${API_URL}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })

      const data = await response.json()

      if (data.success) {
        // Login successful! Save token and redirect to dashboard
        login(data.token, data.user)
        navigate('/dashboard')
      } else {
        // Show the error message from the server
        setApiError(data.message || 'Login failed. Please try again.')
      }
    } catch (err) {
      setApiError('Cannot connect to server. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">💼</div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your JobTracker account</p>

        {/* Server error alert */}
        {apiError && (
          <div className="alert alert-danger">
            <span>⚠️</span>
            <span>{apiError}</span>
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
            {errors.email && (
              <p className="form-error">⚠ {errors.email}</p>
            )}
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
            {errors.password && (
              <p className="form-error">⚠ {errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
          >
            {loading ? 'Signing in...' : '→ Sign In'}
          </button>
        </form>

        {/* Demo credentials hint */}
        <div className="alert alert-info mt-16" style={{ fontSize: '0.8rem' }}>
          <div>
            <strong>Demo Login:</strong><br />
            Email: test@example.com<br />
            Password: password123
          </div>
        </div>

        <div className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register">Create one free →</Link>
        </div>
      </div>
    </div>
  )
}
