import { useState } from 'react'
import { 
  Sparkles, SlidersHorizontal, BookOpen, Brain, 
  Layers, CheckCircle2, Circle, Clock, Flame, ShieldAlert 
} from 'lucide-react'

// Mock Data
const MOCK_TASKS = [
  { id: '1', title: 'Revise: Newton\'s Laws', type: 'revise', subject: 'Physics', duration: '20 min', source: 'auto', difficulty: 'medium', status: 'pending', date: 'Today' },
  { id: '2', title: 'Calculus Derivatives Quiz', type: 'quiz', subject: 'Math', duration: '15 min', source: 'auto', difficulty: 'hard', status: 'completed', date: 'Today' },
  { id: '3', title: 'Master 20 CS Terms', type: 'flashcards', subject: 'Computer Science', duration: '10 min', source: 'custom', difficulty: 'easy', status: 'pending', date: 'Today' },
  { id: '4', title: 'Practice Set: Kinematics', type: 'practice', subject: 'Physics', duration: '30 min', source: 'auto', difficulty: 'hard', status: 'pending', date: 'Tomorrow' },
]

const WEAK_TOPICS = [
  { subject: 'Physics', topic: 'Kinematics', score: '45%' },
  { subject: 'Math', topic: 'Derivatives', score: '52%' },
]

export default function StudyPlanPage() {
  const [planType, setPlanType] = useState<'auto' | 'custom'>('auto')
  const [tasks, setTasks] = useState(MOCK_TASKS)

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t))
  }

  const completionRate = Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) || 0

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] bg-surface-950 animate-fade-in">
      
      {/* Left: Task Timeline (65%) */}
      <div className="flex-1 p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-surface-800">
        <div className="max-w-3xl mx-auto">
          
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-surface-50">Study Plan</h1>
              <p className="text-sm text-surface-400 mt-1">Execute your optimized daily learning path.</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 rounded-lg bg-surface-900 border border-surface-800 text-surface-200 text-sm font-medium hover:bg-surface-800 transition-colors flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" /> Plan Settings
              </button>
            </div>
          </header>

          <PlanSwitcher planType={planType} setPlanType={setPlanType} />

          <div className="mt-8 space-y-8">
            <TaskList 
              title="Today's Objectives" 
              tasks={tasks.filter(t => t.date === 'Today')} 
              onToggle={toggleTask} 
            />
            <TaskList 
              title="Upcoming" 
              tasks={tasks.filter(t => t.date === 'Tomorrow')} 
              onToggle={toggleTask} 
            />
          </div>

        </div>
      </div>

      {/* Right: Insights Panel (35%) */}
      <div className="w-full lg:w-[400px] xl:w-[480px] bg-surface-900/30 p-8 flex flex-col shrink-0 overflow-y-auto">
        <h3 className="text-sm font-semibold text-surface-50 mb-6 tracking-wide uppercase">Plan Insights</h3>
        
        <div className="space-y-6">
          <ProgressCard rate={completionRate} total={tasks.length} completed={tasks.filter(t => t.status === 'completed').length} />
          
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <h4 className="text-sm font-medium text-surface-200">Weak Areas Addressed</h4>
            </div>
            <div className="space-y-3">
              {WEAK_TOPICS.map((topic, i) => (
                <WeakAreaCard key={i} {...topic} />
              ))}
            </div>
          </div>

          <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 mt-4">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-5 h-5 text-primary-400" />
              <h4 className="text-sm font-medium text-surface-100">Auto-Plan Logic Active</h4>
            </div>
            <p className="text-xs text-surface-400 leading-relaxed">
              Your plan prioritizes quizzes for weak topics, spaced repetition flashcards for repeated failures, and revision blocks for recent lectures.
            </p>
            <button className="mt-4 w-full py-2 bg-surface-800 text-surface-200 text-xs font-semibold rounded-lg hover:bg-surface-700 transition-colors">
              Regenerate Plan
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}

