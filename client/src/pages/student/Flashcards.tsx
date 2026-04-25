import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { flashcardsAPI } from '../../api'

export default function Flashcards() {
  const { notesId } = useParams<{ notesId: string }>()
  const [cards, setCards] = useState<any[]>([])
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [reviewed, setReviewed] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (notesId) flashcardsAPI.getByNotes(notesId).then(setCards).catch(() => {}).finally(() => setLoading(false))
  }, [notesId])

  const card = cards[current]

  const flip = () => setFlipped(f => !f)

  const next = () => {
    if (card) {
      setReviewed(prev => new Set(prev).add(card.id))
      flashcardsAPI.markReviewed(card.id).catch(() => {})
    }
    setFlipped(false)
    setCurrent(c => Math.min(c + 1, cards.length - 1))
  }

  const prev = () => { setFlipped(false); setCurrent(c => Math.max(c - 1, 0)) }

  if (loading) return <div className="h-96 shimmer rounded-2xl" />

  if (cards.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Link to="/student/notes" className="text-sm text-primary-400 hover:text-primary-300">← Back to notes</Link>
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-5xl mb-4">🃏</p>
          <p className="text-lg font-medium text-surface-300">No flashcards available</p>
        </div>
      </div>
    )
  }

  const progress = reviewed.size / cards.length * 100

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      <Link to="/student/notes" className="text-sm text-primary-400 hover:text-primary-300 inline-block">← Back to notes</Link>

      {/* Progress */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-surface-400">{reviewed.size}/{cards.length} reviewed</span>
        <div className="flex-1 h-2 bg-surface-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-success-400 to-success-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Flashcard */}
      <div className="perspective cursor-pointer" onClick={flip}>
        <div className={`relative w-full h-80 transition-transform duration-500 preserve-3d ${flipped ? 'rotate-y-180' : ''}`}>
          {/* Front */}
          <div className="absolute inset-0 glass rounded-2xl p-8 flex flex-col items-center justify-center backface-hidden glow-accent">
            <p className="text-xs text-accent-400 font-medium uppercase tracking-wide mb-4">Question</p>
            <p className="text-xl font-semibold text-surface-100 text-center leading-relaxed">{card?.front}</p>
            <p className="text-xs text-surface-500 mt-6">Click to reveal answer</p>
          </div>
          {/* Back */}
          <div className="absolute inset-0 glass rounded-2xl p-8 flex flex-col items-center justify-center backface-hidden rotate-y-180 glow-primary">
            <p className="text-xs text-primary-400 font-medium uppercase tracking-wide mb-4">Answer</p>
            <p className="text-lg text-surface-200 text-center leading-relaxed">{card?.back}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={prev} disabled={current === 0}
          className="px-5 py-2.5 rounded-xl bg-surface-700 text-surface-200 text-sm font-semibold hover:bg-surface-600 disabled:opacity-30 transition-all">
          ← Previous
        </button>
        <span className="text-sm text-surface-400 font-medium">{current + 1} / {cards.length}</span>
        <button onClick={next} disabled={current === cards.length - 1}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-600 to-primary-600 text-white text-sm font-semibold disabled:opacity-30 transition-all shadow-lg">
          Next →
        </button>
      </div>

      {reviewed.size === cards.length && (
        <div className="glass rounded-2xl p-6 text-center border border-success-500/30 animate-slide-up">
          <p className="text-4xl mb-2">🎉</p>
          <p className="font-semibold text-success-400">All cards reviewed!</p>
          <p className="text-xs text-xp mt-1">+10 XP earned ⚡</p>
        </div>
      )}
    </div>
  )
}
