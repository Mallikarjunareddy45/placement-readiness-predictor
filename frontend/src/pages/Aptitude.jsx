import { useState, useEffect, useRef } from 'react'
import { 
  getAptCategoriesAPI, 
  startAptTestAPI, 
  submitAptTestAPI, 
  getAptHistoryAPI, 
  getAptProgressAPI,
  getAptitudeLeaderboardAPI
} from '../services/api'
import { useAuth } from '../context/AuthContext'
import './Aptitude.css'

export default function Aptitude() {
  const { student } = useAuth()
  const [categories, setCategories] = useState([])
  const [history, setHistory] = useState([])
  const [progress, setProgress] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
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

      const leadRes = await getAptitudeLeaderboardAPI()
      setLeaderboard(leadRes.data.leaderboard)
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
                    {leaderboard.length === 0 ? (
                      <div className="leaderboard-empty-state" style={{ color: 'var(--text-secondary)', padding: '20px 0', textAlign: 'center', fontSize: 13, lineHeight: '1.6' }}>
                        No students have completed the aptitude test yet. Be the first to take the test and claim Rank #1!
                      </div>
                    ) : (
                      leaderboard.map(u => (
                        <div key={u.rank} className={`leaderboard-item ${u.isUser ? 'leaderboard-item--user' : ''}`}>
                          <span className="leaderboard-rank">{u.rank}</span>
                          <div className="leaderboard-details">
                            <span className="leaderboard-name">{u.name}</span>
                            <span className="leaderboard-branch">{u.branch}</span>
                          </div>
                          <span className="leaderboard-score">{u.score}%</span>
                        </div>
                      ))
                    )}
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

              <div className="question-box">
                <p className="question-text">{activeTest.questions[currentIdx].question}</p>
                <div className="options-grid">
                  {activeTest.questions[currentIdx].options.map(opt => {
                    const isSelected = answers[activeTest.questions[currentIdx].id] === opt
                    return (
                      <button
                        key={opt}
                        className={`btn btn-option ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectOption(activeTest.questions[currentIdx].id, opt)}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="test-action-buttons">
                <button
                  className="btn btn-secondary"
                  onClick={prevQuestion}
                  disabled={currentIdx === 0}
                >
                  Previous
                </button>
                {currentIdx < activeTest.questions.length - 1 ? (
                  <button
                    className="btn btn-secondary"
                    onClick={nextQuestion}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    className="btn btn-success"
                    onClick={submitTest}
                  >
                    Submit Test
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Test Result Screen */}
          {testResult && (
            <div className="card result-card fade-in">
              <div className="result-header">
                <h2>Test Completed!</h2>
                <p className="result-category">{testResult.category} Aptitude Assessment</p>
              </div>

              <div className="result-score-section">
                <div className="result-score-circle">
                  <span className="result-score-val">{testResult.score}%</span>
                  <span className="result-score-lbl">Score</span>
                </div>
                <div className="result-quick-stats">
                  <p>Correct Answers: <strong>{testResult.correct} / {testResult.total}</strong></p>
                  <p>Performance: <strong>{testResult.performance}</strong></p>
                  <p>Time Taken: <strong>{formatTime(testResult.time_taken)}</strong></p>
                </div>
              </div>

              <div className="result-feedback-section">
                <h3>AI Recommendation</h3>
                <p className="result-feedback-text">{testResult.feedback}</p>
                
                {testResult.weak_topics.length > 0 && (
                  <div className="topics-list-wrapper">
                    <strong>Focus Areas (Weak Topics):</strong>
                    <div className="tags-container">
                      {testResult.weak_topics.map(t => <span key={t} className="tag tag-red">{t}</span>)}
                    </div>
                  </div>
                )}

                {testResult.strong_topics.length > 0 && (
                  <div className="topics-list-wrapper">
                    <strong>Strengths (Strong Topics):</strong>
                    <div className="tags-container">
                      {testResult.strong_topics.map(t => <span key={t} className="tag tag-green">{t}</span>)}
                    </div>
                  </div>
                )}
              </div>

              <button className="btn btn-primary" onClick={() => setTestResult(null)}>
                Back to Lobby
              </button>
            </div>
          )}

    </div>
  )
}