// TransactionDetailPage.jsx - Single transaction detail
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { IoArrowBack, IoCheckmarkCircle, IoCloseCircle, IoTimeOutline, IoDownloadOutline } from 'react-icons/io5'

function TransactionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [transaction, setTransaction] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(function () {
    api.get('/api/transactions/' + id)
      .then(function (res) { setTransaction(res.data.transaction) })
      .catch(function () { navigate('/transactions') })
      .finally(function () { setLoading(false) })
  }, [id])

  function downloadReceipt() {
    if (!transaction) return

    var receiptContent = [
      '========================================',
      '       PAYFLOW TRANSACTION RECEIPT',
      '========================================',
      '',
      '  Transaction ID: ' + transaction.transaction_id,
      '  Date: ' + new Date(transaction.date_time).toLocaleString('en-IN'),
      '  Status: ' + transaction.status.toUpperCase(),
      '',
      '  Amount: Rs.' + transaction.amount.toLocaleString('en-IN'),
      '  From: ' + (transaction.sender_name || 'N/A'),
      '  To: ' + (transaction.receiver_name || 'N/A'),
      '  Note: ' + (transaction.note || 'N/A'),
      '',
      '========================================',
      '  Thank you for using PayFlow!',
      '========================================',
    ].join('\n')

    var blob = new Blob([receiptContent], { type: 'text/plain' })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = 'PayFlow_Receipt_' + transaction.transaction_id + '.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <LoadingSpinner fullScreen />
  if (!transaction) return null

  var isSent = transaction.direction === 'sent'
  var isSuccess = transaction.status === 'success'
  var isPending = transaction.status === 'pending'
  var isFailed = transaction.status === 'failed'

  return (
    <div className="page-container space-y-4">
      <button
        onClick={function () { navigate('/transactions') }}
        className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700"
      >
        <IoArrowBack /> Back
      </button>

      <div className="text-center py-4 animate-scaleIn">
        <div className={'w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-3 ' +
          (isSuccess ? 'bg-emerald-100 dark:bg-emerald-900/30' : isPending ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-red-100 dark:bg-red-900/30')
        }>
          {isSuccess
            ? <IoCheckmarkCircle className="text-5xl text-emerald-500" />
            : isPending
              ? <IoTimeOutline className="text-5xl text-amber-500" />
              : <IoCloseCircle className="text-5xl text-red-500" />
          }
        </div>

        <p className={'text-3xl font-bold ' + (isFailed ? 'text-gray-400' : isSent ? 'text-red-500' : 'text-emerald-500')}>
          {isSent ? '-' : '+'}{'\u20B9'}{transaction.amount.toLocaleString('en-IN')}
        </p>
        <p className={'text-sm font-medium mt-1 ' + (isSuccess ? 'text-emerald-500' : isPending ? 'text-amber-500' : 'text-red-500')}>
          {isSuccess ? 'Successful' : isPending ? 'Pending' : 'Failed'}
        </p>
      </div>

      <div className="card space-y-3 animate-slideUp">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Transaction Details</h3>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-500">Transaction ID</span>
            <span className="text-gray-900 dark:text-white font-mono text-xs">{transaction.transaction_id}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-500">Date & Time</span>
            <span className="text-gray-900 dark:text-white">
              {new Date(transaction.date_time).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-500">From</span>
            <div className="text-right">
              <p className="text-gray-900 dark:text-white font-medium">{transaction.sender_name}</p>
              <p className="text-xs text-gray-400">{transaction.sender_upi}</p>
            </div>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-500">To</span>
            <div className="text-right">
              <p className="text-gray-900 dark:text-white font-medium">{transaction.receiver_name}</p>
              <p className="text-xs text-gray-400">{transaction.receiver_upi}</p>
            </div>
          </div>
          {transaction.note && (
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Note</span>
              <span className="text-gray-900 dark:text-white">{transaction.note}</span>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={downloadReceipt}
        className="btn-secondary w-full flex items-center justify-center gap-2"
      >
        <IoDownloadOutline className="text-lg" />
        Download Receipt
      </button>
    </div>
  )
}

export default TransactionDetailPage
