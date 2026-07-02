import { useState, useEffect, useCallback } from 'react'
import { predictAPI, getScoresOnlyAPI } from '../services/api'
// Removed local navbar import
import { motion, AnimatePresence } from 'framer-motion'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend
} from 'recharts'
import {
  GraduationCap,
  Briefcase,
  Award,
  Code2,
  Cpu,
  BrainCircuit,
  FileSpreadsheet,
  Users,
  MessageSquare,
  Sparkles,
  Info
} from 'lucide-react'
import './Prediction.css'

export default function Prediction() {
  const [scores, setScores] = useState({
    cgpa: 7.5,
    technical_score: 60,
    coding_score: 60,
    aptitude_score: 60,
    resume_score: 65,
    mock_interview_score: 65,
    communication_score: 65,
    projects_count: 2,
    certifications: 1,
    internships: 0,
    ats_score: 65,
    skill_match_score: 60,
    github_score: 40,
    backlogs: 0,
    college_tier: 2,
    project_complexity: 'Medium'
  })

  const [loading, setLoading] = useState(true)
  const [predicting, setPredicting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  // Sync scores once at mount
  useEffect(() => {
    fetchCurrentScores()
  }, [])

  const fetchCurrentScores = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getScoresOnlyAPI()
      const dbScores = res.data.scores
      const updated = {
        ...scores,
        cgpa: dbScores.cgpa || scores.cgpa,
        technical_score: dbScores.technical_score || scores.technical_score,
        coding_score: dbScores.coding_score || scores.coding_score,
        aptitude_score: dbScores.aptitude_score || scores.aptitude_score,
        resume_score: dbScores.resume_score || scores.resume_score,
        ats_score: dbScores.ats_score || scores.ats_score,
        skill_match_score: dbScores.skill_match_score || scores.skill_match_score,
        projects_count: dbScores.projects_count ?? scores.projects_count,
        certifications: dbScores.certifications ?? scores.certifications,
        internships: dbScores.internships ?? scores.internships,
        communication_score: dbScores.communication_score || scores.communication_score,
      }
      setScores(updated)
      // Trigger initial prediction immediately
      triggerPrediction(updated)
    } catch (err) {
      setError('Could not fetch active student scores. Simulator loaded with averages.')
      triggerPrediction(scores)
    } finally {
      setLoading(false)
    }
  }

  // Trigger prediction API directly
  const triggerPrediction = async (currentScores) => {
    setPredicting(true)
    try {
      const res = await predictAPI(currentScores)
      setResult(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setPredicting(false)
    }
  }

  // Debounced/Buffered prediction trigger to avoid rate-limiting on slider drags
  const debounce = (fn, delay) => {
    let timer
    return (...args) => {
      clearTimeout(timer)
      timer = setTimeout(() => fn(...args), delay)
    }
  }

  const debouncedPredict = useCallback(
    debounce((sc) => triggerPrediction(sc), 400),
    []
  )

  const handleSliderChange = (key, val) => {
    const updated = { ...scores, [key]: val }
    setScores(updated)
    debouncedPredict(updated)
  }

  if (loading) {
    return (
      <div className="skeleton-page-wrapper">
        <div className="skeleton-hero" />
        <div className="skeleton-body-grid">
          <div className="skeleton-card-left" />
          <div className="skeleton-card-right" />
        </div>
      </div>
    )
  }

  // Recharts radar comparison chart dataset
  const radarData = [
    { subject: 'CGPA', Current: Math.round(scores.cgpa * 10), Baseline: 80 },
    { subject: 'Resume', Current: scores.resume_score, Baseline: 80 },
    { subject: 'Technical', Current: scores.technical_score, Baseline: 80 },
    { subject: 'Aptitude', Current: scores.aptitude_score, Baseline: 80 },
    { subject: 'Coding', Current: scores.coding_score, Baseline: 80 },
    { subject: 'Interview', Current: scores.mock_interview_score, Baseline: 80 },
  ]

  const probability = result?.placement_probability ?? 0

  return (
    <div className="predict-content-wrapper">
        
        {/* Premium Hero Section */}
        <section className="predict-hero">
          <div className="hero-badge">
            <Sparkles size={12} className="hero-sparkle" />
            <span>Real-time ML Placement Modeler</span>
          </div>
          <h1 className="hero-title">
            Placement Readiness <span className="text-gradient">Predictor</span>
          </h1>
          <p className="hero-desc">
            Simulate your likelihood of recruitment. Drag sliders to check how enhancing specific skills, scores, or academics influences your total placement probability.
          </p>
        </section>

        {error && <div className="alert alert-info" style={{ marginBottom: 24 }}>{error}</div>}

        <div className="predict-grid">
          
          {/* Left Column: Simulator Sliders */}
          <div className="card sliders-card-premium">
            <div className="card-header-premium">
              <h3>⚡ What-If Simulator</h3>
              <p>Scores directly influence the Scikit-learn predictive classifier.</p>
            </div>

            <div className="sliders-section-scroller">
              
              {/* Group 1 */}
              <div className="slider-group">
                <span className="group-label">🎓 Academic Metrics</span>
                
                <div className="slider-row">
                  <div className="slider-icon-box"><GraduationCap size={16} /></div>
                  <div className="slider-body">
                    <div className="slider-meta"><span>Cumulative GPA</span><strong>{scores.cgpa}</strong></div>
                    <input type="range" min="5.0" max="10.0" step="0.1" value={scores.cgpa} onChange={e => handleSliderChange('cgpa', parseFloat(e.target.value))} />
                  </div>
                </div>

                <div className="slider-row">
                  <div className="slider-icon-box"><Briefcase size={16} /></div>
                  <div className="slider-body">
                    <div className="slider-meta"><span>Internships Completed</span><strong>{scores.internships}</strong></div>
                    <input type="range" min="0" max="3" step="1" value={scores.internships} onChange={e => handleSliderChange('internships', parseInt(e.target.value))} />
                  </div>
                </div>

                <div className="slider-row">
                  <div className="slider-icon-box"><Award size={16} /></div>
                  <div className="slider-body">
                    <div className="slider-meta"><span>Projects Count</span><strong>{scores.projects_count}</strong></div>
                    <input type="range" min="0" max="5" step="1" value={scores.projects_count} onChange={e => handleSliderChange('projects_count', parseInt(e.target.value))} />
                  </div>
                </div>
              </div>

              {/* Group 2 */}
              <div className="slider-group">
                <span className="group-label">💻 Test & Code Proficiency</span>
                
                <div className="slider-row">
                  <div className="slider-icon-box"><Cpu size={16} /></div>
                  <div className="slider-body">
                    <div className="slider-meta"><span>Technical Core Assessments</span><strong>{scores.technical_score}%</strong></div>
                    <input type="range" min="0" max="100" step="1" value={scores.technical_score} onChange={e => handleSliderChange('technical_score', parseInt(e.target.value))} />
                  </div>
                </div>

                <div className="slider-row">
                  <div className="slider-icon-box"><Code2 size={16} /></div>
                  <div className="slider-body">
                    <div className="slider-meta"><span>Coding Compilations</span><strong>{scores.coding_score}%</strong></div>
                    <input type="range" min="0" max="100" step="1" value={scores.coding_score} onChange={e => handleSliderChange('coding_score', parseInt(e.target.value))} />
                  </div>
                </div>

                <div className="slider-row">
                  <div className="slider-icon-box"><BrainCircuit size={16} /></div>
                  <div className="slider-body">
                    <div className="slider-meta"><span>Logical Aptitude Scoring</span><strong>{scores.aptitude_score}%</strong></div>
                    <input type="range" min="0" max="100" step="1" value={scores.aptitude_score} onChange={e => handleSliderChange('aptitude_score', parseInt(e.target.value))} />
                  </div>
                </div>
              </div>

              {/* Group 3 */}
              <div className="slider-group">
                <span className="group-label">👥 Interview & Communication</span>
                
                <div className="slider-row">
                  <div className="slider-icon-box"><FileSpreadsheet size={16} /></div>
                  <div className="slider-body">
                    <div className="slider-meta"><span>ATS Resume Optimization</span><strong>{scores.resume_score}%</strong></div>
                    <input type="range" min="0" max="100" step="1" value={scores.resume_score} onChange={e => handleSliderChange('resume_score', parseInt(e.target.value))} />
                  </div>
                </div>

                <div className="slider-row">
                  <div className="slider-icon-box"><Users size={16} /></div>
                  <div className="slider-body">
                    <div className="slider-meta"><span>Mock Interview Delivery</span><strong>{scores.mock_interview_score}%</strong></div>
                    <input type="range" min="0" max="100" step="1" value={scores.mock_interview_score} onChange={e => handleSliderChange('mock_interview_score', parseInt(e.target.value))} />
                  </div>
                </div>

                <div className="slider-row">
                  <div className="slider-icon-box"><MessageSquare size={16} /></div>
                  <div className="slider-body">
                    <div className="slider-meta"><span>Speaking Fluency & Grammar</span><strong>{scores.communication_score}%</strong></div>
                    <input type="range" min="0" max="100" step="1" value={scores.communication_score} onChange={e => handleSliderChange('communication_score', parseInt(e.target.value))} />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: AI Analytics & Visualizations */}
          <div className="predict-analytics-col">
            
            {/* Upper: Prediction Output & Gauge */}
            <div className="card gauge-card-premium">
              <div className="gauge-status-header">
                <h3>Prediction Model Output</h3>
                {predicting && <span className="model-recalculating-pill">Recalculating...</span>}
              </div>

              <div className="gauge-grid-layout">
                {/* Radial Gauge */}
                <div className="radial-gauge-side">
                  <div className="radial-progress-ring">
                    <svg viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="44" className="ring-base" />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="44"
                        className="ring-fill"
                        initial={{ strokeDashoffset: 276 }}
                        animate={{ strokeDashoffset: 276 - (276 * probability) / 100 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </svg>
                    <div className="radial-inner-value">
                      <span className="radial-val-num">{probability}%</span>
                      <span className="radial-val-lbl">Likelihood</span>
                    </div>
                  </div>
                </div>

                {/* Status Tags */}
                <div className="status-tags-side">
                  <div className="status-stat-block">
                    <span className="stat-label">Readiness Classification</span>
                    <strong className={`stat-value-tag label-${result?.readiness_label.toLowerCase().replace(' ', '-')}`}>
                      {result?.readiness_label || 'Predicting'}
                    </strong>
                  </div>
                  
                  <div className="status-stat-block" style={{ marginTop: 14 }}>
                    <span className="stat-label">Model Evaluation Confidence</span>
                    <strong className="stat-value-tag confidence-val" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                      {result?.ai_confidence_label || result?.confidence || 'Low'} ({result?.ai_confidence_score || 50}%)
                      <span className="card-stat-tooltip" style={{ cursor: 'help', fontSize: 11 }} title="AI Confidence indicates how confident the prediction model is based on the amount and quality of available data.">ℹ</span>
                    </strong>
                  </div>

                  <div className="info-bar-note">
                    <Info size={14} className="info-icon" />
                    <span>Values fluctuate instantly as you toggle simulation parameters.</span>
                  </div>
                </div>
              </div>

              <div className="divider" style={{ margin: '24px 0 16px' }} />

              {/* Explanations strengths/weaknesses */}
              {result && (
                <div className="grid-2 reasons-block-layout">
                  <div className="reasons-col-str">
                    <span className="col-hdr-reason col-hdr-str">✔ Profile Highlights</span>
                    <ul>
                      {result.top_reasons.slice(0, 3).map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                  <div className="reasons-col-gap">
                    <span className="col-hdr-reason col-hdr-gap">✖ Recommended Fixes</span>
                    <ul>
                      {result.weak_areas.slice(0, 3).map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Middle: Radar Chart */}
            <div className="card radar-chart-card">
              <h3 className="setup-card-title" style={{ marginBottom: 16 }}>Benchmark Radar Comparison</h3>
              <p className="tab-desc" style={{ marginBottom: 20 }}>Compare your simulated metrics against the baseline recommended by tier-1 recruitment filters.</p>
              
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.05)" />
                    <PolarAngleAxis dataKey="subject" stroke="var(--text-secondary)" fontSize={11} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.1)" tick={false} />
                    <Radar name="Simulated" dataKey="Current" stroke="var(--accent-blue)" fill="var(--accent-blue)" fillOpacity={0.2} />
                    <Radar name="Target Benchmark" dataKey="Baseline" stroke="var(--accent-purple)" fill="var(--accent-purple)" fillOpacity={0.05} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom: Roadmap */}
            {result && (
              <div className="card roadmap-card-premium">
                <h3 className="setup-card-title">🗺️ Career Roadmap Milestones</h3>
                <p className="tab-desc">Dynamic checklist customized to your simulated parameters.</p>
                
                <div className="roadmap-stepper-premium">
                  <div className={`step-item-premium ${scores.cgpa >= 6.5 ? 'completed' : 'pending'}`}>
                    <div className="step-badge-node">1</div>
                    <div className="step-content-meta">
                      <strong>Academic Eligibility Cutoff</strong>
                      <p>{scores.cgpa >= 6.5 ? 'Eligibility threshold cleared (>= 6.5 CGPA)' : 'CGPA below 6.5, take technical certifications to compensate'}</p>
                    </div>
                  </div>

                  <div className={`step-item-premium ${scores.resume_score >= 60 ? 'completed' : 'pending'}`}>
                    <div className="step-badge-node">2</div>
                    <div className="step-content-meta">
                      <strong>Resume Parsing Optimization</strong>
                      <p>{scores.resume_score >= 60 ? 'ATS keywords compatibility score high' : 'Refactor resume structure and add missing skills keywords'}</p>
                    </div>
                  </div>

                  <div className={`step-item-premium ${scores.technical_score >= 60 && scores.coding_score >= 60 ? 'completed' : 'pending'}`}>
                    <div className="step-badge-node">3</div>
                    <div className="step-content-meta">
                      <strong>DSA & Tech Screening</strong>
                      <p>{scores.technical_score >= 60 && scores.coding_score >= 60 ? 'CS fundamentals and algorithm metrics strong' : 'Solve at least 2 coding test questions daily'}</p>
                    </div>
                  </div>

                  <div className={`step-item-premium ${scores.mock_interview_score >= 65 ? 'completed' : 'pending'}`}>
                    <div className="step-badge-node">4</div>
                    <div className="step-content-meta">
                      <strong>Mock Interview Performance</strong>
                      <p>{scores.mock_interview_score >= 65 ? 'AI mock delivery and communication cleared' : 'Practice STAR situational question templates'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
  )
}
