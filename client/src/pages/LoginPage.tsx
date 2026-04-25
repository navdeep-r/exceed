import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      // AuthContext will redirect via App router
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-surface-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-3xl" />
      </div>

      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative">
        <div className="max-w-md text-center animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-8 shadow-2xl animate-float">
            E
          </div>
          <h1 className="text-5xl font-bold mb-4">
            <span className="gradient-text">Exceed</span>
          </h1>
          <p className="text-xl text-surface-300 mb-6">AI Multilingual Classroom</p>
          <p className="text-surface-400 leading-relaxed">
            Transform lectures into structured, multilingual learning materials.
            Record, transcribe, refine, translate, and deliver — all in one platform.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl mb-2">🎙️</div>
              <p className="text-xs text-surface-400">Record & Transcribe</p>
            </div>
            <div>
              <div className="text-2xl mb-2">🌍</div>
              <p className="text-xs text-surface-400">Multilingual</p>
            </div>
            <div>
              <div className="text-2xl mb-2">🧠</div>
              <p className="text-xs text-surface-400">AI-Powered</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="w-full max-w-md animate-slide-up">
          <div className="glass rounded-2xl p-8 glow-primary">
            <div className="lg:hidden text-center mb-8">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xl font-bold mx-auto mb-4 shadow-lg">
                E
              </div>
              <h1 className="text-2xl font-bold gradient-text">Exceed</h1>
            </div>

            <h2 className="text-2xl font-bold text-surface-100 mb-1">Welcome back</h2>
            <p className="text-surface-400 mb-8">Sign in to your account to continue</p>

            {error && (
              <div className="mb-6 p-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-surface-300 mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-800/80 border border-surface-600/50 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all text-sm"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-surface-300 mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-800/80 border border-surface-600/50 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold text-sm hover:from-primary-500 hover:to-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/25"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-surface-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                Create one
              </Link>
            </p>
          </div>

          {/* Demo credentials hint */}
          <div className="mt-4 glass-light rounded-xl p-4 text-center">
            <p className="text-xs text-surface-400 mb-2">Demo credentials:</p>
            <div className="flex gap-4 justify-center text-xs">
              <div>
                <span className="text-surface-300 font-medium">Teacher:</span>{' '}
                <span className="text-primary-400">teacher@exceed.com</span>
              </div>
              <div>
                <span className="text-surface-300 font-medium">Student:</span>{' '}
                <span className="text-accent-400">student@exceed.com</span>
              </div>
            </div>
            <p className="text-xs text-surface-500 mt-1">Password: password123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
