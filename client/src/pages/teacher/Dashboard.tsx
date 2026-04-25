import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { lecturesAPI, notesAPI, doubtsAPI } from '../../api'

export default function TeacherDashboard() {
  const [stats, setStats] = useState({ lectures: 0, published: 0, pendingDoubts: 0 })
  const [recentLectures, setRecentLectures] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      lecturesAPI.list().catch(() => []),
      notesAPI.listForTeacher().catch(() => []),
      doubtsAPI.listForTeacher().catch(() => []),
    ]).then(([lectures, notes, doubts]) => {
      setRecentLectures(lectures.slice(0, 5))
      setStats({
        lectures: lectures.length,
        published: notes.filter((n: any) => n.published_at).length,
        pendingDoubts: doubts.filter((d: any) => d.status === 'pending').length,
      })
      setLoading(false)
    })
  }, [])

  const statCards = [
    { label: 'Total Lectures', value: stats.lectures, icon: '🎙️', color: 'from-primary-500 to-primary-600', glow: 'glow-primary' },
    { label: 'Published Notes', value: stats.published, icon: '📝', color: 'from-success-500 to-success-600', glow: '' },
    { label: 'Pending Doubts', value: stats.pendingDoubts, icon: '❓', color: 'from-warning-500 to-warning-400', glow: 'glow-xp' },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 shimmer rounded-lg" />
        <div className="grid grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-32 shimmer rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-surface-50">Dashboard</h1>
        <p className="text-surface-400 mt-1">Manage your lectures and monitor student progress</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger">
        {statCards.map(card => (
          <div key={card.label} className={`glass rounded-2xl p-6 card-hover ${card.glow}`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">{card.icon}</span>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white text-lg font-bold shadow-lg`}>
                {card.value}
              </div>
            </div>
            <p className="text-surface-300 text-sm font-medium">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/teacher/record" className="glass rounded-2xl p-6 card-hover group border border-primary-500/20 hover:border-primary-500/40">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
              🎙️
            </div>
            <div>
              <h3 className="text-lg font-semibold text-surface-100 group-hover:text-primary-300 transition-colors">Record New Lecture</h3>
              <p className="text-sm text-surface-400">Start a recording session and transcribe</p>
            </div>
          </div>
        </Link>

        <Link to="/teacher/notes" className="glass rounded-2xl p-6 card-hover group border border-accent-500/20 hover:border-accent-500/40">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
              📝
            </div>
            <div>
              <h3 className="text-lg font-semibold text-surface-100 group-hover:text-accent-300 transition-colors">Manage Notes</h3>
              <p className="text-sm text-surface-400">Refine, translate, and publish notes</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent lectures */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-surface-100">Recent Lectures</h2>
          <Link to="/teacher/notes" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">View all →</Link>
        </div>
        {recentLectures.length === 0 ? (
          <div className="text-center py-12 text-surface-400">
            <p className="text-4xl mb-3">🎙️</p>
            <p className="font-medium">No lectures yet</p>
            <p className="text-sm mt-1">Record your first lecture to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentLectures.map(lecture => (
              <div key={lecture.id} className="flex items-center gap-4 p-4 rounded-xl bg-surface-800/40 hover:bg-surface-800/60 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center text-primary-400">🎤</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-surface-200 truncate">{lecture.title}</p>
                  <p className="text-xs text-surface-400">{new Date(lecture.recorded_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  lecture.status === 'completed' ? 'bg-success-500/15 text-success-400' :
                  lecture.status === 'transcribing' ? 'bg-warning-500/15 text-warning-400' :
                  'bg-surface-600/30 text-surface-400'
                }`}>
                  {lecture.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
