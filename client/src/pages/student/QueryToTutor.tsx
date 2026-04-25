import { useState, useEffect, useRef } from 'react'
import { queriesAPI } from '../../api'
import {
  Plus, Send, ChevronRight, X, Clock, CheckCircle2,
  AlertCircle, Loader2, MessageSquare, Inbox, Search,
  Trash2, Circle, BookOpen
} from 'lucide-react'

type Status = 'pending' | 'in_progress' | 'answered' | 'closed'

const STATUS_CONFIG: Record<Status, { label: string; color: string; icon: typeof Clock }> = {
  pending:     { label: 'Pending',     color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',   icon: Clock },
  in_progress: { label: 'In Progress', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',      icon: Circle },
  answered:    { label: 'Answered',    color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle2 },
  closed:      { label: 'Closed',      color: 'text-surface-400 bg-surface-400/10 border-surface-400/20', icon: X },
}

const SUBJECTS = ['General', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'History', 'Literature']

export default function QueryToTutor() {
  const [queries, setQueries] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // New query form
  const [form, setForm] = useState({ title: '', body: '', subject: 'General', priority: 'normal' })
  const [submitting, setSubmitting] = useState(false)

  const repliesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadQueries = () =>
    queriesAPI.myQueries().then(setQueries).catch(() => {})

  useEffect(() => {
    setLoading(true)
    loadQueries().finally(() => setLoading(false))
    // Poll every 8s for new replies
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

  const handleSubmitQuery = async () => {
    if (!form.title.trim() || !form.body.trim()) return
    setSubmitting(true)
    try {
      const created = await queriesAPI.create(form)
      setQueries(prev => [created, ...prev])
      setForm({ title: '', body: '', subject: 'General', priority: 'normal' })
      setShowNew(false)
      openQuery(created)
    } finally {
      setSubmitting(false)
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
        status: 'pending',
      }))
      setReplyText('')
      loadQueries()
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await queriesAPI.delete(id).catch(() => {})
    setQueries(prev => prev.filter(q => q.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const filtered = queries.filter(q => {
    const matchSearch = !search || q.title.toLowerCase().includes(search.toLowerCase()) || q.subject.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || q.status === filterStatus
    return matchSearch && matchStatus
  })

  const unread = queries.filter(q => q.status === 'answered' && q.reply_count > 0).length

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-surface-950">

      {/* ── LEFT: Query List ── */}
      <div className="w-[360px] shrink-0 border-r border-surface-800 flex flex-col bg-surface-900/30">

        {/* Header */}
        <div className="p-5 border-b border-surface-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-base font-bold text-surface-50 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary-400" />
                Ask Your Tutor
                {unread > 0 && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30">
                    {unread} new
                  </span>
                )}
              </h1>
              <p className="text-xs text-surface-500 mt-0.5">Submit and track your questions</p>
            </div>
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-primary-500/20"
            >
              <Plus className="w-3.5 h-3.5" /> New Query
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 text-surface-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search queries..."
              className="w-full pl-8 pr-3 py-2 bg-surface-950 border border-surface-800 rounded-lg text-xs text-surface-200 placeholder-surface-500 focus:outline-none focus:border-surface-600"
            />
          </div>

          {/* Status filter */}
          <div className="flex gap-1.5 flex-wrap">
            {['all', 'pending', 'in_progress', 'answered', 'closed'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors capitalize ${
                  filterStatus === s
                    ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                    : 'bg-surface-800/50 text-surface-400 border border-surface-700 hover:text-surface-200'
                }`}
              >
                {s === 'in_progress' ? 'In Progress' : s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-surface-500 mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <Inbox className="w-8 h-8 text-surface-600 mx-auto mb-3" />
              <p className="text-sm text-surface-500">No queries yet</p>
              <p className="text-xs text-surface-600 mt-1">Click "New Query" to ask your tutor</p>
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
                  className={`p-4 border-b border-surface-800/50 cursor-pointer transition-colors group relative ${
                    isActive ? 'bg-primary-500/5 border-l-2 border-l-primary-500' : 'hover:bg-surface-800/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-100 truncate">{q.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium ${cfg.color}`}>
                          <StatusIcon className="w-2.5 h-2.5" />
                          {cfg.label}
                        </span>
                        <span className="text-[10px] text-surface-500 flex items-center gap-1">
                          <BookOpen className="w-2.5 h-2.5" />{q.subject}
                        </span>
                      </div>
                      <p className="text-[10px] text-surface-600 mt-1.5 flex items-center gap-1">
                        <MessageSquare className="w-2.5 h-2.5" />
                        {q.reply_count || 0} {q.reply_count === 1 ? 'reply' : 'replies'}
                        <span className="mx-1">·</span>
                        {new Date(q.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <button
                      onClick={e => handleDelete(q.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── RIGHT: Detail / Thread ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {detailLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-surface-500" />
          </div>
        ) : !selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="w-16 h-16 rounded-2xl bg-surface-900 border border-surface-800 flex items-center justify-center mb-4">
              <MessageSquare className="w-7 h-7 text-surface-600" />
            </div>
            <h3 className="text-base font-semibold text-surface-300 mb-2">Select a query to view</h3>
            <p className="text-sm text-surface-500 max-w-xs">Choose a query from the list, or create a new one to start a conversation with your tutor.</p>
            <button
              onClick={() => setShowNew(true)}
              className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Ask Your Tutor
            </button>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="px-6 py-4 border-b border-surface-800 bg-surface-900/40 shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-surface-50">{selected.title}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    {(() => {
                      const cfg = STATUS_CONFIG[selected.status as Status] || STATUS_CONFIG.pending
                      const StatusIcon = cfg.icon
                      return (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-medium ${cfg.color}`}>
                          <StatusIcon className="w-2.5 h-2.5" />{cfg.label}
                        </span>
                      )
                    })()}
                    <span className="text-[10px] text-surface-500">
                      {selected.subject} · {new Date(selected.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-surface-500 rotate-180 cursor-pointer hover:text-surface-300 transition-colors" onClick={() => setSelected(null)} />
              </div>
            </div>

            {/* Thread Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">

              {/* Original question */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-500/20 border border-primary-500/30 flex items-center justify-center shrink-0 text-primary-400 text-xs font-bold">
                  You
                </div>
                <div className="flex-1">
                  <div className="bg-surface-900 border border-surface-800 rounded-2xl rounded-tl-sm p-4 max-w-2xl">
                    <p className="text-sm text-surface-200 leading-relaxed whitespace-pre-wrap">{selected.body}</p>
                  </div>
                  <p className="text-[10px] text-surface-600 mt-1 ml-1">
                    {new Date(selected.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Replies */}
              {(selected.replies || []).map((reply: any) => {
                const isTeacher = reply.sender_role === 'teacher'
                return (
                  <div key={reply.id} className={`flex gap-3 ${isTeacher ? '' : 'flex-row-reverse'}`}>
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 text-[10px] font-bold ${
                      isTeacher
                        ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                        : 'bg-primary-500/20 border-primary-500/30 text-primary-400'
                    }`}>
                      {isTeacher ? 'T' : 'You'}
                    </div>
                    <div className={`flex-1 flex flex-col ${isTeacher ? 'items-start' : 'items-end'}`}>
                      <p className="text-[10px] text-surface-500 mb-1 px-1">
                        {isTeacher ? reply.sender_name : 'You'}
                      </p>
                      <div className={`rounded-2xl p-4 max-w-2xl ${
                        isTeacher
                          ? 'bg-emerald-500/5 border border-emerald-500/20 rounded-tl-sm'
                          : 'bg-primary-500/5 border border-primary-500/20 rounded-tr-sm'
                      }`}>
                        <p className="text-sm text-surface-200 leading-relaxed whitespace-pre-wrap">{reply.message}</p>
                      </div>
                      <p className="text-[10px] text-surface-600 mt-1 px-1">
                        {new Date(reply.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}

              {selected.replies?.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="w-6 h-6 text-surface-600 mb-2" />
                  <p className="text-sm text-surface-500">Waiting for a tutor response</p>
                  <p className="text-xs text-surface-600 mt-1">You'll see replies here when your tutor responds</p>
                </div>
              )}

              <div ref={repliesEndRef} />
            </div>

            {/* Reply Input */}
            {selected.status !== 'closed' && (
              <div className="p-4 border-t border-surface-800 bg-surface-950/80 backdrop-blur-md shrink-0">
                <div className="flex gap-3 max-w-3xl mx-auto">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleReply() }}
                    placeholder="Add a follow-up or clarification... (Ctrl+Enter to send)"
                    rows={2}
                    className="flex-1 bg-surface-900 border border-surface-800 rounded-xl px-4 py-3 text-sm text-surface-200 placeholder-surface-500 focus:outline-none focus:border-surface-600 resize-none transition-colors"
                  />
                  <button
                    onClick={handleReply}
                    disabled={!replyText.trim() || sending}
                    className="px-4 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-end"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── New Query Modal ── */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-surface-900 border border-surface-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-surface-50">Ask Your Tutor</h2>
              <button onClick={() => setShowNew(false)} className="text-surface-400 hover:text-surface-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-400 mb-1.5">Question Title <span className="text-red-400">*</span></label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. What is gradient descent?"
                  className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-surface-100 placeholder-surface-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-400 mb-1.5">Your Question <span className="text-red-400">*</span></label>
                <textarea
                  value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  placeholder="Describe your question in detail. Include what you've already tried..."
                  rows={5}
                  className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-3 text-sm text-surface-100 placeholder-surface-500 focus:outline-none focus:border-primary-500 resize-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-surface-400 mb-1.5">Subject</label>
                  <select
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    className="w-full bg-surface-950 border border-surface-700 rounded-xl px-3 py-2.5 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
                  >
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-400 mb-1.5">Priority</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full bg-surface-950 border border-surface-700 rounded-xl px-3 py-2.5 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNew(false)} className="flex-1 py-2.5 bg-surface-800 text-surface-200 text-sm font-medium rounded-xl hover:bg-surface-700 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmitQuery}
                disabled={!form.title.trim() || !form.body.trim() || submitting}
                className="flex-1 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-500 transition-colors shadow-lg shadow-primary-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit Query
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
