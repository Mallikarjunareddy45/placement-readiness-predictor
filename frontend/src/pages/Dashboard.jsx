import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboardAPI, getNotificationsAPI, readNotificationAPI, clearNotificationsAPI } from '../services/api'
import Navbar from '../components/Navbar'
import CollapsibleSidebar from '../components/CollapsibleSidebar'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer
} from 'recharts'
import {
  FileText,
  Laptop,
  Brain,
  Code,
  Mic,
  Sparkles,
  Award,
  Trophy,
  GraduationCap,
  Briefcase,
  Flame,
  CheckCircle2,
  TrendingUp,
  Clock,
  Play,
  Calendar,
  Send,
  MessageSquare,
  X,
  Target,
  BadgeAlert,
  ChevronRight,
  Users
} from 'lucide-react'
import '../css/Dashboard.css'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Chatbot states
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'Hi! I am your Placement Prep Assistant. Ask me how to boost your readiness!' }
  ])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const res = await getDashboardAPI()
      setData(res.data)
    } catch (err) {
      setError('Could not load dashboard. Complete your academic profile first.')
    } finally {
      setLoading(false)
    }
  }

  const handleChatSubmit = (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const userMsg = chatInput.trim()
    setChatMessages(p => [...p, { sender: 'user', text: userMsg }])
    setChatInput('')

    // Generate responsive response based on keyword inputs
    setTimeout(() => {
      let reply = "I'm analyzing your profile parameters. To maximize your prediction scores, try completing all DSA coding problems and taking a technical interview assessment."
      const lower = userMsg.toLowerCase()
      if (lower.includes('dsa') || lower.includes('code') || lower.includes('coding')) {
        reply = "Your Coding Score is currently evaluated from the DSA test. Solve 'Valid Parentheses' and 'Two Sum' in the Coding Test console to boost this metric instantly!"
      } else if (lower.includes('resume') || lower.includes('ats')) {
        reply = "To raise your ATS resume score, upload a single-column layout containing industry-aligned keywords like Docker, CI/CD, SQL, and Python."
      } else if (lower.includes('interview') || lower.includes('mock')) {
        reply = "Practice Mock Interviews regularly! Fluency is graded by speaking speed (target 100-130 WPM) and minimizing filler words."
      } else if (lower.includes('score') || lower.includes('probability')) {
        reply = "Your Overall Placement Readiness is a weighted average of Technical tests (20%), Coding rounds (20%), Aptitude (15%), and Mock Interviews (15%)."
      }
      setChatMessages(p => [...p, { sender: 'ai', text: reply }])
    }, 800)
  }

  if (loading) return (
    <div className="skeleton-page-wrapper" style={{ padding: '40px 24px' }}>
      <div className="skeleton-hero" style={{ height: 160, width: '100%', marginBottom: 24 }} />
      <div className="grid-3" style={{ gap: 20 }}>
        <div className="skeleton-card-left" style={{ height: 300 }} />
        <div className="skeleton-card-right" style={{ height: 300 }} />
        <div className="skeleton-card-right" style={{ height: 300 }} />
      </div>
    </div>
  )

  if (error) return (
    <div className="dash-error" style={{ height: '70vh', flexDirection: 'column', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="alert alert-info" style={{ maxWidth: 480, textAlign: 'center', marginBottom: 20 }}>
        {error}
      </div>
      <button className="btn btn-primary" onClick={() => navigate('/profile')}>
        Complete Profile Now
      </button>
    </div>
  )

  const { student, placement, scores, breakdowns, modules, analysis, recommendations, stats, skills, recent_activities } = data

  const probability = placement.placement_probability || placement.overall_score

  // Generate dynamic motivational statement
  let motivationalMessage = "Complete your academic profile setup and resume scans to trigger ML simulations."
  if (probability >= 80) {
    motivationalMessage = "Outstanding! You are in the top recruitment readiness tier. Focus on system design details to secure marquee offers."
  } else if (probability >= 65) {
    motivationalMessage = "Solid readiness! Review missing keywords on your resume and solve 2 algorithms daily to break into the 80%+ bracket."
  } else if (probability >= 50) {
    motivationalMessage = "Steady progress! Raise your Technical and Aptitude scores to cross threshold cutoff metrics."
  }

  // Calculate dynamic XP and Level
  const totalXp = (stats.technical_tests_taken * 100) + (stats.aptitude_tests_taken * 100) + (stats.predictions_run * 50) + (stats.resume_uploaded ? 250 : 0)
  const currentLevel = Math.floor(totalXp / 1000) + 1
  const xpProgress = (totalXp % 1000) / 10

  // Recharts Radar data
  const radarData = [
    { subject: 'Technical', Score: scores.technical_score },
    { subject: 'Aptitude', Score: scores.aptitude_score },
    { subject: 'Coding', Score: scores.dsa_score },
    { subject: 'Interview', Score: scores.mock_interview_score },
    { subject: 'Projects', Score: scores.projects_score },
    { subject: 'Resume', Score: scores.resume_score },
  ]

  // Mock schedule calendar list
  const studySchedule = [
    { day: 'MON', time: '10:00 AM', task: 'DSA Strings Challenge' },
    { day: 'WED', time: '02:00 PM', task: 'Aptitude Quantitative Practice' },
    { day: 'FRI', time: '04:00 PM', task: 'Mock Interview Evaluation' },
  ]

  // Mock leaderboard
  const mockLeaderboard = [
    { rank: 1, name: "Ananya Sharma", xp: 2450 },
    { rank: 2, name: "Rohit Kumar", xp: 1980 },
    { rank: 3, name: student.name, xp: totalXp, isUser: true }
  ].sort((a,b) => b.xp - a.xp).map((x, i) => ({ ...x, rank: i + 1 }))

  return (
    <div className="saas-dash-wrapper">
            
            {/* Hero Section */}
            <section className="card saas-hero-card">
              <div className="saas-hero-grid">
                
                {/* Left info */}
                <div className="hero-info-section">
                  <div className="hero-welcome-row">
                    <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${student.name}`} alt="Profile" className="hero-avatar-img" />
                    <div>
                      <h1 className="hero-welcome-title">Welcome back, {student.name}!</h1>
                      <p className="hero-welcome-sub">{student.college || 'N/A'} · {student.branch || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="hero-ai-motivation">
                    <span className="motivation-sparkle-pill">✨ AI Placement Analyst</span>
                    <p className="motivation-msg-text">"{motivationalMessage}"</p>
                  </div>
                  
                  {/* Streak & Weekly Progress */}
                  <div className="hero-gamify-row" style={{ display: 'flex', gap: 24, marginTop: 20 }}>
                    <div className="streak-badge-premium">
                      <Flame className="streak-icon-flame" size={18} />
                      <div>
                        <strong>4 Days</strong>
                        <span>Prep Streak</span>
                      </div>
                    </div>
                    
                    <div className="weekly-target-badge">
                      <Target className="target-icon-stepper" size={18} />
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700 }}>
                          <span>Weekly Target</span>
                          <span>4/5 Done</span>
                        </div>
                        <div className="score-bar" style={{ marginTop: 4, height: 6 }}>
                          <div className="score-bar-fill" style={{ width: '80%', background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Middle Column: Readiness probability dial */}
                <div className="hero-gauge-section">
                  <div className="radial-progress-ring" style={{ width: 130, height: 130 }}>
                    <svg viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="44" className="ring-base" />
                      <circle
                        cx="50"
                        cy="50"
                        r="44"
                        className="ring-fill"
                        style={{
                          stroke: probability >= 75 ? 'var(--accent-green)' : probability >= 55 ? 'var(--accent-amber)' : 'var(--accent-red)',
                          strokeDashoffset: 276 - (276 * probability) / 100
                        }}
                      />
                    </svg>
                    <div className="radial-inner-value">
                      <span className="radial-val-num" style={{ fontSize: 26 }}>{probability}%</span>
                      <span className="radial-val-lbl">Readiness</span>
                    </div>
                  </div>
                  <div className="gauge-status-block">
                    <span className="badge badge-purple">{placement.readiness_label}</span>
                    <span className="confidence-label">Predictive Score</span>
                  </div>
                </div>

                {/* Right Column: AI Model Confidence dial */}
                <div className="hero-gauge-section" style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.05)', paddingLeft: 24 }}>
                  <div className="radial-progress-ring" style={{ width: 130, height: 130 }}>
                    <svg viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="44" className="ring-base" />
                      <circle
                        cx="50"
                        cy="50"
                        r="44"
                        className="ring-fill"
                        style={{
                          stroke: 'var(--accent-cyan)',
                          strokeDashoffset: 276 - (276 * (placement.ai_confidence_score || 50)) / 100
                        }}
                      />
                    </svg>
                    <div className="radial-inner-value">
                      <span className="radial-val-num" style={{ fontSize: 26 }}>{placement.ai_confidence_score || 50}%</span>
                      <span className="radial-val-lbl">Confidence</span>
                    </div>
                  </div>
                  <div className="gauge-status-block">
                    <span className="badge badge-cyan" style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                      {placement.ai_confidence_label || 'Low'}
                      <span className="card-stat-tooltip" style={{ cursor: 'help', fontSize: 10 }} title="AI Confidence indicates how confident the prediction model is based on the amount and quality of available data.">ℹ</span>
                    </span>
                    <span className="confidence-label">AI Model Trust</span>
                  </div>
                </div>

              </div>
            </section>

            {/* 12 Statistics Cards Grid */}
            <section className="stats-grid-container">
              
              <div className="card stat-card-premium gradient-blue">
                <div className="stat-card-header">
                  <span>Resume Strength</span>
                  <span className="card-stat-tooltip" title="Overall resume grammar and formatting quality.">ℹ</span>
                </div>
                <div className="stat-card-value">
                  <FileText className="stat-icon-color" size={24} />
                  <strong>{scores.resume_score}/100</strong>
                </div>
              </div>

              <div className="card stat-card-premium gradient-cyan">
                <div className="stat-card-header">
                  <span>ATS Match Score</span>
                  <span className="card-stat-tooltip" title="Compliance with automated screening filters.">ℹ</span>
                </div>
                <div className="stat-card-value">
                  <Sparkles className="stat-icon-color" size={24} />
                  <strong>{scores.ats_score}%</strong>
                </div>
              </div>

              <div className="card stat-card-premium gradient-purple">
                <div className="stat-card-header">
                  <span>Technical Core</span>
                  <span className="card-stat-tooltip" title="Performance average across CS fundamentals.">ℹ</span>
                </div>
                <div className="stat-card-value">
                  <Laptop className="stat-icon-color" size={24} />
                  <strong>{scores.technical_score}%</strong>
                </div>
              </div>

              <div className="card stat-card-premium gradient-green">
                <div className="stat-card-header">
                  <span>Logical Aptitude</span>
                  <span className="card-stat-tooltip" title="Performance in quantitative & verbal tests.">ℹ</span>
                </div>
                <div className="stat-card-value">
                  <Brain className="stat-icon-color" size={24} />
                  <strong>{scores.aptitude_score}%</strong>
                </div>
              </div>

              <div className="card stat-card-premium gradient-blue">
                <div className="stat-card-header">
                  <span>Coding Score</span>
                  <span className="card-stat-tooltip" title="Grades solved program logic correctness.">ℹ</span>
                </div>
                <div className="stat-card-value">
                  <Code className="stat-icon-color" size={24} />
                  <strong>{scores.dsa_score}%</strong>
                </div>
              </div>

              <div className="card stat-card-premium gradient-cyan">
                <div className="stat-card-header">
                  <span>speaking fluency</span>
                  <span className="card-stat-tooltip" title="WPM pacing and grammatical grammar accuracy.">ℹ</span>
                </div>
                <div className="stat-card-value">
                  <Mic className="stat-icon-color" size={24} />
                  <strong>{scores.communication_score}%</strong>
                </div>
              </div>

              <div className="card stat-card-premium gradient-purple">
                <div className="stat-card-header">
                  <span>Mock Interview</span>
                  <span className="card-stat-tooltip" title="Evaluation score from latest mock session.">ℹ</span>
                </div>
                <div className="stat-card-value">
                  <Users className="stat-icon-color" size={24} />
                  <strong>{scores.mock_interview_score}%</strong>
                </div>
              </div>

              <div className="card stat-card-premium gradient-green">
                <div className="stat-card-header">
                  <span>Projects Score</span>
                  <span className="card-stat-tooltip" title="Score computed based on projects count.">ℹ</span>
                </div>
                <div className="stat-card-value">
                  <Briefcase className="stat-icon-color" size={24} />
                  <strong>{scores.projects_score}%</strong>
                </div>
              </div>

              <div className="card stat-card-premium gradient-blue">
                <div className="stat-card-header">
                  <span>Internships</span>
                  <span className="card-stat-tooltip" title="Completed industrial internship records.">ℹ</span>
                </div>
                <div className="stat-card-value">
                  <Award className="stat-icon-color" size={24} />
                  <strong>{student.internships}</strong>
                </div>
              </div>

              <div className="card stat-card-premium gradient-cyan">
                <div className="stat-card-header">
                  <span>Certifications</span>
                  <span className="card-stat-tooltip" title="Verified certifications added to profile.">ℹ</span>
                </div>
                <div className="stat-card-value">
                  <Trophy className="stat-icon-color" size={24} />
                  <strong>{student.certifications}</strong>
                </div>
              </div>

              <div className="card stat-card-premium gradient-purple">
                <div className="stat-card-header">
                  <span>Skill Match Ratio</span>
                  <span className="card-stat-tooltip" title="Skills list overlap with placement requirements.">ℹ</span>
                </div>
                <div className="stat-card-value">
                  <Target className="stat-icon-color" size={24} />
                  <strong>{scores.skill_match_score}%</strong>
                </div>
              </div>

              <div className="card stat-card-premium gradient-green">
                <div className="stat-card-header">
                  <span>Readiness Ratio</span>
                  <span className="card-stat-tooltip" title="Aggregated probability computed by AI model.">ℹ</span>
                </div>
                <div className="stat-card-value">
                  <TrendingUp className="stat-icon-color" size={24} />
                  <strong>{probability}%</strong>
                </div>
              </div>

            </section>

            {/* Radar Comparison Chart & Stepper Progress */}
            <div className="grid-2" style={{ gap: 24, margin: '24px 0' }}>
              
              {/* Radar Chart */}
              <div className="card radar-card-dashboard">
                <h3 className="setup-card-title" style={{ marginBottom: 16 }}>Placement Competencies Radar</h3>
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.05)" />
                      <PolarAngleAxis dataKey="subject" stroke="var(--text-secondary)" fontSize={11} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.1)" tick={false} />
                      <Radar name="Student Metrics" dataKey="Score" stroke="var(--accent-blue)" fill="var(--accent-blue)" fillOpacity={0.25} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Progress Milestones Stepper */}
              <div className="card milestones-stepper-card">
                <h3 className="setup-card-title">🏁 Placement Readiness Milestones</h3>
                <div className="roadmap-stepper-premium" style={{ marginTop: 20 }}>
                  <div className={`step-item-premium ${scores.cgpa_score > 0 ? 'completed' : 'pending'}`}>
                    <div className="step-badge-node">1</div>
                    <div className="step-content-meta">
                      <strong>Setup Profile Details</strong>
                      <p>{scores.cgpa_score > 0 ? 'Academic details synced' : 'Add CGPA and graduation year'}</p>
                    </div>
                  </div>
                  <div className={`step-item-premium ${scores.resume_score > 0 ? 'completed' : 'pending'}`}>
                    <div className="step-badge-node">2</div>
                    <div className="step-content-meta">
                      <strong>Upload ATS Resume</strong>
                      <p>{scores.resume_score > 0 ? 'Resume scanned' : 'Upload PDF/DOCX resume file'}</p>
                    </div>
                  </div>
                  <div className={`step-item-premium ${scores.technical_score > 0 ? 'completed' : 'pending'}`}>
                    <div className="step-badge-node">3</div>
                    <div className="step-content-meta">
                      <strong>CS Core assessment</strong>
                      <p>{scores.technical_score > 0 ? 'Tests completed' : 'Attempt at least one technical subject test'}</p>
                    </div>
                  </div>
                  <div className={`step-item-premium ${probability >= 70 ? 'completed' : 'pending'}`}>
                    <div className="step-badge-node">4</div>
                    <div className="step-content-meta">
                      <strong>AI Simulation Run</strong>
                      <p>{probability >= 70 ? 'Ready for screening rounds' : 'Reach overall readiness above 70%'}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Recommendations Row */}
            <section className="card recommendations-section-card" style={{ marginBottom: 24 }}>
              <div className="card-header">
                <h3 className="setup-card-title">💡 Personalized AI Preparation Roadmap</h3>
                <span className="badge badge-cyan">Model Recommendations</span>
              </div>
              
              <div className="recs-cards-grid">
                {recommendations.length === 0 ? (
                  <p className="no-data-text">Run placement predictions to compile recommendation checklists.</p>
                ) : (
                  recommendations.map((r, i) => (
                    <div key={i} className="card rec-card-premium">
                      <div className="rec-card-tag-row">
                        <span className="badge badge-purple">{r.category}</span>
                        <span className="priority-dot-tag">Priority: {r.priority}</span>
                      </div>
                      <p className="rec-desc-txt">{r.suggestion}</p>
                      
                      <div className="rec-card-details">
                        <div className="rec-meta-col">
                          <span>Difficulty:</span>
                          <strong>Medium</strong>
                        </div>
                        <div className="rec-meta-col">
                          <span>Est. Time:</span>
                          <strong>2 Hours</strong>
                        </div>
                      </div>

                      <button className="btn btn-primary btn-sm" onClick={() => navigate('/predict')} style={{ width: '100%', marginTop: 12, justifyContent: 'center' }}>
                        Improve Metrics
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Technical Subjects & Aptitude categories */}
            <div className="grid-2" style={{ gap: 24, marginBottom: 24 }}>
              
              {/* Technical subjects */}
              <div className="card subjects-dashboard-card">
                <div className="card-header" style={{ marginBottom: 20 }}>
                  <h3 className="setup-card-title">Technical Subjects Checklist</h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate('/technical')}>All Tests →</button>
                </div>

                <div className="subjects-scroller-dashboard">
                  {Object.entries(breakdowns.technical_subjects).map(([subj, val]) => (
                    <div key={subj} className="subject-row-card card">
                      <div className="subj-title-col">
                        <strong>{subj}</strong>
                        <span>20 Qs · 20m</span>
                      </div>
                      <div className="subj-progress-col" style={{ flexGrow: 1, padding: '0 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                          <span>Best Score</span>
                          <span>{val}%</span>
                        </div>
                        <div className="score-bar" style={{ marginTop: 4, height: 6 }}>
                          <div
                            className="score-bar-fill"
                            style={{
                              width: `${val}%`,
                              background: val >= 70 ? 'var(--accent-green)' : val >= 50 ? 'var(--accent-amber)' : val > 0 ? 'var(--accent-red)' : 'var(--text-muted)'
                            }}
                          />
                        </div>
                      </div>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/technical')}>
                        Take Test
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aptitude categories */}
              <div className="card subjects-dashboard-card">
                <div className="card-header" style={{ marginBottom: 20 }}>
                  <h3 className="setup-card-title">Aptitude Categories</h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate('/aptitude')}>All Tests →</button>
                </div>

                <div className="subjects-scroller-dashboard">
                  {Object.entries(breakdowns.aptitude_categories).map(([cat, val]) => (
                    <div key={cat} className="subject-row-card card">
                      <div className="subj-title-col">
                        <strong>{cat}</strong>
                        <span>20 Qs · 20m</span>
                      </div>
                      <div className="subj-progress-col" style={{ flexGrow: 1, padding: '0 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                          <span>Best Score</span>
                          <span>{val}%</span>
                        </div>
                        <div className="score-bar" style={{ marginTop: 4, height: 6 }}>
                          <div
                            className="score-bar-fill"
                            style={{
                              width: `${val}%`,
                              background: val >= 70 ? 'var(--accent-green)' : val >= 50 ? 'var(--accent-amber)' : val > 0 ? 'var(--accent-red)' : 'var(--text-muted)'
                            }}
                          />
                        </div>
                      </div>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/aptitude')}>
                        Start Test
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Achievements, Activity logs, Widgets grid */}
            <div className="grid-3" style={{ gap: 24, marginBottom: 40 }}>
              
              {/* Gamified achievements */}
              <div className="card widget-card-premium">
                <h3 className="widget-title">🏆 Prep Achievements</h3>
                
                <div className="xp-badge-level" style={{ textAlign: 'center', margin: '16px 0' }}>
                  <h1 style={{ color: 'var(--accent-cyan)' }}>Level {currentLevel}</h1>
                  <span className="xp-score-sub">{totalXp} XP Cumulative Points</span>
                </div>

                <div className="score-bar" style={{ height: 8, marginBottom: 20 }}>
                  <div className="score-bar-fill" style={{ width: `${xpProgress}%`, background: 'var(--accent-cyan)' }} />
                </div>

                <span className="group-label">Unlocked Badges</span>
                <div className="badges-flex-list" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {stats.resume_uploaded && <span className="badge badge-green">📄 Resume Pro</span>}
                  {stats.technical_tests_taken > 0 && <span className="badge badge-blue">💻 CS Starter</span>}
                  {stats.technical_tests_taken >= 3 && <span className="badge badge-purple">🔥 CS Master</span>}
                  {stats.predictions_run > 0 && <span className="badge badge-cyan">🔮 ML Modeler</span>}
                </div>
              </div>

              {/* Study schedule calendar */}
              <div className="card widget-card-premium">
                <h3 className="widget-title">📅 Study Planner</h3>
                <p className="tab-desc" style={{ marginBottom: 12 }}>Assigned learning goals for placement prep rounds.</p>
                
                <div className="schedule-listing" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {studySchedule.map((s, idx) => (
                    <div key={idx} className="sch-row card" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div className="sch-day-badge" style={{ background: 'var(--accent-blue)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 8px', borderRadius: 4 }}>{s.day}</div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{s.task}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Recent Activities log */}
              <div className="card widget-card-premium">
                <h3 className="widget-title">⚡ Recent Prep Logs</h3>
                <div className="activity-listing" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                  {recent_activities.length === 0 ? (
                    <p className="no-data-text">No recent logs compiled.</p>
                  ) : (
                    recent_activities.map((act, i) => (
                      <div key={i} className="activity-row" style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                        <span style={{ color: 'var(--accent-purple)' }}>●</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{act.message}</span>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(act.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Extra Row: Leaderboard + Upcoming Goals + AI Daily widgets */}
            <div className="grid-3" style={{ gap: 24, marginBottom: 40 }}>
              
              {/* Leaderboard widget */}
              <div className="card widget-card-premium">
                <h3 className="widget-title">🎖️ Prep Leaderboard</h3>
                <div className="leaderboard-list" style={{ marginTop: 12 }}>
                  {mockLeaderboard.map(u => (
                    <div key={u.rank} className={`leaderboard-item ${u.isUser ? 'leaderboard-item--user' : ''}`} style={{ padding: 10 }}>
                      <span className="leaderboard-rank">{u.rank}</span>
                      <div className="leaderboard-details">
                        <span className="leaderboard-name">{u.name}</span>
                      </div>
                      <span className="leaderboard-score">{u.xp} XP</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Goals */}
              <div className="card widget-card-premium">
                <h3 className="widget-title">🎯 Target Goals Checklist</h3>
                <div className="goals-checklist" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                  <div className="goal-item" style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 12 }}>
                    <input type="checkbox" checked={stats.resume_uploaded} disabled />
                    <span style={{ textDecoration: stats.resume_uploaded ? 'line-through' : 'none' }}>Scan Resume for ATS Compatibility</span>
                  </div>
                  <div className="goal-item" style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 12 }}>
                    <input type="checkbox" checked={stats.technical_tests_taken >= 3} disabled />
                    <span style={{ textDecoration: stats.technical_tests_taken >= 3 ? 'line-through' : 'none' }}>Complete 3 Technical assessments</span>
                  </div>
                  <div className="goal-item" style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 12 }}>
                    <input type="checkbox" checked={stats.predictions_run > 0} disabled />
                    <span style={{ textDecoration: stats.predictions_run > 0 ? 'line-through' : 'none' }}>Run AI Simulation predictor</span>
                  </div>
                </div>
              </div>

              {/* AI Daily Target Widget */}
              <div className="card widget-card-premium" style={{ border: '1px solid rgba(59, 130, 246, 0.2)', background: 'rgba(59, 130, 246, 0.03)' }}>
                <h3 className="widget-title" style={{ color: 'var(--accent-blue)' }}>🎯 Today's AI Prep Target</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '12px 0 20px', lineHeight: 1.5 }}>
                  Solve the <strong>"Valid Parentheses"</strong> problem inside the Coding Editor to trigger automated test evaluations.
                </p>
                <button className="btn btn-primary" onClick={() => navigate('/coding')} style={{ width: '100%', justifyContent: 'center' }}>
                  Open Editor →
                </button>
              </div>

            </div>

            {/* Floating AI Chatbot assistant widget */}
            <div className="chatbot-floating-wrapper">
              <AnimatePresence>
                {chatOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    className="chatbot-card card"
                  >
                    <div className="chatbot-header">
                      <span>💬 AI Prep Copilot</span>
                      <button className="chatbot-close" onClick={() => setChatOpen(false)}>&times;</button>
                    </div>
                    
                    <div className="chatbot-messages-scroll">
                      {chatMessages.map((m, i) => (
                        <div key={i} className={`chat-bubble chat-bubble--${m.sender}`}>
                          <p>{m.text}</p>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleChatSubmit} className="chatbot-input-row">
                      <input
                        type="text"
                        className="input input-sm"
                        placeholder="Ask a question..."
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                      />
                      <button type="submit" className="btn btn-primary btn-sm chatbot-send-btn">
                        <Send size={12} />
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              <button className="chatbot-launcher-btn" onClick={() => setChatOpen(!chatOpen)} title="AI Prep Assistant">
                {chatOpen ? <X size={20} /> : <MessageSquare size={20} />}
              </button>
            </div>
          </div>
  )
}