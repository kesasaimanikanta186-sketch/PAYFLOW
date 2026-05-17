// LoginPage.jsx - User login page
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { IoMailOutline, IoLockClosedOutline, IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) {
      addToast('Please fill in all fields', 'error')
      return
    }

    setLoading(true)
    login(email, password)
      .then(function (data) {
        addToast('Welcome back, ' + data.user.name + '!', 'success')
        navigate('/')
      })
      .catch(function (err) {
        const msg = err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : 'Login failed. Please try again.'
        addToast(msg, 'error')
      })
      .finally(function () { setLoading(false) })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
      {/* Logo */}
      <div className="mb-8 text-center animate-fadeIn">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-bg flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-2xl">P</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome to <span className="text-indigo-600">PayFlow</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Sign in to continue</p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 animate-slideUp">
        <div className="card space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <div className="relative">
              <IoMailOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type="email"
                value={email}
                onChange={function (e) { setEmail(e.target.value) }}
                placeholder="you@example.com"
                className="input-field pl-10"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <div className="relative">
              <IoLockClosedOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={function (e) { setPassword(e.target.value) }}
                placeholder="Enter your password"
                className="input-field pl-10 pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={function () { setShowPassword(!showPassword) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : 'Sign In'}
          </button>
        </div>

        {/* Demo Credentials */}
        <div className="card bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800">
          <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-2">Demo Credentials</p>
          <div className="space-y-1 text-xs text-indigo-600 dark:text-indigo-400">
            <p>User: <span className="font-mono">rahul@example.com</span> / <span className="font-mono">password123</span></p>
            <p>Admin: <span className="font-mono">admin@payflow.com</span> / <span className="font-mono">admin123</span></p>
          </div>
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  )
}

export default LoginPage
