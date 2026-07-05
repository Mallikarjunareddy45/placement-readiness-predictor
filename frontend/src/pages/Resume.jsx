import { useState, useEffect } from 'react'
import { getLatestResumeAPI, uploadResumeAPI, getResumeReportAPI, getResumeHistoryAPI, improveResumeAPI } from '../services/api'
// Removed local navbar import
import { motion, AnimatePresence } from 'framer-motion'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'
import {
  Upload, FileText, CheckCircle, AlertTriangle, Sparkles, Download, ArrowRight,
  TrendingUp, Award, Compass, Play, Copy, RefreshCw, BadgeAlert
} from 'lucide-react'
import './Resume.css'

export default function Resume() {
  const [analysis, setAnalysis] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [activeTab, setActiveTab] = useState('ats') // ats, ai-audit, keywords, suggestions
  
  // Rewrite Modal
  const [rewriteModal, setRewriteModal] = useState({ open: false, type: '', content: '', loading: false })

  useEffect(() => {
    fetchLatestAnalysis()
    fetchUploadHistory()
  }, [])

  const fetchLatestAnalysis = async () => {
    try {
      const res = await getLatestResumeAPI()
      setAnalysis(res.data)
    } catch (err) {
      if (err.response?.status !== 404) {
        setError('Error loading latest resume analysis.')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchUploadHistory = async () => {
    try {
      const res = await getResumeHistoryAPI()
      setHistory(res.data.history)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    else if (e.type === "dragleave") setDragActive(false)
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0])
    }
  }

  const uploadFile = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase()
    if (ext !== 'pdf' && ext !== 'docx') {
      setError('Please upload a PDF or DOCX file.')
      return
    }
    setError('')
    setUploading(true)
    const formData = new FormData()
    formData.append('resume', file)

    try {
      const res = await uploadResumeAPI(formData)
      setAnalysis(res.data)
      fetchUploadHistory()
    } catch (err) {
      setError(err.response?.data?.message || 'Resume parsing failed.')
    } finally {
      setUploading(false)
    }
  }

  const triggerRewrite = async (type) => {
    setRewriteModal({ open: true, type, content: '', loading: true })
    try {
      const res = await improveResumeAPI({ type })
      setRewriteModal(p => ({ ...p, content: res.data.improvement, loading: false }))
    } catch (err) {
      setRewriteModal(p => ({ ...p, content: 'AI rewrite failed. Try again.', loading: false }))
    }
  }

  const copyRewrite = () => {
    navigator.clipboard.writeText(rewriteModal.content)
    alert('Copied to clipboard!')
  }

  // Print PDF analysis report
  const downloadReport = async () => {
    try {
      const res = await getResumeReportAPI()
      const report = res.data
      
      const printWindow = window.open('', '_blank')
      printWindow.document.write(`
        <html>
        <head>
          <title>AI ATS Report - ${report.filename}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; color: #0f172a; }
            .header { border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 24px; }
            .scores-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
            .score-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; text-align: center; }
            .score-num { font-size: 28px; font-weight: 800; color: #4f46e5; }
            .section { margin-bottom: 24px; }
            .section-title { font-size: 16px; font-weight: 700; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 12px; }
            .badge { background: #e0e7ff; color: #4338ca; padding: 3px 8px; border-radius: 4px; font-size: 12px; margin-right: 6px; display: inline-block; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="header">
            <h1>AI Resume Audit Report</h1>
            <p>File: <strong>${report.filename}</strong> | Analyzed: ${new Date(report.analyzed_at).toLocaleDateString()}</p>
          </div>
          <div class="scores-grid">
            <div class="score-box"><div class="score-num">${report.scores.overall_ats}%</div><div>ATS Score</div></div>
            <div class="score-box"><div class="score-num">${report.scores.resume_score}%</div><div>Resume Quality</div></div>
            <div class="score-box"><div class="score-num">${report.scores.grammar_score}%</div><div>Grammar</div></div>
            <div class="score-box"><div class="score-num">${report.scores.formatting_score}%</div><div>Formatting</div></div>
          </div>
          <div class="section">
            <div class="section-title">Strengths</div>
            <ul>${report.strengths.map(s => `<li>${s}</li>`).join('')}</ul>
          </div>
          <div class="section">
            <div class="section-title">Recommendations</div>
            <ul>${report.suggestions.map(s => `<li>${s.item} (${s.priority} Priority)</li>`).join('')}</ul>
          </div>
        </body>
        </html>
      `)
      printWindow.document.close()
    } catch (err) {
      alert('Could not compile PDF report.')
    }
  }

  if (loading) return <div className="page-loading"><div className="dash-loading-spinner" /></div>

  // Charts formatters
  const radarData = analysis ? [
    { subject: 'ATS Fit', A: analysis.scores.overall_ats },
    { subject: 'Formatting', A: analysis.scores.formatting_score },
    { subject: 'Grammar', A: analysis.scores.grammar_score },
    { subject: 'Readability', A: analysis.scores.readability_score },
    { subject: 'Recruiter Score', A: analysis.scores.recruiter_score },
    { subject: 'AI Score', A: analysis.scores.ai_score },
  ] : []

  const pieData = analysis ? [
    { name: 'Detected Skills', value: Object.values(analysis.detected_categorized).flat().length, fill: 'var(--accent-blue)' },
    { name: 'Missing Keywords', value: analysis.missing_skills.length, fill: 'var(--accent-red)' }
  ] : []

  const lineData = history.map(h => ({
    name: new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    ATS: h.ats_score,
    Resume: h.resume_score
  })).reverse()

  return (
    <div className="predict-content-wrapper">
      {/* Dynamic Confetti Emitter when ATS > 90% */}
      {analysis?.scores?.overall_ats >= 90 && (
        <div className="confetti-emitter-overlay">
          {Array.from({ length: 30 }).map((_, i) => (
            <span key={i} className="confetti-piece" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              backgroundColor: ['#3b82f6', '#06b6d4', '#22c55e', '#8b5cf6'][i % 4]
            }} />
          ))}
        </div>
      )}
        
        {/* Hero Section */}
        <section className="predict-hero">
          <div className="hero-badge">
            <Sparkles size={12} className="hero-sparkle" />
            <span>AI ATS Resume Optimizer</span>
          </div>
          <h1 className="hero-title">
            AI Resume <span className="text-gradient">Analyzer</span>
          </h1>
          <p className="hero-desc">
            Upload your resume to audit grammar compliance, formatting score, and extract high-value placement keywords.
          </p>
        </section>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Upload screen */}
        {!analysis && (
          <div className="card resume-upload-container">
            <form
              id="file-upload-form"
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onSubmit={e => e.preventDefault()}
              className={`drag-drop-zone ${dragActive ? 'drag-active' : ''} ${uploading ? 'zone-uploading' : ''}`}
            >
              <input type="file" id="input-file-upload" className="file-input-hidden" onChange={handleFileChange} accept=".pdf,.docx" />
              {uploading ? (
                <div className="upload-progress-state">
                  <div className="dash-loading-spinner" style={{ width: 48, height: 48, marginBottom: 16 }} />
                  <h3>Analyzing Resume Parameters...</h3>
                  <p>Running regex filters, categorizing tech stacks, and grading grammatical syntax.</p>
                </div>
              ) : (
                <label htmlFor="input-file-upload" className="upload-label-trigger">
                  <div className="upload-icon">📄</div>
                  <h3>Drag & drop your Resume here</h3>
                  <p>Supports PDF and DOCX files (Max 5MB)</p>
                  <span className="btn btn-primary" style={{ marginTop: 16 }}>Browse Files</span>
                </label>
              )}
            </form>
          </div>
        )}

        {/* Dashboard Tabs Grid */}
        {analysis && (
          <div className="resume-grid-layout">
            
            {/* Left Nav Tabs */}
            <div className="profile-tabs-header" style={{ marginBottom: 20, alignSelf: 'flex-start' }}>
              <button className={`tab-btn ${activeTab === 'ats' ? 'tab-btn--active' : ''}`} onClick={() => setActiveTab('ats')}>
                📊 ATS Score Dials
              </button>
              <button className={`tab-btn ${activeTab === 'ai-audit' ? 'tab-btn--active' : ''}`} onClick={() => setActiveTab('ai-audit')}>
                🤖 AI Section Audit
              </button>
              <button className={`tab-btn ${activeTab === 'keywords' ? 'tab-btn--active' : ''}`} onClick={() => setActiveTab('keywords')}>
                🔑 Keywords & Role Match
              </button>
              <button className={`tab-btn ${activeTab === 'suggestions' ? 'tab-btn--active' : ''}`} onClick={() => setActiveTab('suggestions')}>
                🗺️ Planner & Planner
              </button>
            </div>

            {/* Top Row actions */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginBottom: 16 }}>
              <a 
                href={`${import.meta.env.VITE_API_URL || (window.location.origin + '/api')}/resume/file?token=${encodeURIComponent(localStorage.getItem('prp_token'))}`} 
                target="_blank" 
                rel="noreferrer" 
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: 13 }}
              >
                <FileText size={14} /> View Uploaded Resume
              </a>
              <button className="btn btn-secondary" onClick={downloadReport}><Download size={14} /> Download ATS Report</button>
              <button className="btn btn-primary" onClick={() => setAnalysis(null)}><RefreshCw size={14} /> Re-Upload Resume</button>
            </div>

            {/* Tabs content render */}
            <div className="resume-tab-pane-container">
              
              {/* ATS Dials Tab */}
              {activeTab === 'ats' && (
                <div className="tab-pane fade-in">
                  
                  {/* Dials row */}
                  <div className="dials-grid-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16, marginBottom: 30 }}>
                    {Object.entries(analysis.scores).map(([name, val]) => (
                      <div key={name} className="card val-card" style={{ background: 'rgba(18,18,26,0.6)', padding: 16 }}>
                        <div className="radial-progress-ring" style={{ width: 80, height: 80, marginBottom: 10 }}>
                          <svg viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="44" className="ring-base" />
                            <circle cx="50" cy="50" r="44" className="ring-fill" style={{
                              stroke: name.includes('overall') ? 'var(--accent-purple)' : 'var(--accent-blue)',
                              strokeDashoffset: 276 - (276 * val) / 100
                            }} />
                          </svg>
                          <div className="radial-inner-value"><span className="radial-val-num" style={{ fontSize: 18 }}>{val}%</span></div>
                        </div>
                        <span className="val-title" style={{ fontSize: 10 }}>{name.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>

                  {/* Charts Grid */}
                  <div className="grid-2" style={{ gap: 24 }}>
                    
                    {/* Radar competency chart */}
                    <div className="card">
                      <h3 className="setup-card-title" style={{ marginBottom: 16 }}>ATS Parameters Competency</h3>
                      <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer>
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                            <PolarGrid stroke="rgba(255,255,255,0.05)" />
                            <PolarAngleAxis dataKey="subject" stroke="var(--text-secondary)" fontSize={11} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.1)" tick={false} />
                            <Radar name="Scored" dataKey="A" stroke="var(--accent-blue)" fill="var(--accent-blue)" fillOpacity={0.25} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Historical trend charts */}
                    <div className="card">
                      <h3 className="setup-card-title" style={{ marginBottom: 16 }}>Historical ATS Trend</h3>
                      <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer>
                          <LineChart data={lineData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                            <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                            <Tooltip contentStyle={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }} />
                            <Line type="monotone" dataKey="ATS" stroke="var(--accent-purple)" strokeWidth={2.5} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="Resume" stroke="var(--accent-blue)" strokeWidth={2.5} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* AI Section Audit Tab */}
              {activeTab === 'ai-audit' && (
                <div className="tab-pane fade-in">
                  <h3 className="tab-pane-title">AI Section Analysis & Rewrites</h3>
                  
                  <div className="recs-cards-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                    
                    <div className="card rec-card-premium" style={{ background: 'rgba(18,18,26,0.6)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>Professional Summary Section</strong>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status: {analysis.checklist.summary ? '✓ Found' : '✖ Missing'}</p>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => triggerRewrite('summary')}>
                          Improve Summary
                        </button>
                      </div>
                    </div>

                    <div className="card rec-card-premium" style={{ background: 'rgba(18,18,26,0.6)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>Projects Description Section</strong>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status: {analysis.checklist.projects ? '✓ Found' : '✖ Missing'}</p>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => triggerRewrite('projects')}>
                          Improve Projects
                        </button>
                      </div>
                    </div>

                    <div className="card rec-card-premium" style={{ background: 'rgba(18,18,26,0.6)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>CS Core Skills Section</strong>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status: {analysis.checklist.skills ? '✓ Found' : '✖ Missing'}</p>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => triggerRewrite('skills')}>
                          Improve Skills
                        </button>
                      </div>
                    </div>

                    <div className="card rec-card-premium" style={{ background: 'rgba(18,18,26,0.6)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>Work Experience Section</strong>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status: {analysis.checklist.experience ? '✓ Found' : '✖ Missing'}</p>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => triggerRewrite('experience')}>
                          Improve Experience
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Keywords Scan Tab */}
              {activeTab === 'keywords' && (
                <div className="tab-pane fade-in">
                  
                  {/* Grid splits keyword lists and role matches */}
                  <div className="grid-2" style={{ gap: 24, alignItems: 'start' }}>
                    
                    {/* Category list */}
                    <div className="card">
                      <h3 className="setup-card-title" style={{ marginBottom: 16 }}>Detected Tech Stacks</h3>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {Object.entries(analysis.detected_categorized).map(([cat, list]) => (
                          <div key={cat}>
                            <span className="group-label" style={{ fontSize: 11 }}>{cat}</span>
                            <div className="skills-cloud" style={{ marginTop: 6 }}>
                              {list.length === 0 ? (
                                <span className="badge badge-amber" style={{ fontSize: 10 }}>No {cat} keywords detected</span>
                              ) : (
                                list.map(s => <span key={s} className="badge badge-blue" style={{ fontSize: 11 }}>{s}</span>)
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="divider" style={{ margin: '20px 0' }} />

                      <h3 className="setup-card-title" style={{ color: 'var(--accent-red)' }}>Missing ATS Keywords</h3>
                      <div className="skills-cloud" style={{ marginTop: 10 }}>
                        {analysis.missing_skills.length === 0 ? (
                          <span className="badge badge-green">No high-value placement skills missing! Excellent.</span>
                        ) : (
                          analysis.missing_skills.map(s => <span key={s} className="badge badge-red" style={{ fontSize: 11 }}>{s}</span>)
                        )}
                      </div>
                    </div>

                    {/* Role Matches */}
                    <div className="card">
                      <h3 className="setup-card-title" style={{ marginBottom: 16 }}>Role Alignment Map</h3>
                      <p className="tab-desc" style={{ marginBottom: 20 }}>Compare your resume keywords against typical filter benchmarks for key developer profiles.</p>
                      
                      <div className="roles-match-list" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {Object.entries(analysis.role_matches).map(([role, val]) => (
                          <div key={role} className="role-match-row">
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700 }}>
                              <span>{role}</span>
                              <span style={{ color: 'var(--accent-blue)' }}>{val}%</span>
                            </div>
                            <div className="score-bar" style={{ height: 6, marginTop: 4 }}>
                              <div className="score-bar-fill" style={{ width: `${val}%`, background: 'var(--accent-blue)' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* Suggestions Planner Tab */}
              {activeTab === 'suggestions' && (
                <div className="tab-pane fade-in">
                  
                  <div className="grid-2" style={{ gap: 24, alignItems: 'start' }}>
                    
                    {/* Recommendations list */}
                    <div className="card">
                      <h3 className="setup-card-title" style={{ marginBottom: 16 }}>ATS Compliance Suggestions</h3>
                      <div className="recs-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {analysis.suggestions.map((s, idx) => (
                          <div key={idx} className="rec-item card" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                            <div className="rec-header">
                              <span className="badge badge-purple">ATS Optimization</span>
                              <span className="badge badge-amber" style={{ fontSize: 10 }}>Priority: {s.priority}</span>
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: '8px 0' }}>{s.item}</p>
                            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-secondary)' }}>
                              <span>Difficulty: <strong>{s.difficulty}</strong></span>
                              <span>Est. Time: <strong>{s.time}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section checklist */}
                    <div className="card">
                      <h3 className="setup-card-title" style={{ marginBottom: 16 }}>ATS Structure Checklist</h3>
                      <div className="compliance-checklist" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {Object.entries(analysis.checklist).map(([sec, present]) => (
                          <div key={sec} className={`compliance-item ${present ? 'comp-found' : 'comp-missing'}`} style={{ padding: 10 }}>
                            <span className="comp-icon">{present ? '✓' : '○'}</span>
                            <span className="comp-name" style={{ fontSize: 13 }}>{sec.charAt(0).toUpperCase() + sec.slice(1)} Section</span>
                            <span className={`badge ${present ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 10 }}>
                              {present ? 'Compliant' : 'Missing'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>
              )}

            </div>
          </div>
        )}

      <AnimatePresence>
        {rewriteModal.open && (
          <div className="notif-drawer-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setRewriteModal(p => ({ ...p, open: false }))}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card rewrite-modal-card"
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: 500, background: 'var(--bg-card)', padding: 24, border: '1px solid var(--border-bright)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ textTransform: 'uppercase', fontSize: 13, letterSpacing: '0.04em', color: 'var(--accent-cyan)' }}>
                  ✨ AI ATS Optimizer ({rewriteModal.type})
                </h3>
                <button className="drawer-close" onClick={() => setRewriteModal(p => ({ ...p, open: false }))}>&times;</button>
              </div>

              {rewriteModal.loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 0' }}>
                  <div className="dash-loading-spinner" style={{ width: 28, height: 28, marginBottom: 10 }} />
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Generating ATS optimized phrasing...</p>
                </div>
              ) : (
                <div className="rewrite-content-pane">
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Copy and paste this into your resume draft:</p>
                  <div className="output-code" style={{ padding: 14, background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontSize: 13, whiteSpace: 'pre-wrap', lineHeight: 1.5, maxHeight: 200, overflowY: 'auto' }}>
                    {rewriteModal.content}
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                    <button className="btn btn-secondary" onClick={() => setRewriteModal(p => ({ ...p, open: false }))}>Close</button>
                    <button className="btn btn-primary" onClick={copyRewrite}><Copy size={13} /> Copy to Clipboard</button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </div>
  )
}