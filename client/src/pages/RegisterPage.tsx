import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'student' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 p-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-slide-up relative">
        <div className="glass rounded-2xl p-8 glow-accent">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center text-white text-xl font-bold mx-auto mb-4 shadow-lg animate-float">
              E
            </div>
            <h2 className="text-2xl font-bold text-surface-100">Create Account</h2>
            <p className="text-surface-400 mt-1">Join the Exceed learning platform</p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selector */}
            <div className="flex gap-2 p-1 bg-surface-800/80 rounded-xl">
              {['student', 'teacher'].map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => update('role', role)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    form.role === role
                      ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg'
                      : 'text-surface-400 hover:text-surface-200'
                  }`}
                >
                  {role === 'student' ? '🎓 Student' : '👩‍🏫 Teacher'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-surface-300 mb-1.5">First Name</label>
                <input id="firstName" type="text" required value={form.firstName} onChange={e => update('firstName', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-800/80 border border-surface-600/50 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-all text-sm"
                  placeholder="Jane" />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-surface-300 mb-1.5">Last Name</label>
                <input id="lastName" type="text" required value={form.lastName} onChange={e => update('lastName', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-800/80 border border-surface-600/50 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-all text-sm"
                  placeholder="Doe" />
              </div>
            </div>

            <div>
              <label htmlFor="regEmail" className="block text-sm font-medium text-surface-300 mb-1.5">Email</label>
              <input id="regEmail" type="email" required value={form.email} onChange={e => update('email', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface-800/80 border border-surface-600/50 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-all text-sm"
                placeholder="you@example.com" />
            </div>
            <div>
              <label htmlFor="regPassword" className="block text-sm font-medium text-surface-300 mb-1.5">Password</label>
              <input id="regPassword" type="password" required minLength={6} value={form.password} onChange={e => update('password', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface-800/80 border border-surface-600/50 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-all text-sm"
                placeholder="Min 6 characters" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-600 to-primary-600 text-white font-semibold text-sm hover:from-accent-500 hover:to-primary-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 transition-all disabled:opacity-50 shadow-lg shadow-accent-500/25">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-surface-400">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-400 hover:text-accent-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
