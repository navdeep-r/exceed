import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { notesAPI, aiAPI } from '../../api'
import {
  ArrowLeft, FileText, BrainCircuit, Lightbulb,
  Settings, Download, Share2, Layers, Play, Mic,
  Globe, RotateCcw, ChevronDown, Loader2, CheckCircle2
} from 'lucide-react'
import VoiceMode from './VoiceMode'

// ── Supported languages ──────────────────────────────────────────────────────
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'ar', label: 'Arabic' },
  { code: 'zh', label: 'Chinese (Simplified)' },
  { code: 'ja', label: 'Japanese' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ru', label: 'Russian' },
  { code: 'ko', label: 'Korean' },
  { code: 'it', label: 'Italian' },
  { code: 'nl', label: 'Dutch' },
  { code: 'tr', label: 'Turkish' },
  { code: 'ur', label: 'Urdu' },
  { code: 'bn', label: 'Bengali' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'pl', label: 'Polish' },
  { code: 'sv', label: 'Swedish' },
]

// ── Markdown renderer ─────────────────────────────────────────────────────────
function renderMarkdown(text: string) {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-surface-50 mt-6 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 class="text-lg font-bold text-surface-50 mt-8 mb-4">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 class="text-xl font-bold text-surface-50 mt-8 mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-surface-100 font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em class="text-surface-300 italic">$1</em>')
    .replace(/^- (.+)$/gm,    '<li class="ml-4 list-disc text-surface-300 my-1.5">$1</li>')
    .replace(/(<li.*<\/li>)/gs,'<ul class="my-4">$1</ul>')
    .replace(/\n\n/g, '</p><p class="text-surface-300 leading-relaxed my-4">')
    .replace(/\n/g, '<br/>')
}

