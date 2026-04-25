import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { progressAPI, notesAPI, plannerAPI } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { 
  Zap, BrainCircuit, Clock, Target, 
  ChevronRight, CheckCircle2, Circle, 
  Flame, Award, Shield, Timer
} from 'lucide-react'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [progress, setProgress] = useState<any>(null)
  const [recentNotes, setRecentNotes] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      progressAPI.get().catch(() => ({ total_xp: 0, level: 1, notes_viewed: 0, quizzes_completed: 0, flashcards_reviewed: 0, average_quiz_score: 0 })),
      notesAPI.listForStudent().catch(() => []),
      plannerAPI.get().catch(() => []),
    ]).then(([p, n, t]) => {
      setProgress(p); setRecentNotes(n.slice(0, 3)); setTasks(t.filter((x: any) => !x.completed).slice(0, 4)); setLoading(false)
    })
  }, [])

  if (loading) return <div className="p-8 space-y-6"><div className="h-10 shimmer rounded-lg w-1/3" /><div className="grid grid-cols-4 gap-5">{[1,2,3,4].map(i => <div key={i} className="h-28 shimmer rounded-xl" />)}</div></div>

  const p = progress || {}

  return (
    <div className="flex w-full min-h-full">
      {/* Main Content (70%) */}
      <div className="flex-1 p-8 lg:pr-10 lg:w-[70%] max-w-5xl space-y-10 animate-fade-in">
        
        {/* Welcome Section */}
        <section>
          <h1 className="text-2xl font-semibold text-surface-50">Welcome back, {user?.firstName}</h1>
          <p className="text-surface-400 mt-1 text-sm">Ready to continue your learning journey?</p>
        </section>

        {/* Stats Cards (4 Grid) */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard title="XP This Week" value={p.total_xp || 0} delta="+120" deltaPositive icon={<Zap className="w-4 h-4 text-primary-400" />} />
          <StatCard title="Quizzes Completed" value={p.quizzes_completed || 0} delta="+2" deltaPositive icon={<BrainCircuit className="w-4 h-4 text-accent-400" />} />
          <StatCard title="Study Time" value="4h 20m" delta="+45m" deltaPositive icon={<Clock className="w-4 h-4 text-emerald-400" />} />
          <StatCard title="Accuracy" value={`${p.average_quiz_score || 0}%`} delta="-2%" deltaPositive={false} icon={<Target className="w-4 h-4 text-amber-400" />} />
        </section>

        {/* Continue Learning */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-surface-50">Continue Learning</h2>
            <button className="text-xs font-medium text-surface-400 hover:text-surface-100 transition-colors flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {recentNotes.length > 0 ? recentNotes.map((n, i) => (
              <LearningCard 
                key={n.id}
                tag={i === 0 ? 'Physics' : i === 1 ? 'Computer Science' : 'Mathematics'}
                tagColor={i === 0 ? 'bg-blue-500/10 text-blue-400' : i === 1 ? 'bg-purple-500/10 text-purple-400' : 'bg-emerald-500/10 text-emerald-400'}
                title={n.title}
                subtitle="Chapter Overview"
                progress={Math.floor(Math.random() * 60) + 20}
                lastStudied="2 hours ago"
              />
            )) : (
              <div className="col-span-3 text-center py-10 bg-surface-900 border border-surface-800 rounded-xl">
                <p className="text-sm text-surface-400">No recent study materials found.</p>
              </div>
            )}
          </div>
        </section>

        {/* Today's Plan */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-surface-50">Today's Plan</h2>
          </div>
          <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
            <div className="divide-y divide-surface-800/50">
              {tasks.length > 0 ? tasks.map((t, i) => (
                <TaskItem 
                  key={t.id}
                  time={['10:00 AM', '02:30 PM', '05:00 PM', '08:00 PM'][i % 4]}
                  title={t.title}
                  tag={t.type === 'quiz' ? 'Practice' : 'Review'}
                  duration="20 min"
                />
              )) : (
                <div className="p-6 text-center">
                  <p className="text-sm text-surface-400">Your schedule is clear for today.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Right Panel (30%) */}
      <div className="hidden lg:block w-[30%] min-w-[320px] max-w-[400px] bg-surface-900/50 border-l border-surface-800 p-8 space-y-10">
        
        {/* Daily Goals */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-surface-50">Daily Goals</h2>
            <button className="text-[11px] font-medium text-surface-400 hover:text-surface-100 transition-colors">Edit goals</button>
          </div>
          <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 space-y-5">
            <GoalProgress label="Study Time" current="1h 20m" target="2h" percent={66} color="bg-blue-500" />
            <GoalProgress label="Quizzes" current="2" target="3" percent={66} color="bg-purple-500" />
            <GoalProgress label="Accuracy" current="85%" target="90%" percent={94} color="bg-emerald-500" />
          </div>
        </section>

        {/* Badges */}
        <section>
          <h2 className="text-sm font-semibold text-surface-50 mb-5">Recent Badges</h2>
          <div className="grid grid-cols-3 gap-3">
            <BadgeCard icon={<Flame className="w-5 h-5 text-amber-500" />} title="7 Day Streak" />
            <BadgeCard icon={<Award className="w-5 h-5 text-blue-500" />} title="Top 10%" />
            <BadgeCard icon={<Shield className="w-5 h-5 text-emerald-500" />} title="Flawless" />
          </div>
        </section>

        {/* Minimal Calendar Widget */}
        <section>
          <h2 className="text-sm font-semibold text-surface-50 mb-5">April 2026</h2>
          <div className="bg-surface-900 border border-surface-800 rounded-xl p-5">
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-surface-500 mb-3">
              <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              <div className="p-1.5 text-surface-600">29</div><div className="p-1.5 text-surface-600">30</div><div className="p-1.5 text-surface-600">31</div>
              <div className="p-1.5 text-surface-300">1</div><div className="p-1.5 text-surface-300">2</div><div className="p-1.5 text-surface-300">3</div><div className="p-1.5 text-surface-300">4</div>
              <div className="p-1.5 text-surface-300">5</div><div className="p-1.5 text-surface-300">6</div><div className="p-1.5 text-surface-300">7</div><div className="p-1.5 text-surface-300">8</div><div className="p-1.5 text-surface-300">9</div><div className="p-1.5 text-surface-300">10</div><div className="p-1.5 text-surface-300">11</div>
              <div className="p-1.5 text-surface-300">12</div><div className="p-1.5 text-surface-300">13</div><div className="p-1.5 text-surface-300">14</div><div className="p-1.5 text-surface-300">15</div><div className="p-1.5 text-surface-300">16</div><div className="p-1.5 text-surface-300">17</div><div className="p-1.5 text-surface-300">18</div>
              <div className="p-1.5 text-surface-300">19</div><div className="p-1.5 text-surface-300">20</div><div className="p-1.5 text-surface-300">21</div><div className="p-1.5 text-surface-300">22</div><div className="p-1.5 text-surface-300">23</div><div className="p-1.5 text-surface-300">24</div>
              <div className="p-1.5 bg-primary-500/20 text-primary-300 rounded-md font-semibold">25</div><div className="p-1.5 text-surface-300">26</div><div className="p-1.5 text-surface-300">27</div><div className="p-1.5 text-surface-300">28</div><div className="p-1.5 text-surface-300">29</div><div className="p-1.5 text-surface-300">30</div>
            </div>
          </div>
        </section>

        {/* Focus Mode Card */}
        <section>
          <div className="bg-gradient-to-br from-surface-800 to-surface-900 border border-surface-700 rounded-xl p-6 relative overflow-hidden group hover:border-surface-600 transition-colors cursor-pointer">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Timer className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Timer className="w-4 h-4 text-surface-200" />
                <h3 className="text-sm font-semibold text-surface-100">Focus Mode</h3>
              </div>
              <p className="text-xs text-surface-400 leading-relaxed mb-4 max-w-[200px]">
                Block distractions and track your deep work sessions.
              </p>
              <button className="px-4 py-2 bg-surface-100 text-surface-900 text-xs font-semibold rounded-lg hover:bg-white transition-colors">
                Start Session
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}

function StatCard({ title, value, delta, deltaPositive, icon }: { title: string, value: string | number, delta: string, deltaPositive: boolean, icon: React.ReactNode }) {
  return (
    <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 hover:bg-surface-800/50 hover:scale-[1.02] transition-all duration-200 cursor-default">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-surface-400">{title}</h3>
        <div className="p-1.5 bg-surface-800 rounded-lg">{icon}</div>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-semibold text-surface-100 tracking-tight">{value}</p>
        <span className={`text-[11px] font-medium ${deltaPositive ? 'text-emerald-400' : 'text-amber-400'}`}>
          {delta}
        </span>
      </div>
    </div>
  )
}

function LearningCard({ tag, tagColor, title, subtitle, progress, lastStudied }: { tag: string, tagColor: string, title: string, subtitle: string, progress: number, lastStudied: string }) {
  return (
    <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 flex flex-col hover:bg-surface-800/50 hover:border-surface-700 hover:scale-[1.02] transition-all duration-200 cursor-pointer">
      <div className="mb-4 flex items-start justify-between">
        <span className={`px-2 py-1 rounded text-[10px] font-medium tracking-wide ${tagColor}`}>
          {tag}
        </span>
      </div>
      <h3 className="text-sm font-semibold text-surface-100 mb-1 line-clamp-1">{title}</h3>
      <p className="text-xs text-surface-400 mb-6 flex-1">{subtitle}</p>
      
      <div>
        <div className="w-full h-1 bg-surface-800 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-primary-500 rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between text-[10px] text-surface-500">
          <span>{lastStudied}</span>
          <span className="font-medium text-surface-300">{progress}%</span>
        </div>
      </div>
    </div>
  )
}

function TaskItem({ time, title, tag, duration }: { time: string, title: string, tag: string, duration: string }) {
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-surface-800/30 transition-colors cursor-pointer group">
      <span className="text-xs font-medium text-surface-400 w-16 shrink-0">{time}</span>
      <div className="text-surface-600 group-hover:text-primary-500 transition-colors">
        <Circle className="w-4 h-4" />
      </div>
      <p className="text-sm font-medium text-surface-200 flex-1 truncate">{title}</p>
      <span className="px-2 py-1 bg-surface-800 rounded text-[10px] text-surface-300 hidden sm:block">{tag}</span>
      <span className="text-xs text-surface-500 w-12 text-right">{duration}</span>
    </div>
  )
}

function GoalProgress({ label, current, target, percent, color }: { label: string, current: string, target: string, percent: number, color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="font-medium text-surface-200">{label}</span>
        <span className="text-surface-400">{current} <span className="text-surface-600">/</span> {target}</span>
      </div>
      <div className="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function BadgeCard({ icon, title }: { icon: React.ReactNode, title: string }) {
  return (
    <div className="bg-surface-900 border border-surface-800 rounded-xl p-4 flex flex-col items-center text-center hover:bg-surface-800/50 transition-colors cursor-default">
      <div className="w-10 h-10 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center mb-2">
        {icon}
      </div>
      <p className="text-[10px] font-medium text-surface-200">{title}</p>
    </div>
  )
}
