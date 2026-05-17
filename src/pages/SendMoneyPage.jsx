// SendMoneyPage.jsx - Multi-step send money flow
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../services/api'
import sendTransactionEmail from '../services/emailService'
import { IoSearchOutline, IoPersonCircle, IoCheckmarkCircle, IoCloseCircle, IoArrowBack } from 'react-icons/io5'

function SendMoneyPage() {
  const { user, fetchProfile } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [receiverUpi, setReceiverUpi] = useState('')
  const [receiverName, setReceiverName] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [pin, setPin] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [recentContacts, setRecentContacts] = useState([])
  const [result, setResult] = useState(null)

  useEffect(function () {
    api.get('/api/auth/users/recent')
      .then(function (res) { setRecentContacts(res.data.contacts) })
      .catch(function () { })
  }, [])

  function handleSearch(query) {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }
    api.get('/api/auth/users/search?q=' + encodeURIComponent(query))
      .then(function (res) { setSearchResults(res.data.users) })
      .catch(function () { })
  }

  function selectReceiver(contact) {
    setReceiverUpi(contact.upi_id)
    setReceiverName(contact.name)
    setStep(2)
  }

  function handleUpiDirect() {
    if (!receiverUpi.includes('@')) {
      addToast('Enter a valid UPI ID (e.g. phone@payflow)', 'error')
      return
    }
    setReceiverName(receiverUpi)
    setStep(2)
  }

  function handleAmountNext() {
    var amt = parseFloat(amount)
    if (!amt || amt <= 0) {
      addToast('Enter a valid amount', 'error')
      return
    }
    if (amt > 100000) {
      addToast('Maximum limit is 1,00,000', 'error')
      return
    }
    setStep(3)
  }

  function handleConfirm() {
    setStep(4)
  }

  function handlePinSubmit() {
    if (pin.length !== 4) {
      addToast('Enter 4-digit UPI PIN', 'error')
      return
    }
    setStep(5)

    setTimeout(function () {
      api.post('/api/transactions/send', {
        receiver_upi: receiverUpi,
        amount: parseFloat(amount),
        note: note,
        upi_pin: pin
      })
        .then(function (res) {
          setResult({ status: 'success', data: res.data })
          setStep(6)
          fetchProfile()

          // EmailJS - send ONLY after backend confirms
          sendTransactionEmail({
            to_email: user.email,
            to_name: user.name,
            amount: amount,
            receiver: res.data.transaction.receiver_name,
            transaction_id: res.data.transaction_id,
            status: 'Success',
            date_time: new Date().toLocaleString('en-IN')
          })
        })
        .catch(function (err) {
          var msg = err.response && err.response.data ? err.response.data.error : 'Transaction failed'
          var txnId = err.response && err.response.data ? err.response.data.transaction_id : null
          setResult({ status: 'failed', message: msg, transaction_id: txnId })
          setStep(6)

          // EmailJS on failure too
          if (txnId) {
            sendTransactionEmail({
              to_email: user.email,
              to_name: user.name,
              amount: amount,
              receiver: receiverName,
              transaction_id: txnId,
              status: 'Failed - ' + msg,
              date_time: new Date().toLocaleString('en-IN')
            })
          }
        })
    }, 2000)
  }

  var quickAmounts = [100, 200, 500, 1000, 2000, 5000]

  return (
    <div className="page-container">
      {step > 1 && step < 5 && (
        <button
          onClick={function () { setStep(step - 1) }}
          className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-4 hover:text-gray-700"
        >
          <IoArrowBack /> Back
        </button>
      )}

      {/* Step 1: Select Receiver */}
      {step === 1 && (
        <div className="space-y-4 animate-fadeIn">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Send Money</h2>

          <div className="card">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Enter UPI ID</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={receiverUpi}
                onChange={function (e) { setReceiverUpi(e.target.value) }}
                placeholder="phone@payflow"
                className="input-field flex-1"
              />
              <button onClick={handleUpiDirect} className="btn-primary px-4 py-2 text-sm">Go</button>
            </div>
          </div>

          <div className="card">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Search People</label>
            <div className="relative">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={function (e) { handleSearch(e.target.value) }}
                placeholder="Search by name or mobile"
                className="input-field pl-10"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="mt-3 space-y-1">
                {searchResults.map(function (contact) {
                  return (
                    <button
                      key={contact.id}
                      onClick={function () { selectReceiver(contact) }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                        <span className="text-indigo-600 font-bold text-sm">{contact.name[0]}</span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{contact.name}</p>
                        <p className="text-xs text-gray-500">{contact.upi_id}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {recentContacts.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase">Recent</h3>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {recentContacts.map(function (contact) {
                  return (
                    <button
                      key={contact.id}
                      onClick={function () { selectReceiver(contact) }}
                      className="flex flex-col items-center gap-1 min-w-[60px]"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                        <span className="text-white font-bold">{contact.name[0]}</span>
                      </div>
                      <span className="text-[10px] text-gray-600 dark:text-gray-300 text-center truncate w-16">
                        {contact.name.split(' ')[0]}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Enter Amount */}
      {step === 2 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="card flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
              <IoPersonCircle className="text-2xl text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{receiverName}</p>
              <p className="text-xs text-gray-500">{receiverUpi}</p>
            </div>
          </div>

          <div className="card text-center">
            <label className="text-xs text-gray-500 dark:text-gray-400">Enter Amount</label>
            <div className="flex items-center justify-center gap-1 my-4">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">{'\u20B9'}</span>
              <input
                type="number"
                value={amount}
                onChange={function (e) { setAmount(e.target.value) }}
                placeholder="0"
                className="text-4xl font-bold text-center bg-transparent outline-none w-40 text-gray-900 dark:text-white"
                autoFocus
              />
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {quickAmounts.map(function (amt) {
                return (
                  <button
                    key={amt}
                    onClick={function () { setAmount(String(amt)) }}
                    className={'px-4 py-1.5 rounded-full text-xs font-medium transition-colors ' +
                      (amount === String(amt)
                        ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300')
                    }
                  >
                    {'\u20B9'}{amt.toLocaleString('en-IN')}
                  </button>
                )
              })}
            </div>

            <input
              type="text"
              value={note}
              onChange={function (e) { setNote(e.target.value) }}
              placeholder="Add a note (optional)"
              className="input-field text-center text-sm"
              maxLength={100}
            />
          </div>

          <button onClick={handleAmountNext} className="btn-primary w-full">Continue</button>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="space-y-4 animate-scaleIn">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white text-center">Confirm Payment</h2>

          <div className="card space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Sending</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white my-2">{'\u20B9'}{parseFloat(amount).toLocaleString('en-IN')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">to</p>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                <span className="text-indigo-600 font-bold">{receiverName[0]}</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{receiverName}</p>
                <p className="text-xs text-gray-500">{receiverUpi}</p>
              </div>
            </div>

            {note && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Note</span>
                <span className="text-gray-900 dark:text-white">{note}</span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">From</span>
              <span className="text-gray-900 dark:text-white">{user ? user.upi_id : ''}</span>
            </div>
          </div>

          <button onClick={handleConfirm} className="btn-primary w-full">Pay {'\u20B9'}{parseFloat(amount).toLocaleString('en-IN')}</button>
        </div>
      )}

      {/* Step 4: Enter PIN */}
      {step === 4 && (
        <div className="space-y-4 animate-fadeIn text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
            <span className="text-2xl">&#128274;</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Enter UPI PIN</h2>
          <p className="text-sm text-gray-500">Enter your 4-digit UPI PIN to confirm</p>

          <div className="flex justify-center">
            <input
              type="password"
              value={pin}
              onChange={function (e) {
                if (e.target.value.length <= 4) setPin(e.target.value)
              }}
              placeholder="----"
              className="input-field w-40 text-center text-2xl tracking-[0.5em] font-bold"
              maxLength={4}
              autoFocus
            />
          </div>

          <button
            onClick={handlePinSubmit}
            disabled={pin.length !== 4}
            className="btn-primary w-full"
          >
            Confirm Payment
          </button>
        </div>
      )}

      {/* Step 5: Processing */}
      {step === 5 && (
        <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
          <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center animate-pulse mb-6">
            <span className="text-3xl text-white">{'\u20B9'}</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">Processing Payment...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Please wait</p>
          <div className="flex gap-1 mt-4">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      )}

      {/* Step 6: Result */}
      {step === 6 && result && (
        <div className="flex flex-col items-center justify-center py-12 animate-scaleIn">
          {result.status === 'success' ? (
            <>
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                <IoCheckmarkCircle className="text-5xl text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Payment Successful!</h2>
              <p className="text-3xl font-bold text-emerald-500 mb-2">{'\u20B9'}{parseFloat(amount).toLocaleString('en-IN')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">sent to {result.data.transaction.receiver_name}</p>

              <div className="card w-full mt-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction ID</span>
                  <span className="text-gray-900 dark:text-white font-mono text-xs">{result.data.transaction_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">To</span>
                  <span className="text-gray-900 dark:text-white">{result.data.transaction.receiver_upi}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">New Balance</span>
                  <span className="text-gray-900 dark:text-white font-semibold">
                    {'\u20B9'}{result.data.new_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <IoCloseCircle className="text-5xl text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Payment Failed</h2>
              <p className="text-sm text-red-500">{result.message}</p>
              {result.transaction_id && (
                <p className="text-xs text-gray-400 mt-1">Ref: {result.transaction_id}</p>
              )}
            </>
          )}

          <div className="flex gap-3 w-full mt-6">
            <button onClick={function () { navigate('/') }} className="btn-secondary flex-1">Home</button>
            <button
              onClick={function () {
                setStep(1); setAmount(''); setPin(''); setNote(''); setReceiverUpi(''); setResult(null)
              }}
              className="btn-primary flex-1"
            >
              Send Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SendMoneyPage
