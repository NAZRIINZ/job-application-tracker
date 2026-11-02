// ============================================================
// JobList.jsx - Lists all job applications with search, filter, pagination
// ============================================================
import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { StatusBadge, LoadingSpinner, ConfirmModal } from '../components/Layout'

const STATUS_OPTIONS = ['', 'Wishlist', 'Applied', 'Interview', 'Offer Received', 'Rejected']

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function JobList() {
  const { getAuthHeaders } = useAuth()
  const navigate = useNavigate()

  // Data
  const [jobs, setJobs]           = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  // Filters & pagination
  const [search,   setSearch]     = useState('')
  const [status,   setStatus]     = useState('')
  const [page,     setPage]       = useState(1)

  // Delete modal
  const [deleteModal, setDeleteModal] = useState({ open: false, jobId: null, name: '' })
  const [deleting,    setDeleting]    = useState(false)

  // useCallback memoizes the function so it doesn't re-create on every render
  const fetchJobs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      // Build URL with query parameters
      const params = new URLSearchParams({ page, limit: 10 })
      if (search) params.set('search', search)
      if (status) params.set('status', status)

      const res  = await fetch(`/api/jobs?${params}`, { headers: getAuthHeaders() })
      const data = await res.json()

      if (data.success) {
        setJobs(data.data)
        setPagination(data.pagination)
      } else {
        setError(data.message || 'Failed to load jobs.')
      }
    } catch {
      setError('Cannot connect to server.')
    } finally {
      setLoading(false)
    }
  }, [search, status, page])

  // Re-fetch whenever filters or page changes
  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  // Handle search with small delay (debounce)
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1) // Reset to first page when searching
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  function handleStatusChange(e) {
    setStatus(e.target.value)
    setPage(1)
  }

  function openDeleteModal(job) {
    setDeleteModal({ open: true, jobId: job.id, name: job.company_name })
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res  = await fetch(`/api/jobs/${deleteModal.jobId}`, {
        method:  'DELETE',
        headers: getAuthHeaders()
      })
      const data = await res.json()
      if (data.success) {
        setDeleteModal({ open: false, jobId: null, name: '' })
        fetchJobs() // Refresh the list
      } else {
        alert(data.message || 'Delete failed.')
      }
    } catch {
      alert('Server error.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Applications</h1>
          <p className="page-subtitle">
            {pagination.totalJobs || 0} total application{pagination.totalJobs !== 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/jobs/new" className="btn btn-primary">+ Add Application</Link>
      </div>

      {/* Search and filters */}
      <div className="card mb-16">
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div className="filters-bar">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by company, title, or location..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
            </div>
            <div className="filter-select">
              <select
                className="form-control"
                value={status}
                onChange={handleStatusChange}
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s || 'All Statuses'}</option>
                ))}
              </select>
            </div>
            {(search || status) && (
              <button
                className="btn btn-secondary"
                onClick={() => { setSearchInput(''); setSearch(''); setStatus(''); setPage(1); }}
              >
                ✕ Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="alert alert-danger">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <LoadingSpinner text="Loading applications..." />
      ) : jobs.length === 0 ? (
        /* Empty state */
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">{search || status ? '🔍' : '📋'}</div>
            <p className="empty-title">
              {search || status ? 'No matching applications' : 'No applications yet'}
            </p>
            <p className="empty-desc">
              {search || status
                ? 'Try adjusting your search or filters'
                : 'Start by adding your first job application'}
            </p>
            {!search && !status && (
              <Link to="/jobs/new" className="btn btn-primary">Add First Application</Link>
            )}
          </div>
        </div>
      ) : (
        /* Jobs table */
        <>
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Company / Role</th>
                    <th>Location</th>
                    <th>Salary</th>
                    <th>Applied Date</th>
                    <th>Follow-up</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(job => (
                    <tr key={job.id}>
                      <td>
                        <div className="company-cell">
                          <span className="company-name">{job.company_name}</span>
                          <span className="job-title-small">{job.job_title}</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm text-muted truncate">
                          {job.location || '—'}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm">
                          {job.salary || '—'}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm">{formatDate(job.application_date)}</span>
                      </td>
                      <td>
                        <span className={`text-sm ${isOverdue(job.follow_up_date) ? '' : ''}`}
                          style={{ color: isOverdue(job.follow_up_date) ? '#ef4444' : 'inherit' }}
                        >
                          {job.follow_up_date ? formatDate(job.follow_up_date) : '—'}
                          {isOverdue(job.follow_up_date) && ' ⚠'}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={job.status} />
                      </td>
                      <td>
                        <div className="action-buttons">
                          {job.job_link && (
                            <a
                              href={job.job_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-icon"
                              title="Open job link"
                            >
                              🔗
                            </a>
                          )}
                          <button
                            className="btn btn-icon"
                            title="Edit"
                            onClick={() => navigate(`/jobs/${job.id}/edit`)}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn btn-icon"
                            title="Delete"
                            onClick={() => openDeleteModal(job)}
                            style={{ color: '#ef4444' }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <span className="pagination-info">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                className="page-btn"
                onClick={() => setPage(1)}
                disabled={page === 1}
              >«</button>
              <button
                className="page-btn"
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
              >‹</button>

              {/* Page number buttons */}
              {generatePageNumbers(pagination.currentPage, pagination.totalPages).map((p, i) => (
                p === '...'
                  ? <span key={i} style={{ padding: '0 4px', color: '#6b7280' }}>...</span>
                  : <button
                      key={p}
                      className={`page-btn ${page === p ? 'active' : ''}`}
                      onClick={() => setPage(p)}
                    >{p}</button>
              ))}

              <button
                className="page-btn"
                onClick={() => setPage(p => p + 1)}
                disabled={page === pagination.totalPages}
              >›</button>
              <button
                className="page-btn"
                onClick={() => setPage(pagination.totalPages)}
                disabled={page === pagination.totalPages}
              >»</button>
            </div>
          )}
        </>
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={deleteModal.open}
        title="Delete Application"
        description={`Are you sure you want to delete the application for "${deleteModal.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ open: false, jobId: null, name: '' })}
        loading={deleting}
      />
    </div>
  )
}

function isOverdue(dateStr) {
  if (!dateStr) return false
  return new Date(dateStr) < new Date() && new Date(dateStr).toDateString() !== new Date().toDateString()
}

function generatePageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = []
  if (current > 3) pages.push(1, '...')
  for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) pages.push(i)
  if (current < total - 2) pages.push('...', total)
  return pages
}
