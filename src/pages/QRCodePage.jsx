// QRCodePage.jsx - QR code generation and scan UI
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { IoQrCodeOutline, IoScanOutline, IoCheckmarkCircle } from 'react-icons/io5'

function QRCodePage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('myqr') // 'myqr' or 'scan'
  const [scannedUpi, setScannedUpi] = useState('')
  const [amount, setAmount] = useState('')

  // Generate QR code using free API
  var upiString = 'upi://pay?pa=' + (user ? user.upi_id : '') + '&pn=' + encodeURIComponent(user ? user.name : '')
  var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(upiString)

  function handleScanPay() {
    if (!scannedUpi || !scannedUpi.includes('@')) {
      addToast('Enter a valid UPI ID', 'error')
      return
    }
    // Navigate to send money with pre-filled UPI
    navigate('/send')
  }

  return (
    <div className="page-container space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        <button
          onClick={function () { setActiveTab('myqr') }}
          className={'flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ' +
            (activeTab === 'myqr'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500')
          }
        >
          <IoQrCodeOutline /> My QR
        </button>
        <button
          onClick={function () { setActiveTab('scan') }}
          className={'flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ' +
            (activeTab === 'scan'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500')
          }
        >
          <IoScanOutline /> Scan QR
        </button>
      </div>

      {/* My QR Code */}
      {activeTab === 'myqr' && (
        <div className="animate-fadeIn">
          <div className="card text-center py-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Your QR Code</h3>

            {/* QR Code Image */}
            <div className="inline-block p-4 bg-white rounded-2xl shadow-lg">
              <img
                src={qrUrl}
                alt="Your PayFlow QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <div className="mt-4">
              <p className="text-lg font-bold text-gray-900 dark:text-white">{user ? user.name : ''}</p>
              <p className="text-sm text-indigo-600 dark:text-indigo-400 font-mono">{user ? user.upi_id : ''}</p>
            </div>

            <p className="text-xs text-gray-400 mt-3">
              Scan this QR code to pay you instantly
            </p>
          </div>

          {/* Amount QR */}
          <div className="card mt-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Generate QR with Amount</h3>
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={function (e) { setAmount(e.target.value) }}
                placeholder="Enter amount"
                className="input-field flex-1"
              />
            </div>
            {amount && parseFloat(amount) > 0 && (
              <div className="mt-4 text-center animate-fadeIn">
                <div className="inline-block p-3 bg-white rounded-xl shadow-md">
                  <img
                    src={'https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=' +
                      encodeURIComponent(upiString + '&am=' + amount)
                    }
                    alt="QR with amount"
                    className="w-40 h-40"
                  />
                </div>
                <p className="text-sm font-bold text-emerald-500 mt-2">₹{parseFloat(amount).toLocaleString('en-IN')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scan QR */}
      {activeTab === 'scan' && (
        <div className="animate-fadeIn space-y-4">
          {/* Simulated Scanner */}
          <div className="card">
            <div className="relative aspect-square max-w-xs mx-auto bg-gray-900 rounded-2xl overflow-hidden flex items-center justify-center">
              {/* Scanner frame */}
              <div className="w-48 h-48 relative">
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-400 rounded-br-lg"></div>

                {/* Scanning line animation */}
                <div className="absolute left-2 right-2 h-0.5 bg-indigo-400 animate-bounce opacity-50"></div>
              </div>

              <p className="absolute bottom-4 text-xs text-white/60">Point camera at QR code</p>
            </div>
          </div>

          {/* Manual UPI Entry */}
          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Or enter UPI ID manually</h3>
            <input
              type="text"
              value={scannedUpi}
              onChange={function (e) { setScannedUpi(e.target.value) }}
              placeholder="Enter UPI ID (e.g. phone@payflow)"
              className="input-field"
            />
            <button
              onClick={handleScanPay}
              disabled={!scannedUpi}
              className="btn-primary w-full"
            >
              Pay Now
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default QRCodePage
