import { useState, useEffect } from 'react'
import { plannerAPI } from '../../api'
import { 
  ChevronLeft, ChevronRight, CheckCircle2, Circle, 
  Plus, Calendar as CalendarIcon, Clock, Sparkles
} from 'lucide-react'

// Dummy tasks for the mock calendar
const MOCK_TASKS = [
  { id: '1', title: 'Review Physics Chapter 4', type: 'review', subject: 'Physics', duration: '30m', status: 'pending', source: 'auto', date: new Date().toISOString().split('T')[0] },
  { id: '2', title: 'Calculus Practice Quiz', type: 'quiz', subject: 'Mathematics', duration: '15m', status: 'completed', source: 'auto', date: new Date().toISOString().split('T')[0] },
  { id: '3', title: 'Read assigned essay', type: 'reading', subject: 'Literature', duration: '45m', status: 'pending', source: 'custom', date: new Date().toISOString().split('T')[0] },
]

export default function PlannerPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real app, we'd fetch tasks for the specific month/date.
    plannerAPI.get().catch(() => []).finally(() => {
      setTasks(MOCK_TASKS)
      setLoading(false)
    })
  }, [])

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t))
  }

  const completionRate = tasks.length === 0 ? 0 : Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)

  // Calendar logic
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()
    return { daysInMonth, startingDay }
  }

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth)
  const days = Array.from({ length: 42 }, (_, i) => {
    const dayNumber = i - startingDay + 1
    if (dayNumber > 0 && dayNumber <= daysInMonth) return dayNumber
    return null
  })

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))

  const isToday = (day: number) => {
    const today = new Date()
    return day === today.getDate() && currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear()
  }

  const isSelected = (day: number) => {
    return day === selectedDate.getDate() && currentMonth.getMonth() === selectedDate.getMonth() && currentMonth.getFullYear() === selectedDate.getFullYear()
  }

  if (loading) return <div className="p-8"><div className="h-96 shimmer rounded-xl" /></div>

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] bg-surface-950 animate-fade-in">
      
      {/* Left: Calendar Grid */}
      <div className="flex-1 p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-surface-800">
        <div className="max-w-2xl mx-auto">
          
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-surface-50">Planner</h1>
              <p className="text-sm text-surface-400 mt-1">Manage your study schedule and auto-generated tasks.</p>
            </div>
            <div className="flex items-center gap-2 bg-surface-900 border border-surface-800 rounded-lg p-1">
              <button onClick={prevMonth} className="p-1.5 rounded-md text-surface-400 hover:text-surface-100 hover:bg-surface-800 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-surface-200 min-w-[120px] text-center">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button onClick={nextMonth} className="p-1.5 rounded-md text-surface-400 hover:text-surface-100 hover:bg-surface-800 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-surface-900/50 border border-surface-800 rounded-2xl p-6 shadow-sm">
            {/* Days of week */}
            <div className="grid grid-cols-7 gap-2 mb-4 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-xs font-semibold text-surface-500 uppercase tracking-wider">{d}</div>
              ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, i) => (
                <CalendarDay 
                  key={i} 
                  day={day} 
                  isToday={day ? isToday(day) : false} 
                  isSelected={day ? isSelected(day) : false}
                  hasTasks={day === new Date().getDate()} // Mock logic
                  onClick={() => day && setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Task Panel (30-40%) */}
      <div className="w-full lg:w-[400px] xl:w-[480px] bg-surface-900/30 p-8 lg:p-10 flex flex-col shrink-0">
        
        <ProgressHeader 
          date={selectedDate} 
          completionRate={completionRate} 
          totalTasks={tasks.length} 
        />

        <div className="flex items-center justify-between mt-8 mb-4">
          <h3 className="text-sm font-semibold text-surface-200 uppercase tracking-wider">Schedule</h3>
          <button className="p-1.5 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 -mx-2 px-2 custom-scrollbar">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center border border-surface-800 border-dashed rounded-xl bg-surface-900/50 mt-4">
              <CalendarIcon className="w-8 h-8 text-surface-600 mb-3" />
              <p className="text-sm font-medium text-surface-300">No tasks scheduled</p>
              <p className="text-xs text-surface-500 mt-1">Take a break, or add a custom task.</p>
            </div>
          ) : (
            tasks.map(task => (
              <TaskItem key={task.id} task={task} onToggle={() => toggleTask(task.id)} />
            ))
          )}
        </div>

      </div>
    </div>
  )
}

