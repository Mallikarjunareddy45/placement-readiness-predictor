import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getActiveAssessmentAPI,
  startAssessmentAPI,
  getAssessmentQuestionsAPI,
  runCodingCodeAPI,
  submitAssessmentQuestionAPI,
  completeAssessmentAPI,
  getLatestResumeAPI,
  getCodingReportAPI
} from '../services/api'
import { 
  Play, 
  Send, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  BookOpen, 
  CheckCircle, 
  HelpCircle,
  FileText,
  Brain,
  Download,
  Activity,
  Award,
  Zap,
  ArrowRight
} from 'lucide-react'
import './Coding.css'

export default function Coding() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [noResume, setNoResume] = useState(false)
  const [resumeSkills, setResumeSkills] = useState([])
  const [careerRole, setCareerRole] = useState('')

  // Flow State: 'landing' | 'testing' | 'report'
  const [flowState, setFlowState] = useState('landing')

  // Testing Attempts
  const [activeAttempt, setActiveAttempt] = useState(null)
  const [timeLeft, setTimeLeft] = useState(3600)
  const [questions, setQuestions] = useState([])
  const [selectedProb, setSelectedProb] = useState(null)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState('')
  
  // Running/Submitting states
  const [running, setRunning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [customInput, setCustomInput] = useState('')
  const [runResult, setRunResult] = useState(null)
  const [submitResult, setSubmitResult] = useState(null)
  const [answers, setAnswers] = useState({}) // { [qid]: { code, language, status, score, runCount } }

  // Final Reports State
  const [reportData, setReportData] = useState(null)

  // Timer Ref
  const timerRef = useRef(null)

  useEffect(() => {
    fetchInitialStatus()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const fetchInitialStatus = async () => {
    setLoading(true)
    setError('')
    try {
      // 1. Check if there is an active assessment in progress
      const res = await getActiveAssessmentAPI()
      if (res.data?.success) {
        if (res.data.no_resume) {
          setNoResume(true)
          setFlowState('landing')
        } else if (res.data.active) {
          // Attempt is active! Restore state
          setActiveAttempt(res.data)
          setTimeLeft(res.data.time_left)
          startTimer(res.data.time_left)
          await loadQuestions()
          setFlowState('testing')
        } else {
          // No active attempt. Let's see if a completed report exists
          await checkCompletedReport()
        }
      }
    } catch (err) {
      setError('Connection failure loading assessment module.')
    } finally {
      setLoading(false)
    }
  }

  const checkCompletedReport = async () => {
    try {
      const res = await getCodingReportAPI()
      if (res.data?.success && res.data.report) {
        setReportData(res.data.report)
        setFlowState('report')
      } else {
        // No active attempt AND no completed report -> Show landing page
        await loadResumeDetails()
        setFlowState('landing')
      }
    } catch (err) {
      // If 404, just show landing
      await loadResumeDetails()
      setFlowState('landing')
    }
  }

  const loadResumeDetails = async () => {
    try {
      const res = await getLatestResumeAPI()
      if (res.data?.success && res.data.data) {
        const data = res.data.data
        const skillsStr = data.detected_skills || ''
        const skillsArr = skillsStr.split(',').map(s => s.trim()).filter(Boolean)
        setResumeSkills(skillsArr.slice(0, 12))

        const text = (data.extracted_text || '').toLowerCase()
        if (text.includes('machine learning') || text.includes('ai/') || text.includes('data science')) {
          setCareerRole('AI/ML & Data Science Specialist')
        } else if (text.includes('full stack') || text.includes('fullstack')) {
          setCareerRole('Full Stack Software Engineer')
        } else if (text.includes('backend') || text.includes('django') || text.includes('spring boot')) {
          setCareerRole('Backend Systems Developer')
        } else {
          setCareerRole('Frontend Interface Engineer')
        }
      } else {
        setNoResume(true)
      }
    } catch (err) {
      console.warn('Lobby resume query exception:', err)
    }
  }

  const startTestAttempt = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await startAssessmentAPI() // Mutates and starts assessment attempt
      if (res.data?.success) {
        setActiveAttempt(res.data)
        setTimeLeft(res.data.time_left)
        startTimer(res.data.time_left)
        await loadQuestions()
        setFlowState('testing')
      } else {
        setError(res.data?.message || 'Error generating challenge pool.')
      }
    } catch (err) {
      setError('Assessment instantiation timeout.')
    } finally {
      setLoading(false)
    }
  }

  const loadQuestions = async () => {
    try {
      const res = await getAssessmentQuestionsAPI()
      if (res.data?.success && res.data.questions) {
        setQuestions(res.data.questions)
        const qList = res.data.questions
        if (qList.length > 0) {
          selectProblem(qList[0], 0, qList[0].languages_supported[0] || 'python')
        }
      }
    } catch (err) {
      setError('Failure compiling question assets.')
    }
  }

  const startTimer = (initialSeconds) => {
    if (timerRef.current) clearInterval(timerRef.current)
    let rem = initialSeconds
    timerRef.current = setInterval(() => {
      rem -= 1
      setTimeLeft(rem)
      if (rem <= 0) {
        clearInterval(timerRef.current)
        completeAssessment(true)
      }
    }, 1000)
  }

  const selectProblem = (prob, idx, defaultLang = 'python') => {
    setSelectedProb(prob)
    setSelectedIdx(idx)
    setRunResult(null)
    setSubmitResult(null)
    setError('')

    let lang = defaultLang
    if (!prob.languages_supported.includes(lang)) {
      lang = prob.languages_supported[0] || 'python'
    }
    setLanguage(lang)

    const saved = answers[prob.id]
    if (saved) {
      setCode(saved.code)
      setLanguage(saved.language)
      if (saved.submit_res) {
        setSubmitResult(saved.submit_res)
      }
    } else {
      const templates = prob.starter_code || {}
      setCode(templates[lang] || '')
    }
  }

  const handleLangChange = (lang) => {
    setLanguage(lang)
    const templates = selectedProb?.starter_code || {}
    setCode(templates[lang] || '')
  }

  const handleCodeChange = (e) => {
    setCode(e.target.value)
    setAnswers(prev => ({
      ...prev,
      [selectedProb.id]: {
        ...prev[selectedProb.id],
        code: e.target.value,
        language: language
      }
    }))
  }

  const runCode = async () => {
    if (!selectedProb) return
    setRunning(true)
    setRunResult(null)
    setSubmitResult(null)
    setError('')

    const payload = {
      problem_id: selectedProb.slug,
      language: language,
      code: code,
      test_input: customInput || (selectedProb.sample_test_cases[0]?.input || '')
    }

    // Increment run attempt counter
    setAnswers(prev => {
      const current = prev[selectedProb.id] || { runCount: 0 }
      return {
        ...prev,
        [selectedProb.id]: {
          ...current,
          runCount: (current.runCount || 0) + 1,
          code: code,
          language: language
        }
      }
    })

    try {
      const res = await runCodingCodeAPI(payload)
      setRunResult(res.data)
    } catch (err) {
      setError('Compile engine timed out.')
    } finally {
      setRunning(false)
    }
  }

  const submitCode = async () => {
    if (!selectedProb) return
    setSubmitting(true)
    setRunResult(null)
    setSubmitResult(null)
    setError('')

    const payload = {
      question_id: selectedProb.id,
      language: language,
      code: code
    }

    try {
      const res = await submitAssessmentQuestionAPI(payload)
      if (res.data?.success) {
        setSubmitResult(res.data)
        setAnswers(prev => {
          const current = prev[selectedProb.id] || { runCount: 0 }
          return {
            ...prev,
            [selectedProb.id]: {
              ...current,
              code: code,
              language: language,
              status: res.data.status,
              score: res.data.score,
              submit_res: res.data
            }
          }
        })
      } else {
        setError(res.data?.message || 'Grading harness communication failure.')
      }
    } catch (err) {
      setError('Grading endpoint timeout.')
    } finally {
      setSubmitting(false)
    }
  }

  const completeAssessment = async (auto = false) => {
    if (!auto && !window.confirm('Confirm submission. Ending the assessment will lock all question canvases.')) {
      return
    }

    if (timerRef.current) clearInterval(timerRef.current)
    setLoading(true)
    setError('')

    try {
      const res = await completeAssessmentAPI()
      if (res.data?.success) {
        await checkCompletedReport()
      } else {
        setError(res.data?.message || 'Error finalizing grading sequences.')
      }
    } catch (err) {
      setError('Finalizing report compiled error.')
    } finally {
      setLoading(false)
    }
  }

  const handleNextQuestion = () => {
    if (selectedIdx < questions.length - 1) {
      const nextIdx = selectedIdx + 1
      selectProblem(questions[nextIdx], nextIdx, language)
    }
  }

  const handlePrevQuestion = () => {
    if (selectedIdx > 0) {
      const prevIdx = selectedIdx - 1
      selectProblem(questions[prevIdx], prevIdx, language)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.target.selectionStart
      const end = e.target.selectionEnd
      const newCode = code.substring(0, start) + '    ' + code.substring(end)
      setCode(newCode)
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 4
      }, 0)
    }
  }

  // print window trigger for PDF
  const triggerPdfDownload = () => {
    window.print()
  }

  if (loading) {
    return <div className="page-loading"><div className="dash-loading-spinner" /></div>
  }

  // ─────────────────────────────────────────
  // FLOW STATE 1: LANDING PAGE
  // ─────────────────────────────────────────
  if (flowState === 'landing') {
    return (
      <div className="coding-lobby-container">
        <div className="coding-lobby-card" style={{ maxWidth: 780, textAlign: 'left' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div className="badge-pill" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent-cyan)', padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
              ⚡ Adaptive AI Engine
            </div>
            {noResume && (
              <span style={{ color: 'var(--accent-red)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertCircle size={14} /> Resume Analysis Required
              </span>
            )}
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
            Resume-Based AI Coding Assessment
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Our algorithmic test harness analyzes your uploaded resume to dynamically isolate your programming languages, 
            frameworks, and technologies. It constructs 5 real-world coding problems tailored directly to your career profile.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 18, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 700 }}>
                📋 Assessment Parameters
              </h3>
              <ul style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text-primary)' }}>
                <li>⏱ <strong>Time Limit:</strong> 60 Minutes (Strict)</li>
                <li>🎯 <strong>Questions:</strong> 5 Balanced Challenges</li>
                <li>📈 <strong>Difficulties:</strong> Easy, Medium, and Hard</li>
                <li>🛠 <strong>Compilers:</strong> Python, Node JS, SQLite Core</li>
                <li>🔒 <strong>Safety:</strong> Refreshing retains selection</li>
              </ul>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 18, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 700 }}>
                💡 Eligibility & Focus
              </h3>
              {noResume ? (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', textAlign: 'center', padding: '10px 0' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: 0 }}>
                    Please upload your resume to compile dynamic skills metadata.
                  </p>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate('/resume')} style={{ marginTop: 12 }}>
                    Upload Resume
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 13 }}>
                    Career Domain: <strong style={{ color: 'var(--accent-cyan)' }}>{careerRole}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Matched Competencies:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {resumeSkills.map((s, i) => (
                      <span key={i} className="skill-tag-badge">{s}</span>
                    ))}
                    <span className="skill-tag-badge" style={{ background: 'rgba(6,182,212,0.1)', borderColor: 'var(--accent-cyan)' }}>General DSA</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', padding: 14, borderRadius: 8, fontSize: 12, color: 'var(--accent-red)', marginBottom: 24 }}>
            ⚠️ <strong>Crucial Instruction:</strong> This is a single-attempt examination. Clicking <strong>Start Coding Test</strong> locks your session. Make sure you have uninterrupted internet connectivity and a quiet environment before initiating.
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 20, padding: 12, fontSize: 13, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {!noResume ? (
            <button 
              className="btn btn-primary"
              onClick={startTestAttempt}
              style={{ width: '100%', padding: 14, fontSize: 15, fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, background: 'var(--accent-blue)' }}
            >
              Start Coding Test <ArrowRight size={16} />
            </button>
          ) : (
            <button className="btn btn-primary" disabled style={{ width: '100%', padding: 14, opacity: 0.5 }}>
              Awaiting Resume Upload
            </button>
          )}

        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────
  // FLOW STATE 2: TESTING IDE PANEL
  // ─────────────────────────────────────────
  if (flowState === 'testing') {
    const solvedCount = Object.values(answers).filter(ans => ans.status === 'Accepted').length
    const currentAns = answers[selectedProb?.id] || { runCount: 0 }

    return (
      <div className="coding-page fade-in">
        {/* 1. Left Sidebar: navigator and timer */}
        <div className="coding-sidebar" style={{ width: 260 }}>
          <h3 className="sidebar-hdr-title">Test Console</h3>
          
          <div style={{ padding: '0 16px 12px 16px', borderBottom: '1px solid var(--border)' }}>
            <div className="coding-timer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 16, background: timeLeft < 300 ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)', color: timeLeft < 300 ? 'var(--accent-red)' : 'var(--accent-cyan)', fontWeight: 700 }}>
              ⏱ {formatTime(timeLeft)}
            </div>
            
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                <span>Solved Progress:</span>
                <strong>{solvedCount} / 5</strong>
              </div>
              <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                <div style={{ width: `${(solvedCount / 5) * 100}%`, height: '100%', background: 'var(--accent-green)', borderRadius: 2 }} />
              </div>
            </div>
          </div>

          <div className="problems-nav-list" style={{ marginTop: 10 }}>
            {questions.map((q, idx) => {
              const ans = answers[q.id]
              const active = selectedProb?.id === q.id
              let statusLabel = 'Unattempted'
              let statusColor = 'var(--text-secondary)'
              
              if (ans) {
                if (ans.status === 'Accepted') {
                  statusLabel = 'Accepted'
                  statusColor = 'var(--accent-green)'
                } else if (ans.status) {
                  statusLabel = ans.status
                  statusColor = 'var(--accent-red)'
                } else if (ans.code) {
                  statusLabel = 'Draft'
                  statusColor = 'var(--accent-cyan)'
                }
              }

              return (
                <div
                  key={q.id}
                  className={`prob-nav-item ${active ? 'prob-nav-item--active' : ''}`}
                  onClick={() => selectProblem(q, idx, language)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`difficulty-dot diff-${q.difficulty.toLowerCase()}`} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="prob-nav-title" style={{ fontSize: 12 }}>Q{idx+1}: {q.title}</span>
                      <span style={{ fontSize: 9, color: statusColor, fontWeight: 600 }}>{statusLabel}</span>
                    </div>
                  </div>
                  {ans?.status === 'Accepted' && <CheckCircle size={12} style={{ color: 'var(--accent-green)' }} />}
                </div>
              )
            })}
          </div>

          <div style={{ padding: 12 }}>
            <button 
              className="btn btn-primary"
              onClick={() => completeAssessment(false)}
              style={{ width: '100%', background: 'var(--accent-red)', padding: 10, fontSize: 12, fontWeight: 700 }}
            >
              End Assessment
            </button>
          </div>
        </div>

        {/* 2. Middle Pane: Problem specifications */}
        {selectedProb && (
          <div className="coding-desc-pane" style={{ width: '38%' }}>
            <div className="desc-content-scroll">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span className="tag tag-difficulty">{selectedProb.difficulty}</span>
                <span className="tag tag-category" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)' }}>
                  {selectedProb.category}
                </span>
                <span className="tag tag-topic" style={{ background: 'rgba(6,182,212,0.05)', color: 'var(--accent-cyan)' }}>
                  {selectedProb.topic}
                </span>
              </div>
              
              <h2 className="desc-title" style={{ fontSize: 20 }}>{selectedProb.title}</h2>
              
              <div className="desc-body-md" style={{ whiteSpace: 'pre-line', fontSize: 13, lineHeight: 1.5, marginBottom: 20 }}>
                {selectedProb.description}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Constraints:</div>
                <div style={{ fontSize: 12, fontFamily: 'monospace', marginTop: 4, color: 'var(--text-primary)' }}>
                  {selectedProb.constraints}
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
                  <span>Estimated Time: <strong>{selectedProb.estimated_time} mins</strong></span>
                  <span>Runs / Submits: <strong>{currentAns.runCount || 0} Attempts</strong></span>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Sample Test Cases</h4>
                {selectedProb.sample_test_cases?.map((tc, i) => (
                  <div key={i} style={{ marginTop: 10, background: 'rgba(0,0,0,0.15)', padding: 10, borderRadius: 6 }}>
                    <div className="tc-row">
                      <span className="tc-lbl" style={{ fontSize: 11 }}>Input:</span>
                      <pre className="tc-val" style={{ margin: 0, padding: 4 }}>{tc.input}</pre>
                    </div>
                    <div className="tc-row" style={{ marginTop: 6 }}>
                      <span className="tc-lbl" style={{ fontSize: 11 }}>Expected:</span>
                      <pre className="tc-val" style={{ margin: 0, padding: 4 }}>{tc.expected}</pre>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigator buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={handlePrevQuestion}
                  disabled={selectedIdx === 0}
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', alignSelf: 'center' }}>
                  Question {selectedIdx + 1} of 5
                </span>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={handleNextQuestion}
                  disabled={selectedIdx === questions.length - 1}
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>

            </div>
          </div>
        )}

        {/* 3. Right Pane: Code Editor */}
        {selectedProb && (
          <div className="coding-editor-pane" style={{ width: '42%' }}>
            <div className="editor-control-header">
              <select
                className="input input-sm select-lang"
                value={language}
                onChange={e => handleLangChange(e.target.value)}
                style={{ width: 130 }}
              >
                {selectedProb.languages_supported.map(lang => (
                  <option key={lang} value={lang}>
                    {lang === 'python' ? 'Python 3' : lang === 'javascript' ? 'Node.js' : lang === 'cpp' ? 'C++' : 'Java'}
                  </option>
                ))}
              </select>

              <div style={{ display: 'flex', gap: 6 }}>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={runCode}
                  disabled={running || submitting}
                >
                  {running ? 'Compiling...' : '▶ Run Code'}
                </button>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={submitCode}
                  disabled={running || submitting}
                  style={{ background: 'var(--accent-green)' }}
                >
                  {submitting ? 'Submitting...' : '🚀 Submit Code'}
                </button>
              </div>
            </div>

            {error && <div className="alert alert-error" style={{ margin: '8px 12px', padding: 8, fontSize: 12 }}>{error}</div>}

            <div className="editor-textarea-wrapper" style={{ flexGrow: 1, position: 'relative' }}>
              <div className="line-numbers" style={{ padding: 12, userSelect: 'none' }}>
                {Array.from({ length: code.split('\n').length || 1 }).map((_, i) => (
                  <span key={i}>{i + 1}</span>
                ))}
              </div>
              <textarea
                className="editor-textarea"
                value={code}
                onChange={handleCodeChange}
                onKeyDown={handleKeyDown}
                spellCheck="false"
                placeholder="# Write your implementation here..."
                style={{ padding: 12, paddingLeft: 44, width: '100%', height: '100%', resize: 'none', background: 'transparent', outline: 'none', border: 'none', fontFamily: 'monospace', color: '#f4f4f5', fontSize: 13 }}
              />
            </div>

            {/* Grader Console Logs */}
            <div className="coding-console" style={{ height: '30%', minHeight: 140, background: '#0a0a0f', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '8px 16px', background: '#0f0f14', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                OUTPUT TERMINAL
              </div>
              <div style={{ padding: 16, overflowY: 'auto', flexGrow: 1, fontFamily: 'monospace', fontSize: 12 }}>
                
                {submitResult && (
                  <div style={{ marginBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Grader: <strong>{submitResult.test_cases_passed} / {submitResult.test_cases_total} Test Cases Passed</strong></span>
                      <span className={`status-badge status-${submitResult.status?.toLowerCase().replace(' ', '-')}`} style={{ background: submitResult.status === 'Accepted' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: submitResult.status === 'Accepted' ? 'var(--accent-green)' : 'var(--accent-red)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                        {submitResult.status}
                      </span>
                    </div>
                    <div className="submit-testcase-dots" style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                      {submitResult.results?.map((r, i) => (
                        <span 
                          key={i} 
                          className={`tc-dot ${r.passed ? 'tc-dot-pass' : 'tc-dot-fail'}`} 
                          title={`Test Case ${i+1}: ${r.passed ? 'Passed' : 'Failed'}`}
                          style={{ width: 10, height: 10, borderRadius: '50%', display: 'inline-block' }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {runResult ? (
                  <div>
                    {runResult.run_success ? (
                      <div>
                        <div style={{ color: 'var(--accent-green)', fontWeight: 600 }}>Stdout Output:</div>
                        <pre style={{ background: 'rgba(255,255,255,0.02)', padding: 6, borderRadius: 4, marginTop: 4 }}>{runResult.stdout || '(no outputs)'}</pre>
                      </div>
                    ) : (
                      <div>
                        <div style={{ color: 'var(--accent-red)', fontWeight: 600 }}>Exception Thrown:</div>
                        <pre style={{ background: 'rgba(239,68,68,0.05)', color: '#ef4444', padding: 6, borderRadius: 4, marginTop: 4 }}>{runResult.stderr || 'Compiler execution error.'}</pre>
                      </div>
                    )}
                  </div>
                ) : (
                  !submitResult && <span style={{ color: 'var(--text-secondary)' }}>Click Run Code or Submit Code to evaluate outputs.</span>
                )}

              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────
  // FLOW STATE 3: STEP 6 - REPORTS PAGE
  // ─────────────────────────────────────────
  if (flowState === 'report' && reportData) {
    return (
      <div className="predict-content-wrapper fade-in" style={{ padding: 30, background: 'var(--bg-primary)' }}>
        
        {/* Printable/Clean container */}
        <div className="print-report-container" style={{ maxWidth: 840, margin: '0 auto' }}>
          
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: 20, marginBottom: 24 }}>
            <div>
              <div style={{ color: 'var(--accent-cyan)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                AI Recruiter Analytics
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 0 0', color: 'var(--text-primary)' }}>
                Coding Assessment Report
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0 0' }}>
                Candidate: <strong>{reportData.student_name}</strong> ({reportData.email})
              </p>
            </div>
            
            <button 
              className="btn btn-primary print-hidden-btn"
              onClick={triggerPdfDownload}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--accent-blue)' }}
            >
              <Download size={14} /> Download Report (PDF)
            </button>
          </div>

          {/* Stats summary row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>
            <div className="card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Overall Coding Score</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--accent-cyan)', marginTop: 8 }}>
                {reportData.overall_score}%
              </div>
            </div>
            <div className="card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Solved Challenges</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--accent-green)', marginTop: 8 }}>
                {reportData.solved_questions} / 5
              </div>
            </div>
            <div className="card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Failed / Skips</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--accent-red)', marginTop: 8 }}>
                {reportData.failed_questions} / 5
              </div>
            </div>
          </div>

          {/* Strengths / Weaknesses grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <div className="card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: 20 }}>
              <h3 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 700 }}>
                🌟 Highlighted Strengths
              </h3>
              <ul style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--accent-green)' }}>
                {reportData.strengths?.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
                {reportData.strengths?.length === 0 && (
                  <li style={{ color: 'var(--text-secondary)' }}>No target strengths identified.</li>
                )}
              </ul>
            </div>

            <div className="card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: 20 }}>
              <h3 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 700 }}>
                💡 Areas for Up-Skilling
              </h3>
              <ul style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--accent-amber)' }}>
                {reportData.weaknesses?.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
                {reportData.weaknesses?.length === 0 && (
                  <li style={{ color: 'var(--accent-green)' }}>Competencies verified across all categories!</li>
                )}
              </ul>
            </div>
          </div>

          {/* Difficulty breakdown panel */}
          <div className="card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 16, fontWeight: 700 }}>
              📊 Difficulty Breakdown
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {Object.entries(reportData.difficulty_breakdown || {}).map(([diff, val]) => {
                const pct = val.total > 0 ? (val.solved / val.total) * 100 : 0
                return (
                  <div key={diff} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
                    <span style={{ width: 80, fontSize: 13, fontWeight: 600 }}>{diff}</span>
                    <div style={{ flexGrow: 1, height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: diff === 'Easy' ? 'var(--accent-green)' : diff === 'Medium' ? 'var(--accent-amber)' : 'var(--accent-red)', borderRadius: 4 }} />
                    </div>
                    <span style={{ width: 80, fontSize: 13, textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {val.solved} / {val.total} Solved
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recommended topics list */}
          <div className="card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 700 }}>
              🎯 AI Skill Gap Recommendations
            </h3>
            <ul style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text-primary)' }}>
              {reportData.recommendations?.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>

          {/* Detail Question attempts logs */}
          <div className="card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: 20 }}>
            <h3 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 16, fontWeight: 700 }}>
              📋 Detailed Submissions Logs
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {reportData.questions?.map((q, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      Q{i+1}: {q.title}
                    </h4>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      Topic: {q.topic} • Language: {q.language}
                    </span>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: q.status === 'Accepted' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {q.status}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      Passed {q.passed} / {q.total} cases ({q.score}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 30, display: 'flex', justifyContent: 'center', gap: 12 }} className="print-hidden-btn">
            <button className="btn btn-secondary" onClick={() => navigate('/dashboard')} style={{ padding: '10px 24px' }}>
              Return to Dashboard
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/predict')} style={{ padding: '10px 24px', background: 'var(--accent-blue)' }}>
              Check Placement Forecast
            </button>
          </div>

        </div>
      </div>
    )
  }

  return null
}
