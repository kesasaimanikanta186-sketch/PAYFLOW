// TransactionsPage.jsx - Full transaction history with search/filter
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import TransactionCard from '../components/TransactionCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { IoSearchOutline, IoFunnelOutline } from 'react-icons/io5'

function TransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadTransactions()
  }, [page, statusFilter])

  useEffect(() => {
    // Load stats once
    api.get('/api/transactions/stats')
      .then(function (res) { setStats(res.data) })
      .catch(function () { })
  }, [])

  function loadTransactions() {
    setLoading(true)
    var url = '/api/transactions?page=' + page + '&per_page=20'
    if (search) url += '&search=' + encodeURIComponent(search)
    if (statusFilter) url += '&status=' + statusFilter

    api.get(url)
      .then(function (res) {
        setTransactions(res.data.transactions)
        setTotalPages(res.data.total_pages)
      })
      .catch(function () { })
      .finally(function () { setLoading(false) })
  }

  function handleSearch(e) {
    e.preventDefault()
    setPage(1)
    loadTransactions()
  }

  var filters = [
    { label: 'All', value: '' },
    { label: 'Success', value: 'success' },
    { label: 'Pending', value: 'pending' },
    { label: 'Failed', value: 'failed' },
  ]

  return (
    <div className="page-container space-y-4">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Transaction History</h2>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-2">
          <div className="card text-center py-3">
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Sent</p>
            <p className="text-sm font-bold text-red-500">₹{(stats.total_sent / 1000).toFixed(1)}K</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Received</p>
            <p className="text-sm font-bold text-emerald-500">₹{(stats.total_received / 1000).toFixed(1)}K</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Total</p>
            <p className="text-sm font-bold text-indigo-600">{stats.transaction_count}</p>
          </div>
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="relative">
        <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={function (e) { setSearch(e.target.value) }}
          placeholder="Search transactions..."
          className="input-field pl-10 pr-4"
        />
      </form>

      {/* Filters */}
      <div className="flex gap-2">
        {filters.map(function (f) {
          return (
            <button
              key={f.value}
              onClick={function () { setStatusFilter(f.value); setPage(1) }}
              className={'px-4 py-1.5 rounded-full text-xs font-medium transition-colors ' +
                (statusFilter === f.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300')
              }
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {/* Transaction List */}
      {loading ? (
        <LoadingSpinner />
      ) : transactions.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-4xl mb-2">📋</p>
          <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
        </div>
      ) : (
        <div className="card space-y-1">
          {transactions.map(function (txn) {
            return <TransactionCard key={txn.id} transaction={txn} />
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={function () { setPage(Math.max(1, page - 1)) }}
            disabled={page === 1}
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-gray-500">{page} / {totalPages}</span>
          <button
            onClick={function () { setPage(Math.min(totalPages, page + 1)) }}
            disabled={page === totalPages}
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default TransactionsPage
