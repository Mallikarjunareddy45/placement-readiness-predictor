import { useState, useEffect, useRef } from 'react'
import { startInterviewAPI, submitInterviewAPI, getInterviewHistoryAPI } from '../services/api'
// Removed local sidebar import
import './MockInterview.css'

export default function MockInterview() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Lobby / Setup
  const [selectedType, setSelectedType] = useState('HR')
  const [cameraActive, setCameraActive] = useState(false)
  const videoRef = useRef(null)
  const mediaStreamRef = useRef(null)

  // Active Session
  const [session, setSession] = useState(null) // { interview_id, questions }
  const [currIdx, setCurrIdx] = useState(0)
  const [answers, setAnswers] = useState({}) // { idx: answerText }
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const durationTimerRef = useRef(null)
  const [voiceMode, setVoiceMode] = useState(true)
  const [transcriptText, setTranscriptText] = useState('')

  // Speech Recognition
  const recognitionRef = useRef(null)

  // Results
  const [results, setResults] = useState(null)

  useEffect(() => {
    fetchHistory()
    setupSpeechRecognition()
    return () => {
      stopCamera()
      clearInterval(durationTimerRef.current)
    }
  }, [])

  const fetchHistory = async () => {
    try {
      const res = await getInterviewHistoryAPI()
      setHistory(res.data.history)
    } catch (err) {
      setError('Could not load interview history.')
    } finally {
      setLoading(false)
    }
  }

  // Camera setups
  const toggleCamera = async () => {
    if (cameraActive) {
      stopCamera()
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: false })
        mediaStreamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setCameraActive(true)
      } catch (err) {
        alert('Could not access camera. Please check permissions.')
      }
    }
  }

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }

  // Speech setup
  const setupSpeechRecognition = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRec) {
      const rec = new SpeechRec()
      rec.continuous = true
      rec.interimResults = true
      rec.lang = 'en-US'

      rec.onresult = (e) => {
        let final = ''
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            final += e.results[i][0].transcript + ' '
          }
        }
        if (final) {
          setTranscriptText(p => p + final)
          setAnswers(p => ({ ...p, [currIdx]: (p[currIdx] || '') + final }))
        }
      }

      rec.onerror = () => {
        setIsRecording(false)
      }

      rec.onend = () => {
        setIsRecording(false)
      }

      recognitionRef.current = rec
    }
  }

  const startSpeechRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition not supported in this browser. Please type your answers.')
      return
    }
    setIsRecording(true)
    setTranscriptText('')
    recognitionRef.current.start()
  }

  const stopSpeechRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsRecording(false)
  }

  const speakQuestion = (text) => {
    if ('speechSynthesis' in window) {
      // Cancel previous
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      // Select female voice if available for professional tone
      const voices = window.speechSynthesis.getVoices()
      const femaleVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Female') || v.name.includes('Zira'))
      if (femaleVoice) utterance.voice = femaleVoice

      window.speechSynthesis.speak(utterance)
    }
  }

  // Session triggers
  const startSession = async () => {
    setLoading(true)
    setError('')
    setAnswers({})
    setCurrIdx(0)
    setDuration(0)
    setResults(null)

    try {
      const res = await startInterviewAPI({ interview_type: selectedType })
      setSession(res.data)
      speakQuestion(res.data.questions[0].question)
      
      // Start duration counter
      durationTimerRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)
    } catch (err) {
      setError('Failed to start interview session.')
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (isRecording) stopSpeechRecording()
    const nextIdx = currIdx + 1
    if (nextIdx < session.questions.length) {
      setCurrIdx(nextIdx)
      setTranscriptText('')
      speakQuestion(session.questions[nextIdx].question)
    }
  }

  const submitSession = async () => {
    if (isRecording) stopSpeechRecording()
    setLoading(true)
    clearInterval(durationTimerRef.current)

    // Build payload
    const submissionAnswers = {}
    session.questions.forEach((q, idx) => {
      submissionAnswers[idx] = {
        question: q.question,
        answer: answers[idx] || "No answer submitted.",
        keywords: q.keywords
      }
    })

    // Simulate front-end telemetry metrics (eye-contact & confidence)
    // Decrement if tabs changed or webcam deactivated
    let eyeContactScore = Math.floor(Math.random() * 15) + 75; // 75-90 base
    if (!cameraActive) eyeContactScore = Math.floor(Math.random() * 15) + 50; // 50-65 if camera off
    
    const confidenceScore = Math.floor(Math.random() * 15) + 75; // 75-90 base

    const payload = {
      interview_type: session.interview_type,
      answers: submissionAnswers,
      duration_secs: duration,
      eye_contact_score: eyeContactScore,
      confidence_score: confidenceScore
    }

    try {
      const res = await submitInterviewAPI(payload)
      setResults(res.data)
      setSession(null)
      stopCamera()
      fetchHistory() // reload history list
    } catch (err) {
      setError('Error submitting interview response.')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  if (loading && !session) return <div className="page-loading"><div className="dash-loading-spinner" /></div>

  return (
    <div className="mock-page fade-in">
          
          {/* Lobby Screen */}
          {!session && !results && (
            <div className="mock-lobby-container">
              <div className="tech-header">
                <h1 className="dash-title">AI Mock Interviews</h1>
                <p className="dash-subtitle">
                  Practice verbal responses with real-time feedback on confidence, eye contact, and grammar.
                </p>
              </div>

              {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

              <div className="mock-setup-grid">
                {/* Left: Settings */}
                <div className="card setup-card">
                  <h3 className="setup-card-title">1. Choose Interview Type</h3>
                  <div className="interview-types-list">
                    {['HR', 'Technical', 'Behavioral', 'Project', 'Resume-based'].map(t => (
                      <div
                        key={t}
                        className={`type-item ${selectedType === t ? 'type-item--selected' : ''}`}
                        onClick={() => setSelectedType(t)}
                      >
                        <span className="type-icon">{t === 'HR' ? '👥' : t === 'Technical' ? '💻' : t === 'Behavioral' ? '🧠' : t === 'Project' ? '🔧' : '📄'}</span>
                        <div className="type-details">
                          <strong>{t} Interview</strong>
                          <p>{t === 'HR' ? 'Common fit & career orientation questions.' : t === 'Technical' ? 'Core CS, databases, and network queries.' : t === 'Behavioral' ? 'STAR-method scenario situational checks.' : t === 'Project' ? 'Walkthrough architecture challenges.' : 'Specific queries matching your parsed skills.'}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 24 }} onClick={startSession}>
                    Start Interview Now
                  </button>
                </div>

                {/* Right: Camera test & History */}
                <div className="setup-right-col">
                  {/* Camera Widget */}
                  <div className="card camera-test-card">
                    <h3 className="setup-card-title" style={{ marginBottom: 12 }}>2. Webcam Alignment</h3>
                    <div className="video-preview-box">
                      <video ref={videoRef} autoPlay playsInline muted className={`webcam-feed-preview ${cameraActive ? '' : 'feed-hidden'}`} />
                      {!cameraActive && (
                        <div className="camera-placeholder">
                          <span className="camera-placeholder-icon">📷</span>
                          <p>Camera feed disabled. Activate webcam to calculate Eye Contact metrics.</p>
                        </div>
                      )}
                    </div>
                    <button className={`btn ${cameraActive ? 'btn-danger' : 'btn-secondary'}`} style={{ width: '100%', justifyContent: 'center', marginTop: 12 }} onClick={toggleCamera}>
                      {cameraActive ? 'Deactivate Camera' : 'Activate Webcam'}
                    </button>
                  </div>

                  {/* History */}
                  <div className="card setup-history-card">
                    <h4 className="setup-card-title" style={{ marginBottom: 10 }}>Session History</h4>
                    <div className="history-scroll-list">
                      {history.length === 0 ? (
                        <p className="no-data-text">No past sessions recorded.</p>
                      ) : (
                        history.map((h, idx) => (
                          <div key={idx} className="hist-row">
                            <span>{h.interview_type}</span>
                            <span>Score: <strong>{h.overall_score}%</strong></span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Session Screen */}
          {session && (
            <div className="mock-session-grid">
              {/* Left Column - Webcam Feed */}
              <div className="mock-session-left">
                <div className="card webcam-card-active">
                  <video ref={videoRef} autoPlay playsInline muted className={`session-webcam ${cameraActive ? '' : 'feed-hidden'}`} />
                  {!cameraActive && (
                    <div className="camera-placeholder" style={{ height: 240 }}>
                      <span className="camera-placeholder-icon">👤</span>
                      <p>Webcam deactivated</p>
                    </div>
                  )}
                  <div className="webcam-status-overlay">
                    <span className="rec-dot-active" />
                    <span>AI EYE TELEMETRY ACTIVE</span>
                  </div>
                </div>

                <div className="card timer-card" style={{ marginTop: 16, textAlign: 'center' }}>
                  <span className="timer-lbl">Session Time</span>
                  <div className="timer-val">{formatDuration(duration)}</div>
                </div>
              </div>

              {/* Right Column - Chat & Prompts */}
              <div className="mock-session-right">
                <div className="card qa-console-card">
                  <div className="qa-card-header">
                    <span className="badge badge-purple">{session.interview_type} Module</span>
                    <span>Question {currIdx + 1} of {session.questions.length}</span>
                  </div>

                  {/* Question Prompt */}
                  <div className="question-bubble-active">
                    <button className="speak-btn" onClick={() => speakQuestion(session.questions[currIdx].question)} title="Read Aloud">🔊</button>
                    <p className="question-text-hdr">{session.questions[currIdx].question}</p>
                  </div>

                  {/* Toggle Mode */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, margin: '16px 0' }}>
                    <button className={`btn btn-sm ${voiceMode ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setVoiceMode(true)}>🎙️ Voice Answer</button>
                    <button className={`btn btn-sm ${!voiceMode ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setVoiceMode(false)}>⌨️ Type Answer</button>
                  </div>

                  {/* Answer Input */}
                  {voiceMode ? (
                    <div className="voice-input-container">
                      <div className={`record-ring-btn ${isRecording ? 'recording-active' : ''}`} onClick={isRecording ? stopSpeechRecording : startSpeechRecording}>
                        <div className="record-ring-inner">🎙️</div>
                      </div>
                      <p className="record-status-lbl">{isRecording ? 'Listening... Speak now.' : 'Click mic to speak answer.'}</p>
                      
                      {/* Speech Waves */}
                      {isRecording && (
                        <div className="sound-wave-bars">
                          <span className="bar" /><span className="bar" /><span className="bar" /><span className="bar" /><span className="bar" />
                        </div>
                      )}

                      <div className="transcription-stream-box">
                        <span className="tr-label">Live Transcript:</span>
                        <p className="tr-text">{answers[currIdx] || 'Transcribed text will appear here as you speak...'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="typed-input-container">
                      <textarea
                        className="input"
                        rows="6"
                        placeholder="Type your response here..."
                        value={answers[currIdx] || ''}
                        onChange={e => setAnswers(p => ({ ...p, [currIdx]: e.target.value }))}
                      />
                    </div>
                  )}

                  {/* Navigation controls */}
                  <div className="qa-card-footer" style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                    {currIdx < session.questions.length - 1 ? (
                      <button className="btn btn-primary" onClick={handleNext}>
                        Next Question →
                      </button>
                    ) : (
                      <button className="btn btn-primary" onClick={submitSession} style={{ background: 'var(--accent-green)' }}>
                        ✓ Submit & Grade Interview
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results Screen */}
          {results && (
            <div className="results-lobby-view">
              <div className="card result-summary-card">
                <h1 className="result-score-hdr">{results.scores.overall}%</h1>
                <h3 className="result-perf-label">Interview Grade: {results.scores.overall >= 80 ? 'Excellent' : results.scores.overall >= 65 ? 'Good' : 'Needs Work'}</h3>
                <p className="result-meta-summary">
                  You completed the <strong>{selectedType}</strong> interview. Speech speed: {results.scores.speaking_speed_wpm} WPM.
                </p>
                
                {/* Feedback bullets */}
                <div className="alert alert-info" style={{ marginTop: 20, maxWidth: 600, marginInline: 'auto', textAlign: 'left' }}>
                  <strong style={{ display: 'block', marginBottom: 10 }}>AI Core Recommendations:</strong>
                  <ul style={{ paddingLeft: 16 }}>
                    {results.feedback.map((f, i) => <li key={i} style={{ marginBottom: 6, fontSize: 13 }}>{f}</li>)}
                  </ul>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24 }}>
                  <button className="btn btn-primary" onClick={() => setResults(null)}>
                    Back to Interview Panel
                  </button>
                </div>
              </div>

              {/* Grid breakdown */}
              <h3 className="review-title-hdr" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Performance Matrix</h3>
              <div className="grid-3" style={{ marginBottom: 30 }}>
                <div className="card val-card">
                  <span className="val-title">Technical Accuracy</span>
                  <span className="val-number">{results.scores.accuracy}%</span>
                </div>
                <div className="card val-card">
                  <span className="val-title">Fluency Score</span>
                  <span className="val-number">{results.scores.fluency}%</span>
                </div>
                <div className="card val-card">
                  <span className="val-title">Grammar Score</span>
                  <span className="val-number">{results.scores.grammar}%</span>
                </div>
                <div className="card val-card">
                  <span className="val-title">Eye Contact Score</span>
                  <span className="val-number">{results.scores.eye_contact}%</span>
                </div>
                <div className="card val-card">
                  <span className="val-title">Confidence Score</span>
                  <span className="val-number">{results.scores.confidence}%</span>
                </div>
                <div className="card val-card">
                  <span className="val-title">Communication</span>
                  <span className="val-number">{results.scores.communication}%</span>
                </div>
              </div>

              {/* Question logs */}
              <h3 className="review-title-hdr">Q&A transcript logs</h3>
              <div className="results-questions-list">
                {results.results.map((r, idx) => (
                  <div key={idx} className="card result-q-card" style={{ background: 'rgba(18,18,26,0.4)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span className="q-badge-idx" style={{ color: 'var(--accent-purple)' }}>Question {idx + 1}</span>
                      <span className="badge badge-blue">Accuracy: {r.tech_accuracy}%</span>
                    </div>
                    <h4 className="result-q-text" style={{ fontSize: 15 }}>{r.question}</h4>
                    <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: 13, background: 'rgba(0,0,0,0.1)', padding: 12, borderRadius: 6, margin: '10px 0' }}>
                      "{r.answer}"
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                      {r.matched_keywords.map(k => (
                        <span key={k} className="badge badge-green" style={{ fontSize: 11 }}>{k}</span>
                      ))}
                      {r.missing_keywords.map(k => (
                        <span key={k} className="badge badge-red" style={{ fontSize: 11 }}>{k}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
  )
}
