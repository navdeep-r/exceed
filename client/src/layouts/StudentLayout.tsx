import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  Home, Folders, ClipboardList, MessageSquare, UserPlus, 
  Brain, Trophy, Settings, Search, Bell, GraduationCap, HelpCircle
} from 'lucide-react'

export default function StudentLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex bg-surface-950 font-sans text-surface-100">
      {/* Sidebar */}
      <aside className="w-[240px] border-r border-surface-800 flex flex-col fixed h-screen z-30 bg-surface-950">
        {/* Brand */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-surface-800 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            E
          </div>
          <h1 className="text-sm font-semibold tracking-wide text-surface-50">Exceed</h1>
        </div>

        {/* Profile Card */}
        <div className="p-4 border-b border-surface-800 shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-surface-800 flex items-center justify-center text-surface-200 text-sm font-semibold border border-surface-700">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-surface-100 truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-surface-400">Level 5 • 2,400 XP</p>
            </div>
          </div>
          <div className="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full" style={{ width: '65%' }} />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <nav className="px-3 space-y-0.5">
            <NavItem to="/student" icon={Home} label="Home" end />
            <NavItem to="/student/notes" icon={Folders} label="My Sets" />
            <NavItem to="/student/plan" icon={ClipboardList} label="Study Plan" />
            <NavItem to="/student/classes" icon={GraduationCap} label="My Classes" />
          </nav>

          <div className="px-5 mt-6 mb-2">
            <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider">Tools</p>
          </div>
          <nav className="px-3 space-y-0.5">
            <NavItem to="/student/doubts" icon={MessageSquare} label="Chat" />
            <NavItem to="/student/tutor" icon={UserPlus} label="Tutor Me" />
            <NavItem to="/student/queries" icon={HelpCircle} label="Ask Tutor" />
            <NavItem to="/student/quiz" icon={Brain} label="Practice" />
          </nav>

          <div className="px-5 mt-6 mb-2">
            <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider">Activity</p>
          </div>
          <nav className="px-3 space-y-0.5">
            <NavItem to="/student/leaderboard" icon={Trophy} label="Leaderboards" />
          </nav>
        </div>

        {/* Bottom Utility */}
        <div className="p-3 border-t border-surface-800 shrink-0">
          <button className="flex items-center gap-3 px-3 py-2 w-full text-left text-sm text-surface-300 hover:text-surface-100 hover:bg-surface-800/50 rounded-lg transition-colors">
            <Settings className="w-4 h-4 opacity-70" />
            <span>Settings</span>
          </button>
          <button onClick={() => { logout(); navigate('/login') }} className="flex items-center gap-3 px-3 py-2 w-full text-left text-sm text-surface-300 hover:text-danger-400 hover:bg-danger-500/10 rounded-lg transition-colors mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-[240px] flex flex-col min-h-screen">
        {/* Header Bar */}
        <header className="h-16 border-b border-surface-800 bg-surface-950/80 backdrop-blur-md sticky top-0 z-20 px-8 flex items-center justify-between shrink-0">
          {/* Search */}
          <div className="relative w-96 group">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-primary-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Search notes, subjects..." 
              className="w-full h-9 pl-9 pr-12 bg-surface-900 border border-surface-800 rounded-lg text-sm text-surface-100 placeholder-surface-400 focus:outline-none focus:border-surface-600 transition-colors"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-surface-400 bg-surface-800 rounded border border-surface-700">⌘</kbd>
              <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-surface-400 bg-surface-800 rounded border border-surface-700">K</kbd>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-5">
            <button className="px-4 py-1.5 rounded-lg bg-surface-900 border border-surface-800 text-surface-200 text-sm font-medium hover:bg-surface-800 transition-colors">
              Upgrade
            </button>
            <button className="relative text-surface-400 hover:text-surface-100 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-primary-500 rounded-full border border-surface-950"></span>
            </button>
            <button className="w-8 h-8 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center text-surface-200 text-xs font-semibold hover:border-surface-600 transition-colors">
              {user?.firstName?.[0]}
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 bg-surface-950">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function NavItem({ to, icon: Icon, label, end }: { to: string, icon: any, label: string, end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-gradient-to-r from-primary-500/10 to-transparent text-primary-100 border border-primary-500/20'
            : 'text-surface-300 hover:text-surface-100 hover:bg-surface-800/50 border border-transparent'
        }`
      }
    >
      <Icon className="w-[18px] h-[18px] opacity-80" strokeWidth={2} />
      <span>{label}</span>
    </NavLink>
  )
}
