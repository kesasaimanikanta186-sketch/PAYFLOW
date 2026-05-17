// AuthContext.jsx - Authentication state management
import { createContext, useState, useEffect, useContext } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('payflow_token') || null)
  const [loading, setLoading] = useState(true)

  // Load user profile on mount if token exists
  useEffect(() => {
    if (token) {
      fetchProfile()
    } else {
      setLoading(false)
    }
  }, [])

  function fetchProfile() {
    api.get('/api/auth/profile')
      .then(function (res) {
        setUser(res.data.user)
        setLoading(false)
      })
      .catch(function () {
        // Token invalid, clear it
        localStorage.removeItem('payflow_token')
        setToken(null)
        setUser(null)
        setLoading(false)
      })
  }

  function login(email, password) {
    return api.post('/api/auth/login', { email, password })
      .then(function (res) {
        const data = res.data
        localStorage.setItem('payflow_token', data.token)
        setToken(data.token)
        setUser(data.user)
        return data
      })
  }

  function register(userData) {
    return api.post('/api/auth/register', userData)
      .then(function (res) {
        const data = res.data
        localStorage.setItem('payflow_token', data.token)
        setToken(data.token)
        setUser(data.user)
        return data
      })
  }

  function logout() {
    api.post('/api/auth/logout').catch(function () { })
    localStorage.removeItem('payflow_token')
    setToken(null)
    setUser(null)
  }

  function updateUser(updatedData) {
    setUser(function (prev) {
      return { ...prev, ...updatedData }
    })
  }

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    fetchProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export default AuthContext
