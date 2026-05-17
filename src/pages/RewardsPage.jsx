// RewardsPage.jsx - Rewards and cashback management
import { useState, useEffect } from 'react'
import api from '../services/api'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { IoGiftOutline, IoStarOutline, IoTrophyOutline, IoSparklesOutline } from 'react-icons/io5'

function RewardsPage() {
  const [rewards, setRewards] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [redeemPoints, setRedeemPoints] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    loadRewards()
  }, [])

  function loadRewards() {
    Promise.all([
      api.get('/api/rewards'),
      api.get('/api/rewards/summary')
    ])
      .then(function (results) {
        setRewards(results[0].data.rewards)
        setSummary(results[1].data.summary)
      })
      .catch(function () { addToast('Failed to load rewards', 'error') })
      .finally(function () { setLoading(false) })
  }

  function handleRedeem(e) {
    e.preventDefault()
    var pts = parseInt(redeemPoints)
    if (!pts || pts <= 0) {
      addToast('Enter valid points to redeem', 'error')
      return
    }
    setSubmitting(true)
    api.post('/api/rewards/redeem', { points: pts })
      .then(function (res) {
        addToast(res.data.message, 'success')
        setRedeemPoints('')
        loadRewards()
      })
      .catch(function (err) {
        addToast(err.response ? err.response.data.error : 'Failed', 'error')
      })
      .finally(function () { setSubmitting(false) })
  }

  if (loading) return <LoadingSpinner fullScreen />

  // Offers display
  var offers = [
    { title: '2% Cashback', desc: 'On every UPI transfer over ₹100', color: 'from-indigo-500 to-purple-500' },
    { title: '1% Bill Pay', desc: 'Cashback on bill payments', color: 'from-emerald-500 to-teal-500' },
    { title: 'Sign-up Bonus', desc: '100 points + ₹50 cashback', color: 'from-amber-500 to-orange-500' },
  ]

  return (
    <div className="page-container space-y-4">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Rewards & Cashback</h2>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-2">
          <div className="card text-center py-3">
            <IoStarOutline className="text-xl text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900 dark:text-white">{summary.total_points}</p>
            <p className="text-[10px] text-gray-500">Points</p>
          </div>
          <div className="card text-center py-3">
            <IoSparklesOutline className="text-xl text-emerald-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900 dark:text-white">₹{summary.total_cashback.toFixed(0)}</p>
            <p className="text-[10px] text-gray-500">Cashback</p>
          </div>
          <div className="card text-center py-3">
            <IoTrophyOutline className="text-xl text-indigo-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900 dark:text-white">{summary.total_rewards}</p>
            <p className="text-[10px] text-gray-500">Earned</p>
          </div>
        </div>
      )}

      {/* Redeem Section */}
      <div className="card animate-fadeIn">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Redeem Points</h3>
        <p className="text-xs text-gray-500 mb-3">10 points = ₹1 wallet credit</p>
        <form onSubmit={handleRedeem} className="flex gap-2">
          <input
            type="number"
            value={redeemPoints}
            onChange={function (e) { setRedeemPoints(e.target.value) }}
            placeholder="Enter points"
            className="input-field flex-1"
          />
          <button type="submit" disabled={submitting} className="btn-primary px-4 py-2 text-sm">
            {submitting ? '...' : 'Redeem'}
          </button>
        </form>
        {redeemPoints && parseInt(redeemPoints) > 0 && (
          <p className="text-xs text-emerald-500 mt-2">
            You'll get ₹{(parseInt(redeemPoints) / 10).toFixed(2)} in your wallet
          </p>
        )}
      </div>

      {/* Active Offers */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Active Offers</h3>
        <div className="space-y-2">
          {offers.map(function (offer, index) {
            return (
              <div key={index} className={'bg-gradient-to-r ' + offer.color + ' rounded-xl p-4 text-white'}>
                <p className="font-bold text-sm">{offer.title}</p>
                <p className="text-xs opacity-80 mt-0.5">{offer.desc}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Reward History */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Reward History</h3>
        {rewards.length === 0 ? (
          <div className="card text-center py-6">
            <IoGiftOutline className="text-3xl text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No rewards yet. Start transacting!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rewards.map(function (reward) {
              var isNegative = reward.points < 0
              return (
                <div key={reward.id} className="card flex items-center gap-3 py-3">
                  <div className={'w-8 h-8 rounded-full flex items-center justify-center ' +
                    (isNegative ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-pink-100 dark:bg-pink-900/30')
                  }>
                    {isNegative ? '🔄' : '🎁'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{reward.description}</p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(reward.created_at).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={'text-xs font-bold ' + (isNegative ? 'text-amber-500' : 'text-pink-500')}>
                      {isNegative ? '' : '+'}{reward.points} pts
                    </p>
                    {reward.cashback_amount > 0 && (
                      <p className="text-[10px] text-emerald-500">+₹{reward.cashback_amount}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default RewardsPage
