import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { notesAPI } from '../../api'
import { 
  ArrowLeft, FileText, BrainCircuit, Lightbulb, 
  Settings, Download, Share2, Layers, Play
} from 'lucide-react'

export default function NotesView() {
  const { id } = useParams<{ id: string }>()
  const [notes, setNotes] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'notes' | 'flashcards' | 'quiz' | 'insights'>('notes')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      setLoading(true)
      notesAPI.get(id, 'en').then(setNotes).catch(() => {}).finally(() => setLoading(false))
    }
  }, [id])

  if (loading) return <div className="p-8 space-y-6"><div className="h-40 shimmer rounded-xl" /><div className="h-96 shimmer rounded-xl" /></div>

  const renderMarkdown = (text: string) => {
    return text
      .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-surface-50 mt-6 mb-3">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-surface-50 mt-8 mb-4">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-surface-50 mt-8 mb-4">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-surface-100 font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em class="text-surface-300 italic">$1</em>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-surface-300 my-1.5">$1</li>')
      .replace(/(<li.*<\/li>)/gs, '<ul class="my-4">$1</ul>')
      .replace(/\n\n/g, '</p><p class="text-surface-300 leading-relaxed my-4">')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface-950 animate-fade-in">
      
      {/* Set Header */}
      <div className="bg-surface-900 border-b border-surface-800 px-8 py-6 shrink-0">
        <div className="max-w-5xl mx-auto">
          <Link to="/student/notes" className="inline-flex items-center gap-1.5 text-xs font-medium text-surface-400 hover:text-surface-100 transition-colors mb-4">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Sets
          </Link>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-[10px] font-medium tracking-wide">
                  Computer Science
                </span>
                <span className="text-xs text-surface-500 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> 12 Items
                </span>
              </div>
              <h1 className="text-2xl font-bold text-surface-50 leading-tight">{notes?.title || 'Untitled Set'}</h1>
              <p className="text-sm text-surface-400 mt-2 max-w-2xl">
                Comprehensive study materials generated from the lecture transcript. Review notes, practice with flashcards, or test your knowledge.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button className="p-2 rounded-lg border border-surface-800 text-surface-300 hover:bg-surface-800 hover:text-surface-100 transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg border border-surface-800 text-surface-300 hover:bg-surface-800 hover:text-surface-100 transition-colors">
                <Download className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg border border-surface-800 text-surface-300 hover:bg-surface-800 hover:text-surface-100 transition-colors">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-surface-800 bg-surface-900/50 shrink-0 sticky top-16 z-10 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-8 flex gap-8">
          <TabButton active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} icon={FileText} label="Notes" />
          <TabButton active={activeTab === 'flashcards'} onClick={() => setActiveTab('flashcards')} icon={Layers} label="Flashcards" />
          <TabButton active={activeTab === 'quiz'} onClick={() => setActiveTab('quiz')} icon={BrainCircuit} label="Practice Quiz" />
          <TabButton active={activeTab === 'insights'} onClick={() => setActiveTab('insights')} icon={Lightbulb} label="Insights" />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          {activeTab === 'notes' && (
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-8 shadow-sm">
              <div dangerouslySetInnerHTML={{ __html: renderMarkdown(notes?.content || 'No content available.') }} />
            </div>
          )}

          {activeTab === 'flashcards' && (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-surface-800 border-dashed rounded-2xl bg-surface-900/30">
              <div className="w-16 h-16 rounded-full bg-surface-900 border border-surface-800 flex items-center justify-center mb-4 text-primary-400">
                <Layers className="w-8 h-8" />
              </div>
              <h3 className="text-base font-medium text-surface-50 mb-2">Flashcard Deck Ready</h3>
              <p className="text-sm text-surface-400 max-w-sm mb-6">Master the key concepts from this set using spaced repetition.</p>
              <Link to={`/student/flashcards/${id}`} className="px-6 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors flex items-center gap-2">
                <Play className="w-4 h-4 fill-current" /> Start Review
              </Link>
            </div>
          )}

          {activeTab === 'quiz' && (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-surface-800 border-dashed rounded-2xl bg-surface-900/30">
              <div className="w-16 h-16 rounded-full bg-surface-900 border border-surface-800 flex items-center justify-center mb-4 text-accent-400">
                <BrainCircuit className="w-8 h-8" />
              </div>
              <h3 className="text-base font-medium text-surface-50 mb-2">Practice Quiz</h3>
              <p className="text-sm text-surface-400 max-w-sm mb-6">Test your knowledge with an AI-generated quiz based on these notes.</p>
              <Link to={`/student/quiz`} className="px-6 py-2.5 rounded-lg bg-surface-100 text-surface-900 text-sm font-semibold hover:bg-white transition-colors">
                Start Quiz
              </Link>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-surface-800 border-dashed rounded-2xl bg-surface-900/30">
              <div className="w-16 h-16 rounded-full bg-surface-900 border border-surface-800 flex items-center justify-center mb-4 text-amber-400">
                <Lightbulb className="w-8 h-8" />
              </div>
              <h3 className="text-base font-medium text-surface-50 mb-2">Study Insights</h3>
              <p className="text-sm text-surface-400 max-w-sm mb-6">Complete quizzes and flashcards to generate insights on your weak areas.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 py-4 border-b-2 transition-all duration-200 ${
        active 
          ? 'border-primary-500 text-primary-400 font-medium' 
          : 'border-transparent text-surface-400 hover:text-surface-200'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm">{label}</span>
    </button>
  )
}
