import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { notesAPI } from '../../api'

const LANGUAGES = [
  { code: 'en', name: 'English' }, { code: 'es', name: 'Spanish' }, { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' }, { code: 'hi', name: 'Hindi' }, { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' }, { code: 'pt', name: 'Portuguese' }, { code: 'ja', name: 'Japanese' },
]

export default function EditNotes() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [notes, setNotes] = useState<any>(null)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [selectedLangs, setSelectedLangs] = useState<string[]>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (id) notesAPI.get(id).then(n => { setNotes(n); setContent(n.content || '') }).catch(() => navigate('/teacher/notes'))
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    try { await notesAPI.update(id!, content); setMessage('Notes saved!') }
    catch { setMessage('Save failed') }
    finally { setSaving(false); setTimeout(() => setMessage(''), 3000) }
  }

  const handlePublish = async () => {
    setPublishing(true)
    try { await notesAPI.publish(id!); setMessage('Published!'); setNotes((n: any) => ({ ...n, published_at: new Date().toISOString() })) }
    catch { setMessage('Publish failed') }
    finally { setPublishing(false); setTimeout(() => setMessage(''), 3000) }
  }

  const handleTranslate = async () => {
    if (selectedLangs.length === 0) return
    setTranslating(true)
    try { await notesAPI.translate(id!, selectedLangs); setMessage(`Translated to ${selectedLangs.length} languages!`) }
    catch { setMessage('Translation failed') }
    finally { setTranslating(false); setSelectedLangs([]); setTimeout(() => setMessage(''), 3000) }
  }

  const toggleLang = (code: string) => setSelectedLangs(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code])

  if (!notes) return <div className="h-48 shimmer rounded-2xl" />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-50">{notes.title || 'Edit Notes'}</h1>
          <p className="text-surface-400 mt-1">Refine content, translate, and publish</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-surface-700 text-surface-200 text-sm font-semibold hover:bg-surface-600 disabled:opacity-50">
            {saving ? 'Saving…' : '💾 Save'}
          </button>
          <button onClick={handlePublish} disabled={publishing || !!notes.published_at}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-success-500 to-success-600 text-white text-sm font-semibold disabled:opacity-50 shadow-lg">
            {notes.published_at ? '✅ Published' : publishing ? 'Publishing…' : '🚀 Publish'}
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-300 text-sm animate-fade-in">
          {message}
        </div>
      )}

      {/* Editor */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-surface-100 mb-4">Content Editor</h2>
        <textarea value={content} onChange={e => setContent(e.target.value)}
          className="w-full h-96 px-4 py-3 rounded-xl bg-surface-800/80 border border-surface-600/50 text-surface-200 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none text-sm leading-relaxed font-mono"
          placeholder="Edit your structured notes here (supports Markdown)…" />
      </div>

      {/* Translation */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-surface-100 mb-4">🌍 Translate</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {LANGUAGES.filter(l => l.code !== notes.language).map(lang => (
            <button key={lang.code} onClick={() => toggleLang(lang.code)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedLangs.includes(lang.code)
                  ? 'bg-accent-500/20 text-accent-300 border border-accent-500/40'
                  : 'bg-surface-800/60 text-surface-400 border border-surface-600/40 hover:border-surface-500'
              }`}>
              {lang.name}
            </button>
          ))}
        </div>
        <button onClick={handleTranslate} disabled={translating || selectedLangs.length === 0}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-accent-600 to-primary-600 text-white text-sm font-semibold disabled:opacity-50 shadow-lg">
          {translating ? 'Translating…' : `Translate to ${selectedLangs.length} language(s)`}
        </button>
      </div>
    </div>
  )
}
