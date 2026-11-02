// ============================================================
// Profile.jsx - User profile settings page
// ============================================================
import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user, getAuthHeaders, updateUser } = useAuth()

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name:  user?.name  || '',
    email: user?.email || '',
  })
  const [profileErrors,  setProfileErrors]  = useState({})
  const [profileMsg,     setProfileMsg]     = useState({ type: '', text: '' })
  const [savingProfile,  setSavingProfile]  = useState(false)

  // Password form
  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
  })
  const [pwdErrors,  setPwdErrors]  = useState({})
  const [pwdMsg,     setPwdMsg]     = useState({ type: '', text: '' })
  const [savingPwd,  setSavingPwd]  = useState(false)

  // Get initials for avatar
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  // ---- Profile update ----
  function handleProfileChange(e) {
    const { name, value } = e.target
    setProfileForm(prev => ({ ...prev, [name]: value }))
    if (profileErrors[name]) setProfileErrors(prev => ({ ...prev, [name]: '' }))
    setProfileMsg({ type: '', text: '' })
  }

  function validateProfile() {
    const errs = {}
    if (!profileForm.name.trim())  errs.name  = 'Name is required'
    if (!profileForm.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email)) errs.email = 'Invalid email'
    setProfileErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleProfileSave(e) {
    e.preventDefault()
    if (!validateProfile()) return

    setSavingProfile(true)
    setProfileMsg({ type: '', text: '' })

    try {
      const res  = await fetch('/api/auth/profile', {
        method:  'PUT',
        headers: getAuthHeaders(),
        body:    JSON.stringify(profileForm),
      })
      const data = await res.json()

      if (data.success) {
        updateUser(profileForm)
        setProfileMsg({ type: 'success', text: '✅ Profile updated successfully!' })
      } else {
        setProfileMsg({ type: 'danger', text: data.message || 'Update failed.' })
      }
    } catch {
      setProfileMsg({ type: 'danger', text: 'Cannot connect to server.' })
    } finally {
      setSavingProfile(false)
    }
  }

  // ---- Password change ----
  function handlePwdChange(e) {
    const { name, value } = e.target
    setPwdForm(prev => ({ ...prev, [name]: value }))
    if (pwdErrors[name]) setPwdErrors(prev => ({ ...prev, [name]: '' }))
    setPwdMsg({ type: '', text: '' })
  }

  function validatePwd() {
    const errs = {}
    if (!pwdForm.currentPassword)   errs.currentPassword = 'Current password is required'
    if (!pwdForm.newPassword)        errs.newPassword     = 'New password is required'
    else if (pwdForm.newPassword.length < 6) errs.newPassword = 'Min. 6 characters'
    if (pwdForm.newPassword !== pwdForm.confirmPassword)
      errs.confirmPassword = 'Passwords do not match'
    setPwdErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handlePwdSave(e) {
    e.preventDefault()
    if (!validatePwd()) return

    setSavingPwd(true)
    setPwdMsg({ type: '', text: '' })

    try {
      const res  = await fetch('/api/auth/password', {
        method:  'PUT',
        headers: getAuthHeaders(),
        body:    JSON.stringify({
          currentPassword: pwdForm.currentPassword,
          newPassword:     pwdForm.newPassword,
        }),
      })
      const data = await res.json()

      if (data.success) {
        setPwdMsg({ type: 'success', text: '✅ Password changed successfully!' })
        setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setPwdMsg({ type: 'danger', text: data.message || 'Password change failed.' })
      }
    } catch {
      setPwdMsg({ type: 'danger', text: 'Cannot connect to server.' })
    } finally {
      setSavingPwd(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile Settings</h1>
          <p className="page-subtitle">Manage your account details and security</p>
        </div>
      </div>

      {/* Profile Info */}
      <div className="card mb-24">
        <div className="card-header">
          <h2 className="card-title">👤 Account Information</h2>
        </div>
        <div className="card-body">
          {/* Avatar + Name banner */}
          <div className="profile-avatar-section">
            <div className="profile-avatar">{initials}</div>
            <div>
              <div className="profile-name">{user?.name}</div>
              <div className="profile-email">{user?.email}</div>
            </div>
          </div>

          {profileMsg.text && (
            <div className={`alert alert-${profileMsg.type} mb-16`}>
              <span>{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleProfileSave} noValidate>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="name">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  className={`form-control ${profileErrors.name ? 'error' : ''}`}
                />
                {profileErrors.name && <p className="form-error">⚠ {profileErrors.name}</p>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Email Address <span className="required">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  className={`form-control ${profileErrors.email ? 'error' : ''}`}
                />
                {profileErrors.email && <p className="form-error">⚠ {profileErrors.email}</p>}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                {savingProfile ? 'Saving...' : '💾 Update Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Change Password */}
      <div className="card mb-24">
        <div className="card-header">
          <h2 className="card-title">🔒 Change Password</h2>
        </div>
        <div className="card-body">
          {pwdMsg.text && (
            <div className={`alert alert-${pwdMsg.type} mb-16`}>
              <span>{pwdMsg.text}</span>
            </div>
          )}

          <form onSubmit={handlePwdSave} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="currentPassword">
                Current Password <span className="required">*</span>
              </label>
              <input
                id="currentPassword"
                type="password"
                name="currentPassword"
                value={pwdForm.currentPassword}
                onChange={handlePwdChange}
                className={`form-control ${pwdErrors.currentPassword ? 'error' : ''}`}
                autoComplete="current-password"
              />
              {pwdErrors.currentPassword && <p className="form-error">⚠ {pwdErrors.currentPassword}</p>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="newPassword">
                  New Password <span className="required">*</span>
                </label>
                <input
                  id="newPassword"
                  type="password"
                  name="newPassword"
                  value={pwdForm.newPassword}
                  onChange={handlePwdChange}
                  className={`form-control ${pwdErrors.newPassword ? 'error' : ''}`}
                  autoComplete="new-password"
                  placeholder="Min. 6 characters"
                />
                {pwdErrors.newPassword && <p className="form-error">⚠ {pwdErrors.newPassword}</p>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">
                  Confirm New Password <span className="required">*</span>
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  value={pwdForm.confirmPassword}
                  onChange={handlePwdChange}
                  className={`form-control ${pwdErrors.confirmPassword ? 'error' : ''}`}
                  autoComplete="new-password"
                />
                {pwdErrors.confirmPassword && <p className="form-error">⚠ {pwdErrors.confirmPassword}</p>}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={savingPwd}>
                {savingPwd ? 'Changing...' : '🔑 Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Security info card */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">🛡️ Security Information</h2>
        </div>
        <div className="card-body">
          <div className="alert alert-info">
            <div>
              <p><strong>How your data is protected:</strong></p>
              <ul style={{ marginTop: '8px', paddingLeft: '20px', lineHeight: '2' }}>
                <li>Passwords are hashed with bcrypt (10 salt rounds) — never stored in plain text</li>
                <li>Authentication uses JWT tokens with 7-day expiration</li>
                <li>All database queries use parameterized statements to prevent SQL injection</li>
                <li>You can only access your own job records — other users' data is protected</li>
              </ul>
              <p style={{ marginTop: '8px', fontSize: '0.8rem', opacity: 0.8 }}>
                ⚠️ Note: JWT tokens are stored in localStorage in this project for simplicity.
                In a production app, HttpOnly cookies are more secure against XSS attacks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
