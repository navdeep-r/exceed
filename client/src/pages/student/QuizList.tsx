import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { quizAPI } from '../../api'

export default function QuizList() {
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      quizAPI.listForStudent().catch(() => []),
      quizAPI.results().catch(() => []),
    ]).then(([q, r]) => { setQuizzes(q); setResults(r); setLoading(false) })
  }, [])

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 shimmer rounded-2xl" />)}</div>

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-surface-50">🧠 Quizzes</h1>
        <p className="text-surface-400 mt-1">Test your knowledge on lecture content</p>
      </div>

      {quizzes.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-5xl mb-4">🧠</p>
          <p className="text-lg font-medium text-surface-300">No quizzes available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger">
          {quizzes.map(q => {
            const result = results.find((r: any) => r.quiz_id === q.id)
            return (
              <Link key={q.id} to={`/student/quiz/${q.id}`}
                className="glass rounded-2xl p-6 card-hover group border border-surface-700/50 hover:border-accent-500/30">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500/20 to-primary-500/20 flex items-center justify-center text-xl">🧠</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-surface-100 group-hover:text-accent-300 transition-colors">{q.title || 'Quiz'}</h3>
                    <p className="text-xs text-surface-400 mt-1">{q.question_count || '?'} questions</p>
                    {result ? (
                      <div className="mt-3 flex items-center gap-2">
                        <span className={`text-sm font-bold ${result.score >= 70 ? 'text-success-400' : result.score >= 40 ? 'text-warning-400' : 'text-danger-400'}`}>
                          {result.score}%
                        </span>
                        <span className="text-xs text-surface-500">completed</span>
                      </div>
                    ) : (
                      <span className="text-xs text-accent-400 mt-3 inline-block">Start quiz →</span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
