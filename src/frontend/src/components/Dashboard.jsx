import React, { useState, useEffect } from 'react'
import { AlertCircle, TrendingUp, RefreshCw, Zap } from 'lucide-react'
import { getAlerts, processCompetitorUpdates } from '../services/api'

function Dashboard({ stats, onRefresh }) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const data = await getAlerts(10)
      setAlerts(data)
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProcessUpdates = async () => {
    try {
      setProcessing(true)
      await processCompetitorUpdates()
      await onRefresh()
      await fetchAlerts()
    } catch (error) {
      console.error('Error processing updates:', error)
    } finally {
      setProcessing(false)
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-900 border-red-700'
      case 'high':
        return 'bg-orange-900 border-orange-700'
      case 'medium':
        return 'bg-yellow-900 border-yellow-700'
      default:
        return 'bg-slate-700 border-slate-600'
    }
  }

  const getPriorityEmoji = (priority) => {
    switch (priority) {
      case 'critical':
        return '🔴'
      case 'high':
        return '🟠'
      case 'medium':
        return '🟡'
      default:
        return '⚪'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Quick Actions */}
      <div className="flex gap-4">
        <button
          onClick={handleProcessUpdates}
          disabled={processing}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-blue-600 disabled:bg-slate-600 rounded-lg font-semibold transition-colors"
        >
          <Zap size={18} />
          {processing ? 'Processing...' : 'Process Updates'}
        </button>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Alerts Section */}
      <div className="bg-secondary rounded-lg border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center gap-2">
          <AlertCircle size={20} className="text-accent" />
          <h2 className="text-xl font-bold">Recent Alerts</h2>
          <span className="ml-auto text-sm text-slate-400">{alerts.length} alerts</span>
        </div>

        {loading ? (
          <div className="p-6 text-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-2"></div>
            Loading alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-6 text-center text-slate-400">
            No alerts yet. Process updates to generate alerts.
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 border-l-4 ${getPriorityColor(alert.impact_level)} transition-colors hover:opacity-80`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getPriorityEmoji(alert.impact_level)}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{alert.title}</h3>
                    <p className="text-slate-300 mt-1 text-sm">{alert.message}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                      <span>Type: {alert.type}</span>
                      <span>•</span>
                      <span>{new Date(alert.created_at).toLocaleString()}</span>
                      {alert.sent && (
                        <>
                          <span>•</span>
                          <span className="text-green-400">✓ Sent</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Competitor Updates */}
        <div className="bg-secondary rounded-lg p-6 border border-slate-700">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-accent" />
            Competitor Updates
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Total Updates</span>
              <span className="text-2xl font-bold">{stats?.competitors?.total_updates || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Processed</span>
              <span className="text-2xl font-bold text-green-400">{stats?.competitors?.processed_updates || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Pending</span>
              <span className="text-2xl font-bold text-yellow-400">{stats?.competitors?.unprocessed_updates || 0}</span>
            </div>
          </div>
        </div>

        {/* Market Trends */}
        <div className="bg-secondary rounded-lg p-6 border border-slate-700">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-accent" />
            Market Trends
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Total Trends</span>
              <span className="text-2xl font-bold">{stats?.market_trends?.total_trends || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Processed</span>
              <span className="text-2xl font-bold text-green-400">{stats?.market_trends?.processed_trends || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Pending</span>
              <span className="text-2xl font-bold text-yellow-400">{stats?.market_trends?.unprocessed_trends || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
