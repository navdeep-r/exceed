import { useState, useEffect } from 'react'
import { progressAPI } from '../../api'

export default function StudentMonitor() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'xp'|'quiz'|'name'>('xp')

  useEffect(() => { progressAPI.getStudents().then(setStudents).catch(() => {}).finally(() => setLoading(false)) }, [])

  const sorted = [...students].sort((a, b) => {
    if (sortBy === 'xp') return (b.total_xp || 0) - (a.total_xp || 0)
    if (sortBy === 'quiz') return (b.average_quiz_score || 0) - (a.average_quiz_score || 0)
    return (a.first_name || '').localeCompare(b.first_name || '')
  })

  if (loading) return <div className="space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-16 shimmer rounded-xl" />)}</div>

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-surface-50">Student Monitor</h1>
        <p className="text-surface-400 mt-1">Track engagement and performance</p>
      </div>

      <div className="flex gap-2">
        {(['xp','quiz','name'] as const).map(s => (
          <button key={s} onClick={() => setSortBy(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${sortBy === s ? 'bg-primary-500/20 text-primary-300' : 'text-surface-400'}`}>
            Sort by {s === 'xp' ? 'XP' : s === 'quiz' ? 'Quiz Score' : 'Name'}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-700/50">
              <th className="text-left p-4 text-xs uppercase text-surface-400 font-medium">Student</th>
              <th className="text-left p-4 text-xs uppercase text-surface-400 font-medium">XP</th>
              <th className="text-left p-4 text-xs uppercase text-surface-400 font-medium">Quiz Avg</th>
              <th className="text-left p-4 text-xs uppercase text-surface-400 font-medium">Notes Read</th>
              <th className="text-left p-4 text-xs uppercase text-surface-400 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-surface-400">No students enrolled</td></tr>
            ) : sorted.map(s => {
              const isLow = (s.total_xp || 0) < 50 && (s.average_quiz_score || 0) < 40
              return (
                <tr key={s.id} className={`border-b border-surface-800/50 hover:bg-surface-800/30 transition-colors ${isLow ? 'bg-danger-500/5' : ''}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-400 to-primary-400 flex items-center justify-center text-white text-xs font-semibold">
                        {s.first_name?.[0]}{s.last_name?.[0]}
                      </div>
                      <span className="text-sm text-surface-200">{s.first_name} {s.last_name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-medium text-xp">⚡ {s.total_xp || 0}</td>
                  <td className="p-4 text-sm text-surface-300">{s.average_quiz_score || 0}%</td>
                  <td className="p-4 text-sm text-surface-300">{s.notes_viewed || 0}</td>
                  <td className="p-4">
                    {isLow ? (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-danger-500/15 text-danger-400">Needs Help</span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-success-500/15 text-success-400">Active</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
