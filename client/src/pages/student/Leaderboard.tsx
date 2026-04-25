import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  Trophy, TrendingUp, TrendingDown, Minus, Flame,
  Target, BookOpen, Zap, Crown, Medal, Award,
  RefreshCw, Loader2, ChevronUp, ChevronDown, Star
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

async function fetchLeaderboard(type: string, timeRange: string) {
  const token = localStorage.getItem('exceed_token')
  const res = await fetch(`${API_BASE}/leaderboard?type=${type}&timeRange=${timeRange}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to fetch leaderboard')
  return res.json()
}

const TREND_ICON = {
  up:   <TrendingUp  className="w-3.5 h-3.5 text-emerald-400" />,
  down: <TrendingDown className="w-3.5 h-3.5 text-red-400" />,
  same: <Minus        className="w-3.5 h-3.5 text-surface-500" />,
}

const RANK_MEDAL: Record<number, { icon: typeof Crown; color: string; bg: string }> = {
  1: { icon: Crown,  color: 'text-amber-400',  bg: 'bg-amber-400/10 border-amber-400/30' },
  2: { icon: Medal,  color: 'text-slate-300',  bg: 'bg-slate-300/10 border-slate-300/30' },
  3: { icon: Award,  color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/30' },
}

function Podium({ entries, currentUserId }: { entries: any[]; currentUserId: string }) {
  const top3 = entries.slice(0, 3)
  // Reorder: [2nd, 1st, 3rd] for visual podium
  const order = [top3[1], top3[0], top3[2]].filter(Boolean)
  const heights = { 0: 'h-24', 1: 'h-32', 2: 'h-20' }
  const podiumIdx: Record<number, number> = { 0: 2, 1: 1, 2: 3 } // visual position → actual rank

  return (
    <div className="flex items-end justify-center gap-4 mb-8">
      {order.map((entry, vi) => {
        const rank = podiumIdx[vi]
        const medal = RANK_MEDAL[rank]
        const MedalIcon = medal.icon
        const isMe = entry.userId === currentUserId
        const podiumH = vi === 1 ? 'h-28' : vi === 0 ? 'h-20' : 'h-16'

        return (
          <div key={entry.userId} className={`flex flex-col items-center ${vi === 1 ? 'order-2' : vi === 0 ? 'order-1' : 'order-3'}`}>
            {/* Avatar */}
            <div className={`relative w-14 h-14 rounded-full flex items-center justify-center text-base font-bold mb-2 border-2 transition-all ${
              isMe
                ? 'border-primary-500 bg-primary-500/20 text-primary-300'
                : medal.bg + ' ' + medal.color
            }`}>
              {entry.avatar}
              <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center border ${medal.bg}`}>
                <MedalIcon className={`w-3 h-3 ${medal.color}`} />
              </div>
              {isMe && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-primary-500 text-white text-[8px] font-bold rounded-full">
                  You
                </div>
              )}
            </div>

            {/* Info */}
            <p className={`text-xs font-bold mb-1 text-center max-w-[80px] truncate ${isMe ? 'text-primary-300' : 'text-surface-100'}`}>
              {entry.name.split(' ')[0]}
            </p>
            <p className="text-sm font-black text-surface-50 mb-2">{entry.score.toLocaleString()}</p>

            {/* Podium block */}
            <div className={`w-20 ${podiumH} rounded-t-lg flex items-start justify-center pt-2 ${
              vi === 1
                ? 'bg-gradient-to-b from-amber-400/20 to-amber-400/5 border-t-2 border-amber-400/40'
                : vi === 0
                ? 'bg-gradient-to-b from-slate-300/20 to-slate-300/5 border-t-2 border-slate-300/30'
                : 'bg-gradient-to-b from-orange-400/20 to-orange-400/5 border-t-2 border-orange-400/30'
            }`}>
              <span className={`text-lg font-black ${medal.color}`}>#{rank}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function LeaderboardRow({ entry, currentUserId, rank }: { entry: any; currentUserId: string; rank: number }) {
  const isMe = entry.userId === currentUserId
  const medal = RANK_MEDAL[rank]

  return (
    <div className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
      isMe
        ? 'bg-primary-500/8 border border-primary-500/20'
        : 'hover:bg-surface-800/40 border border-transparent'
    }`}>
      {/* Rank */}
      <div className={`w-8 text-center shrink-0 ${medal ? medal.color : 'text-surface-500'} font-bold text-sm`}>
        {medal ? (() => { const I = medal.icon; return <I className={`w-4 h-4 mx-auto ${medal.color}`} /> })() : `#${rank}`}
      </div>

      {/* Avatar */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${
        isMe
          ? 'bg-primary-500/20 border-primary-500/40 text-primary-300'
          : 'bg-surface-800 border-surface-700 text-surface-200'
      }`}>
        {entry.avatar}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-semibold truncate ${isMe ? 'text-primary-200' : 'text-surface-100'}`}>
            {entry.name}
          </p>
          {isMe && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30 shrink-0">
              You
            </span>
          )}
          {entry.badges?.map((b: any) => (
            <span key={b.id} className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-surface-800 border border-surface-700 ${b.color} shrink-0`}>
              {b.label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[10px] text-surface-500 flex items-center gap-1">
            <Flame className="w-2.5 h-2.5 text-orange-400" /> {entry.streak}d
          </span>
          <span className="text-[10px] text-surface-500 flex items-center gap-1">
            <Target className="w-2.5 h-2.5 text-blue-400" /> {entry.accuracy}%
          </span>
          <span className="text-[10px] text-surface-500 flex items-center gap-1">
            <BookOpen className="w-2.5 h-2.5 text-violet-400" /> {entry.quizzesCompleted} quizzes
          </span>
        </div>
      </div>

      {/* Score */}
      <div className="text-right shrink-0">
        <p className={`text-sm font-bold ${isMe ? 'text-primary-300' : 'text-surface-100'}`}>
          {entry.score.toLocaleString()}
        </p>
        <p className="text-[10px] text-surface-500">pts</p>
      </div>

      {/* Trend */}
      <div className="w-6 shrink-0 flex justify-center">
        {TREND_ICON[entry.trend as 'up' | 'down' | 'same'] || TREND_ICON.same}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <p className="text-xs text-surface-400 font-medium">{label}</p>
      </div>
      <p className="text-xl font-bold text-surface-50">{value}</p>
    </div>
  )
}

const SUGGESTIONS: Record<string, string[]> = {
  top3:    ['You\'re in the top 3! Keep your streak going to stay there.', 'Complete more quizzes to widen your lead.'],
  top10:   ['Complete 2 more quizzes to reach the top 3.', 'Improve your accuracy above 85% for the Precision badge.'],
  default: ['Focus on your weakest topics to climb ranks.', 'A 5-day streak gives +10 bonus points.', 'Higher accuracy scores reduce your penalty multiplier.'],
}

export default function Leaderboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'global' | 'class' | 'weekly'>('global')
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('week')
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const result = await fetchLeaderboard(tab, timeRange)
      setData(result)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [tab, timeRange])

  const currentUserId = (user as any)?.id || ''
  const myStats = data?.myStats

  const suggestions = myStats
    ? myStats.rank <= 3   ? SUGGESTIONS.top3
    : myStats.rank <= 10  ? SUGGESTIONS.top10
    : SUGGESTIONS.default
    : SUGGESTIONS.default

  const tabs: { id: typeof tab; label: string }[] = [
    { id: 'global', label: 'Global' },
    { id: 'class',  label: 'Class' },
    { id: 'weekly', label: 'Weekly' },
  ]

  const timeRanges: { id: typeof timeRange; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'week',  label: 'This Week' },
    { id: 'month', label: 'This Month' },
  ]

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-surface-950 animate-fade-in">

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="shrink-0 px-8 pt-6 pb-4 border-b border-surface-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-surface-50 flex items-center gap-2.5">
                <Trophy className="w-6 h-6 text-amber-400" /> Leaderboard
              </h1>
              <p className="text-sm text-surface-400 mt-0.5">
                Rankings based on quiz accuracy, streaks & consistency.
                {data && <span className="text-surface-500 ml-2">· {data.totalParticipants} participants</span>}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Time range */}
              <div className="flex bg-surface-900 border border-surface-800 rounded-lg p-1 gap-1">
                {timeRanges.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setTimeRange(r.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      timeRange === r.id
                        ? 'bg-surface-700 text-surface-50'
                        : 'text-surface-400 hover:text-surface-200'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => load(true)}
                disabled={refreshing}
                className="p-2 rounded-lg border border-surface-800 text-surface-400 hover:text-surface-200 hover:bg-surface-800 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 mt-4">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`pb-2 text-sm font-medium border-b-2 transition-all ${
                  tab === t.id
                    ? 'border-primary-500 text-primary-400'
                    : 'border-transparent text-surface-400 hover:text-surface-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-surface-500" />
            </div>
          ) : !data || data.leaderboard.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Trophy className="w-12 h-12 text-surface-700 mb-4" />
              <h3 className="text-base font-semibold text-surface-400 mb-2">No rankings yet</h3>
              <p className="text-sm text-surface-500">Complete quizzes and practice sessions to appear on the leaderboard.</p>
            </div>
          ) : (
            <>
              {/* Podium */}
              {data.leaderboard.length >= 3 && (
                <Podium entries={data.leaderboard} currentUserId={currentUserId} />
              )}

              {/* Full list */}
              <div className="bg-surface-900/50 border border-surface-800 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-surface-800 flex items-center justify-between">
                  <h2 className="text-xs font-bold text-surface-400 uppercase tracking-wider">All Rankings</h2>
                  {myStats && (
                    <span className="text-xs text-surface-500">
                      Your rank: <span className="text-primary-400 font-bold">#{myStats.rank}</span> of {data.totalParticipants}
                    </span>
                  )}
                </div>
                <div className="divide-y divide-surface-800/50">
                  {data.leaderboard.map((entry: any) => (
                    <LeaderboardRow
                      key={entry.userId}
                      entry={entry}
                      currentUserId={currentUserId}
                      rank={entry.rank}
                    />
                  ))}
                </div>
              </div>

              {/* Nearby section (if list is long) */}
              {data.leaderboard.length > 8 && myStats && (
                <div className="mt-6">
                  <h3 className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Star className="w-3.5 h-3.5 text-primary-400" /> Players Near You
                  </h3>
                  <div className="bg-surface-900/50 border border-surface-800 rounded-2xl overflow-hidden">
                    {data.nearby.map((entry: any) => (
                      <LeaderboardRow
                        key={entry.userId}
                        entry={entry}
                        currentUserId={currentUserId}
                        rank={entry.rank}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="w-72 xl:w-80 border-l border-surface-800 bg-surface-900/20 flex flex-col overflow-y-auto custom-scrollbar hidden lg:flex shrink-0">
        <div className="p-5 border-b border-surface-800">
          <h2 className="text-xs font-bold text-surface-400 uppercase tracking-wider">Your Performance</h2>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-surface-600" />
          </div>
        ) : myStats ? (
          <div className="p-5 space-y-5">

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Rank"     value={`#${myStats.rank}`}          icon={Trophy}  color="bg-amber-400/10 text-amber-400" />
              <StatCard label="Score"    value={myStats.score.toLocaleString()} icon={Zap}    color="bg-violet-400/10 text-violet-400" />
              <StatCard label="Accuracy" value={`${myStats.accuracy}%`}       icon={Target}  color="bg-blue-400/10 text-blue-400" />
              <StatCard label="Streak"   value={`${myStats.streak}d`}          icon={Flame}   color="bg-orange-400/10 text-orange-400" />
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-surface-400">Score Progress</p>
                <p className="text-xs text-surface-500">vs. avg</p>
              </div>
              <div className="h-2 bg-surface-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-700"
                  style={{ width: `${Math.min(100, (myStats.score / (data.leaderboard[0]?.score || 1)) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-surface-600 mt-1">
                {Math.round((myStats.score / (data.leaderboard[0]?.score || 1)) * 100)}% of top score
              </p>
            </div>

            {/* Rank change hint */}
            <div className="bg-surface-800/50 border border-surface-700 rounded-xl p-3">
              <p className="text-xs font-semibold text-surface-300 mb-1 flex items-center gap-1.5">
                {myStats.rank <= 3 ? (
                  <><ChevronUp className="w-3.5 h-3.5 text-emerald-400" /> Top Performer</>
                ) : (
                  <><ChevronUp className="w-3.5 h-3.5 text-primary-400" /> Climb the Ranks</>
                )}
              </p>
              {myStats.rank > 1 && data.leaderboard[myStats.rank - 2] && (
                <p className="text-xs text-surface-400">
                  Need <span className="text-primary-300 font-semibold">
                    {data.leaderboard[myStats.rank - 2].score - myStats.score} pts
                  </span> more to overtake #{myStats.rank - 1}
                </p>
              )}
            </div>

            {/* Badges */}
            {myStats.badges?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">Badges Earned</p>
                <div className="flex flex-wrap gap-2">
                  {myStats.badges.map((b: any) => (
                    <span key={b.id} className={`px-2.5 py-1 rounded-lg bg-surface-800 border border-surface-700 text-xs font-semibold ${b.color}`}>
                      {b.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            <div>
              <p className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">How to Improve</p>
              <div className="space-y-2">
                {suggestions.map((s, i) => (
                  <div key={i} className="flex gap-2 p-3 bg-surface-800/50 border border-surface-700 rounded-xl">
                    <Zap className="w-3.5 h-3.5 text-primary-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-surface-300 leading-relaxed">{s}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <Trophy className="w-10 h-10 text-surface-700 mb-3" />
            <p className="text-sm text-surface-400 font-medium">Not ranked yet</p>
            <p className="text-xs text-surface-600 mt-1">Complete at least one quiz to appear on the leaderboard.</p>
          </div>
        )}
      </div>
    </div>
  )
}
