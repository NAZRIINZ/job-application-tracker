
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import API_URL from '../api'

export default function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    async function handleSubmit(e) {
        e.preventDefault()

        setError('')
        setSuccess('')

        if (!email.trim()) {
            setError('Please enter your email address.')
            return
        }

        setLoading(true)

        try {
            const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email.trim() })
            })

            const data = await response.json()

            if (response.ok && data.success) {
                setSuccess(
                    data.message ||
                    'Password reset link has been sent to your email address. Please check your inbox.'
                )
            } else {
                setError(data.message || 'Unable to process your request. Please try again.')
            }
        } catch (err) {
            setError('Cannot connect to server. Is the backend running?')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">🔐</div>

                <h1 className="auth-title">Forgot Password?</h1>

                <p className="auth-subtitle">
                    Enter your registered email address. We will send you a link
                    to reset your password.
                </p>

                {error && (
                    <div className="alert alert-danger">
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="alert alert-success">
                        <span>✓</span>
                        <span>{success}</span>
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
                            value={email}
                            onChange={e => {
                                setEmail(e.target.value)
                                setError('')
                                setSuccess('')
                            }}
                            className="form-control"
                            placeholder="you@example.com"
                            autoComplete="email"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-full btn-lg"
                        disabled={loading}
                    >
                        {loading ? 'Sending...' : '📧 Send Reset Link'}
                    </button>
                </form>

                <div className="auth-footer">
                    Remember your password?{' '}
                    <Link to="/login">Back to Login →</Link>
                </div>
            </div>
        </div>
    )
}
