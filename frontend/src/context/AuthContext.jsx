
// AuthContext.jsx - Manages login and logout information
// Shares user authentication details across the application.
import React, { createContext, useState, useEffect, useContext } from 'react'
import API_URL from '../api'

// Step 1:  Create a context to share authentication information.
const AuthContext = createContext(null)

// Step 2:  Provides user information to all components

export function AuthProvider({ children }) {
    // Store the logged-in user's details.
    // Initially, the user is null (not logged in).
  const [user, setUser] = useState(null)

  // Whether we're still checking if the user is logged in
  const [loading, setLoading] = useState(true)

  // When the app first loads, check if a token exists in localStorage
  // and fetch the user profile from the backend
  useEffect(() => {
    const token = localStorage.getItem('token')

    if (token) {
      // Verify the token is still valid 
        fetch(`${API_URL}/api/auth/me`, { 
        headers: {
          // JWT tokens are sent in the Authorization header
          'Authorization': `Bearer ${token}`
        }
      })
            .then(res => res.json())
            // Receives the response from the backend.
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

    // LOGIN function - Saves the token and user details after login

  function login(token, userData) {
    localStorage.setItem('token', token)
    setUser(userData)
  }

    // LOGOUT function - Clears the login information
  function logout() {
    localStorage.removeItem('token')
    setUser(null)
  }

    // UPDATE USER - Updates the user information
  function updateUser(updatedData) {
    setUser(prev => ({ ...prev, ...updatedData }))
  }

    // GET AUTH HEADERS - Adds the token to API requests
  function getAuthHeaders() {
    const token = localStorage.getItem('token')
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

   // Stores all authentication information and functions.
  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    getAuthHeaders,
    isAuthenticated: !!user,  // true if user is not null
  }

    // Makes authentication information available to child components.
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Step 3:useAuth - Allows components to access authentication details
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return context
}
