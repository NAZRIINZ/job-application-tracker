// ============================================================
// Interviews.jsx - Manage interview schedule
// ============================================================
import React, { useState, useEffect } from 'react'

import { useAuth } from '../context/AuthContext'
import API_URL from '../api'
import Calendar from '../components/Calendar';
import { LoadingSpinner } from '../components/Layout';


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
  const [loading,     setLoading]     = useState(true);
  const [error, setError] = useState('');


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

    // Show loading while fetching interviews
    if (loading) {
        return <LoadingSpinner text="Loading interviews..." />;
    }

    // Build calendar events from all interviews
    const interviewEvents = interviews.map(i => ({
        date: i.interview_date,
        id: i.id,
        label: `${i.interview_type} - ${i.result}`,
        type: 'interview',
    }));

    // Open the selected interview in the full-page edit form
    const handleCalendarClick = (event) => {
        const selectedInterview = interviews.find(
            interview => String(interview.id) === String(event.id)
        );

        if (selectedInterview) {
            openEditForm(selectedInterview);
        }
    };

    // Show full-page Add/Edit Interview form

    // Show full-page Add/Edit Interview form
    if (showForm) {
        return (
            <div>
                <div className="page-header">
                    <div>
                        <h1 className="page-title">
                            {editMode ? 'Edit Interview' : 'Schedule Interview'}
                        </h1>
                        <p className="page-subtitle">
                            {editMode
                                ? 'Update your interview details'
                                : 'Schedule a new interview'}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowForm(false)}
                    >
                        ← Back to Calendar
                    </button>
                </div>

                {formError && (
                    <div className="alert alert-danger">
                        <span>⚠️</span>
                        <span>{formError}</span>
                    </div>
                )}

                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">
                            ✏️ {editMode ? 'Update Interview Details' : 'Interview Details'}
                        </h2>
                    </div>

                    <div className="card-body">
                        <form onSubmit={handleSave} noValidate>

                            {/* Job Application and Interview Type */}
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
                                        <option value="">Select a job</option>
                                        {jobs.map(job => (
                                            <option key={job.id} value={job.id}>
                                                {job.company_name} - {job.job_title}
                                            </option>
                                        ))}
                                    </select>

                                    {formErrors.job_id && (
                                        <p className="form-error">⚠ {formErrors.job_id}</p>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="interview_type">
                                        Interview Type
                                    </label>

                                    <select
                                        id="interview_type"
                                        name="interview_type"
                                        value={form.interview_type}
                                        onChange={handleChange}
                                        className="form-control"
                                    >
                                        {INTERVIEW_TYPES.map(type => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Interview Date and Time */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label" htmlFor="interview_date">
                                        Interview Date <span className="required">*</span>
                                    </label>

                                    <input
                                        id="interview_date"
                                        type="date"
                                        name="interview_date"
                                        value={form.interview_date}
                                        onChange={handleChange}
                                        className={`form-control ${formErrors.interview_date ? 'error' : ''}`}
                                    />

                                    {formErrors.interview_date && (
                                        <p className="form-error">⚠ {formErrors.interview_date}</p>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="interview_time">
                                        Interview Time
                                    </label>

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

                            {/* Interview Result */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label" htmlFor="result">
                                        Result / Status
                                    </label>

                                    <select
                                        id="result"
                                        name="result"
                                        value={form.result}
                                        onChange={handleChange}
                                        className="form-control"
                                    >
                                        {INTERVIEW_RESULTS.map(result => (
                                            <option key={result} value={result}>
                                                {result}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="notes">
                                    Notes
                                </label>

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

                            {/* Action Buttons */}
                            <div
                                style={{
                                    display: 'flex',
                                    gap: '12px',
                                    justifyContent: 'flex-end',
                                    borderTop: '1px solid #e5e7eb',
                                    paddingTop: '20px'
                                }}
                            >
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowForm(false)}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={saving}
                                >
                                    {saving
                                        ? 'Saving...'
                                        : editMode
                                            ? '💾 Update Interview'
                                            : '💾 Schedule Interview'}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        );
    }


    // Main Calendar Page
    return (
        <div className="page-container">

            <div className="page-header">
                <div>
                    <h1 className="page-title">Interview Calendar</h1>
                    <p className="page-subtitle">
                        Manage and view all your interviews
                    </p>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={openAddForm}
                >
                    + Schedule Interview
                </button>
            </div>

            {error && (
                <div className="alert alert-error">{error}</div>
            )}

            <Calendar
                events={interviewEvents}
                onDateClick={handleCalendarClick}
            />

        </div>
    );
}







