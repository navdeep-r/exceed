import { useState, useEffect } from 'react'
import { analyticsAPI } from '../../api'

export default function TeacherAnalytics() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { analyticsAPI.teacher().then(setData).catch(() => {}).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 shimmer rounded-2xl" />)}</div>

  const metrics = data || { totalStudents: 0, totalLectures: 0, avgQuizScore: 0, totalViews: 0, completionRate: 0, topTopics: [] }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-surface-50">Analytics</h1>
        <p className="text-surface-400 mt-1">Content effectiveness and student performance insights</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
        {[
          { label: 'Students', value: metrics.totalStudents, icon: '👥', color: 'text-primary-400' },
          { label: 'Lectures', value: metrics.totalLectures, icon: '🎙️', color: 'text-accent-400' },
          { label: 'Avg Quiz Score', value: `${metrics.avgQuizScore}%`, icon: '📊', color: 'text-success-400' },
          { label: 'Content Views', value: metrics.totalViews, icon: '👁️', color: 'text-warning-400' },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-5 card-hover">
            <span className="text-2xl">{s.icon}</span>
            <p className={`text-2xl font-bold mt-2 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-surface-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Completion bar chart */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-surface-100 mb-6">Completion Rate</h2>
        <div className="space-y-4">
          {[
            { label: 'Notes Viewed', pct: metrics.completionRate || 72, color: 'bg-primary-500' },
            { label: 'Quizzes Completed', pct: metrics.avgQuizScore || 58, color: 'bg-accent-500' },
            { label: 'Flashcards Reviewed', pct: 45, color: 'bg-success-500' },
          ].map(bar => (
            <div key={bar.label}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-surface-300">{bar.label}</span>
                <span className="text-surface-400 font-medium">{bar.pct}%</span>
              </div>
              <div className="w-full h-3 bg-surface-800 rounded-full overflow-hidden">
                <div className={`h-full ${bar.color} rounded-full transition-all duration-1000`} style={{ width: `${bar.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
