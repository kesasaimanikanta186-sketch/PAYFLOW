// BottomNav.jsx - Mobile bottom navigation
import { useNavigate, useLocation } from 'react-router-dom'
import { IoHomeOutline, IoHome, IoSendOutline, IoSend, IoTimeOutline, IoTime, IoPersonOutline, IoPerson } from 'react-icons/io5'

function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname

  const navItems = [
    { path: '/', label: 'Home', icon: IoHomeOutline, activeIcon: IoHome },
    { path: '/send', label: 'Send', icon: IoSendOutline, activeIcon: IoSend },
    { path: '/transactions', label: 'History', icon: IoTimeOutline, activeIcon: IoTime },
    { path: '/profile', label: 'Profile', icon: IoPersonOutline, activeIcon: IoPerson },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-2">
        {navItems.map(function (item) {
          const isActive = currentPath === item.path
          const Icon = isActive ? item.activeIcon : item.icon

          return (
            <button
              key={item.path}
              onClick={function () { navigate(item.path) }}
              className={'flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 ' +
                (isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300')
              }
            >
              <Icon className="text-2xl" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav
