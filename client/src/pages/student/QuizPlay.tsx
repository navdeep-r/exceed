import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { quizAPI } from '../../api'

export default function QuizPlay() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState<any>(null)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) quizAPI.get(id).then(q => { setQuiz(q); setAnswers(new Array(q.questions?.length || 0).fill(-1)) }).catch(() => navigate('/student/quiz')).finally(() => setLoading(false))
  }, [id])

  const questions = quiz?.questions || []
  const q = questions[current]

  const handleAnswer = (idx: number) => {
    if (showFeedback) return
    setSelected(idx)
    const newAnswers = [...answers]; newAnswers[current] = idx; setAnswers(newAnswers)
    setShowFeedback(true)
  }

  const nextQuestion = () => {
    setShowFeedback(false); setSelected(null)
    if (current < questions.length - 1) { setCurrent(c => c + 1) }
    else { submitQuiz() }
  }

  const submitQuiz = async () => {
    try {
      const res = await quizAPI.submit(id!, answers)
      setResult(res)
    } catch { setResult({ score: 0, feedback: 'Submission failed' }) }
  }

  if (loading) return <div className="h-96 shimmer rounded-2xl" />

  if (result) {
    return (
      <div className="max-w-lg mx-auto space-y-8 animate-slide-up">
        <div className="glass rounded-2xl p-8 text-center glow-primary">
          <p className="text-6xl mb-4">{result.score >= 70 ? '🎉' : result.score >= 40 ? '👍' : '💪'}</p>
          <h2 className="text-2xl font-bold text-surface-50 mb-2">Quiz Complete!</h2>
          <p className={`text-5xl font-bold mb-2 ${result.score >= 70 ? 'text-success-400' : result.score >= 40 ? 'text-warning-400' : 'text-danger-400'}`}>
            {result.score}%
          </p>
          <p className="text-surface-400 mb-1">{Math.round(result.score / 100 * questions.length)} of {questions.length} correct</p>
          {result.xp_awarded && <p className="text-xp font-semibold mt-2">+{result.xp_awarded} XP earned! ⚡</p>}
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={() => navigate('/student/quiz')} className="px-6 py-2.5 rounded-xl bg-surface-700 text-surface-200 text-sm font-semibold hover:bg-surface-600">
              Back to Quizzes
            </button>
            <button onClick={() => { setCurrent(0); setAnswers(new Array(questions.length).fill(-1)); setResult(null); setSelected(null); setShowFeedback(false) }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-accent-600 to-primary-600 text-white text-sm font-semibold">
              Retry Quiz
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!q) return <p className="text-surface-400">No questions found.</p>

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Progress bar */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-surface-400 font-medium">{current + 1}/{questions.length}</span>
        <div className="flex-1 h-2 bg-surface-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-accent-500 to-primary-500 rounded-full transition-all duration-300"
            style={{ width: `${(current + 1) / questions.length * 100}%` }} />
        </div>
      </div>

      {/* Question */}
      <div className="glass rounded-2xl p-8">
        <p className="text-xs text-accent-400 font-medium mb-3 uppercase tracking-wide">Question {current + 1}</p>
        <h2 className="text-xl font-semibold text-surface-50 mb-6 leading-relaxed">{q.question_text}</h2>

        <div className="space-y-3">
          {(q.options || []).map((opt: string, idx: number) => {
            let style = 'bg-surface-800/60 border-surface-600/50 hover:border-surface-500 text-surface-200'
            if (showFeedback) {
              if (idx === q.correct_answer) style = 'bg-success-500/15 border-success-500/40 text-success-300'
              else if (idx === selected && idx !== q.correct_answer) style = 'bg-danger-500/15 border-danger-500/40 text-danger-300'
              else style = 'bg-surface-800/40 border-surface-700/30 text-surface-500'
            } else if (idx === selected) {
              style = 'bg-primary-500/15 border-primary-500/40 text-primary-300'
            }
            return (
              <button key={idx} onClick={() => handleAnswer(idx)} disabled={showFeedback}
                className={`w-full text-left px-5 py-4 rounded-xl border transition-all text-sm font-medium ${style}`}>
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-surface-700/50 text-xs mr-3">
                  {String.fromCharCode(65 + idx)}
                </span>
                {opt}
              </button>
            )
          })}
        </div>

        {showFeedback && q.explanation && (
          <div className="mt-4 p-4 rounded-xl bg-primary-500/10 border border-primary-500/20 text-sm text-surface-300 animate-fade-in">
            💡 {q.explanation}
          </div>
        )}
      </div>

      {showFeedback && (
        <button onClick={nextQuestion}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold text-sm shadow-lg animate-fade-in">
          {current < questions.length - 1 ? 'Next Question →' : 'See Results 🏆'}
        </button>
      )}
    </div>
  )
}
