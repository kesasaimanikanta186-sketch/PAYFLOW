// SavingsPage.jsx - Savings goals management
import { useState, useEffect } from 'react'
import api from '../services/api'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { IoAddCircleOutline, IoTrashOutline, IoTrendingUp, IoArrowDown, IoArrowUp } from 'react-icons/io5'

function SavingsPage() {
  const [savings, setSavings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [goalName, setGoalName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [activeGoal, setActiveGoal] = useState(null) // for deposit/withdraw
  const [actionType, setActionType] = useState('') // 'deposit' or 'withdraw'
  const [actionAmount, setActionAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    loadSavings()
  }, [])

  function loadSavings() {
    api.get('/api/savings')
      .then(function (res) { setSavings(res.data.savings) })
      .catch(function () { addToast('Failed to load savings', 'error') })
      .finally(function () { setLoading(false) })
  }

  function handleCreate(e) {
    e.preventDefault()
    if (!goalName || !targetAmount || parseFloat(targetAmount) <= 0) {
      addToast('Fill all fields correctly', 'error')
      return
    }
    setSubmitting(true)
    api.post('/api/savings', { goal_name: goalName, target_amount: parseFloat(targetAmount) })
      .then(function (res) {
        addToast(res.data.message, 'success')
        setShowForm(false)
        setGoalName('')
        setTargetAmount('')
        loadSavings()
      })
      .catch(function (err) {
        addToast(err.response ? err.response.data.error : 'Failed', 'error')
      })
      .finally(function () { setSubmitting(false) })
  }

  function handleAction(e) {
    e.preventDefault()
    if (!actionAmount || parseFloat(actionAmount) <= 0) {
      addToast('Enter a valid amount', 'error')
      return
    }
    setSubmitting(true)
    var url = '/api/savings/' + activeGoal.id + '/' + actionType
    api.post(url, { amount: parseFloat(actionAmount) })
      .then(function (res) {
        addToast(res.data.message, 'success')
        setActiveGoal(null)
        setActionAmount('')
        loadSavings()
      })
      .catch(function (err) {
        addToast(err.response ? err.response.data.error : 'Failed', 'error')
      })
      .finally(function () { setSubmitting(false) })
  }

  function deleteGoal(goalId) {
    if (!confirm('Delete this savings goal? Remaining amount will be returned to wallet.')) return
    api.delete('/api/savings/' + goalId)
      .then(function (res) {
        addToast(res.data.message, 'success')
        loadSavings()
      })
      .catch(function () { addToast('Failed to delete', 'error') })
  }

  if (loading) return <LoadingSpinner fullScreen />

  return (
    <div className="page-container space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Savings Goals</h2>
        <button
          onClick={function () { setShowForm(!showForm) }}
          className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 font-medium"
        >
          <IoAddCircleOutline className="text-lg" /> New Goal
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-3 animate-slideUp">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Create Savings Goal</h3>
          <input
            type="text"
            value={goalName}
            onChange={function (e) { setGoalName(e.target.value) }}
            placeholder="Goal name (e.g. Vacation)"
            className="input-field"
          />
          <input
            type="number"
            value={targetAmount}
            onChange={function (e) { setTargetAmount(e.target.value) }}
            placeholder="Target amount"
            className="input-field"
          />
          <div className="flex gap-2">
            <button type="button" onClick={function () { setShowForm(false) }} className="btn-secondary flex-1 py-2 text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 py-2 text-sm">
              {submitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      )}

      {/* Action Modal */}
      {activeGoal && (
        <form onSubmit={handleAction} className="card space-y-3 animate-scaleIn border-2 border-indigo-200 dark:border-indigo-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {actionType === 'deposit' ? 'Add to' : 'Withdraw from'} "{activeGoal.goal_name}"
          </h3>
          <input
            type="number"
            value={actionAmount}
            onChange={function (e) { setActionAmount(e.target.value) }}
            placeholder="Enter amount"
            className="input-field"
            autoFocus
          />
          <div className="flex gap-2">
            <button type="button" onClick={function () { setActiveGoal(null) }} className="btn-secondary flex-1 py-2 text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 py-2 text-sm">
              {submitting ? 'Processing...' : (actionType === 'deposit' ? 'Deposit' : 'Withdraw')}
            </button>
          </div>
        </form>
      )}

      {/* Savings List */}
      {savings.length === 0 ? (
        <div className="card text-center py-10">
          <IoTrendingUp className="text-4xl text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400">No savings goals yet</p>
          <button
            onClick={function () { setShowForm(true) }}
            className="mt-2 text-indigo-600 text-sm font-medium"
          >
            Create your first goal →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {savings.map(function (goal) {
            var progress = goal.target_amount > 0
              ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
              : 0

            return (
              <div key={goal.id} className="card animate-fadeIn">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{goal.goal_name}</p>
                    <p className="text-xs text-gray-500">
                      ₹{goal.current_amount.toLocaleString('en-IN')} / ₹{goal.target_amount.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-indigo-600">{progress.toFixed(0)}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                    style={{ width: progress + '%' }}
                  ></div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={function () { setActiveGoal(goal); setActionType('deposit'); setActionAmount('') }}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg hover:bg-emerald-100"
                  >
                    <IoArrowDown /> Add
                  </button>
                  <button
                    onClick={function () { setActiveGoal(goal); setActionType('withdraw'); setActionAmount('') }}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg hover:bg-amber-100"
                  >
                    <IoArrowUp /> Withdraw
                  </button>
                  <button
                    onClick={function () { deleteGoal(goal.id) }}
                    className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <IoTrashOutline />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SavingsPage