function PlanSwitcher({ planType, setPlanType }: { planType: string, setPlanType: (type: 'auto' | 'custom') => void }) {
  return (
    <div className="flex bg-surface-900 border border-surface-800 p-1 rounded-xl w-full max-w-sm">
      <button 
        onClick={() => setPlanType('auto')}
        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
          planType === 'auto' ? 'bg-surface-800 text-surface-50 shadow-sm' : 'text-surface-400 hover:text-surface-200'
        }`}
      >
        <Sparkles className="w-4 h-4" /> Auto Plan
      </button>
      <button 
        onClick={() => setPlanType('custom')}
        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
          planType === 'custom' ? 'bg-surface-800 text-surface-50 shadow-sm' : 'text-surface-400 hover:text-surface-200'
        }`}
      >
        <BookOpen className="w-4 h-4" /> Custom Plan
      </button>
    </div>
  )
}

function TaskList({ title, tasks, onToggle }: { title: string, tasks: any[], onToggle: (id: string) => void }) {
  if (tasks.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-wider pl-1 mb-2">{title}</h3>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} onToggle={() => onToggle(task.id)} />
        ))}
      </div>
    </div>
  )
}

function TaskItem({ task, onToggle }: { task: any, onToggle: () => void }) {
  const isDone = task.status === 'completed'
  
  const getIcon = () => {
    switch(task.type) {
      case 'revise': return <BookOpen className="w-4 h-4" />
      case 'quiz': return <Brain className="w-4 h-4" />
      case 'flashcards': return <Layers className="w-4 h-4" />
      case 'practice': return <Flame className="w-4 h-4" />
      default: return <BookOpen className="w-4 h-4" />
    }
  }

  const getTypeColor = () => {
    switch(task.type) {
      case 'revise': return 'bg-blue-500/10 text-blue-400'
      case 'quiz': return 'bg-purple-500/10 text-purple-400'
      case 'flashcards': return 'bg-emerald-500/10 text-emerald-400'
      case 'practice': return 'bg-amber-500/10 text-amber-400'
      default: return 'bg-surface-800 text-surface-300'
    }
  }

  return (
    <div 
      onClick={onToggle}
      className={`group flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
        isDone 
          ? 'bg-surface-900/30 border-surface-800/50 opacity-60 hover:opacity-100' 
          : 'bg-surface-900 border-surface-800 hover:border-surface-700 hover:shadow-sm hover:scale-[1.01]'
      }`}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button className="shrink-0 transition-colors">
          {isDone 
            ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> 
            : <Circle className="w-5 h-5 text-surface-600 group-hover:text-primary-500" />
          }
        </button>

        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-medium truncate transition-colors ${isDone ? 'text-surface-400 line-through' : 'text-surface-100 group-hover:text-primary-100'}`}>
            {task.title}
          </h4>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium tracking-wide flex items-center gap-1.5 ${getTypeColor()}`}>
              {getIcon()} <span className="uppercase">{task.type}</span>
            </span>
            <span className="text-[11px] text-surface-500 font-medium">{task.subject}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:ml-auto pl-9 sm:pl-0">
        {task.source === 'auto' && (
          <div className="flex items-center gap-1.5 text-[10px] text-primary-500/80 font-medium" title="AI Generated Task">
            <Sparkles className="w-3.5 h-3.5" /> Auto
          </div>
        )}
        <div className="flex items-center gap-1.5 text-[11px] text-surface-500 font-medium bg-surface-800/50 px-2.5 py-1 rounded-md">
          <Clock className="w-3.5 h-3.5" /> {task.duration}
        </div>
      </div>
    </div>
  )
}

function ProgressCard({ rate, total, completed }: { rate: number, total: number, completed: number }) {
  return (
    <div className="bg-gradient-to-br from-primary-500/10 to-transparent border border-primary-500/20 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-primary-100">Daily Progress</h4>
        <span className="text-2xl font-bold text-primary-400">{rate}%</span>
      </div>
      <div className="w-full h-2 bg-surface-900 rounded-full overflow-hidden mb-3">
        <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${rate}%` }} />
      </div>
      <p className="text-xs text-primary-300/70 font-medium">{completed} of {total} tasks completed</p>
    </div>
  )
}

function WeakAreaCard({ subject, topic, score }: { subject: string, topic: string, score: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-surface-900 border border-surface-800">
      <div>
        <p className="text-[10px] text-surface-500 font-medium uppercase tracking-wider mb-0.5">{subject}</p>
        <p className="text-sm font-medium text-surface-200">{topic}</p>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-xs font-bold text-amber-500">{score}</span>
        <span className="text-[9px] text-surface-500 uppercase tracking-wide">Accuracy</span>
      </div>
    </div>
  )
}
