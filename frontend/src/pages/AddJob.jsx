// ============================================================
// AddJob.jsx - Form to add a new job application
// ============================================================
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const STATUS_OPTIONS = ['Wishlist', 'Applied', 'Interview', 'Offer Received', 'Rejected']

// Get today's date in YYYY-MM-DD format for the date input default
function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export default function AddJob() {
  const navigate = useNavigate()
  const { getAuthHeaders } = useAuth()

  const [form, setForm] = useState({
    company_name:     '',
    job_title:        '',
    location:         '',
    salary:           '',
    application_date: todayISO(),
    status:           'Applied',
    job_link:         '',
    notes:            '',
    follow_up_date:   '',
  })

  const [errors,   setErrors]   = useState({})
  const [apiError, setApiError] = useState('')
  const [success,  setSuccess]  = useState('')
  const [loading,  setLoading]  = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    setApiError('')
  }

  function validate() {
    const errs = {}
    if (!form.company_name.trim())     errs.company_name     = 'Company name is required'
    if (!form.job_title.trim())        errs.job_title        = 'Job title is required'
    if (!form.application_date)        errs.application_date = 'Application date is required'
    if (!STATUS_OPTIONS.includes(form.status)) errs.status   = 'Please select a valid status'
    if (form.job_link && !isValidUrl(form.job_link)) {
      errs.job_link = 'Please enter a valid URL (e.g. https://...)'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setApiError('')
    setSuccess('')

    try {
      const res  = await fetch('/api/jobs', {
        method:  'POST',
        headers: getAuthHeaders(),
        body:    JSON.stringify(form),
      })
      const data = await res.json()

      if (data.success) {
        setSuccess('Application added successfully!')
        // Redirect to job list after a short delay
        setTimeout(() => navigate('/jobs'), 1200)
      } else {
        setApiError(data.message || 'Failed to add job.')
      }
    } catch {
      setApiError('Cannot connect to server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Add Application</h1>
          <p className="page-subtitle">Track a new job you've applied to or want to apply to</p>
        </div>
        <Link to="/jobs" className="btn btn-secondary">← Back to Jobs</Link>
      </div>

      {success && (
        <div className="alert alert-success">
          <span>✅</span>
          <span>{success}</span>
        </div>
      )}

      {apiError && (
        <div className="alert alert-danger">
          <span>⚠️</span>
          <span>{apiError}</span>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">📝 Job Details</h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} noValidate>

            {/* Row 1 */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="company_name">
                  Company Name <span className="required">*</span>
                </label>
                <input
                  id="company_name"
                  type="text"
                  name="company_name"
                  value={form.company_name}
                  onChange={handleChange}
                  className={`form-control ${errors.company_name ? 'error' : ''}`}
                  placeholder="e.g. Google, Microsoft, Amazon"
                />
                {errors.company_name && <p className="form-error">⚠ {errors.company_name}</p>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="job_title">
                  Job Title <span className="required">*</span>
                </label>
                <input
                  id="job_title"
                  type="text"
                  name="job_title"
                  value={form.job_title}
                  onChange={handleChange}
                  className={`form-control ${errors.job_title ? 'error' : ''}`}
                  placeholder="e.g. Software Engineer, Frontend Developer"
                />
                {errors.job_title && <p className="form-error">⚠ {errors.job_title}</p>}
              </div>
            </div>

            {/* Row 2 */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="location">Location</label>
                <input
                  id="location"
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="e.g. New York, NY or Remote"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="salary">Salary Range</label>
                <input
                  id="salary"
                  type="text"
                  name="salary"
                  value={form.salary}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="e.g. $80,000 - $100,000"
                />
              </div>
            </div>

            {/* Row 3 */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="application_date">
                  Application Date <span className="required">*</span>
                </label>
                <input
                  id="application_date"
                  type="date"
                  name="application_date"
                  value={form.application_date}
                  onChange={handleChange}
                  className={`form-control ${errors.application_date ? 'error' : ''}`}
                />
                {errors.application_date && <p className="form-error">⚠ {errors.application_date}</p>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className={`form-control ${errors.status ? 'error' : ''}`}
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.status && <p className="form-error">⚠ {errors.status}</p>}
              </div>
            </div>

            {/* Row 4 */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="job_link">Job Posting URL</label>
                <input
                  id="job_link"
                  type="url"
                  name="job_link"
                  value={form.job_link}
                  onChange={handleChange}
                  className={`form-control ${errors.job_link ? 'error' : ''}`}
                  placeholder="https://company.com/careers/job-123"
                />
                {errors.job_link && <p className="form-error">⚠ {errors.job_link}</p>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="follow_up_date">Follow-up Date</label>
                <input
                  id="follow_up_date"
                  type="date"
                  name="follow_up_date"
                  value={form.follow_up_date}
                  onChange={handleChange}
                  className="form-control"
                />
                <p className="text-muted text-sm mt-4">Set a reminder to follow up</p>
              </div>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label className="form-label" htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                className="form-control"
                rows={4}
                placeholder="Add any notes about this application — referrals, interview prep, impressions, etc."
              />
            </div>

            {/* Form actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: '20px', marginTop: '8px' }}>
              <Link to="/jobs" className="btn btn-secondary">Cancel</Link>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : '💾 Save Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function isValidUrl(str) {
  try {
    const url = new URL(str)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
