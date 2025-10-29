import { Link, useLocation } from 'react-router-dom'

function Sidebar() {
  const location = useLocation()
  const items = [
    { to: '/dashboard', label: 'Overview' },
    { to: '/logs', label: 'Time Logs' },
    { to: '/reports', label: 'Reports' },
  ]
  return (
    <aside className="hidden md:block w-60 shrink-0 border-r bg-white min-h-[calc(100vh-56px)]">
      <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto scrollbar-hide gap-1 sm:gap-2 lg:gap-3 px-2 sm:px-3 lg:px-4 py-2 sm:py-3 lg:py-4">
        {items.map(it => (
          <Link key={it.to} to={it.to} className={`block px-3 py-2 rounded-lg text-sm mb-1 ${location.pathname===it.to ? 'bg-slate-100 font-medium' : 'text-slate-600 hover:text-slate-900'}`}>{it.label}</Link>
        ))}
      </div>
    </aside>
  )
}

export default Sidebar


