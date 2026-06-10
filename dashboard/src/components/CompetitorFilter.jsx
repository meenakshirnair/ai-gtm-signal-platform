export default function CompetitorFilter({ selectedCompetitor, onSelectCompetitor }) {
  const competitors = ['All', 'Cursor', 'Windsurf', 'GitHub Copilot', 'Codeium']

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {competitors.map((competitor) => (
        <button
          key={competitor}
          onClick={() => onSelectCompetitor(competitor === 'All' ? null : competitor)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            (competitor === 'All' && !selectedCompetitor) ||
            selectedCompetitor === competitor
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          {competitor}
        </button>
      ))}
    </div>
  )
}
