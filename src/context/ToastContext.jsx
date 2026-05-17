// ToastContext.jsx - Global toast notification system
import { createContext, useState, useContext } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  function addToast(message, type) {
    // type: 'success', 'error', 'info', 'warning'
    const id = Date.now() + Math.random()
    setToasts(function (prev) {
      return [...prev, { id, message, type: type || 'info' }]
    })

    // Auto remove after 3 seconds
    setTimeout(function () {
      setToasts(function (prev) {
        return prev.filter(function (t) { return t.id !== id })
      })
    }, 3000)
  }

  function removeToast(id) {
    setToasts(function (prev) {
      return prev.filter(function (t) { return t.id !== id })
    })
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

export default ToastContext
