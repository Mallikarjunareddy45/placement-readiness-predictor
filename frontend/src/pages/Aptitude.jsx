import { useState, useEffect, useRef } from 'react'
import { getAptCategoriesAPI, startAptTestAPI, submitAptTestAPI, getAptHistoryAPI, getAptProgressAPI } from '../services/api'
// Removed local sidebar import
import { useAuth } from '../context/AuthContext'
import './Aptitude.css'

export default function Aptitude() {
  const { student } = useAuth()
  const [categories, setCategories] = useState([])
  const [history, setHistory] = useState([])
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Test states
  const [activeTest, setActiveTest] = useState(null)
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

  // Timer runner
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

  const fetchInitialData = async () => {
    try {
      const catRes = await getAptCategoriesAPI()
      setCategories(catRes.data.categories)

      const histRes = await getAptHistoryAPI()
      setHistory(histRes.data.history)

      const progRes = await getAptProgressAPI()
      setProgress(progRes.data)
    } catch (err) {
      setError('Could not load aptitude data.')
    } finally {
      setLoading(false)
    }
  }

  const startTest = async (catName) => {
    setLoading(true)
    setError('')
    try {
      const res = await startAptTestAPI(catName)
      setActiveTest(res.data)
      setAnswers({})
      setCurrentIdx(0)
      setTimeLeft(res.data.time_limit)
      setTestResult(null)
    } catch (err) {
      setError(`Failed to load ${catName} Aptitude Test.`)
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
    if (Object.keys(answers).length === 0) {
      alert("Please answer at least one question before submitting.")
      return
    }

    setLoading(true)
    if (timerRef.current) clearInterval(timerRef.current)

    const payload = {
      category: activeTest.category,
      answers: answers,
      time_taken_secs: activeTest.time_limit - timeLeft
    }

    try {
      const res = await submitAptTestAPI(payload)
      setTestResult(res.data)
      setActiveTest(null)
      fetchInitialData()
    } catch (err) {
      setError('Error submitting test.')
    } finally {
      setLoading(false)
    }
  }

  const autoSubmit = async () => {
    setLoading(true)
    const payload = {
      category: activeTest.category,
      answers: answers,
      time_taken_secs: activeTest.time_limit
    }
    try {
      const res = await submitAptTestAPI(payload)
      setTestResult(res.data)
      setActiveTest(null)
      fetchInitialData()
    } catch (err) {
      setError('Test timed out. Auto-submission failed.')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  if (loading && !activeTest) return <div className="page-loading"><div className="dash-loading-spinner" /></div>

  // Mock Leaderboard details
  const leaderboard = [
    { rank: 1, name: "Ananya Sharma", score: 95, branch: "Computer Science" },
    { rank: 2, name: "Rohit Kumar", score: 90, branch: "Information Technology" },
    { rank: 3, name: "Priya Nair", score: 88, branch: "AI & Data Science" },
    { rank: 4, name: "Vikram Malhotra", score: 85, branch: "Electronics" },
    { rank: 5, name: student?.name || "You", score: progress?.overall_aptitude_score || 0, branch: "Student", isUser: true }
  ].sort((a,b) => b.score - a.score).map((x, idx) => ({ ...x, rank: idx + 1 }))

  return (
    <div className="aptitude-page fade-in">
          
          {/* Lobby Screen */}
          {!activeTest && !testResult && (
            <div className="aptitude-lobby-grid">
              
              {/* Left side: Categories & Info */}
              <div className="aptitude-lobby-left">
                <div className="tech-header">
                  <h1 className="dash-title">Aptitude Assessments</h1>
                  <p className="dash-subtitle">
                    Improve logical reasoning, mathematical ability, and verbal expression.
                  </p>
                </div>

                {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

                <div className="categories-list-grid">
                  {categories.map(cat => {
                    const catProgress = progress?.categories?.[cat.category]
                    const best = catProgress?.best_score || 0

                    return (
                      <div key={cat.category} className="card category-row-card">
                        <div className="cat-card-main-info">
                          <div className="cat-avatar">🧠</div>
                          <div>
                            <h3 className="cat-title">{cat.category}</h3>
                            <p className="cat-topics">Topics: {cat.topics.slice(0,4).join(', ')}</p>
                          </div>
                        </div>

                        <div className="cat-score-badge">
                          <span className="cat-score-lbl">Best Attempt:</span>
                          <strong className={`cat-score-val ${best >= 70 ? 'score-green' : best >= 50 ? 'score-amber' : best ? 'score-red' : ''}`}>
                            {best > 0 ? `${best}%` : 'N/A'}
                          </strong>
                        </div>

                        <button className="btn btn-primary" onClick={() => startTest(cat.category)}>
                          Start Test
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Right side: Leaderboard */}
              <div className="aptitude-lobby-right">
                <div className="card leaderboard-card">
                  <h3 className="leaderboard-card-title">🏆 Aptitude Leaderboard</h3>
                  <div className="leaderboard-list">
                    {leaderboard.map(u => (
                      <div key={u.rank} className={`leaderboard-item ${u.isUser ? 'leaderboard-item--user' : ''}`}>
                        <span className="leaderboard-rank">{u.rank}</span>
                        <div className="leaderboard-details">
                          <span className="leaderboard-name">{u.name}</span>
                          <span className="leaderboard-branch">{u.branch}</span>
                        </div>
                        <span className="leaderboard-score">{u.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Active Test Screen */}
          {activeTest && (
            <div className="card test-interface-card">
              <div className="test-nav-header">
                <div>
                  <h2>{activeTest.category} Aptitude</h2>
                  <span className="question-count-badge">Question {currentIdx + 1} of {activeTest.questions.length}</span>
                </div>
                <div className="test-timer-glow">
                  ⏱️ {formatTime(timeLeft)}
                </div>
              </div>

              <div className="test-progress-bar-wrapper">
                <div
                  className="test-progress-bar-fill"
                  style={{ width: `${((currentIdx + 1) / activeTest.questions.length) * 100}%` }}
                />
              </div>

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
                    ✓ Submit Test
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Test Results Screen */}
          {testResult && (
            <div className="test-results-view">
              <div className="card result-summary-card">
                <h1 className="result-score-hdr">{testResult.score}%</h1>
                <h3 className="result-perf-label">{testResult.performance}</h3>
                <p className="result-meta-summary">
                  You scored <strong>{testResult.score}%</strong> in <strong>{testResult.category}</strong>.
                </p>
                <div className="alert alert-info" style={{ marginTop: 15, maxWidth: 500, marginInline: 'auto' }}>
                  {testResult.feedback}
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24 }}>
                  <button className="btn btn-primary" onClick={() => setTestResult(null)}>
                    Return to Lobby
                  </button>
                </div>
              </div>

              {/* Explanations Listing */}
              <h3 className="review-title-hdr">Verify Answers</h3>
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
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
  )
}