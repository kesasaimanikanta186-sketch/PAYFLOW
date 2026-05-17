// Navbar.jsx - Top navigation bar
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { IoMoonOutline, IoSunnyOutline, IoSettingsOutline } from 'react-icons/io5'

function Navbar() {
  const { user } = useAuth()
  const { darkMode, toggleTheme } = useTheme()
  const navigate = useNavigate()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-16">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            Pay<span className="text-indigo-600">Flow</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {user && user.role === 'admin' && (
            <button
              onClick={function () { navigate('/admin') }}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <IoSettingsOutline className="text-xl text-gray-600 dark:text-gray-300" />
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {darkMode
              ? <IoSunnyOutline className="text-xl text-yellow-400" />
              : <IoMoonOutline className="text-xl text-gray-600" />
            }
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
