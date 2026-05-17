// App.jsx - Main application with routing
import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import BottomNav from './components/BottomNav'
import Toast from './components/Toast'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import SendMoneyPage from './pages/SendMoneyPage'
import TransactionsPage from './pages/TransactionsPage'
import TransactionDetailPage from './pages/TransactionDetailPage'
import BankAccountsPage from './pages/BankAccountsPage'
import ProfilePage from './pages/ProfilePage'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import AdminTransactions from './pages/AdminTransactions'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Toast />

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/" element={<ProtectedRoute><Navbar /><HomePage /><BottomNav /></ProtectedRoute>} />
        <Route path="/send" element={<ProtectedRoute><Navbar /><SendMoneyPage /><BottomNav /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><Navbar /><TransactionsPage /><BottomNav /></ProtectedRoute>} />
        <Route path="/transactions/:id" element={<ProtectedRoute><Navbar /><TransactionDetailPage /><BottomNav /></ProtectedRoute>} />
        <Route path="/bank-accounts" element={<ProtectedRoute><Navbar /><BankAccountsPage /><BottomNav /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Navbar /><ProfilePage /><BottomNav /></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute adminOnly><Navbar /><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute adminOnly><Navbar /><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/transactions" element={<ProtectedRoute adminOnly><Navbar /><AdminTransactions /></ProtectedRoute>} />
      </Routes>
    </div>
  )
}

export default App
