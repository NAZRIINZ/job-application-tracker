// ============================================================
// Interviews.jsx - Manage interview schedule
// ============================================================
import React, { useState, useEffect } from 'react'

import { useAuth } from '../context/AuthContext'
import API_URL from '../api'

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

    // Build calendar events with company and interview details
    const interviewEvents = interviews.map(interview => {
        const job = jobs.find(
            j => String(j.id) === String(interview.job_id)
        );

        return {
            id: interview.id,
            date: interview.interview_date,
            company: job?.company_name || 'Unknown Company',
            jobTitle: job?.job_title || '',
            interviewType: interview.interview_type || 'Interview',
            interviewTime: interview.interview_time || '',
            result: interview.result || 'Scheduled',
        };
    });


    // Open the selected interview in the full-page edit form
    const handleCalendarClick = (event) => {
        const selectedInterview = interviews.find(
            interview => String(interview.id) === String(event.id)
        );

        if (selectedInterview) {
            openEditForm(selectedInterview);
        }
    };

    // Open Add Interview form when clicking an empty calendar date
    const handleDateClick = (date) => {
        setForm({
            ...defaultForm(),
            interview_date: date
        });

        setFormErrors({});
        setFormError('');
        setEditMode(false);
        setEditId(null);
        setShowForm(true);
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

            <InterviewCalendar
                events={interviewEvents}
                onEventClick={handleCalendarClick}
                onDateClick={handleDateClick}
            />

        </div>
    );
}

// ============================================================
// InterviewCalendar - Monthly calendar with interview details
// ============================================================

function getDateKey(value) {
    if (!value) return '';

    // Keep SQL date values in local calendar format
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        return value.slice(0, 10);
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function InterviewCalendar({ events, onEventClick, onDateClick }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const todayKey = getDateKey(new Date());

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Always display 6 calendar weeks
    const calendarDays = Array.from({ length: 42 }, (_, index) => {
        const dayNumber = index - firstDay + 1;
        return new Date(year, month, dayNumber);
    });

    function changeMonth(amount) {
        setCurrentMonth(prev => (
            new Date(
                prev.getFullYear(),
                prev.getMonth() + amount,
                1
            )
        ));
    }

    function getEventStyle(event) {
        const eventDate = getDateKey(event.date);
        const result = String(event.result).toLowerCase();

        if (result === 'cancelled') {
            return {
                background: '#fee2e2',
                color: '#b91c1c',
                border: '#ef4444',
            };
        }

        if (result === 'completed' || result === 'passed') {
            return {
                background: '#dcfce7',
                color: '#166534',
                border: '#22c55e',
            };
        }

        if (eventDate < todayKey) {
            return {
                background: '#f1f5f9',
                color: '#64748b',
                border: '#94a3b8',
            };
        }

        return {
            background: '#dbeafe',
            color: '#1d4ed8',
            border: '#3b82f6',
        };
    }

    const monthEvents = events.reduce((grouped, event) => {
        const key = getDateKey(event.date);

        if (!grouped[key]) grouped[key] = [];

        grouped[key].push(event);

        return grouped;
    }, {});

    return (
        <div className="card" style={{ padding: '20px' }}>

            {/* Calendar Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
                marginBottom: '20px'
            }}>
                <h2 className="card-title">
                    {currentMonth.toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric'
                    })}
                </h2>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => changeMonth(-1)}
                    >
                        ←
                    </button>

                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setCurrentMonth(new Date())}
                    >
                        Today
                    </button>

                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => changeMonth(1)}
                    >
                        →
                    </button>
                </div>
            </div>

            {/* Color Legend */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '18px',
                fontSize: '13px'
            }}>
                <span style={{ color: '#2563eb' }}>● Upcoming</span>
                <span style={{ color: '#16a34a' }}>● Completed / Passed</span>
                <span style={{ color: '#64748b' }}>● Past</span>
                <span style={{ color: '#dc2626' }}>● Cancelled</span>
            </div>

            {/* Weekday Names */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                borderTop: '1px solid #e5e7eb',
                borderLeft: '1px solid #e5e7eb'
            }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div
                        key={day}
                        style={{
                            textAlign: 'center',
                            padding: '12px 2px',
                            fontWeight: '600',
                            fontSize: '13px',
                            background: '#f8fafc',
                            borderRight: '1px solid #e5e7eb',
                            borderBottom: '1px solid #e5e7eb'
                        }}
                    >
                        {day}
                    </div>
                ))}

                {/* Calendar Dates */}
                {calendarDays.map((date, index) => {
                    const dateKey = getDateKey(date);

                    const isCurrentMonth = date.getMonth() === month;

                    const isToday = dateKey === todayKey;

                    const dayEvents = monthEvents[dateKey] || [];

                    return (
                        <div
                            key={index}
                            onClick={() => onDateClick(dateKey)}
                            title="Click to schedule an interview"
                            style={{
                                minWidth: 0,
                                minHeight: '125px',
                                padding: '6px',
                                background: isCurrentMonth ? '#ffffff' : '#f8fafc',
                                borderRight: '1px solid #e5e7eb',
                                borderBottom: '1px solid #e5e7eb',
                                overflow: 'hidden',
                                cursor: 'pointer'
                            }}
                        
                        >
                            {/* Date Number */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                marginBottom: '6px'
                            }}>
                                <span style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '25px',
                                    height: '25px',
                                    borderRadius: '50%',
                                    background: isToday ? '#2563eb' : 'transparent',
                                    color: isToday ? '#ffffff' : isCurrentMonth ? '#334155' : '#94a3b8',
                                    fontSize: '13px',
                                    fontWeight: isToday ? '700' : '500'
                                }}>
                                    {date.getDate()}
                                </span>
                            </div>

                            {/* Interview Events */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '5px'
                            }}>
                                {dayEvents.map(event => {
                                    const colors = getEventStyle(event);

                                    const time = formatTime(event.interviewTime);

                                    return (
                                        <button
                                            key={event.id}
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEventClick(event);
                                            }}
                                            title={`${event.company} - ${event.interviewType} - ${time}`}
                                            style={{
                                                width: '100%',
                                                textAlign: 'left',
                                                padding: '6px',
                                                borderRadius: '5px',
                                                border: 'none',
                                                borderLeft: `3px solid ${colors.border}`,
                                                background: colors.background,
                                                color: colors.color,
                                                cursor: 'pointer',
                                                fontSize: '11px',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            <div style={{
                                                fontWeight: '700',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {event.company}
                                            </div>

                                            <div style={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                marginTop: '2px'
                                            }}>
                                                {event.interviewType}
                                            </div>

                                            {time && (
                                                <div style={{ marginTop: '2px' }}>
                                                    {time}
                                                </div>
                                            )}

                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* No Events Message */}
            {events.length === 0 && (
                <p style={{
                    textAlign: 'center',
                    color: '#64748b',
                    padding: '20px'
                }}>
                    No interviews scheduled yet.
                </p>
            )}

        </div>
    );
}







