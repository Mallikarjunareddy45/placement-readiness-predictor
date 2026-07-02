import { useState, useEffect, useRef } from 'react'
import { getTechSubjectsAPI, startTechTestAPI, submitTechTestAPI, getTechHistoryAPI } from '../services/api'
// Removed local sidebar import
import './Technical.css'

export default function Technical() {
  const [subjects, setSubjects] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Test states
  const [activeTest, setActiveTest] = useState(null) // holds test questions & timer
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState({}) // { question_id: selected_option }
  const [timeLeft, setTimeLeft] = useState(0)
  const timerRef = useRef(null)
  
  // Results state
  const [testResult, setTestResult] = useState(null)

  useEffect(() => {
    fetchInitialData()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const fetchInitialData = async () => {
    try {
      const subRes = await getTechSubjectsAPI()
      setSubjects(subRes.data.subjects)
      
      const histRes = await getTechHistoryAPI()
      setHistory(histRes.data.history)
    } catch (err) {
      setError('Could not load subjects. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Timer tick
  useEffect(() => {
    if (activeTest && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            autoSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [activeTest, timeLeft])

  const startTest = async (subjectName) => {
    setLoading(true)
    setError('')
    try {
      const res = await startTechTestAPI(subjectName)
      setActiveTest(res.data)
      setAnswers({})
      setCurrentIdx(0)
      setTimeLeft(res.data.time_limit)
      setTestResult(null)
    } catch (err) {
      setError(`Failed to initialize assessment for ${subjectName}.`)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectOption = (qid, option) => {
    setAnswers(p => ({ ...p, [qid]: option }))
  }

  const nextQuestion = () => {
    if (currentIdx < activeTest.questions.length - 1) {
      setCurrentIdx(currentIdx + 1)
    }
  }

  const prevQuestion = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1)
    }
  }

  const submitTest = async () => {
    // Check if at least one question is answered
    if (Object.keys(answers).length === 0) {
      alert("Please answer at least one question before submitting.")
      return
    }

    setLoading(true)
    if (timerRef.current) clearInterval(timerRef.current)

    const payload = {
      subject: activeTest.subject,
      answers: answers,
      time_taken_secs: activeTest.time_limit - timeLeft
    }

    try {
      const res = await submitTechTestAPI(payload)
      setTestResult(res.data)
      setActiveTest(null)
      fetchInitialData() // refresh lobby scores
    } catch (err) {
      setError('Error submitting test. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const autoSubmit = async () => {
    setLoading(true)
    const payload = {
      subject: activeTest.subject,
      answers: answers,
      time_taken_secs: activeTest.time_limit
    }
    try {
      const res = await submitTechTestAPI(payload)
      setTestResult(res.data)
      setActiveTest(null)
      fetchInitialData()
    } catch (err) {
      setError('Test time expired. Submission failed.')
    } finally {
      setLoading(false)
    }
  }

  const generateExplanation = (q) => {
    return (
      `Explanation: The correct answer is "${q.correct_answer}". ` +
      `This question covers the topic of "${q.topic}" under "${activeTest?.subject || testResult?.subject}" concepts. ` +
      `Your selected answer was "${q.your_answer || "Unattempted"}". ` +
      `Understanding "${q.topic}" is highly valued in technical recruitment screenings.`
    )
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  if (loading && !activeTest) return <div className="page-loading"><div className="dash-loading-spinner" /></div>

  return (
    <div className="technical-page fade-in">
          
          {/* Lobby screen */}
          {!activeTest && !testResult && (
            <>
              <div className="tech-header">
                <div>
                  <h1 className="dash-title">Technical Assessments</h1>
                  <p className="dash-subtitle">
                    Select a core subject to evaluate your programming and core computer science fundamentals.
                  </p>
                </div>
              </div>

              {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

              <div className="subjects-grid">
                {subjects.map(s => {
                  const subjectHistory = history.filter(h => h.subject === s.subject)
                  const bestScore = subjectHistory.length > 0 ? Math.max(...subjectHistory.map(h => h.score)) : null

                  return (
                    <div key={s.subject} className="card subject-card">
                      <div className="subject-card-body">
                        <div className="subject-icon-lbl">💻</div>
                        <h3 className="subject-title">{s.subject}</h3>
                        <p className="subject-meta">{s.total_questions} Questions Bank Available</p>
                        
                        <div className="subject-best-score">
                          <span>Best Attempt:</span>
                          <strong className={bestScore >= 70 ? 'score-green' : bestScore >= 50 ? 'score-amber' : bestScore ? 'score-red' : ''}>
                            {bestScore !== null ? `${bestScore}%` : 'Not Attempted'}
                          </strong>
                        </div>
                      </div>
                      <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => startTest(s.subject)}>
                        Start 20m Test
                      </button>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Active test screen */}
          {activeTest && (
            <div className="card test-interface-card">
              <div className="test-nav-header">
                <div>
                  <h2>{activeTest.subject} Assessment</h2>
                  <span className="question-count-badge">Question {currentIdx + 1} of {activeTest.questions.length}</span>
                </div>
                <div className="test-timer-glow">
                  ⏱️ {formatTime(timeLeft)}
                </div>
              </div>

              {/* Progress bar */}
              <div className="test-progress-bar-wrapper">
                <div
                  className="test-progress-bar-fill"
                  style={{ width: `${((currentIdx + 1) / activeTest.questions.length) * 100}%` }}
                />
              </div>

              {/* Question Box */}
              {activeTest.questions.length > 0 && (
                <div className="active-question-box">
                  <div className="question-topic-pill">Topic: {activeTest.questions[currentIdx].topic}</div>
                  <h3 className="active-question-text">{activeTest.questions[currentIdx].question}</h3>
                  
                  <div className="mcq-options-list">
                    {activeTest.questions[currentIdx].options.map((opt, oIdx) => {
                      const qid = activeTest.questions[currentIdx].id
                      const isSelected = answers[qid] === opt
                      return (
                        <div
                          key={oIdx}
                          className={`mcq-option-item ${isSelected ? 'mcq-option--selected' : ''}`}
                          onClick={() => handleSelectOption(qid, opt)}
                        >
                          <span className="option-indicator">{String.fromCharCode(65 + oIdx)}</span>
                          <span className="option-text">{opt}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Footer controls */}
              <div className="test-footer-controls">
                <button className="btn btn-secondary" onClick={prevQuestion} disabled={currentIdx === 0}>
                  ← Previous
                </button>
                
                {currentIdx < activeTest.questions.length - 1 ? (
                  <button className="btn btn-primary" onClick={nextQuestion}>
                    Next Question →
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={submitTest} style={{ background: 'var(--accent-green)' }}>
                    ✓ Submit Assessment
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Test results screen */}
          {testResult && (
            <div className="test-results-view">
              <div className="card result-summary-card">
                <h1 className="result-score-hdr">{testResult.score}%</h1>
                <h3 className="result-perf-label">{testResult.performance}</h3>
                <p className="result-meta-summary">
                  You answered <strong>{testResult.correct}</strong> out of <strong>{testResult.total}</strong> questions correctly.
                  Time taken: {formatTime(testResult.time_taken)}.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
                  <button className="btn btn-primary" onClick={() => setTestResult(null)}>
                    Back to Subject Lobby
                  </button>
                </div>
              </div>

              {/* Explanations listing */}
              <h3 className="review-title-hdr">Review Questions & Explanations</h3>
              <div className="results-questions-list">
                {testResult.results.map((q, idx) => (
                  <div key={idx} className={`card result-q-card ${q.is_correct ? 'result-correct-card' : 'result-incorrect-card'}`}>
                    <div className="result-q-card-header">
                      <span className="q-badge-idx">Question {idx + 1}</span>
                      <span className={`badge ${q.is_correct ? 'badge-green' : 'badge-red'}`}>
                        {q.is_correct ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                    
                    <h4 className="result-q-text">{q.question}</h4>
                    
                    <div className="result-q-answers">
                      <div className="ans-row">
                        <span>Your Answer:</span>
                        <strong className={q.is_correct ? 'color-green' : 'color-red'}>{q.your_answer || "Unattempted"}</strong>
                      </div>
                      {!q.is_correct && (
                        <div className="ans-row">
                          <span>Correct Answer:</span>
                          <strong className="color-green">{q.correct_answer}</strong>
                        </div>
                      )}
                    </div>

                    <div className="divider" style={{ margin: '12px 0' }} />
                    <p className="result-q-explanation">{generateExplanation(q)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
  )
}