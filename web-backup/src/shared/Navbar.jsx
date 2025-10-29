import { Link, useLocation } from 'react-router-dom'

function Navbar() {
  const location = useLocation()
  const tabs = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/logs', label: 'Logs' },
    { to: '/reports', label: 'Reports' },
  ]
  return (
    <header className="bg-white border-b">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
        <Link to="/dashboard" className="font-semibold">Workshop</Link>
        <nav className="flex items-center gap-1">
          {tabs.map(t => (
            <Link key={t.to} to={t.to} className={`px-3 py-2 rounded-md text-sm ${location.pathname===t.to ? 'bg-slate-100 font-medium' : 'text-slate-600 hover:text-slate-900'}`}>{t.label}</Link>
          ))}
        </nav>
      </div>
    </header>
  )
}

export default Navbar