function CalendarDay({ day, isToday, isSelected, hasTasks, onClick }: any) {
  if (!day) return <div className="h-14 md:h-16 rounded-xl" />
  
  return (
    <button 
      onClick={onClick}
      className={`h-14 md:h-16 rounded-xl flex flex-col items-center justify-center relative transition-all duration-200 border ${
        isSelected 
          ? 'bg-primary-500/10 border-primary-500/50 text-primary-100 shadow-sm' 
          : isToday
            ? 'bg-surface-800/80 border-surface-700 text-surface-50'
            : 'bg-transparent border-transparent hover:bg-surface-800/40 text-surface-300 hover:text-surface-100'
      }`}
    >
      <span className={`text-sm font-medium ${isToday && !isSelected ? 'text-surface-50' : ''}`}>{day}</span>
      {hasTasks && (
        <div className="absolute bottom-2 md:bottom-3 flex gap-1">
          <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-primary-400' : 'bg-surface-500'}`} />
          <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-primary-400' : 'bg-surface-500'}`} />
        </div>
      )}
    </button>
  )
}

function ProgressHeader({ date, completionRate, totalTasks }: any) {
  const isToday = date.toDateString() === new Date().toDateString()
  const dateString = isToday ? "Today" : date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  return (
    <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-sm">
      <h2 className="text-xl font-bold text-surface-50 mb-1">{dateString}</h2>
      <p className="text-sm text-surface-400 mb-6">{totalTasks} tasks planned</p>
      
      <div className="flex items-center justify-between text-xs font-medium text-surface-300 mb-2">
        <span>Daily Progress</span>
        <span className={completionRate === 100 ? 'text-emerald-400' : 'text-surface-200'}>{completionRate}%</span>
      </div>
      <div className="w-full h-2 bg-surface-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500" 
          style={{ width: `${completionRate}%` }} 
        />
      </div>
    </div>
  )
}

function TaskItem({ task, onToggle }: any) {
  const isCompleted = task.status === 'completed'

  return (
    <div className={`group flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
      isCompleted 
        ? 'bg-surface-900/30 border-surface-800/50 opacity-60 hover:opacity-100' 
        : 'bg-surface-900 border-surface-800 hover:border-surface-700 hover:shadow-sm'
    }`} onClick={onToggle}>
      
      <button className="mt-0.5 shrink-0 transition-colors">
        {isCompleted 
          ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> 
          : <Circle className="w-5 h-5 text-surface-600 group-hover:text-primary-500" />
        }
      </button>

      <div className="flex-1 min-w-0">
        <h4 className={`text-sm font-medium truncate transition-colors ${isCompleted ? 'text-surface-400 line-through' : 'text-surface-100 group-hover:text-primary-100'}`}>
          {task.title}
        </h4>
        
        <div className="flex items-center gap-3 mt-1.5">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide ${
            task.subject === 'Physics' ? 'bg-blue-500/10 text-blue-400' :
            task.subject === 'Mathematics' ? 'bg-purple-500/10 text-purple-400' :
            'bg-amber-500/10 text-amber-400'
          }`}>
            {task.subject}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-surface-500">
            <Clock className="w-3 h-3" /> {task.duration}
          </span>
        </div>
      </div>

      {task.source === 'auto' && (
        <div className="shrink-0 text-primary-500/70 group-hover:text-primary-400 transition-colors" title="AI Generated Task">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      )}
    </div>
  )
}
