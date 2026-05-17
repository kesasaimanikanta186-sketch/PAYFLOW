// NotificationsPage.jsx - Notification center
import { useState, useEffect } from 'react'
import api from '../services/api'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { IoCheckmarkDoneOutline, IoNotificationsOutline, IoCheckmarkCircle, IoCloseCircle, IoGiftOutline, IoInformationCircle, IoWarning } from 'react-icons/io5'

function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    loadNotifications()
  }, [])

  function loadNotifications() {
    api.get('/api/notifications')
      .then(function (res) { setNotifications(res.data.notifications) })
      .catch(function () { })
      .finally(function () { setLoading(false) })
  }

  function markRead(notifId) {
    api.put('/api/notifications/' + notifId + '/read')
      .then(function () {
        setNotifications(function (prev) {
          return prev.map(function (n) {
            if (n.id === notifId) return { ...n, is_read: 1 }
            return n
          })
        })
      })
      .catch(function () { })
  }

  function markAllRead() {
    api.put('/api/notifications/read-all')
      .then(function () {
        setNotifications(function (prev) {
          return prev.map(function (n) { return { ...n, is_read: 1 } })
        })
        addToast('All notifications marked as read', 'success')
      })
      .catch(function () { })
  }

  function getIcon(type) {
    if (type === 'success') return <IoCheckmarkCircle className="text-lg text-emerald-500" />
    if (type === 'error') return <IoCloseCircle className="text-lg text-red-500" />
    if (type === 'reward') return <IoGiftOutline className="text-lg text-pink-500" />
    if (type === 'warning') return <IoWarning className="text-lg text-amber-500" />
    return <IoInformationCircle className="text-lg text-blue-500" />
  }

  if (loading) return <LoadingSpinner fullScreen />

  var unreadCount = notifications.filter(function (n) { return n.is_read === 0 }).length

  return (
    <div className="page-container space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Notifications</h2>
          {unreadCount > 0 && (
            <p className="text-xs text-gray-500">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium"
          >
            <IoCheckmarkDoneOutline /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card text-center py-12">
          <IoNotificationsOutline className="text-4xl text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(function (notif) {
            return (
              <button
                key={notif.id}
                onClick={function () { markRead(notif.id) }}
                className={'w-full text-left card flex items-start gap-3 py-3 transition-colors ' +
                  (notif.is_read === 0
                    ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800'
                    : '')
                }
              >
                <div className="mt-0.5">{getIcon(notif.type)}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={'text-sm font-semibold ' +
                      (notif.is_read === 0 ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300')
                    }>
                      {notif.title}
                    </p>
                    {notif.is_read === 0 && (
                      <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{notif.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {new Date(notif.created_at).toLocaleString('en-IN')}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default NotificationsPage
