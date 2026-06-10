import ImpactBadge from './ImpactBadge'

export default function SignalFeed({ signals, loading }) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!signals || signals.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No signals available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {signals.map((signal) => (
        <div
          key={signal.id}
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-bold text-gray-900">{signal.competitor}</h3>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                  {signal.signal_type?.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-gray-700 font-semibold mb-2">{signal.summary}</p>
              <p className="text-gray-600 text-sm mb-3">{signal.implication}</p>
            </div>
            <div className="ml-4">
              <ImpactBadge impact={signal.impact} />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex gap-2">
              {signal.tags && signal.tags.map((tag) => (
                <span key={tag} className="bg-gray-100 px-2 py-1 rounded">
                  #{tag}
                </span>
              ))}
            </div>
            <div>
              {signal.raw_signals?.url && (
                <a
                  href={signal.raw_signals.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View Source
                </a>
              )}
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-400">
            {new Date(signal.created_at).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  )
}
