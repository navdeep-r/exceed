import { useState, useEffect } from 'react'
import { doubtsAPI } from '../../api'

export default function TeacherDoubts() {
  const [doubts, setDoubts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [response, setResponse] = useState('')
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState<'all'|'pending'|'answered'>('all')

  useEffect(() => { doubtsAPI.listForTeacher().then(setDoubts).catch(() => {}).finally(() => setLoading(false)) }, [])

  const handleRespond = async () => {
    if (!selected || !response.trim()) return
    setSending(true)
    try {
      await doubtsAPI.respond(selected.id, response)
      setDoubts(prev => prev.map(d => d.id === selected.id ? { ...d, response, status: 'answered', responded_at: new Date().toISOString() } : d))
      setSelected(null); setResponse('')
    } catch {}
    finally { setSending(false) }
  }

  const filtered = doubts.filter(d => filter === 'all' || d.status === filter)

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 shimmer rounded-2xl" />)}</div>

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-surface-50">Student Doubts</h1>
        <p className="text-surface-400 mt-1">Review and respond to student questions</p>
      </div>

      <div className="flex gap-2">
        {(['all','pending','answered'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f ? 'bg-primary-500/20 text-primary-300' : 'text-surface-400 hover:text-surface-200'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)} {f === 'pending' && `(${doubts.filter(d => d.status === 'pending').length})`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doubts list */}
        <div className="glass rounded-2xl p-6 space-y-3 max-h-[600px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-surface-400"><p className="text-4xl mb-3">💬</p><p>No doubts</p></div>
          ) : filtered.map(d => (
            <div key={d.id} onClick={() => { setSelected(d); setResponse(d.response || '') }}
              className={`p-4 rounded-xl cursor-pointer transition-all ${selected?.id === d.id ? 'bg-primary-500/15 border border-primary-500/30' : 'bg-surface-800/40 hover:bg-surface-800/60'}`}>
              <div className="flex items-start justify-between mb-2">
                <p className="font-medium text-surface-200 text-sm">{d.student_name || 'Student'}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${d.status === 'pending' ? 'bg-warning-500/15 text-warning-400' : 'bg-success-500/15 text-success-400'}`}>
                  {d.status}
                </span>
              </div>
              <p className="text-sm text-surface-300 line-clamp-2">{d.question_text}</p>
              <p className="text-xs text-surface-500 mt-2">{new Date(d.submitted_at).toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* Response panel */}
        <div className="glass rounded-2xl p-6">
          {selected ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-surface-100">Respond to Doubt</h3>
              <div className="p-4 rounded-xl bg-surface-800/60">
                <p className="text-sm text-surface-300">{selected.question_text}</p>
                {selected.is_voice && <span className="text-xs text-accent-400 mt-2 inline-block">🎙️ Voice question</span>}
              </div>
              <textarea value={response} onChange={e => setResponse(e.target.value)}
                className="w-full h-40 px-4 py-3 rounded-xl bg-surface-800/80 border border-surface-600/50 text-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none text-sm"
                placeholder="Type your response…" />
              <button onClick={handleRespond} disabled={sending || !response.trim()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-semibold disabled:opacity-50 shadow-lg">
                {sending ? 'Sending…' : '📩 Send Response'}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-surface-400">
              <p>Select a doubt to respond</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