// ── Language Selector dropdown ────────────────────────────────────────────────
function LanguageSelector({
  value, onChange, disabled
}: { value: string; onChange: (code: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = LANGUAGES.find(l => l.code === value) || LANGUAGES[0]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
          value !== 'en'
            ? 'border-primary-500/40 bg-primary-500/10 text-primary-300'
            : 'border-surface-700 bg-surface-900 text-surface-300 hover:border-surface-600 hover:text-surface-100'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <Globe className="w-4 h-4" />
        {selected.label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-52 bg-surface-900 border border-surface-800 rounded-xl shadow-2xl overflow-hidden">
          <div className="max-h-72 overflow-y-auto custom-scrollbar py-1">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => { onChange(lang.code); setOpen(false) }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                  value === lang.code
                    ? 'bg-primary-500/10 text-primary-300'
                    : 'text-surface-300 hover:bg-surface-800 hover:text-surface-100'
                }`}
              >
                {lang.label}
                {value === lang.code && <CheckCircle2 className="w-3.5 h-3.5 text-primary-400" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function NotesView() {
  const { id } = useParams<{ id: string }>()
  const [notes, setNotes] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'notes' | 'flashcards' | 'quiz' | 'insights'>('notes')
  const [loading, setLoading] = useState(true)
  const [showVoiceMode, setShowVoiceMode] = useState(false)

  // Translation state
  const [targetLang, setTargetLang] = useState('en')
  const [translating, setTranslating] = useState(false)
  const [translatedContent, setTranslatedContent] = useState<string | null>(null)
  const [translateError, setTranslateError] = useState<string | null>(null)
  const [showOriginal, setShowOriginal] = useState(true)

  useEffect(() => {
    if (id) {
      setLoading(true)
      notesAPI.get(id, 'en').then(setNotes).catch(() => {}).finally(() => setLoading(false))
    }
  }, [id])

  // Trigger translation when language changes (skip English = original)
  useEffect(() => {
    if (targetLang === 'en') {
      setTranslatedContent(null)
      setShowOriginal(true)
      setTranslateError(null)
      return
    }
    if (!notes?.content) return
    translateNotes(targetLang)
  }, [targetLang, notes?.content])

  const translateNotes = async (lang: string) => {
    setTranslating(true)
    setTranslateError(null)
    setShowOriginal(false)
    try {
      const result = await aiAPI.translate(notes.content, lang, 'en')
      setTranslatedContent(result.translatedText)
    } catch (err: any) {
      setTranslateError(err.message || 'Translation failed. Please try again.')
      setShowOriginal(true)
    } finally {
      setTranslating(false)
    }
  }

  const handleLangChange = (code: string) => {
    setTargetLang(code)
    if (code === 'en') {
      setTranslatedContent(null)
      setShowOriginal(true)
    }
  }

  const handleRetranslate = () => translateNotes(targetLang)

  const displayContent = showOriginal ? notes?.content : (translatedContent || notes?.content)
  const isTranslated = !showOriginal && translatedContent && targetLang !== 'en'
  const selectedLangLabel = LANGUAGES.find(l => l.code === targetLang)?.label || 'English'

  if (loading) return <div className="p-8 space-y-6"><div className="h-40 shimmer rounded-xl" /><div className="h-96 shimmer rounded-xl" /></div>

  return (
    <>
      {showVoiceMode && (
        <VoiceMode
          onClose={() => setShowVoiceMode(false)}
          context={notes?.content}
          contextLabel={notes?.title}
        />
      )}

      <div className="flex flex-col min-h-screen bg-surface-950 animate-fade-in">

        {/* ── Set Header ── */}
        <div className="bg-surface-900 border-b border-surface-800 px-8 py-6 shrink-0">
          <div className="max-w-5xl mx-auto">
            <Link to="/student/notes" className="inline-flex items-center gap-1.5 text-xs font-medium text-surface-400 hover:text-surface-100 transition-colors mb-4">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to My Sets
            </Link>

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-[10px] font-medium tracking-wide">
                    Study Notes
                  </span>
                  <span className="text-xs text-surface-500 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> {notes?.content?.split('\n').filter((l: string) => l.startsWith('-')).length || 0} key points
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-surface-50 leading-tight">{notes?.title || 'Untitled Set'}</h1>
                <p className="text-sm text-surface-400 mt-2 max-w-2xl">
                  Comprehensive study materials generated from the lecture transcript. Review notes, practice with flashcards, or test your knowledge.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {/* Voice Mode */}
                <button
                  onClick={() => setShowVoiceMode(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:scale-105 shadow-lg shadow-indigo-500/20"
                  style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}
                >
                  <Mic className="w-4 h-4" /> Ask AI
                </button>

                {/* Language selector */}
                <LanguageSelector
                  value={targetLang}
                  onChange={handleLangChange}
                  disabled={translating}
                />

                <button className="p-2 rounded-lg border border-surface-800 text-surface-300 hover:bg-surface-800 hover:text-surface-100 transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg border border-surface-800 text-surface-300 hover:bg-surface-800 hover:text-surface-100 transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="border-b border-surface-800 bg-surface-900/50 shrink-0 sticky top-16 z-10 backdrop-blur-md">
          <div className="max-w-5xl mx-auto px-8 flex gap-8">
            <TabButton active={activeTab === 'notes'}      onClick={() => setActiveTab('notes')}      icon={FileText}    label="Notes" />
            <TabButton active={activeTab === 'flashcards'} onClick={() => setActiveTab('flashcards')} icon={Layers}      label="Flashcards" />
            <TabButton active={activeTab === 'quiz'}       onClick={() => setActiveTab('quiz')}       icon={BrainCircuit} label="Practice Quiz" />
            <TabButton active={activeTab === 'insights'}   onClick={() => setActiveTab('insights')}   icon={Lightbulb}   label="Insights" />
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 p-8">
          <div className="max-w-5xl mx-auto">

            {activeTab === 'notes' && (
              <>
                {/* Voice Mode prompt strip */}
                <div
                  className="flex items-center justify-between mb-4 px-4 py-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 cursor-pointer hover:bg-indigo-500/10 transition-colors group"
                  onClick={() => setShowVoiceMode(true)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                      <Mic className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-indigo-300">Voice Tutor — ask about this note</p>
                      <p className="text-xs text-surface-500">Talk to your AI tutor and get spoken explanations</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors flex items-center gap-1">
                    <Mic className="w-3 h-3" /> Start
                  </span>
                </div>

                {/* Translation status bar */}
                {targetLang !== 'en' && (
                  <div className={`flex items-center justify-between mb-4 px-4 py-2.5 rounded-xl border text-sm ${
                    translateError
                      ? 'border-red-500/20 bg-red-500/5 text-red-400'
                      : translating
                      ? 'border-primary-500/20 bg-primary-500/5 text-primary-400'
                      : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
                  }`}>
                    <div className="flex items-center gap-2">
                      {translating ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Translating to {selectedLangLabel}…</>
                      ) : translateError ? (
                        <><Globe className="w-4 h-4" /> {translateError}</>
                      ) : (
                        <><CheckCircle2 className="w-4 h-4" /> Translated to {selectedLangLabel}</>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {!translating && !translateError && (
                        <>
                          {/* Original / Translated toggle */}
                          <button
                            onClick={() => setShowOriginal(o => !o)}
                            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-surface-800 border border-surface-700 text-surface-300 hover:text-surface-100 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            {showOriginal ? 'Show Translated' : 'Show Original'}
                          </button>
                        </>
                      )}
                      {translateError && (
                        <button
                          onClick={handleRetranslate}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-surface-800 border border-surface-700 text-surface-300 hover:text-surface-100 transition-colors"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes content */}
                <div className="bg-surface-900 border border-surface-800 rounded-xl p-8 shadow-sm">
                  {translating ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                      <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
                      </div>
                      <p className="text-sm text-surface-300 font-medium">Translating to {selectedLangLabel}…</p>
                      <p className="text-xs text-surface-500">Preserving formatting and technical terms</p>
                    </div>
                  ) : (
                    <div
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(displayContent || 'No content available.') }}
                      dir={['ar', 'ur', 'he', 'fa'].includes(targetLang) && !showOriginal ? 'rtl' : 'ltr'}
                      className={['ar', 'ur', 'he', 'fa'].includes(targetLang) && !showOriginal ? 'text-right' : ''}
                    />
                  )}
                </div>

                {/* Language quick-switch strip (visible when English) */}
                {targetLang === 'en' && (
                  <div className="mt-4 flex items-center gap-3 px-1">
                    <Globe className="w-3.5 h-3.5 text-surface-500 shrink-0" />
                    <p className="text-xs text-surface-500 shrink-0">Translate to:</p>
                    <div className="flex gap-2 flex-wrap">
                      {['hi', 'es', 'fr', 'ar', 'zh', 'de', 'ur', 'pt'].map(code => {
                        const lang = LANGUAGES.find(l => l.code === code)!
                        return (
                          <button
                            key={code}
                            onClick={() => handleLangChange(code)}
                            className="px-2.5 py-1 rounded-lg border border-surface-800 bg-surface-900 text-[10px] font-medium text-surface-400 hover:text-surface-200 hover:border-surface-700 transition-colors"
                          >
                            {lang.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'flashcards' && (
              <div className="flex flex-col items-center justify-center py-20 text-center border border-surface-800 border-dashed rounded-2xl bg-surface-900/30">
                <div className="w-16 h-16 rounded-full bg-surface-900 border border-surface-800 flex items-center justify-center mb-4 text-primary-400">
                  <Layers className="w-8 h-8" />
                </div>
                <h3 className="text-base font-medium text-surface-50 mb-2">Flashcard Deck</h3>
                <p className="text-sm text-surface-400 max-w-sm mb-6">Master the key concepts from this set using spaced repetition. Cards are auto-generated from note content.</p>
                <Link to={`/student/flashcards/${notes?.id || id}`} className="px-6 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors flex items-center gap-2">
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
                <Link to="/student/quiz" className="px-6 py-2.5 rounded-lg bg-surface-100 text-surface-900 text-sm font-semibold hover:bg-white transition-colors">
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
    </>
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
