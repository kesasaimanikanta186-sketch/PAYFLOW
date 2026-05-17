// BankAccountsPage.jsx - Bank account management
import { useState, useEffect } from 'react'
import api from '../services/api'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { IoAddCircleOutline, IoTrashOutline, IoStarOutline, IoStar, IoCardOutline } from 'react-icons/io5'

function BankAccountsPage() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    bank_name: '', account_number: '', ifsc: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const { addToast } = useToast()

  var bankOptions = [
    'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank',
    'Punjab National Bank', 'Bank of Baroda', 'Kotak Mahindra Bank',
    'Yes Bank', 'IndusInd Bank', 'Union Bank of India'
  ]

  useEffect(() => {
    loadAccounts()
  }, [])

  function loadAccounts() {
    api.get('/api/bank-accounts')
      .then(function (res) { setAccounts(res.data.accounts) })
      .catch(function () { addToast('Failed to load accounts', 'error') })
      .finally(function () { setLoading(false) })
  }

  function handleChange(e) {
    var name = e.target.name
    var value = e.target.value
    setFormData(function (prev) { return { ...prev, [name]: value } })
  }

  function handleAdd(e) {
    e.preventDefault()
    if (!formData.bank_name || !formData.account_number || !formData.ifsc) {
      addToast('Please fill required fields', 'error')
      return
    }

    setSubmitting(true)
    api.post('/api/bank-accounts', formData)
      .then(function (res) {
        addToast(res.data.message, 'success')
        setShowForm(false)
        setFormData({ bank_name: '', account_number: '', ifsc: '' })
        loadAccounts()
      })
      .catch(function (err) {
        addToast(err.response ? err.response.data.error : 'Failed to add account', 'error')
      })
      .finally(function () { setSubmitting(false) })
  }

  function setPrimary(accountId) {
    api.put('/api/bank-accounts/' + accountId + '/primary')
      .then(function () {
        addToast('Primary account updated', 'success')
        loadAccounts()
      })
      .catch(function () { addToast('Failed to update', 'error') })
  }

  function removeAccount(accountId) {
    if (!confirm('Remove this bank account?')) return
    api.delete('/api/bank-accounts/' + accountId)
      .then(function () {
        addToast('Account removed', 'success')
        loadAccounts()
      })
      .catch(function () { addToast('Failed to remove', 'error') })
  }

  if (loading) return <LoadingSpinner fullScreen />

  return (
    <div className="page-container space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Bank Accounts</h2>
        <button
          onClick={function () { setShowForm(!showForm) }}
          className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 font-medium"
        >
          <IoAddCircleOutline className="text-lg" /> Add
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleAdd} className="card space-y-3 animate-slideUp">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Link New Account</h3>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Bank Name</label>
            <select
              name="bank_name"
              value={formData.bank_name}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Select Bank</option>
              {bankOptions.map(function (bank) {
                return <option key={bank} value={bank}>{bank}</option>
              })}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Account Number</label>
            <input
              type="text"
              name="account_number"
              value={formData.account_number}
              onChange={handleChange}
              placeholder="Enter account number"
              className="input-field"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">IFSC Code</label>
            <input
              type="text"
              name="ifsc"
              value={formData.ifsc}
              onChange={handleChange}
              placeholder="e.g. SBIN0001234"
              className="input-field"
            />
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={function () { setShowForm(false) }} className="btn-secondary flex-1 py-2 text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 py-2 text-sm">
              {submitting ? 'Adding...' : 'Add Account'}
            </button>
          </div>
        </form>
      )}

      {/* Account List */}
      {accounts.length === 0 ? (
        <div className="card text-center py-10">
          <IoCardOutline className="text-4xl text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400">No bank accounts linked</p>
          <button
            onClick={function () { setShowForm(true) }}
            className="mt-2 text-indigo-600 dark:text-indigo-400 text-sm font-medium"
          >
            Link your first account →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map(function (account) {
            return (
              <div key={account.id} className="card animate-fadeIn">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                      <IoCardOutline className="text-blue-600 text-lg" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                        {account.bank_name}
                        {account.is_primary === 1 && (
                          <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 px-1.5 py-0.5 rounded-full">Primary</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        ••••{account.account_number.slice(-4)} | {account.ifsc}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    {account.is_primary !== 1 && (
                      <button
                        onClick={function () { setPrimary(account.id) }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Set as primary"
                      >
                        <IoStarOutline className="text-gray-400 text-lg" />
                      </button>
                    )}
                    <button
                      onClick={function () { removeAccount(account.id) }}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <IoTrashOutline className="text-red-400 text-lg" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default BankAccountsPage
