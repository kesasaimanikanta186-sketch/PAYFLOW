// AdminUsers.jsx - Admin user management
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { IoArrowBack, IoSearchOutline, IoShieldCheckmarkOutline, IoBanOutline, IoCheckmarkCircleOutline } from 'react-icons/io5'

function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { addToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    loadUsers()
  }, [])

  function loadUsers() {
    api.get('/api/admin/users')
      .then(function (res) { setUsers(res.data.users) })
      .catch(function () { addToast('Failed to load users', 'error') })
      .finally(function () { setLoading(false) })
  }

  function blockUser(userId) {
    api.put('/api/admin/users/' + userId + '/block')
      .then(function () {
        addToast('User blocked', 'success')
        loadUsers()
      })
      .catch(function (err) {
        addToast(err.response ? err.response.data.error : 'Failed', 'error')
      })
  }

  function unblockUser(userId) {
    api.put('/api/admin/users/' + userId + '/unblock')
      .then(function () {
        addToast('User unblocked', 'success')
        loadUsers()
      })
      .catch(function (err) {
        addToast(err.response ? err.response.data.error : 'Failed', 'error')
      })
  }

  var filteredUsers = users.filter(function (u) {
    if (!search) return true
    var q = search.toLowerCase()
    return u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.mobile && u.mobile.includes(q))
  })

  if (loading) return <LoadingSpinner fullScreen />

  return (
    <div className="max-w-4xl mx-auto px-4 pt-20 pb-8 space-y-4">
      <button
        onClick={function () { navigate('/admin') }}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <IoArrowBack /> Admin Dashboard
      </button>

      <h2 className="text-lg font-bold text-gray-900 dark:text-white">User Management</h2>

      {/* Search */}
      <div className="relative">
        <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={function (e) { setSearch(e.target.value) }}
          placeholder="Search users..."
          className="input-field pl-10"
        />
      </div>

      {/* Users Table */}
      <div className="space-y-2">
        {filteredUsers.map(function (u) {
          return (
            <div key={u.id} className="card flex items-center gap-3">
              {/* Avatar */}
              <div className={'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ' +
                (u.role === 'admin' ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                  u.is_blocked ? 'bg-gray-400' : 'bg-gradient-to-br from-indigo-400 to-purple-500')
              }>
                {u.name[0]}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{u.name}</p>
                  {u.role === 'admin' && (
                    <IoShieldCheckmarkOutline className="text-amber-500 text-sm flex-shrink-0" />
                  )}
                  {u.is_blocked === 1 && (
                    <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-500 px-1.5 py-0.5 rounded-full flex-shrink-0">Blocked</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{u.email} • {u.mobile}</p>
                <p className="text-xs text-gray-400">{u.upi_id} • {'\u20B9'}{(u.balance || 0).toLocaleString('en-IN')}</p>
              </div>

              {/* Actions */}
              {u.role !== 'admin' && (
                <div>
                  {u.is_blocked === 1 ? (
                    <button
                      onClick={function () { unblockUser(u.id) }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg hover:bg-emerald-100"
                    >
                      <IoCheckmarkCircleOutline /> Unblock
                    </button>
                  ) : (
                    <button
                      onClick={function () { blockUser(u.id) }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100"
                    >
                      <IoBanOutline /> Block
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Showing {filteredUsers.length} of {users.length} users
      </p>
    </div>
  )
}

export default AdminUsers
