// RegisterPage.jsx - User registration page
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { IoPersonOutline, IoMailOutline, IoCallOutline, IoLockClosedOutline, IoKeypadOutline } from 'react-icons/io5'

function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '', email: '', mobile: '', password: '', upi_pin: ''
  })
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  function handleChange(e) {
    var name = e.target.name
    var value = e.target.value
    setFormData(function (prev) {
      return { ...prev, [name]: value }
    })
  }

  function handleSubmit(e) {
    e.preventDefault()

    // Validation
    if (!formData.name || !formData.email || !formData.mobile || !formData.password || !formData.upi_pin) {
      addToast('Please fill in all fields', 'error')
      return
    }
    if (formData.mobile.length !== 10) {
      addToast('Mobile number must be 10 digits', 'error')
      return
    }
    if (formData.upi_pin.length !== 4) {
      addToast('UPI PIN must be 4 digits', 'error')
      return
    }
    if (formData.password.length < 6) {
      addToast('Password must be at least 6 characters', 'error')
      return
    }

    setLoading(true)
    register(formData)
      .then(function (data) {
        addToast(data.message || 'Registration successful!', 'success')
        navigate('/')
      })
      .catch(function (err) {
        var msg = err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : 'Registration failed. Please try again.'
        addToast(msg, 'error')
      })
      .finally(function () { setLoading(false) })
  }

  var fields = [
    { name: 'name', label: 'Full Name', type: 'text', icon: IoPersonOutline, placeholder: 'John Doe' },
    { name: 'email', label: 'Email', type: 'email', icon: IoMailOutline, placeholder: 'you@example.com' },
    { name: 'mobile', label: 'Mobile Number', type: 'tel', icon: IoCallOutline, placeholder: '9876543210', maxLength: 10 },
    { name: 'password', label: 'Password', type: 'password', icon: IoLockClosedOutline, placeholder: 'Min 6 characters' },
    { name: 'upi_pin', label: 'Create UPI PIN', type: 'password', icon: IoKeypadOutline, placeholder: '4-digit PIN', maxLength: 4 },
  ]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gray-50 dark:bg-gray-900">
      {/* Logo */}
      <div className="mb-6 text-center animate-fadeIn">
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl gradient-bg flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-xl">P</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Create Account
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Join PayFlow in seconds</p>
      </div>

      {/* Register Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 animate-slideUp">
        <div className="card space-y-3">
          {fields.map(function (field) {
            var Icon = field.icon
            return (
              <div key={field.name}>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    className="input-field pl-10 py-2.5 text-sm"
                  />
                </div>
              </div>
            )
          })}

          <p className="text-xs text-gray-400 dark:text-gray-500">
            Your UPI ID will be: <span className="font-mono text-indigo-500">{formData.mobile || 'mobile'}@payflow</span>
          </p>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : 'Create Account'}
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </form>
    </div>
  )
}

export default RegisterPage
