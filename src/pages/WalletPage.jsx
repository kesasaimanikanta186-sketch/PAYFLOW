// WalletPage.jsx - Wallet management (add money, transfer, history)
import { useState, useEffect } from 'react'
import api from '../services/api'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { IoWalletOutline, IoAddCircle, IoArrowForwardCircle, IoArrowDownCircle, IoArrowUpCircle } from 'react-icons/io5'

function WalletPage() {
  const [wallet, setWallet] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('history') // 'history', 'add', 'transfer'
  const [amount, setAmount] = useState('')
  const [pin, setPin] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    loadWalletData()
  }, [])

  function loadWalletData() {
    Promise.all([
      api.get('/api/wallet'),
      api.get('/api/wallet/history')
    ])
      .then(function (results) {
        setWallet(results[0].data.wallet)
        setHistory(results[1].data.history)
      })
      .catch(function () { addToast('Failed to load wallet', 'error') })
      .finally(function () { setLoading(false) })
  }

  function handleAddMoney(e) {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) {
      addToast('Enter a valid amount', 'error')
      return
    }
    setSubmitting(true)
    api.post('/api/wallet/add', { amount: parseFloat(amount) })
      .then(function (res) {
        addToast(res.data.message, 'success')
        setWallet(function (prev) { return { ...prev, balance: res.data.new_balance } })
        setAmount('')
        setActiveTab('history')
        loadWalletData()
      })
      .catch(function (err) {
        addToast(err.response ? err.response.data.error : 'Failed', 'error')
      })
      .finally(function () { setSubmitting(false) })
  }

  function handleTransfer(e) {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) {
      addToast('Enter a valid amount', 'error')
      return
    }
    if (pin.length !== 4) {
      addToast('Enter 4-digit UPI PIN', 'error')
      return
    }
    setSubmitting(true)
    api.post('/api/wallet/transfer', { amount: parseFloat(amount), upi_pin: pin })
      .then(function (res) {
        addToast(res.data.message, 'success')
        setWallet(function (prev) { return { ...prev, balance: res.data.new_balance } })
        setAmount('')
        setPin('')
        setActiveTab('history')
        loadWalletData()
      })
      .catch(function (err) {
        addToast(err.response ? err.response.data.error : 'Failed', 'error')
      })
      .finally(function () { setSubmitting(false) })
  }

  if (loading) return <LoadingSpinner fullScreen />

  var tabs = [
    { key: 'history', label: 'History' },
    { key: 'add', label: 'Add Money' },
    { key: 'transfer', label: 'Transfer' },
  ]

  return (
    <div className="page-container space-y-4">
      {/* Wallet Balance */}
      <div className="gradient-bg rounded-2xl p-5 text-white text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
        <IoWalletOutline className="text-3xl mx-auto mb-2 opacity-80" />
        <p className="text-sm opacity-80">Wallet Balance</p>
        <p className="text-3xl font-bold mt-1">
          ₹{wallet ? wallet.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {tabs.map(function (tab) {
          return (
            <button
              key={tab.key}
              onClick={function () { setActiveTab(tab.key); setAmount(''); setPin('') }}
              className={'flex-1 py-2 text-sm font-medium rounded-lg transition-colors ' +
                (activeTab === tab.key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400')
              }
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Add Money Form */}
      {activeTab === 'add' && (
        <form onSubmit={handleAddMoney} className="card space-y-4 animate-fadeIn">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Add Money to Wallet</h3>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={function (e) { setAmount(e.target.value) }}
              placeholder="Enter amount"
              className="input-field text-lg"
              autoFocus
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[500, 1000, 2000, 5000, 10000].map(function (amt) {
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={function () { setAmount(String(amt)) }}
                  className="px-3 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
                >
                  ₹{amt.toLocaleString('en-IN')}
                </button>
              )
            })}
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Processing...' : 'Add Money'}
          </button>
        </form>
      )}

      {/* Transfer Form */}
      {activeTab === 'transfer' && (
        <form onSubmit={handleTransfer} className="card space-y-4 animate-fadeIn">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Transfer to Bank</h3>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={function (e) { setAmount(e.target.value) }}
              placeholder="Enter amount"
              className="input-field"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">UPI PIN</label>
            <input
              type="password"
              value={pin}
              onChange={function (e) { if (e.target.value.length <= 4) setPin(e.target.value) }}
              placeholder="••••"
              className="input-field text-center tracking-widest"
              maxLength={4}
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Processing...' : 'Transfer'}
          </button>
        </form>
      )}

      {/* History */}
      {activeTab === 'history' && (
        <div className="space-y-2 animate-fadeIn">
          {history.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-400 text-sm">No wallet history yet</p>
            </div>
          ) : (
            history.map(function (item) {
              var isCredit = item.type === 'credit'
              return (
                <div key={item.id} className="card flex items-center gap-3 py-3">
                  <div className={'w-8 h-8 rounded-full flex items-center justify-center ' +
                    (isCredit ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30')
                  }>
                    {isCredit
                      ? <IoArrowDownCircle className="text-emerald-500" />
                      : <IoArrowUpCircle className="text-red-500" />
                    }
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.description}</p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(item.created_at).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <p className={'text-sm font-bold ' + (isCredit ? 'text-emerald-500' : 'text-red-500')}>
                    {isCredit ? '+' : ''}₹{Math.abs(item.amount).toLocaleString('en-IN')}
                  </p>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export default WalletPage
