// BalanceCard.jsx - Balance display card
import { useNavigate } from 'react-router-dom'
import { IoEyeOutline, IoEyeOffOutline, IoWalletOutline } from 'react-icons/io5'
import { useState } from 'react'

function BalanceCard({ balance, upiId }) {
  const [showBalance, setShowBalance] = useState(true)
  const navigate = useNavigate()

  return (
    <div className="gradient-bg rounded-2xl p-5 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <IoWalletOutline className="text-xl" />
            <span className="text-sm font-medium text-white/80">Balance</span>
          </div>
          <button
            onClick={function () { setShowBalance(!showBalance) }}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            {showBalance
              ? <IoEyeOutline className="text-lg text-white/70" />
              : <IoEyeOffOutline className="text-lg text-white/70" />
            }
          </button>
        </div>

        <h2 className="text-3xl font-bold mb-1">
          {showBalance
            ? '\u20B9' + (balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })
            : '\u20B9 \u2022\u2022\u2022\u2022\u2022\u2022'
          }
        </h2>

        <p className="text-sm text-white/70 mb-4">UPI ID: {upiId || '---'}</p>

        <div className="flex gap-3">
          <button
            onClick={function () { navigate('/send') }}
            className="flex-1 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors"
          >
            Send Money
          </button>
          <button
            onClick={function () { navigate('/transactions') }}
            className="flex-1 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors"
          >
            History
          </button>
        </div>
      </div>
    </div>
  )
}

export default BalanceCard
