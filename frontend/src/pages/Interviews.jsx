// ============================================================
// Interviews.jsx - Manage interview schedule
// ============================================================
import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import API_URL from '../api'
import { LoadingSpinner, ConfirmModal, StatusBadge } from '../components/Layout'


const INTERVIEW_TYPES  = ['Phone Screen', 'Technical', 'HR Round', 'Final Round', 'On-site', 'Video Call', 'Other']
const INTERVIEW_RESULTS = ['Scheduled', 'Completed', 'Passed', 'Failed', 'Cancelled']

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(timeStr) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':')
  const date = new Date()
  date.setHours(parseInt(h), parseInt(m))
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function toInputDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().split('T')[0]
}

export default function Interviews() {
  const { getAuthHeaders } = useAuth()

  const [interviews,  setInterviews]  = useState([])
  const [jobs,        setJobs]        = useState([])    // For the "Job" dropdown
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')

  // Form state
  const [showForm,    setShowForm]    = useState(false)
  const [editMode,    setEditMode]    = useState(false)
  const [editId,      setEditId]      = useState(null)
  const [form,        setForm]        = useState(defaultForm())
  const [formErrors,  setFormErrors]  = useState({})
  const [saving,      setSaving]      = useState(false)
  const [formError,   setFormError]   = useState('')

  // Delete modal
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null })
  const [deleting,    setDeleting]    = useState(false)

  function defaultForm() {
    return {
      job_id:         '',
      interview_date: '',
      interview_time: '',
      interview_type: 'Phone Screen',
      notes:          '',
      result:         'Scheduled',
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      // Fetch interviews and jobs in parallel
      const [intRes, jobRes] = await Promise.all([
          fetch(`${API_URL}/api/interviews`, { headers: getAuthHeaders() }),
          fetch(`${API_URL}/api/jobs?limit=100`, { headers: getAuthHeaders() })
      ])
      const [intData, jobData] = await Promise.all([intRes.json(), jobRes.json()])

      if (intData.success) setInterviews(intData.data)
      if (jobData.success) setJobs(jobData.data)
    } catch {
      setError('Cannot connect to server.')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }))
    setFormError('')
  }

  function validateForm() {
    const errs = {}
    if (!form.job_id)          errs.job_id         = 'Please select a job'
    if (!form.interview_date)  errs.interview_date = 'Interview date is required'
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  function openAddForm() {
    setForm(defaultForm())
    setFormErrors({})
    setFormError('')
    setEditMode(false)
    setEditId(null)
    setShowForm(true)
  }

  function openEditForm(interview) {
    setForm({
      job_id:         String(interview.job_id),
      interview_date: toInputDate(interview.interview_date),
      interview_time: interview.interview_time ? interview.interview_time.slice(0, 5) : '',
      interview_type: interview.interview_type || 'Phone Screen',
      notes:          interview.notes || '',
      result:         interview.result || 'Scheduled',
    })
    setFormErrors({})
    setFormError('')
    setEditMode(true)
    setEditId(interview.id)
    setShowForm(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!validateForm()) return

    setSaving(true)
    setFormError('')

    try {
        const url = editMode
            ? `${API_URL}/api/interviews/${editId}`
            : `${API_URL}/api/interviews`

        const method = editMode ? 'PUT' : 'POST'

      const res  = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body:    JSON.stringify(form),
      })
      const data = await res.json()

      if (data.success) {
        setShowForm(false)
        fetchAll()
      } else {
        setFormError(data.message || 'Failed to save interview.')
      }
    } catch {
      setFormError('Cannot connect to server.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
        const res = await fetch(`${API_URL}/api/interviews/${deleteModal.id}`, {
        method:  'DELETE',
        headers: getAuthHeaders(),
      })
      const data = await res.json()
      if (data.success) {
        setDeleteModal({ open: false, id: null })
        fetchAll()
      } else {
        alert(data.message || 'Delete failed.')
      }
    } catch {
      alert('Server error.')
    } finally {
      setDeleting(false)
    }
  }

  // Separate upcoming vs past interviews
  const today      = new Date().toDateString()
  const upcoming   = interviews.filter(i => new Date(i.interview_date) >= new Date() || new Date(i.interview_date).toDateString() === today)
  const past       = interviews.filter(i => new Date(i.interview_date) < new Date() && new Date(i.interview_date).toDateString() !== today)

  if (loading) return <LoadingSpinner text="Loading interviews..." />

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Interviews</h1>
          <p className="page-subtitle">
            {upcoming.length} upcoming · {past.length} past
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAddForm}>
          + Schedule Interview
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Interview Form (add/edit) */}
      {showForm && (
        <div className="card mb-16">
          <div className="card-header">
            <h2 className="card-title">
              {editMode ? '✏️ Edit Interview' : '+ Schedule Interview'}
            </h2>
            <button className="btn btn-icon" onClick={() => setShowForm(false)}>✕</button>
          </div>
          <div className="card-body">
            {formError && (
              <div className="alert alert-danger mb-16">
                <span>⚠️</span>
                <span>{formError}</span>
              </div>
            )}
            <form onSubmit={handleSave} noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="job_id">
                    Job Application <span className="required">*</span>
                  </label>
                  <select
                    id="job_id"
                    name="job_id"
                    value={form.job_id}
                    onChange={handleChange}
                    className={`form-control ${formErrors.job_id ? 'error' : ''}`}
                  >
                    <option value="">— Select a job —</option>
                    {jobs.map(j => (
                      <option key={j.id} value={j.id}>
                        {j.company_name} – {j.job_title}
                      </option>
                    ))}
                  </select>
                  {formErrors.job_id && <p className="form-error">⚠ {formErrors.job_id}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="interview_type">Interview Type</label>
                  <select
                    id="interview_type"
                    name="interview_type"
                    value={form.interview_type}
                    onChange={handleChange}
                    className="form-control"
                  >
                    {INTERVIEW_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="interview_date">
                    Date <span className="required">*</span>
                  </label>
                  <input
                    id="interview_date"
                    type="date"
                    name="interview_date"
                    value={form.interview_date}
                    onChange={handleChange}
                    className={`form-control ${formErrors.interview_date ? 'error' : ''}`}
                  />
                  {formErrors.interview_date && <p className="form-error">⚠ {formErrors.interview_date}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="interview_time">Time</label>
                  <input
                    id="interview_time"
                    type="time"
                    name="interview_time"
                    value={form.interview_time}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="result">Result / Status</label>
                <select
                  id="result"
                  name="result"
                  value={form.result}
                  onChange={handleChange}
                  className="form-control"
                >
                  {INTERVIEW_RESULTS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="notes">Preparation Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  className="form-control"
                  rows={3}
                  placeholder="Topics to study, questions to prepare, company research..."
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editMode ? 'Update' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upcoming Interviews */}
      <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
        📅 Upcoming ({upcoming.length})
      </h2>

      {upcoming.length === 0 ? (
        <div className="card mb-24">
          <div className="empty-state">
            <div className="empty-icon">🗓️</div>
            <p className="empty-title">No upcoming interviews</p>
            <p className="empty-desc">Schedule your next interview above</p>
          </div>
        </div>
      ) : (
        <div className="mb-24">
          {upcoming.map(i => (
            <InterviewCard
              key={i.id}
              interview={i}
              onEdit={openEditForm}
              onDelete={id => setDeleteModal({ open: true, id })}
            />
          ))}
        </div>
      )}

      {/* Past Interviews */}
      {past.length > 0 && (
        <>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
            📁 Past Interviews ({past.length})
          </h2>
          {past.map(i => (
            <InterviewCard
              key={i.id}
              interview={i}
              onEdit={openEditForm}
              onDelete={id => setDeleteModal({ open: true, id })}
              past
            />
          ))}
        </>
      )}

      <ConfirmModal
        isOpen={deleteModal.open}
        title="Delete Interview"
        description="Are you sure you want to delete this interview record?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ open: false, id: null })}
        loading={deleting}
      />
    </div>
  )
}

// Single interview card component
function InterviewCard({ interview, onEdit, onDelete, past }) {
  const d     = new Date(interview.interview_date)
  const day   = d.getDate()
  const month = d.toLocaleString('default', { month: 'short' })

  const resultColors = {
    Scheduled:  '#1d4ed8',
    Completed:  '#374151',
    Passed:     '#065f46',
    Failed:     '#991b1b',
    Cancelled:  '#6b7280',
  }

  return (
    <div className="interview-card" style={{ opacity: past ? 0.75 : 1 }}>
      <div className="interview-date-block">
        <div className="interview-day">{day}</div>
        <div className="interview-month">{month}</div>
      </div>

      <div className="interview-info">
        <p className="interview-company">
          {interview.company_name} – {interview.job_title}
        </p>
        <div className="interview-meta">
          <span className="meta-item">📋 {interview.interview_type}</span>
          {interview.interview_time && (
            <span className="meta-item">🕐 {formatTime(interview.interview_time)}</span>
          )}
          <span className="meta-item" style={{ color: resultColors[interview.result] || '#374151', fontWeight: 600 }}>
            ● {interview.result}
          </span>
        </div>
        {interview.notes && (
          <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '6px' }}>
            📝 {interview.notes.slice(0, 100)}{interview.notes.length > 100 ? '...' : ''}
          </p>
        )}
      </div>

      <div className="action-buttons">
        <button className="btn btn-icon" onClick={() => onEdit(interview)} title="Edit">✏️</button>
              <button className="btn btn-icon" onClick={() => onDelete(interview.id)} title="Delete" style={{ color: '#ef4444' }}>🗑️</button>
      </div>
    </div>
  )
}


