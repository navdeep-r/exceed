import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { lecturesAPI } from '../../api'
import {
  Mic,
  MicOff,
  Square,
  Pause,
  Play,
  RotateCcw,
  Save,
  ArrowRight,
  Activity,
  Radio,
  Volume2,
  HardDrive,
  Clock,
  CheckCircle2,
  AlertCircle,
  Waves
} from 'lucide-react'

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
  const [micLevel, setMicLevel] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const recognitionRef = useRef<any>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number | null>(null)

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0')
    const min = Math.floor((s % 3600) / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${h}:${min}:${sec}`
  }

  const monitorMicLevel = useCallback((stream: MediaStream) => {
    const audioCtx = new AudioContext()
    const source = audioCtx.createMediaStreamSource(stream)
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)
    analyserRef.current = analyser

    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    const tick = () => {
      analyser.getByteFrequencyData(dataArray)
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
      setMicLevel(Math.min(100, (avg / 128) * 100))
      animFrameRef.current = requestAnimationFrame(tick)
    }
    tick()
  }, [])

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
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      }

      mediaRecorder.start(250)
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      setElapsed(0)
      monitorMicLevel(stream)

      timerRef.current = window.setInterval(() => {
        setElapsed(e => e + 1)
      }, 1000)

      // Web Speech API
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
        recognition.onerror = () => {}
        recognition.start()
        recognitionRef.current = recognition
      }
    } catch (err: any) {
      setError('Microphone access denied. Please allow microphone permissions.')
    }
  }, [monitorMicLevel])

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
    setMicLevel(0)
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

  // Waveform bars
  const waveformBars = Array.from({ length: 40 }, (_, i) => {
    const base = isRecording ? micLevel : 0
    const noise = Math.sin(Date.now() / 200 + i * 0.5) * 15
    return Math.max(4, Math.min(100, base + noise * (isRecording ? 1 : 0.1)))
  })

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl text-[13px]"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#F87171' }}
        >
          <AlertCircle size={16} />
          {error}
        </motion.div>
      )}

      {/* Title Input */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <label className="block text-[12px] font-medium text-gray-400 mb-2 uppercase tracking-wider">Lecture Title</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g., Introduction to Machine Learning"
          className="w-full px-4 py-3 rounded-xl text-[14px] text-gray-100 placeholder-gray-600 bg-white/[0.04] border transition-all focus:outline-none focus:border-blue-500/40"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        />
      </div>

      {/* Recording Center */}
      <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex flex-col items-center">
          {/* Recording Orb */}
          <div className="relative mb-8">
            <motion.div
              animate={isRecording ? { scale: [1, 1.08, 1], boxShadow: ['0 0 0 0 rgba(239,68,68,0)', '0 0 0 20px rgba(239,68,68,0.1)', '0 0 0 0 rgba(239,68,68,0)'] } : {}}
              transition={isRecording ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
              className="w-36 h-36 rounded-full flex items-center justify-center"
              style={{
                background: isRecording
                  ? 'radial-gradient(circle, rgba(239,68,68,0.15), rgba(239,68,68,0.05))'
                  : audioBlob
                    ? 'radial-gradient(circle, rgba(16,185,129,0.15), rgba(16,185,129,0.05))'
                    : 'radial-gradient(circle, rgba(59,130,246,0.1), rgba(59,130,246,0.03))',
                border: `2px solid ${isRecording ? 'rgba(239,68,68,0.3)' : audioBlob ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.2)'}`,
              }}
            >
              {isRecording ? (
                <Radio size={48} className="text-red-400" strokeWidth={1.2} />
              ) : audioBlob ? (
                <CheckCircle2 size={48} className="text-emerald-400" strokeWidth={1.2} />
              ) : (
                <Mic size={48} className="text-blue-400" strokeWidth={1.2} />
              )}
            </motion.div>
          </div>

          {/* Timer */}
          <p className="text-5xl font-mono font-semibold text-white mb-2 tracking-widest tabular-nums">
            {formatTime(elapsed)}
          </p>

          {/* Status indicators */}
          <div className="flex items-center gap-4 mb-8 text-[12px] text-gray-500">
            <span className="flex items-center gap-1.5">
              <Mic size={13} className={isRecording ? 'text-red-400' : 'text-gray-600'} />
              {isRecording ? 'Recording' : audioBlob ? 'Stopped' : 'Ready'}
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-700" />
            <span className="flex items-center gap-1.5">
              <Activity size={13} className={micLevel > 20 ? 'text-emerald-400' : 'text-gray-600'} />
              Noise: {Math.round(micLevel)}%
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-700" />
            <span className="flex items-center gap-1.5">
              <HardDrive size={13} className="text-gray-600" />
              Local save
            </span>
          </div>

          {/* Waveform */}
          <div className="flex items-center gap-[2px] h-16 mb-8 px-4">
            {waveformBars.map((h, i) => (
              <motion.div
                key={i}
                animate={{ height: `${h}%` }}
                transition={{ duration: 0.1 }}
                className="w-[3px] rounded-full"
                style={{
                  background: isRecording
                    ? `linear-gradient(180deg, rgba(239,68,68,0.8), rgba(239,68,68,0.3))`
                    : audioBlob
                      ? 'rgba(16,185,129,0.3)'
                      : 'rgba(59,130,246,0.2)',
                  minHeight: '3px',
                }}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {!isRecording && !audioBlob && (
              <button
                onClick={startRecording}
                className="flex items-center gap-2 px-8 py-3 rounded-xl text-[14px] font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', boxShadow: '0 4px 15px rgba(239,68,68,0.3)' }}
              >
                <Radio size={18} />
                Start Recording
              </button>
            )}
            {isRecording && (
              <>
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                >
                  <Square size={16} />
                  Stop
                </button>
              </>
            )}
            {audioBlob && !isRecording && (
              <>
                <button
                  onClick={() => { setAudioBlob(null); setTranscript(''); setStep('record'); setElapsed(0) }}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-[13px] font-semibold transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF' }}
                >
                  <RotateCcw size={15} />
                  Re-record
                </button>
                <button
                  onClick={handleSave}
                  disabled={isTranscribing}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-50 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' }}
                >
                  <Save size={16} />
                  {isTranscribing ? 'Saving...' : 'Save & Process'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Live Transcript */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Waves size={16} className="text-blue-400" />
            <h2 className="text-[14px] font-semibold text-white">Live Transcript</h2>
          </div>
          {isRecording && (
            <span className="flex items-center gap-2 text-[11px] text-red-400">
              <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              Listening...
            </span>
          )}
        </div>
        <textarea
          value={transcript}
          onChange={e => setTranscript(e.target.value)}
          placeholder={isRecording ? 'Speak into your microphone -- transcript will appear here...' : 'Transcript will appear here after recording, or type/paste manually...'}
          className="w-full h-48 px-4 py-3 rounded-xl text-[13px] text-gray-300 placeholder-gray-600 bg-white/[0.03] border resize-none leading-relaxed focus:outline-none focus:border-blue-500/30"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        />
      </div>

      {/* Success */}
      {step === 'done' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6"
          style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
              <CheckCircle2 size={24} className="text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-[15px] font-semibold text-emerald-400">Lecture Saved Successfully</h3>
              <p className="text-[13px] text-gray-500 mt-0.5">Head to Notes Studio to refine and publish your content.</p>
            </div>
            <button
              onClick={() => navigate('/teacher/notes')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}
            >
              Notes Studio <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
