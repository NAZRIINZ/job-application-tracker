// ============================================================
// Layout.jsx - The main app shell (sidebar + navbar + content)
// ============================================================
import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// StatusBadge component
export function StatusBadge({ status }) {
  const map = {
    'Wishlist':      'badge badge-wishlist',
    'Applied':       'badge badge-applied',
    'Interview':     'badge badge-interview',
    'Offer Received':'badge badge-offer',
    'Rejected':      'badge badge-rejected',
  }
  return <span className={map[status] || 'badge badge-wishlist'}>{status}</span>
}

// ConfirmModal - reusable delete confirmation dialog
export function ConfirmModal({ isOpen, title, description, onConfirm, onCancel, loading }) {
  if (!isOpen) return null
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-icon">🗑️</div>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-desc">{description}</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// LoadingSpinner
export function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="loading-container">
      <div className="spinner" />
      <p className="loading-text">{text}</p>
    </div>
  )
}

// Navigation items configuration
const NAV_ITEMS = [
  { to: '/dashboard',  icon: '📊', label: 'Dashboard' },
  { to: '/jobs',       icon: '💼', label: 'My Applications' },
  { to: '/interviews', icon: '🗓️', label: 'Interviews' },
]

const NAV_BOTTOM = [
  { to: '/profile', icon: '👤', label: 'Profile Settings' },
]

// ============================================================
// Sidebar Component
// ============================================================
function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  return (
    <>
      {/* Dark overlay on mobile */}
      <div
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-header">
          <NavLink to="/dashboard" className="sidebar-logo" onClick={onClose}>
            <span className="logo-icon">💼</span>
            <span>JobTracker</span>
          </NavLink>
          <button className="sidebar-close" onClick={onClose}>✕</button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <p className="nav-section-title">Menu</p>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}

          <p className="nav-section-title">Account</p>
          {NAV_BOTTOM.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div className="user-avatar" style={{ background: '#4f46e5' }}>{initials}</div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                {user?.email}
              </div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}

// ============================================================
// Top Navbar Component
// ============================================================
function Navbar({ onMenuToggle }) {
  const { user } = useAuth()

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  return (
    <header className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="menu-toggle" onClick={onMenuToggle} aria-label="Toggle menu">
          ☰
        </button>
        <NavLink to="/dashboard" className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="brand-icon">💼</span>
          <span>JobTracker</span>
        </NavLink>
      </div>

      <div className="navbar-right">
        <NavLink to="/jobs/new" className="btn btn-primary btn-sm">
          + Add Job
        </NavLink>
        <div className="navbar-user">
          <div className="user-avatar">{initials}</div>
          <span className="text-sm font-medium" style={{ display: 'none' }}>
            {user?.name}
          </span>
        </div>
      </div>
    </header>
  )
}

// ============================================================
// Layout - wraps all protected pages
// ============================================================
export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <Navbar onMenuToggle={() => setSidebarOpen(prev => !prev)} />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  )
}
