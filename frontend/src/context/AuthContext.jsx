// ============================================================
// AuthContext.jsx - Global Authentication State
// ============================================================
// React Context lets you share data (like the logged-in user)
// across ALL components without "prop drilling" (passing props
// down through many component levels).
//
// How it works:
// 1. AuthProvider wraps the whole app
// 2. Any component can call useAuth() to get the user & functions
// ============================================================

import React, { createContext, useState, useEffect, useContext } from 'react'
import API_URL from '../api'

// Step 1: Create the Context object
const AuthContext = createContext(null)

// Step 2: Create the Provider component
// This wraps the entire application and provides auth data
export function AuthProvider({ children }) {
  // The logged-in user object (or null if not logged in)
  const [user, setUser] = useState(null)

  // Whether we're still checking if the user is logged in
  const [loading, setLoading] = useState(true)

  // When the app first loads, check if a token exists in localStorage
  // and fetch the user profile from the backend
  useEffect(() => {
    const token = localStorage.getItem('token')

    if (token) {
      // Verify the token is still valid by calling /api/auth/me
        fetch(`${API_URL}/api/auth/me`, { 
        headers: {
          // JWT tokens are sent in the Authorization header
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setUser(data.user)
          } else {
            // Token is invalid or expired - clean up
            localStorage.removeItem('token')
            setUser(null)
          }
        })
        .catch(() => {
          localStorage.removeItem('token')
          setUser(null)
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      // No token found - user is not logged in
      setLoading(false)
    }
  }, [])

  // LOGIN function - called after successful login
  // Saves token to localStorage and sets the user state
  function login(token, userData) {
    localStorage.setItem('token', token)
    setUser(userData)
  }

  // LOGOUT function - removes token and clears user state
  function logout() {
    localStorage.removeItem('token')
    setUser(null)
  }

  // UPDATE USER - called after profile update
  function updateUser(updatedData) {
    setUser(prev => ({ ...prev, ...updatedData }))
  }

  // Helper function to get auth headers for fetch requests
  // Usage: fetch('/api/jobs', { headers: getAuthHeaders() })
  function getAuthHeaders() {
    const token = localStorage.getItem('token')
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  // The value object contains everything we want to share
  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    getAuthHeaders,
    isAuthenticated: !!user,  // true if user is not null
  }

  // Provide the value to all child components
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Step 3: Custom hook for easy consumption
// Instead of: import AuthContext; useContext(AuthContext)
// We do:      import useAuth; useAuth()
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return context
}
