import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { lecturesAPI } from '../../api'

export default function RecordLecture() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [transcript, setTranscript] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [step, setStep] = useState<'record' | 'transcribe' | 'done'>('record')
  const [error, setError] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const recognitionRef = useRef<any>(null)

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${min}:${sec}`
  }

  const startRecording = useCallback(async () => {
    try {
      setError('')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach(t => t.stop())
      }

      mediaRecorder.start(250)
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      setElapsed(0)

      timerRef.current = window.setInterval(() => {
        setElapsed(e => e + 1)
      }, 1000)

      // Start live transcription via Web Speech API
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'
        recognition.onresult = (event: any) => {
          let finalText = ''
          for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalText += event.results[i][0].transcript + ' '
            }
          }
          if (finalText) setTranscript(prev => prev + finalText)
        }
        recognition.onerror = () => {} // silent fallback
        recognition.start()
        recognitionRef.current = recognition
      }
    } catch (err: any) {
      setError('Microphone access denied. Please allow microphone permissions.')
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) clearInterval(timerRef.current)
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsRecording(false)
    setIsPaused(false)
    setStep('transcribe')
  }, [])

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Please enter a lecture title')
      return
    }
    setIsTranscribing(true)
    setError('')
    try {
      const lecture = await lecturesAPI.create({ title, audioBlob: audioBlob || undefined })
      if (transcript.trim()) {
        await lecturesAPI.transcribe(lecture.id, transcript)
      }
      setStep('done')
    } catch (err: any) {
      setError(err.message || 'Failed to save lecture')
    } finally {
      setIsTranscribing(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-surface-50">Record Lecture</h1>
        <p className="text-surface-400 mt-1">Capture audio and generate a transcript automatically</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm">
          {error}
        </div>
      )}

      {/* Title input */}
      <div className="glass rounded-2xl p-6">
        <label className="block text-sm font-medium text-surface-300 mb-2">Lecture Title</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g., Introduction to Machine Learning"
          className="w-full px-4 py-3 rounded-xl bg-surface-800/80 border border-surface-600/50 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
        />
      </div>

      {/* Recording panel */}
      <div className="glass rounded-2xl p-8">
        <div className="flex flex-col items-center">
          {/* Recording visualization */}
          <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${
            isRecording
              ? 'bg-danger-500/20 border-2 border-danger-400 animate-recording'
              : audioBlob
                ? 'bg-success-500/20 border-2 border-success-400'
                : 'bg-surface-800 border-2 border-surface-600'
          }`}>
            <span className="text-5xl">
              {isRecording ? '🔴' : audioBlob ? '✅' : '🎙️'}
            </span>
          </div>

          {/* Timer */}
          <p className="text-4xl font-mono font-bold text-surface-100 mb-6 tracking-wider">
            {formatTime(elapsed)}
          </p>

          {/* Controls */}
          <div className="flex gap-4">
            {!isRecording && !audioBlob && (
              <button onClick={startRecording}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-danger-500 to-danger-600 text-white font-semibold hover:from-danger-400 hover:to-danger-500 transition-all shadow-lg shadow-danger-500/25">
                Start Recording
              </button>
            )}
            {isRecording && (
              <button onClick={stopRecording}
                className="px-8 py-3 rounded-xl bg-surface-700 text-surface-200 font-semibold hover:bg-surface-600 transition-all">
                ⏹ Stop Recording
              </button>
            )}
            {audioBlob && !isRecording && (
              <>
                <button onClick={() => { setAudioBlob(null); setTranscript(''); setStep('record'); setElapsed(0) }}
                  className="px-6 py-3 rounded-xl bg-surface-700 text-surface-200 font-semibold hover:bg-surface-600 transition-all">
                  🔄 Re-record
                </button>
                <button onClick={handleSave} disabled={isTranscribing}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold hover:from-primary-500 hover:to-primary-400 transition-all shadow-lg shadow-primary-500/25 disabled:opacity-50">
                  {isTranscribing ? 'Saving…' : '💾 Save & Process'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Live transcript */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-surface-100">Live Transcript</h2>
          {isRecording && <span className="flex items-center gap-2 text-xs text-danger-400"><span className="w-2 h-2 bg-danger-400 rounded-full animate-pulse" /> Listening…</span>}
        </div>
        <textarea
          value={transcript}
          onChange={e => setTranscript(e.target.value)}
          placeholder={isRecording ? 'Speak into your microphone — transcript will appear here…' : 'Transcript will appear here after recording, or type/paste manually…'}
          className="w-full h-48 px-4 py-3 rounded-xl bg-surface-800/80 border border-surface-600/50 text-surface-200 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none text-sm leading-relaxed transition-all"
        />
      </div>

      {step === 'done' && (
        <div className="glass rounded-2xl p-6 border border-success-500/30 glow-primary animate-slide-up">
          <div className="flex items-center gap-4">
            <span className="text-4xl">🎉</span>
            <div>
              <h3 className="text-lg font-semibold text-success-400">Lecture Saved!</h3>
              <p className="text-sm text-surface-400">Head to Notes to refine and publish your content.</p>
            </div>
            <button onClick={() => navigate('/teacher/notes')}
              className="ml-auto px-6 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-500 transition-colors">
              Go to Notes →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
