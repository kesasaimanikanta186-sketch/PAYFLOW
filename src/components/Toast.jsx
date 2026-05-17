// Toast.jsx - Toast notification display component
import { useToast } from '../context/ToastContext'
import { IoCheckmarkCircle, IoCloseCircle, IoInformationCircle, IoWarning, IoClose } from 'react-icons/io5'

function Toast() {
  const { toasts, removeToast } = useToast()

  function getIcon(type) {
    if (type === 'success') return <IoCheckmarkCircle className="text-xl text-emerald-500" />
    if (type === 'error') return <IoCloseCircle className="text-xl text-red-500" />
    if (type === 'warning') return <IoWarning className="text-xl text-amber-500" />
    return <IoInformationCircle className="text-xl text-blue-500" />
  }

  function getBorderColor(type) {
    if (type === 'success') return 'border-l-emerald-500'
    if (type === 'error') return 'border-l-red-500'
    if (type === 'warning') return 'border-l-amber-500'
    return 'border-l-blue-500'
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map(function (toast) {
        return (
          <div
            key={toast.id}
            className={'animate-slideUp bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 border-l-4 ' +
              getBorderColor(toast.type) + ' p-4 flex items-start gap-3'
            }
          >
            {getIcon(toast.type)}
            <p className="text-sm text-gray-700 dark:text-gray-200 flex-1">{toast.message}</p>
            <button
              onClick={function () { removeToast(toast.id) }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <IoClose className="text-lg" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default Toast
