import React from 'react'
import { BarChart3, AlertCircle, Users, Settings, RefreshCw } from 'lucide-react'

function Sidebar({ currentPage, setCurrentPage }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'alerts', label: 'Alerts', icon: AlertCircle },
    { id: 'competitors', label: 'Competitors', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <aside className="w-64 bg-secondary border-r border-slate-700 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <BarChart3 size={20} />
          </div>
          <div>
            <h2 className="font-bold text-lg">GTM Signal</h2>
            <p className="text-xs text-slate-400">Intelligence Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentPage === item.id
                  ? 'bg-accent text-primary font-semibold'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700 space-y-2">
        <button className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors text-sm">
          <RefreshCw size={16} />
          <span>Refresh Data</span>
        </button>
        <p className="text-xs text-slate-500 px-4">v1.0.0</p>
      </div>
    </aside>
  )
}

export default Sidebar
