import { useState, useEffect, useRef } from 'react'
import { queriesAPI } from '../../api'
import {
  Send, Clock, CheckCircle2, Loader2, MessageSquare,
  Inbox, Search, Circle, X, BookOpen, User, ChevronDown,
  AlertCircle, ArrowUpRight
} from 'lucide-react'

type Status = 'pending' | 'in_progress' | 'answered' | 'closed'

const STATUS_CONFIG: Record<Status, { label: string; color: string; icon: typeof Clock }> = {
  pending:     { label: 'Pending',     color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',     icon: Clock },
  in_progress: { label: 'In Progress', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',        icon: Circle },
  answered:    { label: 'Answered',    color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle2 },
  closed:      { label: 'Closed',      color: 'text-gray-400 bg-gray-400/10 border-gray-400/20',         icon: X },
}

const PRIORITY_COLOR: Record<string, string> = {
  high:   'text-red-400 bg-red-400/10',
  normal: 'text-blue-400 bg-blue-400/10',
  low:    'text-gray-400 bg-gray-400/10',
}

export default function TutorQueries() {
  const [queries, setQueries] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const repliesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadQueries = () =>
    queriesAPI.allQueries().then(setQueries).catch(() => {})

  useEffect(() => {
    setLoading(true)
    loadQueries().finally(() => setLoading(false))
    pollRef.current = setInterval(loadQueries, 8000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selected?.replies])

  const openQuery = async (q: any) => {
    setDetailLoading(true)
    setSelected(null)
    try {
      const detail = await queriesAPI.get(q.id)
      setSelected(detail)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleReply = async () => {
    if (!replyText.trim() || !selected) return
    setSending(true)
    try {
      const reply = await queriesAPI.reply(selected.id, replyText.trim())
      setSelected((prev: any) => ({
        ...prev,
        replies: [...(prev.replies || []), reply],
        status: 'answered',
      }))
      setReplyText('')
      loadQueries()
    } finally {
      setSending(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!selected) return
    setUpdatingStatus(true)
    try {
      const updated = await queriesAPI.updateStatus(selected.id, newStatus)
      setSelected((prev: any) => ({ ...prev, status: updated.status }))
      setQueries(prev => prev.map(q => q.id === selected.id ? { ...q, status: updated.status } : q))
    } finally {
      setUpdatingStatus(false)
    }
  }

  const pendingCount = queries.filter(q => q.status === 'pending').length

  const filtered = queries.filter(q => {
    const matchSearch = !search || q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      q.subject?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || q.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="flex h-full min-h-[calc(100vh-140px)] overflow-hidden bg-[#0A0F1F] rounded-2xl border border-white/[0.06]">

      {/* ── LEFT: Query Inbox ── */}
      <div className="w-[360px] shrink-0 border-r border-white/[0.06] flex flex-col">

        {/* Header */}
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white">Student Queries</h2>
            {pendingCount > 0 && (
              <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
                {pendingCount} pending
              </span>
            )}
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by student or topic..."
              className="w-full pl-8 pr-3 py-2 rounded-lg text-xs text-gray-300 placeholder-gray-600 focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {['all', 'pending', 'in_progress', 'answered', 'closed'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors capitalize ${
                  filterStatus === s
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'text-gray-500 border border-white/[0.06] hover:text-gray-300'
                }`}
                style={filterStatus !== s ? { background: 'rgba(255,255,255,0.03)' } : {}}
              >
                {s === 'in_progress' ? 'In Progress' : s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Query list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-600 mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <Inbox className="w-8 h-8 text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No queries found</p>
            </div>
          ) : (
            filtered.map(q => {
              const cfg = STATUS_CONFIG[q.status as Status] || STATUS_CONFIG.pending
              const StatusIcon = cfg.icon
              const isActive = selected?.id === q.id
              return (
                <div
                  key={q.id}
                  onClick={() => openQuery(q)}
                  className="p-4 border-b cursor-pointer transition-all group"
                  style={{
                    borderColor: 'rgba(255,255,255,0.05)',
                    background: isActive ? 'rgba(59,130,246,0.06)' : undefined,
                    borderLeft: isActive ? '2px solid rgba(59,130,246,0.5)' : '2px solid transparent',
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium text-gray-200 truncate flex-1">{q.title}</p>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded capitalize ${PRIORITY_COLOR[q.priority] || PRIORITY_COLOR.normal}`}>
                      {q.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium ${cfg.color}`}>
                      <StatusIcon className="w-2.5 h-2.5" />{cfg.label}
                    </span>
                    <span className="text-[10px] text-gray-600 flex items-center gap-1">
                      <User className="w-2.5 h-2.5" />{q.student_name}
                    </span>
                    <span className="text-[10px] text-gray-600 flex items-center gap-1">
                      <BookOpen className="w-2.5 h-2.5" />{q.subject}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-600 mt-1.5 flex items-center gap-1">
                    <MessageSquare className="w-2.5 h-2.5" />{q.reply_count || 0} {q.reply_count === 1 ? 'reply' : 'replies'}
                    <span className="mx-1">·</span>
                    {new Date(q.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── RIGHT: Thread View ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {detailLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
          </div>
        ) : !selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <MessageSquare className="w-7 h-7 text-gray-700" />
            </div>
            <h3 className="text-base font-semibold text-gray-400 mb-2">Select a query to respond</h3>
            <p className="text-sm text-gray-600 max-w-xs">Choose a student query from the inbox to read their question and send a response.</p>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="px-6 py-4 border-b shrink-0 flex items-start justify-between gap-4"
              style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-white mb-1">{selected.title}</h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-gray-400 flex items-center gap-1.5">
                    <User className="w-3 h-3" /> {selected.student_name}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3" /> {selected.subject}
                  </span>
                  <span className="text-xs text-gray-600">
                    {new Date(selected.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Status dropdown */}
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={selected.status}
                  onChange={e => handleStatusChange(e.target.value)}
                  disabled={updatingStatus}
                  className="text-xs rounded-lg px-3 py-1.5 font-medium focus:outline-none cursor-pointer text-gray-300 disabled:opacity-50"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="answered">Answered</option>
                  <option value="closed">Closed</option>
                </select>
                {updatingStatus && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">

              {/* Original question */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-blue-400"
                  style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
                  {selected.student_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-gray-500 mb-1">{selected.student_name} · Question</p>
                  <div className="rounded-2xl rounded-tl-sm p-4 max-w-2xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{selected.body}</p>
                  </div>
                  <p className="text-[10px] text-gray-600 mt-1 ml-1">
                    {new Date(selected.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Replies */}
              {(selected.replies || []).map((reply: any) => {
                const isTeacher = reply.sender_role === 'teacher'
                return (
                  <div key={reply.id} className={`flex gap-3 ${isTeacher ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 text-[10px] font-bold ${
                      isTeacher ? 'text-emerald-400' : 'text-blue-400'
                    }`}
                      style={{
                        background: isTeacher ? 'rgba(52,211,153,0.15)' : 'rgba(59,130,246,0.15)',
                        border: `1px solid ${isTeacher ? 'rgba(52,211,153,0.3)' : 'rgba(59,130,246,0.3)'}`,
                      }}>
                      {isTeacher ? 'T' : reply.sender_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className={`flex-1 flex flex-col ${isTeacher ? 'items-end' : 'items-start'}`}>
                      <p className="text-[10px] text-gray-500 mb-1 px-1">
                        {isTeacher ? 'You (Teacher)' : reply.sender_name}
                      </p>
                      <div className={`rounded-2xl p-4 max-w-2xl ${isTeacher ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                        style={{
                          background: isTeacher ? 'rgba(52,211,153,0.06)' : 'rgba(59,130,246,0.06)',
                          border: `1px solid ${isTeacher ? 'rgba(52,211,153,0.2)' : 'rgba(59,130,246,0.2)'}`,
                        }}>
                        <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{reply.message}</p>
                      </div>
                      <p className="text-[10px] text-gray-600 mt-1 px-1">
                        {new Date(reply.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}

              {selected.replies?.length === 0 && (
                <div className="flex items-center gap-3 p-4 rounded-xl"
                  style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)' }}>
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <p className="text-sm text-amber-200/70">This query hasn't been answered yet. Be the first to respond.</p>
                </div>
              )}

              <div ref={repliesEndRef} />
            </div>

            {/* Reply input */}
            {selected.status !== 'closed' && (
              <div className="p-4 border-t shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(10,15,31,0.8)' }}>
                <div className="flex gap-3 max-w-3xl mx-auto">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleReply() }}
                    placeholder="Write your answer or explanation... (Ctrl+Enter to send)"
                    rows={3}
                    className="flex-1 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none resize-none transition-colors"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <button
                    onClick={handleReply}
                    disabled={!replyText.trim() || sending}
                    className="px-4 py-3 rounded-xl text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed self-end shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' }}
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-600 mt-2 text-center">Your reply will mark this query as Answered</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
