export default function ImpactBadge({ impact }) {
  const getColor = () => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-amber-100 text-amber-800'
      case 'low':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getColor()}`}>
      {impact?.charAt(0).toUpperCase() + impact?.slice(1)}
    </span>
  )
}
