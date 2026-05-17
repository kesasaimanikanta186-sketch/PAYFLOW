// LoadingSpinner.jsx - Loading indicator component
function LoadingSpinner({ fullScreen, size, text }) {
  const spinnerSize = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-12 h-12' : 'w-8 h-8'

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div className={'animate-spin rounded-full border-3 border-gray-200 dark:border-gray-700 border-t-indigo-600 ' + spinnerSize}
        style={{ borderWidth: '3px' }}
      ></div>
      {text && <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-8">
      {spinner}
    </div>
  )
}

export default LoadingSpinner
