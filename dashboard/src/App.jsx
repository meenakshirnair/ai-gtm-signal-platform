import { useState, useEffect } from 'react'
import { getSignals, getStats } from './services/api'
import CompetitorFilter from './components/CompetitorFilter'
import SignalFeed from './components/SignalFeed'
import StatsBar from './components/StatsBar'
import ImpactBadge from './components/ImpactBadge'

export default function App() {
  const [signals, setSignals] = useState([])
  const [stats, setStats] = useState(null)
  const [selectedCompetitor, setSelectedCompetitor] = useState(null)
  const [selectedImpact, setSelectedImpact] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const signalsData = await getSignals(selectedCompetitor, selectedImpact, 50)
      setSignals(signalsData.signals || [])
      setLastUpdated(new Date())

      const statsData = await getStats()
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedCompetitor, selectedImpact])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            AI Coding Tools Intelligence
          </h1>
          <p className="text-gray-600 mt-2">
            Real-time signals from Cursor, Windsurf, GitHub Copilot, and Codeium
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Bar */}
        <StatsBar stats={stats} lastUpdated={lastUpdated} />

        {/* Filters */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Filter by Competitor</h2>
          <CompetitorFilter
            selectedCompetitor={selectedCompetitor}
            onSelectCompetitor={setSelectedCompetitor}
          />
        </div>

        {/* Impact Filter */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Filter by Impact</h2>
          <div className="flex flex-wrap gap-2">
            {['All', 'high', 'medium', 'low'].map((impact) => (
              <button
                key={impact}
                onClick={() => setSelectedImpact(impact === 'All' ? null : impact)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  (impact === 'All' && !selectedImpact) || selectedImpact === impact
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {impact === 'All' ? 'All' : <ImpactBadge impact={impact} />}
              </button>
            ))}
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mb-6">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        {/* Signal Feed */}
        <SignalFeed signals={signals} loading={loading} />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-600 text-sm">
          <p>GTM Signal Intelligence Platform • Built with FastAPI, Supabase, and React</p>
        </div>
      </footer>
    </div>
  )
}
