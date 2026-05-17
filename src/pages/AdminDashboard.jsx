// AdminDashboard.jsx - Admin analytics dashboard with charts
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'
import { IoPeopleOutline, IoSwapHorizontalOutline, IoTrendingUp, IoTimeOutline, IoChevronForward } from 'react-icons/io5'

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/admin/stats')
      .then(function (res) { setStats(res.data) })
      .catch(function () { })
      .finally(function () { setLoading(false) })
  }, [])

  if (loading) return <LoadingSpinner fullScreen />
  if (!stats) return null

  // Prepare chart data
  var pieData = [
    { name: 'Success', value: stats.transactions.successful },
    { name: 'Failed', value: stats.transactions.failed },
    { name: 'Pending', value: stats.transactions.pending },
  ]
  var PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b']

  var monthlyData = (stats.monthly_transactions || []).reverse().map(function (m) {
    return {
      month: m.month,
      transactions: m.count,
      volume: Math.round((m.volume || 0) / 1000),
    }
  })

  var userGrowth = (stats.monthly_users || []).reverse().map(function (m) {
    return { month: m.month, users: m.count }
  })

  var statCards = [
    { label: 'Total Users', value: stats.users.total, icon: IoPeopleOutline, color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/40' },
    { label: 'Transactions', value: stats.transactions.total, icon: IoSwapHorizontalOutline, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40' },
    { label: 'Pending', value: stats.transactions.pending, icon: IoTimeOutline, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/40' },
    { label: 'Active Users', value: stats.users.active, icon: IoTrendingUp, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/40' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 pt-20 pb-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">System overview & analytics</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(function (card, i) {
          var Icon = card.icon
          return (
            <div key={i} className="card py-4 animate-slideUp" style={{ animationDelay: (i * 0.05) + 's' }}>
              <div className={'w-10 h-10 rounded-xl flex items-center justify-center mb-2 ' + card.color}>
                <Icon className="text-xl" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              <p className="text-xs text-gray-500">{card.label}</p>
            </div>
          )
        })}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={function () { navigate('/admin/users') }}
          className="card flex items-center justify-between hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-2">
            <IoPeopleOutline className="text-indigo-500 text-xl" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Manage Users</span>
          </div>
          <IoChevronForward className="text-gray-400" />
        </button>
        <button
          onClick={function () { navigate('/admin/transactions') }}
          className="card flex items-center justify-between hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-2">
            <IoSwapHorizontalOutline className="text-emerald-500 text-xl" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Transactions</span>
          </div>
          <IoChevronForward className="text-gray-400" />
        </button>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bar Chart - Transaction Volume */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Monthly Transactions</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="transactions" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-8 text-sm">No data yet</p>
          )}
        </div>

        {/* Pie Chart - Success vs Failed */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Transaction Status</h3>
          {stats.transactions.total > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={function (entry) { return entry.name + ': ' + entry.value }}
                >
                  {pieData.map(function (entry, index) {
                    return <Cell key={index} fill={PIE_COLORS[index]} />
                  })}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-8 text-sm">No data yet</p>
          )}
        </div>
      </div>

      {/* Line Chart - User Growth */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">User Growth</h3>
        {userGrowth.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-400 py-8 text-sm">No data yet</p>
        )}
      </div>

      {/* System Info */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">System Status</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Blocked Users</span>
            <span className="font-medium text-red-500">{stats.users.blocked}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total Volume</span>
            <span className="font-medium text-gray-900 dark:text-white">{'\u20B9'}{stats.transactions.volume.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Success Rate</span>
            <span className="font-medium text-emerald-500">
              {stats.transactions.total > 0
                ? ((stats.transactions.successful / stats.transactions.total) * 100).toFixed(1) + '%'
                : 'N/A'
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Failed Txns</span>
            <span className="font-medium text-red-500">{stats.transactions.failed}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
