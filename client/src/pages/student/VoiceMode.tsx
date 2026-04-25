import { useState, useRef, useEffect, useCallback } from 'react'
import { aiAPI } from '../../api'
import { Mic, MicOff, X, Volume2, VolumeX, RotateCcw } from 'lucide-react'

type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface VoiceModeProps {
  onClose: () => void
  context?: string        // Optional note/document text to ground answers
  contextLabel?: string   // E.g. note title, shown in the UI
}

export default function VoiceMode({ onClose, context, contextLabel }: VoiceModeProps) {
  const [avatarState, setAvatarState] = useState<AvatarState>('idle')
  const [transcript, setTranscript] = useState('')
  const [interimText, setInterimText] = useState('')
  const [history, setHistory] = useState<Message[]>([])
  const [lastResponse, setLastResponse] = useState('')
  const [isMuted, setIsMuted] = useState(false)
  const [statusText, setStatusText] = useState('Listening...')
  const [error, setError] = useState('')
  const [micActive, setMicActive] = useState(false)

  const idleVideoRef = useRef<HTMLVideoElement>(null)
  const speakVideoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const recognitionRef = useRef<any>(null)
  const processingRef = useRef(false)
  const audioUrlRef = useRef<string | null>(null)

  // ── Init speech recognition ──
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setError('Speech recognition is not supported in this browser. Try Chrome.')
      return
    }
    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += piece + ' '
        } else {
          interim += piece
        }
      }
      if (interim) setInterimText(interim)
      if (final.trim()) {
        setTranscript(prev => prev + final)
        setInterimText('')
      }
    }

    recognition.onerror = (e: any) => {
      if (e.error !== 'no-speech') console.warn('Speech error:', e.error)
    }

    recognitionRef.current = recognition
    return () => { try { recognition.stop() } catch {} }
  }, [])

  // ── Start mic on mount ──
  useEffect(() => {
    startListening()
    return () => stopAllAudio()
  }, [])

  // ── When transcript accumulates, trigger response after 1.5s of silence ──
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!transcript.trim() || processingRef.current) return
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    silenceTimerRef.current = setTimeout(() => {
      if (transcript.trim()) handleQuestion(transcript.trim())
    }, 1500)
    return () => { if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current) }
  }, [transcript])

  const startListening = useCallback(() => {
    try {
      recognitionRef.current?.start()
      setMicActive(true)
      setAvatarState('idle')
      setStatusText('Listening...')
    } catch {}
  }, [])

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop()
      setMicActive(false)
    } catch {}
  }, [])

  const stopAllAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }
  }, [])

  // ── Browser speech synthesis (primary TTS) ──
  const speakWithBrowser = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) { resolve(); return }
      window.speechSynthesis.cancel()

      const doSpeak = () => {
        const utt = new SpeechSynthesisUtterance(text)
        utt.rate = 0.92
        utt.pitch = 1.0
        utt.volume = 1.0

        // Pick best available English voice
        const voices = window.speechSynthesis.getVoices()
        const preferred =
          voices.find(v => v.lang === 'en-GB' && v.name.includes('Google')) ||
          voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) ||
          voices.find(v => v.lang.startsWith('en') && !v.name.toLowerCase().includes('zira') && !v.name.toLowerCase().includes('david')) ||
          voices.find(v => v.lang.startsWith('en'))
        if (preferred) utt.voice = preferred

        utt.onend = () => resolve()
        utt.onerror = () => resolve()
        window.speechSynthesis.speak(utt)
      }

      // Voices may not be loaded yet on first call
      if (window.speechSynthesis.getVoices().length > 0) {
        doSpeak()
      } else {
        window.speechSynthesis.onvoiceschanged = () => { doSpeak() }
      }
    })
  }, [])

  const handleQuestion = useCallback(async (question: string) => {
    if (processingRef.current || !question.trim()) return
    processingRef.current = true

    // Pause mic while responding
    stopListening()
    setTranscript('')
    setInterimText('')
    setAvatarState('thinking')
    setStatusText('Thinking...')
    setError('')

    const newHistory: Message[] = [...history, { role: 'user', content: question }]
    setHistory(newHistory)

    try {
      // 1. Get AI text answer — inject note context if provided
      const { answer } = await aiAPI.voiceChat(question, history, context)
      setLastResponse(answer)
      setHistory(prev => [...prev, { role: 'assistant', content: answer }])

      if (isMuted) {
        // Skip TTS, go straight back to idle
        setAvatarState('idle')
        setStatusText('Listening...')
        startListening()
        processingRef.current = false
        return
      }

      // 2. Speak the answer using browser TTS
      setAvatarState('speaking')
      setStatusText('Speaking...')
      await speakWithBrowser(answer)
      handleAudioEnded()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Something went wrong. Please try again.')
      setAvatarState('idle')
      setStatusText('Listening...')
      startListening()
      processingRef.current = false
    }
  }, [history, isMuted, stopListening, startListening, speakWithBrowser])

  // When audio ends → back to idle
  const handleAudioEnded = useCallback(() => {
    setAvatarState('idle')
    setStatusText('Listening...')
    processingRef.current = false
    startListening()
  }, [startListening])

  const handleToggleMic = () => {
    if (micActive) {
      stopListening()
      setStatusText('Microphone off')
    } else {
      startListening()
      setStatusText('Listening...')
    }
  }

  const handleReset = () => {
    stopAllAudio()
    stopListening()
    setHistory([])
    setLastResponse('')
    setTranscript('')
    setInterimText('')
    setError('')
    processingRef.current = false
    setTimeout(() => startListening(), 200)
  }

  const isSpeaking = avatarState === 'speaking'
  const displayText = interimText || transcript

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-10 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Reset button */}
      <button
        onClick={handleReset}
        title="Clear conversation"
        className="absolute top-5 left-5 z-10 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

      <div className="flex flex-col items-center w-full max-w-2xl px-6">

        {/* ── Avatar video ── */}
        <div className="relative w-full aspect-video max-h-[55vh] rounded-3xl overflow-hidden shadow-2xl mb-8 bg-black">

          {/* Idle video */}
          <video
            ref={idleVideoRef}
            src="/ai-voice-mode.mp4"
            loop
            muted
            playsInline
            autoPlay
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${isSpeaking ? 'opacity-0' : 'opacity-100'}`}
          />

          {/* Speaking video */}
          <video
            ref={speakVideoRef}
            src="/ai-voice-sent.mp4"
            loop
            muted
            playsInline
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${isSpeaking ? 'opacity-100' : 'opacity-0'}`}
          />

          {/* State overlay badge */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
            {avatarState === 'idle' && micActive && (
              <span className="flex gap-1 items-center">
                {[0, 1, 2, 3].map(i => (
                  <span
                    key={i}
                    className="w-1 rounded-full bg-blue-400 animate-bounce"
                    style={{ height: `${8 + (i % 2) * 4}px`, animationDelay: `${i * 0.1}s`, animationDuration: '1.2s' }}
                  />
                ))}
              </span>
            )}
            {avatarState === 'thinking' && (
              <span className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </span>
            )}
            {avatarState === 'speaking' && (
              <span className="flex gap-1 items-center">
                {[0, 1, 2, 3, 4].map(i => (
                  <span
                    key={i}
                    className="w-1 rounded-full bg-emerald-400 animate-bounce"
                    style={{ height: `${6 + (i % 3) * 5}px`, animationDelay: `${i * 0.08}s`, animationDuration: '0.8s' }}
                  />
                ))}
              </span>
            )}
            <span className="text-xs text-white/80 font-medium">{statusText}</span>
          </div>

          {/* Thinking overlay */}
          {avatarState === 'thinking' && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="flex gap-2">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full bg-amber-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Transcript area ── */}
        <div className="w-full min-h-[60px] flex items-center justify-center mb-6 px-4">
          {error ? (
            <p className="text-red-400 text-sm text-center">{error}</p>
          ) : displayText ? (
            <p className="text-white/90 text-base text-center leading-relaxed max-w-lg">
              <span className="text-blue-300">You: </span>
              {displayText}
              {interimText && <span className="text-white/40 italic">{interimText}</span>}
            </p>
          ) : lastResponse ? (
            <p className="text-white/70 text-sm text-center leading-relaxed max-w-lg italic">
              "{lastResponse.length > 120 ? lastResponse.slice(0, 120) + '…' : lastResponse}"
            </p>
          ) : (
            <p className="text-white/40 text-sm text-center">
              {contextLabel
                ? `Ask me anything about "${contextLabel}"…`
                : 'Ask me anything about your studies…'}
            </p>
          )}
        </div>

        {/* ── Controls ── */}
        <div className="flex items-center gap-5">
          {/* Mute/unmute TTS */}
          <button
            onClick={() => setIsMuted(m => !m)}
            title={isMuted ? 'Unmute voice' : 'Mute voice'}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {/* Main mic button */}
          <button
            onClick={handleToggleMic}
            disabled={avatarState === 'thinking' || avatarState === 'speaking'}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
              micActive
                ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/40 ring-4 ring-blue-500/20'
                : 'bg-red-600 hover:bg-red-500 shadow-red-500/40'
            }`}
          >
            {micActive
              ? <Mic className="w-6 h-6 text-white" />
              : <MicOff className="w-6 h-6 text-white" />
            }
          </button>

          {/* Conversation history count */}
          <div className="p-3 rounded-full bg-white/10 text-white/50 text-xs font-mono min-w-[44px] text-center">
            {Math.floor(history.length / 2)}<br />
            <span className="text-[9px] text-white/30">msgs</span>
          </div>
        </div>

        <p className="text-white/25 text-xs mt-4 text-center">
          {micActive ? 'Speak naturally · pause to send' : 'Mic is off · click to resume'}
        </p>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} className="hidden" onEnded={handleAudioEnded} />

      {/* Manage speaking video play/pause based on state */}
      <SpeakingVideoController videoRef={speakVideoRef} isSpeaking={isSpeaking} />
    </div>
  )
}

// Helper component to control speaking video playback
function SpeakingVideoController({
  videoRef,
  isSpeaking,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>
  isSpeaking: boolean
}) {
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (isSpeaking) {
      v.currentTime = 0
      v.play().catch(() => {})
    } else {
      v.pause()
      v.currentTime = 0
    }
  }, [isSpeaking, videoRef])
  return null
}
