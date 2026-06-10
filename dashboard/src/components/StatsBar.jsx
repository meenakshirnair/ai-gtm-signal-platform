export default function StatsBar({ stats, lastUpdated }) {
  const formatTime = (date) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleTimeString()
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-gray-600 text-sm">Total Signals Today</p>
        <p className="text-2xl font-bold text-gray-900">{stats?.total_signals_today || 0}</p>
      </div>
      <div className="bg-red-50 p-4 rounded-lg shadow">
        <p className="text-gray-600 text-sm">High Priority</p>
        <p className="text-2xl font-bold text-red-600">{stats?.by_impact?.high || 0}</p>
      </div>
      <div className="bg-amber-50 p-4 rounded-lg shadow">
        <p className="text-gray-600 text-sm">Medium Priority</p>
        <p className="text-2xl font-bold text-amber-600">{stats?.by_impact?.medium || 0}</p>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg shadow">
        <p className="text-gray-600 text-sm">Last Updated</p>
        <p className="text-sm font-mono text-gray-900">{formatTime(lastUpdated)}</p>
      </div>
    </div>
  )
}
