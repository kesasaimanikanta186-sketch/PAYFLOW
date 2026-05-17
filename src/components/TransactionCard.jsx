// TransactionCard.jsx - Individual transaction list item
import { useNavigate } from 'react-router-dom'
import { IoArrowUpCircle, IoArrowDownCircle, IoTimeOutline } from 'react-icons/io5'

function TransactionCard({ transaction }) {
  const navigate = useNavigate()
  const isSent = transaction.direction === 'sent'
  const isPending = transaction.status === 'pending'
  const isFailed = transaction.status === 'failed'

  return (
    <button
      onClick={function () { navigate('/transactions/' + transaction.id) }}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200"
    >
      <div className={
        'w-10 h-10 rounded-full flex items-center justify-center ' +
        (isPending
          ? 'bg-amber-100 dark:bg-amber-900/30'
          : isSent
            ? 'bg-red-100 dark:bg-red-900/30'
            : 'bg-emerald-100 dark:bg-emerald-900/30')
      }>
        {isPending
          ? <IoTimeOutline className="text-xl text-amber-500" />
          : isSent
            ? <IoArrowUpCircle className="text-xl text-red-500" />
            : <IoArrowDownCircle className="text-xl text-emerald-500" />
        }
      </div>

      <div className="flex-1 text-left">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {isSent ? transaction.receiver_name : transaction.sender_name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {transaction.note || (isSent ? 'Sent' : 'Received')}
        </p>
      </div>

      <div className="text-right">
        <p className={
          'text-sm font-bold ' +
          (isFailed
            ? 'text-gray-400 line-through'
            : isPending
              ? 'text-amber-500'
              : isSent
                ? 'text-red-500'
                : 'text-emerald-500')
        }>
          {isSent ? '-' : '+'}{'\u20B9'}{transaction.amount.toLocaleString('en-IN')}
        </p>
        <p className="text-[10px] text-gray-400">
          {isFailed ? 'Failed' : isPending ? 'Pending' : new Date(transaction.date_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </p>
      </div>
    </button>
  )
}

export default TransactionCard
