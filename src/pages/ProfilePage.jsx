// ProfilePage.jsx - User profile management
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../services/api'
import { IoPersonCircle, IoMailOutline, IoCallOutline, IoKeyOutline, IoKeypadOutline, IoLogOutOutline, IoChevronForward, IoShieldCheckmarkOutline } from 'react-icons/io5'

function ProfilePage() {
  const { user, logout, updateUser } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [editMode, setEditMode] = useState(false)
  const [editName, setEditName] = useState(user ? user.name : '')
  const [editEmail, setEditEmail] = useState(user ? user.email : '')

  const [showChangePw, setShowChangePw] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const [showChangePin, setShowChangePin] = useState(false)
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')

  const [submitting, setSubmitting] = useState(false)

  function handleUpdateProfile(e) {
    e.preventDefault()
    setSubmitting(true)
    api.put('/api/auth/profile', { name: editName, email: editEmail })
      .then(function (res) {
        updateUser(res.data.user)
        addToast('Profile updated', 'success')
        setEditMode(false)
      })
      .catch(function (err) {
        addToast(err.response ? err.response.data.error : 'Failed', 'error')
      })
      .finally(function () { setSubmitting(false) })
  }

  function handleChangePassword(e) {
    e.preventDefault()
    if (newPassword.length < 6) {
      addToast('Password must be at least 6 characters', 'error')
      return
    }
    setSubmitting(true)
    api.put('/api/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    })
      .then(function () {
        addToast('Password changed successfully', 'success')
        setShowChangePw(false)
        setCurrentPassword('')
        setNewPassword('')
      })
      .catch(function (err) {
        addToast(err.response ? err.response.data.error : 'Failed', 'error')
      })
      .finally(function () { setSubmitting(false) })
  }

  function handleChangePin(e) {
    e.preventDefault()
    if (newPin.length !== 4) {
      addToast('PIN must be 4 digits', 'error')
      return
    }
    setSubmitting(true)
    api.put('/api/auth/change-pin', {
      current_pin: currentPin,
      new_pin: newPin
    })
      .then(function () {
        addToast('UPI PIN changed successfully', 'success')
        setShowChangePin(false)
        setCurrentPin('')
        setNewPin('')
      })
      .catch(function (err) {
        addToast(err.response ? err.response.data.error : 'Failed', 'error')
      })
      .finally(function () { setSubmitting(false) })
  }

  function handleLogout() {
    logout()
    navigate('/login')
    addToast('Logged out successfully', 'info')
  }

  if (!user) return null

  return (
    <div className="page-container space-y-4">
      {/* Profile Header */}
      <div className="card text-center py-6 animate-fadeIn">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center mb-3">
          <span className="text-3xl font-bold text-white">{user.name[0]}</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{user.name}</h2>
        <p className="text-sm text-gray-500">{user.email}</p>
        <div className="flex items-center justify-center gap-1 mt-1">
          <IoShieldCheckmarkOutline className="text-emerald-500 text-sm" />
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono">{user.upi_id}</p>
        </div>
      </div>

      {/* Edit Profile */}
      {editMode ? (
        <form onSubmit={handleUpdateProfile} className="card space-y-3 animate-slideUp">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Edit Profile</h3>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Name</label>
            <input
              type="text"
              value={editName}
              onChange={function (e) { setEditName(e.target.value) }}
              className="input-field"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Email</label>
            <input
              type="email"
              value={editEmail}
              onChange={function (e) { setEditEmail(e.target.value) }}
              className="input-field"
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={function () { setEditMode(false) }} className="btn-secondary flex-1 py-2 text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 py-2 text-sm">Save</button>
          </div>
        </form>
      ) : null}

      {/* Change Password */}
      {showChangePw && (
        <form onSubmit={handleChangePassword} className="card space-y-3 animate-slideUp">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Change Password</h3>
          <input
            type="password"
            value={currentPassword}
            onChange={function (e) { setCurrentPassword(e.target.value) }}
            placeholder="Current password"
            className="input-field"
          />
          <input
            type="password"
            value={newPassword}
            onChange={function (e) { setNewPassword(e.target.value) }}
            placeholder="New password (min 6 chars)"
            className="input-field"
          />
          <div className="flex gap-2">
            <button type="button" onClick={function () { setShowChangePw(false) }} className="btn-secondary flex-1 py-2 text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 py-2 text-sm">Change</button>
          </div>
        </form>
      )}

      {/* Change PIN */}
      {showChangePin && (
        <form onSubmit={handleChangePin} className="card space-y-3 animate-slideUp">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Change UPI PIN</h3>
          <input
            type="password"
            value={currentPin}
            onChange={function (e) { if (e.target.value.length <= 4) setCurrentPin(e.target.value) }}
            placeholder="Current PIN"
            className="input-field text-center tracking-widest"
            maxLength={4}
          />
          <input
            type="password"
            value={newPin}
            onChange={function (e) { if (e.target.value.length <= 4) setNewPin(e.target.value) }}
            placeholder="New 4-digit PIN"
            className="input-field text-center tracking-widest"
            maxLength={4}
          />
          <div className="flex gap-2">
            <button type="button" onClick={function () { setShowChangePin(false) }} className="btn-secondary flex-1 py-2 text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 py-2 text-sm">Change</button>
          </div>
        </form>
      )}

      {/* Menu Items */}
      <div className="card divide-y divide-gray-100 dark:divide-gray-700">
        <button
          onClick={function () { setEditMode(!editMode); setShowChangePw(false); setShowChangePin(false) }}
          className="w-full flex items-center gap-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2"
        >
          <IoPersonCircle className="text-xl text-indigo-500" />
          <span className="flex-1 text-left text-sm text-gray-700 dark:text-gray-200">Edit Profile</span>
          <IoChevronForward className="text-gray-400" />
        </button>

        <button
          onClick={function () { setShowChangePw(!showChangePw); setEditMode(false); setShowChangePin(false) }}
          className="w-full flex items-center gap-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2"
        >
          <IoKeyOutline className="text-xl text-amber-500" />
          <span className="flex-1 text-left text-sm text-gray-700 dark:text-gray-200">Change Password</span>
          <IoChevronForward className="text-gray-400" />
        </button>

        <button
          onClick={function () { setShowChangePin(!showChangePin); setEditMode(false); setShowChangePw(false) }}
          className="w-full flex items-center gap-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2"
        >
          <IoKeypadOutline className="text-xl text-purple-500" />
          <span className="flex-1 text-left text-sm text-gray-700 dark:text-gray-200">Change UPI PIN</span>
          <IoChevronForward className="text-gray-400" />
        </button>
      </div>

      {/* Account Info */}
      <div className="card space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-500">
          <IoCallOutline />
          <span>{user.mobile}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <IoMailOutline />
          <span>{user.email}</span>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 text-red-500 font-semibold hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
      >
        <IoLogOutOutline className="text-xl" />
        Logout
      </button>
    </div>
  )
}

export default ProfilePage
