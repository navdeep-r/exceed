import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { lecturesAPI, notesAPI } from '../../api'

export default function ManageNotes() {
  const [lectures, setLectures] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      lecturesAPI.list().catch(() => []),
      notesAPI.listForTeacher().catch(() => []),
    ]).then(([l, n]) => {
      setLectures(l); setNotes(n); setLoading(false)
    })
  }, [])

  const handleRefine = async (lectureId: string, transcript: string) => {
    const result = await notesAPI.refine(lectureId, transcript).catch(() => null)
    if (result) setNotes(prev => [...prev, result])
  }

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 shimmer rounded-2xl" />)}</div>

  const unrefined = lectures.filter(l => l.status === 'completed' && !notes.find((n: any) => n.lecture_id === l.id))

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-surface-50">Manage Notes</h1>
        <p className="text-surface-400 mt-1">Refine transcripts, translate, and publish</p>
      </div>

      {unrefined.length > 0 && (
        <div className="glass rounded-2xl p-6 border border-warning-500/20">
          <h2 className="text-lg font-semibold text-surface-100 mb-4">📋 Ready for Refinement</h2>
          <div className="space-y-3">
            {unrefined.map(l => (
              <div key={l.id} className="flex items-center gap-4 p-4 rounded-xl bg-surface-800/40">
                <div className="w-10 h-10 rounded-lg bg-warning-500/20 flex items-center justify-center">🎤</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-surface-200 truncate">{l.title}</p>
                  <p className="text-xs text-surface-400">{new Date(l.recorded_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => handleRefine(l.id, l.transcript)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-accent-600 to-primary-600 text-white text-sm font-semibold">
                  ✨ Refine
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-surface-100 mb-4">📝 Your Notes</h2>
        {notes.length === 0 ? (
          <div className="text-center py-12 text-surface-400">
            <p className="text-4xl mb-3">📝</p><p>No notes yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((n: any) => (
              <Link key={n.id} to={`/teacher/notes/${n.id}`}
                className="flex items-center gap-4 p-4 rounded-xl bg-surface-800/40 hover:bg-surface-800/60 transition-colors group">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${n.published_at ? 'bg-success-500/20 text-success-400' : 'bg-primary-500/20 text-primary-400'}`}>
                  {n.published_at ? '✅' : '📄'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-surface-200 truncate group-hover:text-primary-300">{n.title || 'Untitled'}</p>
                  <p className="text-xs text-surface-400">{n.language?.toUpperCase()} · v{n.version}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${n.published_at ? 'bg-success-500/15 text-success-400' : 'bg-surface-600/30 text-surface-400'}`}>
                  {n.published_at ? 'Published' : 'Draft'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
