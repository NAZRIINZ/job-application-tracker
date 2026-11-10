// ============================================================
// Dashboard.jsx - Main dashboard with stats and recent activity
// ============================================================
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingSpinner } from '../components/Layout'
import { StatusBadge } from '../components/Layout'
import API_URL from '../api'

// Format a date string nicely for display
function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  })
}

export default function Dashboard() {
  const { getAuthHeaders, user } = useAuth()

  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  // Fetch stats when component mounts
    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch(`${API_URL}/api/jobs/stats`, {
                    headers: getAuthHeaders(),
                })

                const data = await res.json()

                // Check the actual backend response
                console.log('Dashboard API Status:', res.status)
                console.log('Dashboard API Response:', data)

                if (!res.ok) {
                    throw new Error(data.message || `Server error: ${res.status}`)
                }

                if (data.success && data.data) {
                    setStats(data.data)
                } else {
                    setError(data.message || 'Dashboard statistics were not returned by the server.')
                }
            } catch (err) {
                console.error('Dashboard Error:', err)
                setError(err.message || 'Cannot connect to server.')
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [])

  if (loading) return <LoadingSpinner text="Loading dashboard..." />

  if (error) {
    return (
      <div className="alert alert-danger">
        <span>⚠️</span>
        <span>{error}</span>
      </div>
    )
  }

  const statCards = [
    { label: 'Total Applied',    value: stats?.total      || 0, icon: '📋', color: 'purple' },
    { label: 'In Progress',      value: stats?.applied    || 0, icon: '📤', color: 'blue'   },
    { label: 'Interviews',       value: stats?.interviews || 0, icon: '🗓️', color: 'amber'  },
    { label: 'Offers Received',  value: stats?.offers     || 0, icon: '🎉', color: 'green'  },
    { label: 'Rejected',         value: stats?.rejected   || 0, icon: '❌', color: 'red'    },
    { label: 'Follow-ups Due',   value: stats?.upcoming_followups || 0, icon: '🔔', color: 'teal' },
  ]

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Good {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="page-subtitle">Here's your job search overview</p>
        </div>
        <Link to="/jobs/new" className="btn btn-primary">
          + Add Application
        </Link>
      </div>

      {/* Stats cards */}
      <div className="stats-grid">
        {statCards.map((card, idx) => (
          <div key={idx} className="stat-card">
            <div className={`stat-icon ${card.color}`}>{card.icon}</div>
            <div className="stat-info">
              <p className="stat-label">{card.label}</p>
              <p className="stat-value">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom section: recent apps + quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Recent Applications */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Applications</h2>
            <Link to="/jobs" className="btn btn-outline btn-sm">View All</Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {stats?.recent_applications?.length > 0 ? (
              <ul className="recent-jobs-list" style={{ padding: '0 24px' }}>
                {stats.recent_applications.map(job => (
                  <li key={job.id} className="recent-job-item">
                    <div className="recent-job-info">
                      <p className="recent-company">{job.company_name}</p>
                      <p className="recent-title">{job.job_title}</p>
                    </div>
                    <span className="recent-date">{formatDate(job.application_date)}</span>
                    <StatusBadge status={job.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <p className="empty-title">No applications yet</p>
                <p className="empty-desc">Start by adding your first job application</p>
                <Link to="/jobs/new" className="btn btn-primary">
                  Add Your First Job
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="card mb-16">
            <div className="card-header">
              <h2 className="card-title">Quick Actions</h2>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link to="/jobs/new"   className="btn btn-primary btn-full">📝 Add New Application</Link>
              <Link to="/jobs"       className="btn btn-secondary btn-full">💼 View All Jobs</Link>
              <Link to="/interviews" className="btn btn-secondary btn-full">🗓️ Manage Interviews</Link>
            </div>
          </div>

          {/* Status breakdown */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Status Breakdown</h2>
            </div>
            <div className="card-body">
              {[
                { label: 'Wishlist',      count: stats?.wishlist   || 0, badge: 'badge-wishlist'  },
                { label: 'Applied',       count: stats?.applied    || 0, badge: 'badge-applied'   },
                { label: 'Interview',     count: stats?.interviews || 0, badge: 'badge-interview' },
                { label: 'Offer',         count: stats?.offers     || 0, badge: 'badge-offer'     },
                { label: 'Rejected',      count: stats?.rejected   || 0, badge: 'badge-rejected'  },
              ].map(s => (
                <div key={s.label} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <span className={`badge ${s.badge}`}>{s.label}</span>
                  <span style={{ fontWeight: 700, color: '#374151' }}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
