// QuickActions.jsx - Quick action buttons on home page
import { useNavigate } from 'react-router-dom'
import { IoSendOutline, IoCardOutline, IoTimeOutline, IoPersonOutline } from 'react-icons/io5'

function QuickActions() {
  const navigate = useNavigate()

  const actions = [
    { label: 'Send Money', icon: IoSendOutline, path: '/send', color: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' },
    { label: 'Bank', icon: IoCardOutline, path: '/bank-accounts', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' },
    { label: 'History', icon: IoTimeOutline, path: '/transactions', color: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400' },
    { label: 'Profile', icon: IoPersonOutline, path: '/profile', color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' },
  ]

  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map(function (action) {
        return (
          <button
            key={action.path}
            onClick={function () { navigate(action.path) }}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 active:scale-95"
          >
            <div className={'w-12 h-12 rounded-2xl flex items-center justify-center ' + action.color}>
              <action.icon className="text-xl" />
            </div>
            <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300 text-center leading-tight">
              {action.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default QuickActions
