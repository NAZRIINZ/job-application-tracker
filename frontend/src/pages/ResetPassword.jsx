
import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import API_URL from '../api'

export default function ResetPassword() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    // Get reset token from the email URL
    const token = searchParams.get('token')

    const [form, setForm] = useState({
        newPassword: '',
        confirmPassword: ''
    })

    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)

    function handleChange(e) {
        const { name, value } = e.target

        setForm(prev => ({
            ...prev,
            [name]: value
        }))

        setError('')
    }

    async function handleSubmit(e) {
        e.preventDefault()

        setError('')
        setSuccess('')

        if (!token) {
            setError('Invalid or missing password reset link.')
            return
        }

        if (form.newPassword.length < 6) {
            setError('Password must contain at least 6 characters.')
            return
        }

        if (form.newPassword !== form.confirmPassword) {
            setError('Passwords do not match.')
            return
        }

        setLoading(true)

        try {
            const response = await fetch(`${API_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token,
                    newPassword: form.newPassword
                })
            })

            const data = await response.json()

            if (response.ok && data.success) {
                setSuccess('Your password has been reset successfully.')

                setTimeout(() => {
                    navigate('/login')
                }, 2000)
            } else {
                setError(data.message || 'Unable to reset password. The link may have expired.')
            }
        } catch (err) {
            setError('Cannot connect to server. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">🔑</div>

                <h1 className="auth-title">Reset Password</h1>

                <p className="auth-subtitle">
                    Create a new password for your JobTracker account.
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

                {!token ? (
                    <div className="alert alert-danger">
                        Invalid or missing reset token. Please request a new password reset link.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="form-group">
                            <label className="form-label" htmlFor="newPassword">
                                New Password <span className="required">*</span>
                            </label>

                            <input
                                id="newPassword"
                                type="password"
                                name="newPassword"
                                value={form.newPassword}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="Enter new password"
                                autoComplete="new-password"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="confirmPassword">
                                Confirm New Password <span className="required">*</span>
                            </label>

                            <input
                                id="confirmPassword"
                                type="password"
                                name="confirmPassword"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="Confirm new password"
                                autoComplete="new-password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-full btn-lg"
                            disabled={loading || !!success}
                        >
                            {loading ? 'Updating...' : '🔒 Reset Password'}
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    <Link to="/login">← Back to Login</Link>
                </div>
            </div>
        </div>
    )
}
