import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/teacher', icon: '📊', label: 'Dashboard', end: true },
  { to: '/teacher/record', icon: '🎙️', label: 'Record' },
  { to: '/teacher/notes', icon: '📝', label: 'Notes' },
  { to: '/teacher/students', icon: '👥', label: 'Students' },
  { to: '/teacher/doubts', icon: '❓', label: 'Doubts' },
  { to: '/teacher/analytics', icon: '📈', label: 'Analytics' },
]

export default function TeacherLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-surface-950">
      {/* Sidebar */}
      <aside className="w-64 glass border-r border-surface-700/50 flex flex-col fixed h-screen z-30">
        {/* Brand */}
        <div className="p-6 border-b border-surface-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              E
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text">Exceed</h1>
              <p className="text-[11px] text-surface-400 tracking-wide uppercase">Teacher Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-500/15 text-primary-300 shadow-sm'
                    : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/60'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-surface-700/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-sm font-semibold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-200 truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-surface-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-surface-400 hover:text-danger-400 hover:bg-danger-500/10 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
