// BillsPage.jsx - Bill payments
import { useState, useEffect } from 'react'
import api from '../services/api'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { IoPhonePortraitOutline, IoFlashOutline, IoWaterOutline, IoWifiOutline, IoTvOutline, IoCardOutline, IoCheckmarkCircle, IoChevronBack } from 'react-icons/io5'

function BillsPage() {
  const [providers, setProviders] = useState({})
  const [billHistory, setBillHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [formData, setFormData] = useState({
    provider: '', account_number: '', amount: '', upi_pin: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const { addToast } = useToast()

  var categoryIcons = {
    mobile: IoPhonePortraitOutline,
    electricity: IoFlashOutline,
    water: IoWaterOutline,
    internet: IoWifiOutline,
    dth: IoTvOutline,
    credit_card: IoCardOutline,
  }

  var categoryColors = {
    mobile: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600',
    electricity: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600',
    water: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600',
    internet: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600',
    dth: 'bg-red-100 dark:bg-red-900/40 text-red-600',
    credit_card: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600',
  }

  var categoryLabels = {
    mobile: 'Mobile Recharge',
    electricity: 'Electricity',
    water: 'Water',
    internet: 'Internet',
    dth: 'DTH',
    credit_card: 'Credit Card',
  }

  useEffect(() => {
    Promise.all([
      api.get('/api/bills/providers'),
      api.get('/api/bills')
    ])
      .then(function (results) {
        setProviders(results[0].data.providers)
        setBillHistory(results[1].data.bills)
      })
      .catch(function () { })
      .finally(function () { setLoading(false) })
  }, [])

  function handleChange(e) {
    var name = e.target.name
    var value = e.target.value
    setFormData(function (prev) { return { ...prev, [name]: value } })
  }

  function handlePay(e) {
    e.preventDefault()
    if (!formData.provider || !formData.account_number || !formData.amount || !formData.upi_pin) {
      addToast('Please fill all fields', 'error')
      return
    }
    if (formData.upi_pin.length !== 4) {
      addToast('Enter 4-digit UPI PIN', 'error')
      return
    }

    setSubmitting(true)
    api.post('/api/bills/pay', {
      bill_type: selectedCategory,
      provider: formData.provider,
      account_number: formData.account_number,
      amount: parseFloat(formData.amount),
      upi_pin: formData.upi_pin
    })
      .then(function (res) {
        setResult(res.data)
        addToast('Bill payment successful!', 'success')
      })
      .catch(function (err) {
        addToast(err.response ? err.response.data.error : 'Payment failed', 'error')
      })
      .finally(function () { setSubmitting(false) })
  }

  function resetForm() {
    setSelectedCategory(null)
    setFormData({ provider: '', account_number: '', amount: '', upi_pin: '' })
    setResult(null)
  }

  if (loading) return <LoadingSpinner fullScreen />

  // Success screen
  if (result) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center justify-center py-12 animate-scaleIn">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
            <IoCheckmarkCircle className="text-5xl text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Bill Paid!</h2>
          <p className="text-2xl font-bold text-emerald-500">₹{result.bill.amount.toLocaleString('en-IN')}</p>
          <p className="text-sm text-gray-500 mt-1">{result.bill.provider}</p>
          <button onClick={resetForm} className="btn-primary mt-6 w-full">Pay Another Bill</button>
        </div>
      </div>
    )
  }

  // Bill payment form
  if (selectedCategory) {
    var Icon = categoryIcons[selectedCategory] || IoCardOutline
    return (
      <div className="page-container space-y-4 animate-fadeIn">
        <button onClick={resetForm} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <IoChevronBack /> Back
        </button>

        <div className="flex items-center gap-3">
          <div className={'w-12 h-12 rounded-xl flex items-center justify-center ' + categoryColors[selectedCategory]}>
            <Icon className="text-xl" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{categoryLabels[selectedCategory]}</h2>
        </div>

        <form onSubmit={handlePay} className="card space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Provider</label>
            <select name="provider" value={formData.provider} onChange={handleChange} className="input-field">
              <option value="">Select provider</option>
              {(providers[selectedCategory] || []).map(function (p) {
                return <option key={p} value={p}>{p}</option>
              })}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              {selectedCategory === 'mobile' ? 'Mobile Number' : 'Account / Consumer Number'}
            </label>
            <input
              type="text"
              name="account_number"
              value={formData.account_number}
              onChange={handleChange}
              placeholder="Enter number"
              className="input-field"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Amount</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter amount"
              className="input-field"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">UPI PIN</label>
            <input
              type="password"
              name="upi_pin"
              value={formData.upi_pin}
              onChange={handleChange}
              placeholder="••••"
              className="input-field text-center tracking-widest w-32"
              maxLength={4}
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Processing...' : 'Pay Bill'}
          </button>
        </form>
      </div>
    )
  }

  // Category selection
  return (
    <div className="page-container space-y-4">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Pay Bills</h2>

      {/* Categories */}
      <div className="grid grid-cols-3 gap-3">
        {Object.keys(categoryIcons).map(function (cat) {
          var Icon = categoryIcons[cat]
          return (
            <button
              key={cat}
              onClick={function () { setSelectedCategory(cat) }}
              className="card flex flex-col items-center gap-2 py-4 hover:shadow-md transition-shadow active:scale-95"
            >
              <div className={'w-12 h-12 rounded-xl flex items-center justify-center ' + categoryColors[cat]}>
                <Icon className="text-xl" />
              </div>
              <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">{categoryLabels[cat]}</span>
            </button>
          )
        })}
      </div>

      {/* Recent Bills */}
      {billHistory.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Recent Payments</h3>
          <div className="space-y-2">
            {billHistory.map(function (bill) {
              var Icon = categoryIcons[bill.bill_type] || IoCardOutline
              return (
                <div key={bill.id} className="card flex items-center gap-3 py-3">
                  <div className={'w-8 h-8 rounded-lg flex items-center justify-center ' + (categoryColors[bill.bill_type] || 'bg-gray-100 text-gray-600')}>
                    <Icon className="text-sm" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{bill.provider}</p>
                    <p className="text-[10px] text-gray-400">{new Date(bill.created_at).toLocaleDateString('en-IN')}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">₹{bill.amount.toLocaleString('en-IN')}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default BillsPage
