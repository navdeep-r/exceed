import { useState, useEffect, useRef } from 'react'
import { doubtsAPI } from '../../api'

export default function StudentDoubts() {
  const [doubts, setDoubts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [question, setQuestion] = useState('')
  const [isVoice, setIsVoice] = useState(false)
  const [recording, setRecording] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => { doubtsAPI.listForStudent().then(setDoubts).catch(() => {}).finally(() => setLoading(false)) }, [])

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const recognition = new SR()
    recognition.continuous = true; recognition.interimResults = true; recognition.lang = 'en-US'
    recognition.onresult = (e: any) => {
      let text = ''
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript
      }
      setQuestion(text)
    }
    recognition.start(); recognitionRef.current = recognition; setRecording(true); setIsVoice(true)
  }

  const stopVoice = () => {
    recognitionRef.current?.stop(); setRecording(false)
  }

  const handleSubmit = async () => {
    if (!question.trim()) return
    setSubmitting(true)
    try {
      // Using a placeholder lectureId - in production this would be context-aware
      const result = await doubtsAPI.submit({ lectureId: 'general', questionText: question, isVoice })
      setDoubts(prev => [result, ...prev]); setQuestion(''); setIsVoice(false)
    } catch {}
    finally { setSubmitting(false) }
  }

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 shimmer rounded-2xl" />)}</div>

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-surface-50">💬 Ask a Doubt</h1>
        <p className="text-surface-400 mt-1">Use voice or text to ask your teacher questions</p>
      </div>

      {/* Input */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <textarea value={question} onChange={e => setQuestion(e.target.value)}
          className="w-full h-28 px-4 py-3 rounded-xl bg-surface-800/80 border border-surface-600/50 text-surface-200 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 resize-none text-sm"
          placeholder="Type your question or use voice input…" />
        <div className="flex items-center gap-3">
          <button onClick={recording ? stopVoice : startVoice}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              recording ? 'bg-danger-500/20 text-danger-400 animate-recording' : 'bg-surface-700 text-surface-300 hover:bg-surface-600'
            }`}>
            {recording ? '⏹ Stop' : '🎙️ Voice'}
          </button>
          <button onClick={handleSubmit} disabled={submitting || !question.trim()}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-accent-600 to-primary-600 text-white text-sm font-semibold disabled:opacity-50 shadow-lg">
            {submitting ? 'Sending…' : '📩 Submit'}
          </button>
        </div>
      </div>

      {/* History */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-surface-100 mb-4">Your Questions</h2>
        {doubts.length === 0 ? (
          <p className="text-surface-400 text-sm py-8 text-center">No questions yet</p>
        ) : (
          <div className="space-y-4">
            {doubts.map(d => (
              <div key={d.id} className="p-4 rounded-xl bg-surface-800/40 space-y-3">
                <div className="flex items-start justify-between">
                  <p className="text-sm text-surface-200">{d.question_text}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ml-3 shrink-0 ${d.status === 'answered' ? 'bg-success-500/15 text-success-400' : 'bg-warning-500/15 text-warning-400'}`}>
                    {d.status}
                  </span>
                </div>
                {d.response && (
                  <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/20">
                    <p className="text-xs text-primary-400 font-medium mb-1">Teacher's Response:</p>
                    <p className="text-sm text-surface-300">{d.response}</p>
                  </div>
                )}
                <p className="text-xs text-surface-500">{new Date(d.submitted_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
