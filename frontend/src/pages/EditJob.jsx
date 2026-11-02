// ============================================================
// EditJob.jsx - Edit an existing job application
// ============================================================
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingSpinner } from '../components/Layout'
import API_URL from '../api'

const STATUS_OPTIONS = ['Wishlist', 'Applied', 'Interview', 'Offer Received', 'Rejected']

function isValidUrl(str) {
  try {
    const url = new URL(str)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch { return false }
}

// Format a date from SQL Server (e.g. "2024-01-10T00:00:00.000Z") to "YYYY-MM-DD"
// The HTML date input requires the YYYY-MM-DD format
function toInputDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().split('T')[0]
}

export default function EditJob() {
  const { id } = useParams()              // Get job ID from URL (/jobs/5/edit → id = "5")
  const navigate = useNavigate()
  const { getAuthHeaders } = useAuth()

  const [form, setForm] = useState(null)  // null means "not loaded yet"
  const [errors,   setErrors]   = useState({})
  const [apiError, setApiError] = useState('')
  const [success,  setSuccess]  = useState('')
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)

  // Fetch existing job data when component loads
  useEffect(() => {
    async function fetchJob() {
      try {
       const res = await fetch(`${API_URL}/api/jobs/${id}`, { headers: getAuthHeaders() })
        const data = await res.json()

        if (data.success) {
          // Pre-populate the form with existing values
          const job = data.data
          setForm({
            company_name:     job.company_name     || '',
            job_title:        job.job_title        || '',
            location:         job.location         || '',
            salary:           job.salary           || '',
            application_date: toInputDate(job.application_date),
            status:           job.status           || 'Applied',
            job_link:         job.job_link         || '',
            notes:            job.notes            || '',
            follow_up_date:   toInputDate(job.follow_up_date),
          })
        } else {
          setApiError(data.message || 'Job not found.')
        }
      } catch {
        setApiError('Cannot connect to server.')
      } finally {
        setLoading(false)
      }
    }
    fetchJob()
  }, [id])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    setApiError('')
  }

  function validate() {
    const errs = {}
    if (!form.company_name.trim())  errs.company_name     = 'Company name is required'
    if (!form.job_title.trim())     errs.job_title        = 'Job title is required'
    if (!form.application_date)     errs.application_date = 'Application date is required'
    if (form.job_link && !isValidUrl(form.job_link)) errs.job_link = 'Please enter a valid URL'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    setApiError('')
    setSuccess('')

    try {
      const res = await fetch(`${API_URL}/api/jobs/${id}`, {
        method:  'PUT',
        headers: getAuthHeaders(),
        body:    JSON.stringify(form),
      })
      const data = await res.json()

      if (data.success) {
        setSuccess('Application updated successfully!')
        setTimeout(() => navigate('/jobs'), 1200)
      } else {
        setApiError(data.message || 'Update failed.')
      }
    } catch {
      setApiError('Cannot connect to server.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner text="Loading job details..." />

  if (!form) {
    return (
      <div>
        <div className="alert alert-danger">
          <span>⚠️</span>
          <span>{apiError || 'Job not found.'}</span>
        </div>
        <Link to="/jobs" className="btn btn-secondary">← Back to Jobs</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Application</h1>
          <p className="page-subtitle">{form.company_name} – {form.job_title}</p>
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
          <h2 className="card-title">✏️ Update Job Details</h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} noValidate>
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
                />
                {errors.job_title && <p className="form-error">⚠ {errors.job_title}</p>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="location">Location</label>
                <input id="location" type="text" name="location"
                  value={form.location} onChange={handleChange} className="form-control"
                  placeholder="City, State or Remote"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="salary">Salary Range</label>
                <input id="salary" type="text" name="salary"
                  value={form.salary} onChange={handleChange} className="form-control"
                  placeholder="e.g. $80,000 - $100,000"
                />
              </div>
            </div>

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
                <select id="status" name="status" value={form.status}
                  onChange={handleChange} className="form-control">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

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
                  placeholder="https://..."
                />
                {errors.job_link && <p className="form-error">⚠ {errors.job_link}</p>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="follow_up_date">Follow-up Date</label>
                <input id="follow_up_date" type="date" name="follow_up_date"
                  value={form.follow_up_date} onChange={handleChange} className="form-control"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                className="form-control"
                rows={4}
                placeholder="Interview notes, preparation, impressions..."
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
              <Link to="/jobs" className="btn btn-secondary">Cancel</Link>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : '💾 Update Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
