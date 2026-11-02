// ============================================================
// App.jsx - Root component with routing setup
// ============================================================
// React Router lets us create multiple "pages" in a single-page app.
// The URL in the browser changes, but we never actually reload the page.
// ============================================================

import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Layout
import Layout from './components/Layout'

// Pages (public)
import Home     from './pages/Home'
import Login    from './pages/Login'
import Register from './pages/Register'

// Pages (protected - require login)
import Dashboard  from './pages/Dashboard'
import JobList    from './pages/JobList'
import AddJob     from './pages/AddJob'
import EditJob    from './pages/EditJob'
import Interviews from './pages/Interviews'
import Profile    from './pages/Profile'

// Loading spinner for initial auth check
function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '12px',
      background: '#f9fafb'
    }}>
      <div className="spinner" />
      <p className="text-muted">Loading...</p>
    </div>
  )
}

// ProtectedRoute - redirects to login if not authenticated
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  // Wait for auth check to complete before deciding
  if (loading) return <LoadingScreen />

  // If not logged in, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // If logged in, show the page inside the Layout
  return <Layout>{children}</Layout>
}

// PublicRoute - redirects to dashboard if already logged in
// (So logged-in users can't see the login/register pages)
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <LoadingScreen />

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// ============================================================
// App Component - The root of the component tree
// ============================================================
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes - accessible without login */}
          <Route path="/"         element={<Home />} />
          <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Protected routes - require login */}
          <Route path="/dashboard"        element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/jobs"             element={<ProtectedRoute><JobList /></ProtectedRoute>} />
          <Route path="/jobs/new"         element={<ProtectedRoute><AddJob /></ProtectedRoute>} />
          <Route path="/jobs/:id/edit"    element={<ProtectedRoute><EditJob /></ProtectedRoute>} />
          <Route path="/interviews"       element={<ProtectedRoute><Interviews /></ProtectedRoute>} />
          <Route path="/profile"         element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
