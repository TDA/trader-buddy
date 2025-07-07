'use client'

import { useAuth } from '../../context/AuthContext'
import { useTrades } from '../../context/TradesContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Dashboard() {
  const { user, session, loading, signOut } = useAuth()
  const { trades, loading: tradesLoading, addTrade } = useTrades()
  const router = useRouter()

  console.log('Dashboard render:', { 
    loading, 
    hasSession: !!session, 
    userEmail: user?.email,
    tradesCount: trades.length 
  })

  useEffect(() => {
    console.log('Dashboard useEffect:', { loading, hasSession: !!session })
    if (!loading && !session) {
      console.log('Dashboard: No session, redirecting to login')
      router.push('/login')
    }
  }, [session, loading, router])

  const createDummyTrade = async () => {
    try {
      await addTrade({
        ticker: 'AAPL',
        asset_type: 'stock',
        side: 'buy',
        quantity: 100,
        price: 150.25,
        trade_date: new Date().toISOString(),
        metadata: {
          broker: 'test',
          commission: 0
        }
      })
    } catch (error) {
      console.error('Error creating dummy trade:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Trader's Journal Dashboard
            </h1>
            <button
              onClick={signOut}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Sign Out
            </button>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-green-800 mb-2">
              ✅ Authentication Successful!
            </h2>
            <p className="text-green-700">
              Welcome, {user?.email}! You are now logged in and your session will persist.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              🚀 Quick Actions
            </h3>
            <div className="space-x-3">
              <button
                onClick={() => router.push('/upload')}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Upload Trading Statement
              </button>
              <button
                onClick={createDummyTrade}
                disabled={tradesLoading}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                Create Test Trade
              </button>
            </div>
          </div>

          {/* Dummy Trade Test Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              🧪 Test TradesContext
            </h3>
            <button
              onClick={createDummyTrade}
              disabled={tradesLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {tradesLoading ? 'Loading...' : 'Create Dummy Trade'}
            </button>
            <p className="text-blue-700 mt-2">
              Total trades: {trades.length}
            </p>
          </div>

          {/* Trades List */}
          {trades.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                📊 Your Trades ({trades.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ticker
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Side
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {trades.map((trade) => (
                      <tr key={trade.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {trade.ticker}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {trade.asset_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            trade.side === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {trade.side.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {trade.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${trade.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(trade.trade_date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                Session Info
              </h3>
              <p className="text-blue-700">
                <strong>User ID:</strong> {user?.id}
              </p>
              <p className="text-blue-700">
                <strong>Email:</strong> {user?.email}
              </p>
              <p className="text-blue-700">
                <strong>Last Sign In:</strong> {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-800 mb-2">
                Next Steps
              </h3>
              <ul className="text-purple-700 space-y-1">
                <li>• Upload your trading statements</li>
                <li>• View and analyze your trades</li>
                <li>• Add notes and tags to trades</li>
                <li>• Sync data to cloud (optional)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 