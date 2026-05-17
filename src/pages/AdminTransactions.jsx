// AdminTransactions.jsx - Admin view of all transactions
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { IoArrowBack, IoCheckmarkCircle, IoCloseCircle, IoTimeOutline } from 'react-icons/io5'

function AdminTransactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    loadTransactions()
  }, [page])

  function loadTransactions() {
    setLoading(true)
    api.get('/api/admin/transactions?page=' + page + '&per_page=20')
      .then(function (res) {
        setTransactions(res.data.transactions)
        setTotalPages(res.data.total_pages)
        setTotal(res.data.total)
      })
      .catch(function () { })
      .finally(function () { setLoading(false) })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-20 pb-8 space-y-4">
      <button
        onClick={function () { navigate('/admin') }}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <IoArrowBack /> Admin Dashboard
      </button>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">All Transactions</h2>
        <span className="text-xs text-gray-500">{total} total</span>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : transactions.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-400">No transactions found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map(function (txn) {
            var isSuccess = txn.status === 'success'
            var isPending = txn.status === 'pending'
            return (
              <div key={txn.id} className="card animate-fadeIn">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={'w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ' +
                      (isSuccess ? 'bg-emerald-100 dark:bg-emerald-900/30' : isPending ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-red-100 dark:bg-red-900/30')
                    }>
                      {isSuccess
                        ? <IoCheckmarkCircle className="text-emerald-500" />
                        : isPending
                          ? <IoTimeOutline className="text-amber-500" />
                          : <IoCloseCircle className="text-red-500" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {txn.sender_name || 'Unknown'} → {txn.receiver_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {txn.sender_upi} → {txn.receiver_upi}
                      </p>
                      {txn.note && <p className="text-xs text-gray-400 mt-0.5">"{txn.note}"</p>}
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(txn.date_time).toLocaleString('en-IN')} • {txn.transaction_id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{'\u20B9'}{txn.amount.toLocaleString('en-IN')}</p>
                    <span className={'text-[10px] px-1.5 py-0.5 rounded-full font-medium ' +
                      (isSuccess ? 'bg-emerald-100 text-emerald-600' : isPending ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600')
                    }>
                      {txn.status}
                    </span>
                  </div>
                </div>
              </div>
            )
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
            Previous
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

export default AdminTransactions
