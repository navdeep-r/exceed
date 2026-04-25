import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { notesAPI } from '../../api'
import { 
  Search, Filter, LayoutGrid, List, 
  Folder, ChevronRight, Clock, BookOpen, Layers
} from 'lucide-react'

export default function NotesList() {
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => { 
    notesAPI.listForStudent().then(setNotes).catch(() => {}).finally(() => setLoading(false)) 
  }, [])

  const filteredNotes = notes.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()))

  if (loading) return <div className="p-8 space-y-6"><div className="h-10 shimmer rounded-lg w-1/3" /><div className="grid grid-cols-3 gap-5">{[1,2,3].map(i => <div key={i} className="h-40 shimmer rounded-xl" />)}</div></div>

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in min-h-screen">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-surface-50">My Sets</h1>
          <p className="text-sm text-surface-400 mt-1">Manage and study all your learning materials.</p>
        </div>
      </div>

      {/* Filter & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-72 group">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-primary-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Search sets..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 bg-surface-900 border border-surface-800 rounded-lg text-sm text-surface-100 placeholder-surface-400 focus:outline-none focus:border-surface-600 transition-colors"
            />
          </div>
          <button className="h-10 px-4 rounded-lg border border-surface-800 bg-surface-900 text-surface-300 text-sm font-medium hover:bg-surface-800/50 hover:text-surface-100 transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>

        <div className="flex items-center bg-surface-900 border border-surface-800 rounded-lg p-1">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-surface-800 text-surface-100' : 'text-surface-500 hover:text-surface-300'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-surface-800 text-surface-100' : 'text-surface-500 hover:text-surface-300'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Grid/List */}
      {filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-surface-800 border-dashed rounded-2xl bg-surface-900/30">
          <div className="w-16 h-16 rounded-full bg-surface-900 border border-surface-800 flex items-center justify-center mb-4">
            <Folder className="w-8 h-8 text-surface-600" />
          </div>
          <h3 className="text-base font-medium text-surface-200">No sets found</h3>
          <p className="text-sm text-surface-500 mt-1">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5' : 'space-y-3'}>
          {filteredNotes.map((n, i) => 
            viewMode === 'grid' ? (
              <SetCard 
                key={n.id}
                id={n.id}
                title={n.title}
                subject={['Physics', 'Computer Science', 'Mathematics'][i % 3]}
                subjectColor={['bg-blue-500/10 text-blue-400', 'bg-purple-500/10 text-purple-400', 'bg-emerald-500/10 text-emerald-400'][i % 3]}
                progress={Math.floor(Math.random() * 60) + 20}
                lastStudied={new Date(n.published_at || Date.now()).toLocaleDateString()}
                itemCount={Math.floor(Math.random() * 20) + 5}
              />
            ) : (
              <SetListItem 
                key={n.id}
                id={n.id}
                title={n.title}
                subject={['Physics', 'Computer Science', 'Mathematics'][i % 3]}
                subjectColor={['bg-blue-500/10 text-blue-400', 'bg-purple-500/10 text-purple-400', 'bg-emerald-500/10 text-emerald-400'][i % 3]}
                progress={Math.floor(Math.random() * 60) + 20}
                lastStudied={new Date(n.published_at || Date.now()).toLocaleDateString()}
                itemCount={Math.floor(Math.random() * 20) + 5}
              />
            )
          )}
        </div>
      )}
    </div>
  )
}

function SetCard({ id, title, subject, subjectColor, progress, lastStudied, itemCount }: any) {
  return (
    <Link to={`/student/notes/${id}`} className="block group">
      <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 hover:bg-surface-800/40 hover:border-surface-700 hover:scale-[1.02] transition-all duration-200 h-full flex flex-col cursor-pointer">
        
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-lg bg-surface-800 border border-surface-700 flex items-center justify-center text-surface-300 group-hover:text-primary-400 transition-colors">
            <Layers className="w-5 h-5" />
          </div>
          <span className={`px-2 py-1 rounded text-[10px] font-medium tracking-wide ${subjectColor}`}>
            {subject}
          </span>
        </div>

        <h3 className="text-sm font-semibold text-surface-100 mb-1 line-clamp-2 group-hover:text-primary-100 transition-colors">{title}</h3>
        
        <div className="flex items-center gap-4 text-[11px] text-surface-500 mb-6 flex-1">
          <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> {itemCount} items</span>
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {lastStudied}</span>
        </div>

        <div>
          <div className="flex items-center justify-between text-[10px] text-surface-500 mb-2">
            <span>Progress</span>
            <span className="font-medium text-surface-200">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

      </div>
    </Link>
  )
}

function SetListItem({ id, title, subject, subjectColor, progress, lastStudied, itemCount }: any) {
  return (
    <Link to={`/student/notes/${id}`} className="block group">
      <div className="bg-surface-900 border border-surface-800 rounded-xl p-4 hover:bg-surface-800/40 hover:border-surface-700 transition-all duration-200 flex items-center gap-6 cursor-pointer">
        
        <div className="w-10 h-10 rounded-lg bg-surface-800 border border-surface-700 flex items-center justify-center text-surface-300 group-hover:text-primary-400 transition-colors shrink-0">
          <Layers className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0 flex items-center justify-between">
          <div className="w-1/3 pr-4">
            <h3 className="text-sm font-semibold text-surface-100 truncate group-hover:text-primary-100 transition-colors">{title}</h3>
            <span className={`mt-1.5 inline-block px-2 py-0.5 rounded text-[10px] font-medium tracking-wide ${subjectColor}`}>
              {subject}
            </span>
          </div>

          <div className="w-1/4 hidden md:flex items-center gap-4 text-[11px] text-surface-500">
            <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> {itemCount} items</span>
          </div>

          <div className="w-1/4 hidden lg:flex items-center gap-4 text-[11px] text-surface-500">
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {lastStudied}</span>
          </div>

          <div className="w-1/3 lg:w-1/4 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-surface-800 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[10px] text-surface-500 font-medium w-6 text-right">{progress}%</span>
          </div>
        </div>

        <div className="text-surface-600 group-hover:text-primary-500 transition-colors">
          <ChevronRight className="w-5 h-5" />
        </div>

      </div>
    </Link>
  )
}
