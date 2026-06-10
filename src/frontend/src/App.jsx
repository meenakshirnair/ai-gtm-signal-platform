import React, { useState, useEffect } from 'react'
import { AlertCircle, TrendingUp, Users, Bell } from 'lucide-react'
import Dashboard from './components/Dashboard'
import Sidebar from './components/Sidebar'
import { getStatistics, healthCheck } from './services/api'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    checkHealth()
    fetchStatistics()
    const interval = setInterval(fetchStatistics, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const checkHealth = async () => {
    try {
      await healthCheck()
      setIsConnected(true)
    } catch (err) {
      setIsConnected(false)
      console.error('Backend connection error:', err)
    }
  }

  const fetchStatistics = async () => {
    try {
      setLoading(true)
      const data = await getStatistics()
      setStats(data)
      setError(null)
    } catch (err) {
      setError('Failed to fetch statistics')
      console.error('Error fetching statistics:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-primary text-white">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-secondary border-b border-slate-700 px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">GTM Signal Intelligence Platform</h1>
            <p className="text-sm text-slate-400">Real-time market and competitor insights</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-2 rounded ${isConnected ? 'bg-green-900' : 'bg-red-900'}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {error && (
            <div className="m-4 p-4 bg-red-900 border border-red-700 rounded flex items-center gap-2">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
                <p>Loading data...</p>
              </div>
            </div>
          ) : stats ? (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
                <div className="bg-secondary rounded-lg p-6 border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Competitors</p>
                      <p className="text-3xl font-bold">{stats.competitors?.total_competitors || 0}</p>
                    </div>
                    <Users size={32} className="text-accent" />
                  </div>
                </div>

                <div className="bg-secondary rounded-lg p-6 border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Updates</p>
                      <p className="text-3xl font-bold">{stats.competitors?.total_updates || 0}</p>
                    </div>
                    <TrendingUp size={32} className="text-accent" />
                  </div>
                </div>

                <div className="bg-secondary rounded-lg p-6 border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Market Trends</p>
                      <p className="text-3xl font-bold">{stats.market_trends?.total_trends || 0}</p>
                    </div>
                    <TrendingUp size={32} className="text-accent" />
                  </div>
                </div>

                <div className="bg-secondary rounded-lg p-6 border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Alerts</p>
                      <p className="text-3xl font-bold">{stats.alerts?.total_alerts || 0}</p>
                    </div>
                    <Bell size={32} className="text-accent" />
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              {currentPage === 'dashboard' && <Dashboard stats={stats} onRefresh={fetchStatistics} />}
            </>
          ) : null}
        </main>
      </div>
    </div>
  )
}

export default App
