import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { flashcardsAPI } from '../../api'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Layers, Sparkles, RotateCcw, CheckCircle2, Trophy } from 'lucide-react'

export default function Flashcards() {
  const { notesId } = useParams<{ notesId: string }>()
  const [cards, setCards] = useState<any[]>([])
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [reviewed, setReviewed] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [direction, setDirection] = useState(0)

  useEffect(() => {
    if (notesId) {
      setLoading(true)
      flashcardsAPI.getByNotes(notesId)
        .then(setCards)
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [notesId])

  const handleGenerate = async () => {
    if (!notesId) return
    setGenerating(true)
    try {
      const generated = await flashcardsAPI.generate(notesId)
      setCards(generated)
    } catch {
      // noop
    } finally {
      setGenerating(false)
    }
  }

  const card = cards[current]
  const progress = cards.length > 0 ? (reviewed.size / cards.length) * 100 : 0
  const allDone = cards.length > 0 && reviewed.size === cards.length

  const flip = () => setFlipped(f => !f)

  const go = (delta: number) => {
    const next = current + delta
    if (next < 0 || next >= cards.length) return
    setDirection(delta)
    setFlipped(false)
    setTimeout(() => setCurrent(next), 50)
  }

  const markReviewed = () => {
    if (card) {
      setReviewed(prev => new Set(prev).add(card.id))
      flashcardsAPI.markReviewed(card.id).catch(() => {})
    }
    if (current < cards.length - 1) go(1)
  }

  const reset = () => {
    setReviewed(new Set())
    setCurrent(0)
    setFlipped(false)
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 shimmer rounded-lg w-48" />
        <div className="h-64 shimmer rounded-2xl" />
        <div className="h-10 shimmer rounded-lg" />
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Link
          to={`/student/notes/${notesId}`}
          className="inline-flex items-center gap-1.5 text-sm text-surface-400 hover:text-surface-100 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Notes
        </Link>

        <div className="flex flex-col items-center justify-center py-20 text-center border border-surface-800 border-dashed rounded-2xl bg-surface-900/30">
          <div className="w-20 h-20 rounded-2xl bg-surface-900 border border-surface-800 flex items-center justify-center mb-5">
            <Layers className="w-10 h-10 text-surface-500" />
          </div>
          <h3 className="text-lg font-semibold text-surface-100 mb-2">No Flashcards Yet</h3>
          <p className="text-sm text-surface-400 max-w-sm mb-8">
            Generate a flashcard deck from this note automatically using AI. Cards are created from key concepts and bullet points.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold transition-all shadow-lg shadow-primary-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            {generating ? 'Generating...' : 'Auto-Generate Flashcards'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link
          to={`/student/notes/${notesId}`}
          className="inline-flex items-center gap-1.5 text-sm text-surface-400 hover:text-surface-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Notes
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-surface-500">{current + 1} / {cards.length}</span>
          <button
            onClick={reset}
            title="Restart deck"
            className="p-1.5 rounded-lg text-surface-500 hover:text-surface-200 hover:bg-surface-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-surface-500 mb-2">
          <span>{reviewed.size} reviewed</span>
          <span>{cards.length - reviewed.size} remaining</span>
        </div>
        <div className="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* All-done state */}
      {allDone ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center border border-success-500/20 rounded-2xl bg-success-500/5"
        >
          <div className="w-16 h-16 rounded-full bg-success-500/10 flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-success-400" />
          </div>
          <h3 className="text-lg font-semibold text-surface-50 mb-2">All Done! 🎉</h3>
          <p className="text-sm text-surface-400 mb-6">You've reviewed all {cards.length} flashcards.</p>
          <button
            onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-200 text-sm font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Review Again
          </button>
        </motion.div>
      ) : (
        <>
          {/* Flip card */}
          <div
            className="relative cursor-pointer mb-6"
            style={{ perspective: '1200px', height: '320px' }}
            onClick={flip}
          >
            <motion.div
              style={{
                transformStyle: 'preserve-3d',
                position: 'relative',
                width: '100%',
                height: '100%',
                transition: 'transform 0.5s ease',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* Front */}
              <div
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                className="absolute inset-0 bg-surface-900 border border-surface-700 rounded-2xl p-8 flex flex-col items-center justify-center shadow-lg"
              >
                <span className="text-xs font-semibold text-primary-400 uppercase tracking-widest mb-6">Question</span>
                <p className="text-xl font-semibold text-surface-50 text-center leading-relaxed">{card?.front}</p>
                <p className="text-xs text-surface-600 mt-8">Click to reveal answer</p>
              </div>

              {/* Back */}
              <div
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
                className="absolute inset-0 bg-surface-800 border border-primary-500/20 rounded-2xl p-8 flex flex-col items-center justify-center shadow-lg"
              >
                <span className="text-xs font-semibold text-accent-400 uppercase tracking-widest mb-6">Answer</span>
                <p className="text-lg text-surface-100 text-center leading-relaxed">{card?.back}</p>
              </div>
            </motion.div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => go(-1)}
              disabled={current === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-800 text-surface-200 text-sm font-medium hover:bg-surface-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>

            <button
              onClick={markReviewed}
              disabled={reviewed.has(card?.id)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              {reviewed.has(card?.id) ? 'Reviewed' : 'Mark as Reviewed'}
            </button>

            <button
              onClick={() => go(1)}
              disabled={current === cards.length - 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-800 text-surface-200 text-sm font-medium hover:bg-surface-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card dots */}
          {cards.length <= 20 && (
            <div className="flex items-center justify-center gap-1.5 mt-6 flex-wrap">
              {cards.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => { setFlipped(false); setCurrent(i) }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === current
                      ? 'bg-primary-400 w-5'
                      : reviewed.has(c.id)
                      ? 'bg-success-500'
                      : 'bg-surface-700 hover:bg-surface-500'
                  }`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
