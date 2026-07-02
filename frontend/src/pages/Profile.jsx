import { useState, useEffect, useRef } from 'react'
import { getProfileAPI, updateProfileAPI } from '../services/api'
// Removed local sidebar import
import './Profile.css'

const BRANCHES = [
  'Computer Science', 'AI & Data Science', 'Information Technology',
  'Electronics & Communication', 'Electrical Engineering',
  'Mechanical Engineering', 'Civil Engineering', 'Chemical Engineering',
]

const PROFICIENCIES = ['Beginner', 'Intermediate', 'Advanced']

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [savingStatus, setSavingStatus] = useState('Saved') // Saved, Saving, Error
  const [activeTab, setActiveTab] = useState('academics') // academics, skills, projects, certs
  
  // Tag input states
  const [newSkill, setNewSkill] = useState({ name: '', proficiency: 'Intermediate' })
  const [newProject, setNewProject] = useState({ title: '', description: '', technologies: '', github_url: '', live_url: '' })
  const [newCert, setNewCert] = useState({ name: '', issuer: '', issue_date: '', url: '' })

  const autoSaveTimeout = useRef(null)

  useEffect(() => {
    getProfileAPI()
      .then(r => {
        setProfile(r.data)
        setForm(r.data.profile)
      })
      .catch(() => setSavingStatus('Error loading profile'))
      .finally(() => setLoading(false))
  }, [])

  // Auto-save function triggered on changes or on blur
  const triggerAutoSave = (updatedForm) => {
    setSavingStatus('Saving...')
    if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current)

    autoSaveTimeout.current = setTimeout(async () => {
      try {
        const res = await updateProfileAPI(updatedForm)
        setProfile(res.data)
        setSavingStatus('Saved')
      } catch (err) {
        setSavingStatus('Error saving changes')
      }
    }, 1000) // debounce save by 1 second
  };

  const handleFieldChange = (key, val) => {
    const updated = { ...form, [key]: val }
    setForm(updated)
    triggerAutoSave(updated)
  }

  // Skills handlers
  const addSkill = () => {
    if (!newSkill.name.trim()) return
    const updatedSkills = [...(form.skills || []), { ...newSkill }]
    const updatedForm = { ...form, skills: updatedSkills }
    setForm(updatedForm)
    setNewSkill({ name: '', proficiency: 'Intermediate' })
    triggerAutoSave(updatedForm)
  }

  const removeSkill = (index) => {
    const updatedSkills = (form.skills || []).filter((_, i) => i !== index)
    const updatedForm = { ...form, skills: updatedSkills }
    setForm(updatedForm)
    triggerAutoSave(updatedForm)
  }

  // Projects handlers
  const addProject = () => {
    if (!newProject.title.trim()) return
    const updatedProjects = [...(form.projects_list || []), { ...newProject }]
    const updatedForm = { ...form, projects_list: updatedProjects }
    setForm(updatedForm)
    setNewProject({ title: '', description: '', technologies: '', github_url: '', live_url: '' })
    triggerAutoSave(updatedForm)
  }

  const removeProject = (index) => {
    const updatedProjects = (form.projects_list || []).filter((_, i) => i !== index)
    const updatedForm = { ...form, projects_list: updatedProjects }
    setForm(updatedForm)
    triggerAutoSave(updatedForm)
  }

  // Certificates handlers
  const addCert = () => {
    if (!newCert.name.trim()) return
    const updatedCerts = [...(form.certs_list || []), { ...newCert }]
    const updatedForm = { ...form, certs_list: updatedCerts }
    setForm(updatedForm)
    setNewCert({ name: '', issuer: '', issue_date: '', url: '' })
    triggerAutoSave(updatedForm)
  }

  const removeCert = (index) => {
    const updatedCerts = (form.certs_list || []).filter((_, i) => i !== index)
    const updatedForm = { ...form, certs_list: updatedCerts }
    setForm(updatedForm)
    triggerAutoSave(updatedForm)
  }

  if (loading) return <div className="page-loading"><div className="dash-loading-spinner" /></div>

  const pct = profile?.completion?.percentage || 0
  const missing = profile?.completion?.missing_fields || []

  return (
    <div className="profile-page fade-in">
          {/* Header */}
          <div className="profile-header">
            <div>
              <h1 className="dash-title">Student Profile</h1>
              <p className="dash-subtitle">
                Academic & technical portfolio used by the AI prediction model.
              </p>
            </div>
            
            {/* Auto Save Status Indicator */}
            <div className="autosave-indicator">
              <span className={`status-dot ${savingStatus.toLowerCase() === 'saved' ? 'status-saved' : savingStatus.toLowerCase() === 'saving...' ? 'status-saving' : 'status-error'}`} />
              <span className="status-text">{savingStatus}</span>
            </div>
          </div>

          <div className="profile-grid">
            {/* Left Column - Card */}
            <div className="profile-sidebar-col">
              <div className="card profile-card-main">
                <div className="avatar-section">
                  <img src={form.photo_url} alt="Profile" className="profile-avatar-img" />
                  <h3 className="profile-student-name">{form.name || 'Set Your Name'}</h3>
                  <p className="profile-student-email">{form.email}</p>
                </div>

                <div className="profile-completion-section">
                  <div className="completion-bar-header">
                    <span>Profile Completion</span>
                    <span className="pct-value">{pct}%</span>
                  </div>
                  <div className="score-bar">
                    <div
                      className="score-bar-fill"
                      style={{
                        width: `${pct}%`,
                        background: pct === 100 ? 'var(--accent-green)' : 'linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))',
                      }}
                    />
                  </div>
                </div>

                <div className="divider" />

                <div className="profile-quick-details">
                  <div className="input-group">
                    <label className="input-label">Phone Number</label>
                    <input
                      type="text"
                      className="input input-sm"
                      placeholder="e.g. +91 9876543210"
                      value={form.phone || ''}
                      onChange={e => handleFieldChange('phone', e.target.value)}
                    />
                  </div>
                  <div className="input-group" style={{ marginTop: 12 }}>
                    <label className="input-label">Languages Known</label>
                    <input
                      type="text"
                      className="input input-sm"
                      placeholder="e.g. English, Telugu, Hindi"
                      value={form.languages || ''}
                      onChange={e => handleFieldChange('languages', e.target.value)}
                    />
                  </div>
                  <div className="input-group" style={{ marginTop: 12 }}>
                    <label className="input-label">Portfolio Website</label>
                    <input
                      type="text"
                      className="input input-sm"
                      placeholder="https://yourportfolio.dev"
                      value={form.portfolio || ''}
                      onChange={e => handleFieldChange('portfolio', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Navigation Tabs */}
            <div className="profile-tabs-col">
              <div className="profile-tabs-header">
                <button className={`tab-btn ${activeTab === 'academics' ? 'tab-btn--active' : ''}`} onClick={() => setActiveTab('academics')}>
                  🎓 Academics
                </button>
                <button className={`tab-btn ${activeTab === 'skills' ? 'tab-btn--active' : ''}`} onClick={() => setActiveTab('skills')}>
                  🎯 Skills
                </button>
                <button className={`tab-btn ${activeTab === 'projects' ? 'tab-btn--active' : ''}`} onClick={() => setActiveTab('projects')}>
                  💻 Projects
                </button>
                <button className={`tab-btn ${activeTab === 'certs' ? 'tab-btn--active' : ''}`} onClick={() => setActiveTab('certs')}>
                  📜 Certificates
                </button>
              </div>

              <div className="profile-tabs-content">
                {/* Academics Tab */}
                {activeTab === 'academics' && (
                  <div className="card tab-pane fade-in">
                    <h3 className="tab-pane-title">Academic Details</h3>
                    <div className="grid-2">
                      <div className="input-group">
                        <label className="input-label">Full Name</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="Full Name"
                          value={form.name || ''}
                          onChange={e => handleFieldChange('name', e.target.value)}
                        />
                      </div>
                      <div className="input-group">
                        <label className="input-label">CGPA</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          className="input"
                          placeholder="e.g. 8.5"
                          value={form.cgpa || ''}
                          onChange={e => handleFieldChange('cgpa', e.target.value)}
                        />
                      </div>
                      <div className="input-group">
                        <label className="input-label">College</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="College Name"
                          value={form.college || ''}
                          onChange={e => handleFieldChange('college', e.target.value)}
                        />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Department / Branch</label>
                        <select
                          className="input"
                          value={form.branch || ''}
                          onChange={e => handleFieldChange('branch', e.target.value)}
                        >
                          <option value="">Select Branch</option>
                          {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                      <div className="input-group">
                        <label className="input-label">Graduation Year</label>
                        <select
                          className="input"
                          value={form.graduation_year || ''}
                          onChange={e => handleFieldChange('graduation_year', e.target.value)}
                        >
                          <option value="">Select Year</option>
                          {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                      <div className="input-group">
                        <label className="input-label">Completed Internships</label>
                        <input
                          type="number"
                          className="input"
                          placeholder="0"
                          value={form.internships ?? ''}
                          onChange={e => handleFieldChange('internships', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="divider" style={{ margin: '24px 0' }} />

                    <h3 className="tab-pane-title">Online Presence</h3>
                    <div className="grid-2">
                      <div className="input-group">
                        <label className="input-label">GitHub Link</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="https://github.com/username"
                          value={form.github_url || ''}
                          onChange={e => handleFieldChange('github_url', e.target.value)}
                        />
                      </div>
                      <div className="input-group">
                        <label className="input-label">LinkedIn Link</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="https://linkedin.com/in/username"
                          value={form.linkedin_url || ''}
                          onChange={e => handleFieldChange('linkedin_url', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Skills Tab */}
                {activeTab === 'skills' && (
                  <div className="card tab-pane fade-in">
                    <h3 className="tab-pane-title">Skills Inventory</h3>
                    
                    {/* Add skill row */}
                    <div className="add-item-form grid-3" style={{ marginBottom: 20 }}>
                      <div className="input-group">
                        <label className="input-label">Skill Name</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="e.g. Python"
                          value={newSkill.name}
                          onChange={e => setNewSkill(p => ({ ...p, name: e.target.value }))}
                        />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Proficiency</label>
                        <select
                          className="input"
                          value={newSkill.proficiency}
                          onChange={e => setNewSkill(p => ({ ...p, proficiency: e.target.value }))}
                        >
                          {PROFICIENCIES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div className="input-group" style={{ justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-primary" onClick={addSkill} style={{ width: '100%', height: 42 }}>
                          + Add Skill
                        </button>
                      </div>
                    </div>

                    <div className="skills-cloud">
                      {(!form.skills || form.skills.length === 0) ? (
                        <p className="no-data-text">No skills added yet. Add some skills above!</p>
                      ) : (
                        form.skills.map((s, idx) => (
                          <div key={idx} className="skill-tag">
                            <span className="skill-name">{s.name}</span>
                            <span className={`skill-level level-${s.proficiency.toLowerCase()}`}>{s.proficiency}</span>
                            <button type="button" className="skill-remove-btn" onClick={() => removeSkill(idx)}>&times;</button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Projects Tab */}
                {activeTab === 'projects' && (
                  <div className="card tab-pane fade-in">
                    <h3 className="tab-pane-title">Projects Portfolio</h3>
                    
                    <div className="add-item-form card" style={{ background: 'var(--bg-elevated)', marginBottom: 24 }}>
                      <p className="form-legend">Add New Project</p>
                      <div className="grid-2">
                        <div className="input-group">
                          <label className="input-label">Project Title</label>
                          <input
                            type="text"
                            className="input"
                            placeholder="e.g. Portfolio Website"
                            value={newProject.title}
                            onChange={e => setNewProject(p => ({ ...p, title: e.target.value }))}
                          />
                        </div>
                        <div className="input-group">
                          <label className="input-label">Technologies Used</label>
                          <input
                            type="text"
                            className="input"
                            placeholder="e.g. React, Node.js, SQL"
                            value={newProject.technologies}
                            onChange={e => setNewProject(p => ({ ...p, technologies: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="input-group" style={{ marginTop: 12 }}>
                        <label className="input-label">Description</label>
                        <textarea
                          className="input"
                          rows="2"
                          placeholder="Describe your project"
                          value={newProject.description}
                          onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))}
                        />
                      </div>
                      <div className="grid-2" style={{ marginTop: 12 }}>
                        <div className="input-group">
                          <label className="input-label">GitHub URL</label>
                          <input
                            type="text"
                            className="input"
                            placeholder="https://github.com/..."
                            value={newProject.github_url}
                            onChange={e => setNewProject(p => ({ ...p, github_url: e.target.value }))}
                          />
                        </div>
                        <div className="input-group" style={{ justifyContent: 'flex-end' }}>
                          <button type="button" className="btn btn-primary" onClick={addProject} style={{ height: 42, width: '100%', marginTop: 22 }}>
                            Add Project to Portfolio
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="projects-list">
                      {(!form.projects_list || form.projects_list.length === 0) ? (
                        <p className="no-data-text">No projects added yet.</p>
                      ) : (
                        form.projects_list.map((proj, idx) => (
                          <div key={idx} className="project-list-card card" style={{ background: 'var(--bg-elevated)', marginBottom: 12 }}>
                            <div className="project-card-header">
                              <h4>{proj.title}</h4>
                              <button className="btn btn-sm btn-danger" onClick={() => removeProject(idx)}>Delete</button>
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '6px 0' }}>{proj.description}</p>
                            <div className="project-card-footer">
                              <span className="badge badge-blue">{proj.technologies}</span>
                              {proj.github_url && <a href={proj.github_url} target="_blank" rel="noreferrer" className="project-link">GitHub ↗</a>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Certificates Tab */}
                {activeTab === 'certs' && (
                  <div className="card tab-pane fade-in">
                    <h3 className="tab-pane-title">Certifications & Credentials</h3>

                    <div className="add-item-form card" style={{ background: 'var(--bg-elevated)', marginBottom: 24 }}>
                      <p className="form-legend">Add Certification</p>
                      <div className="grid-2">
                        <div className="input-group">
                          <label className="input-label">Certificate Name</label>
                          <input
                            type="text"
                            className="input"
                            placeholder="e.g. AWS Cloud Practitioner"
                            value={newCert.name}
                            onChange={e => setNewCert(p => ({ ...p, name: e.target.value }))}
                          />
                        </div>
                        <div className="input-group">
                          <label className="input-label">Issuer</label>
                          <input
                            type="text"
                            className="input"
                            placeholder="e.g. Amazon Web Services"
                            value={newCert.issuer}
                            onChange={e => setNewCert(p => ({ ...p, issuer: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="grid-2" style={{ marginTop: 12 }}>
                        <div className="input-group">
                          <label className="input-label">Issue Date / Month</label>
                          <input
                            type="text"
                            className="input"
                            placeholder="e.g. Jan 2025"
                            value={newCert.issue_date}
                            onChange={e => setNewCert(p => ({ ...p, issue_date: e.target.value }))}
                          />
                        </div>
                        <div className="input-group" style={{ justifyContent: 'flex-end' }}>
                          <button type="button" className="btn btn-primary" onClick={addCert} style={{ height: 42, width: '100%', marginTop: 22 }}>
                            Add Certificate
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="certs-list">
                      {(!form.certs_list || form.certs_list.length === 0) ? (
                        <p className="no-data-text">No certifications registered yet.</p>
                      ) : (
                        form.certs_list.map((cert, idx) => (
                          <div key={idx} className="project-list-card card" style={{ background: 'var(--bg-elevated)', marginBottom: 12 }}>
                            <div className="project-card-header">
                              <h4>{cert.name}</h4>
                              <button className="btn btn-sm btn-danger" onClick={() => removeCert(idx)}>Delete</button>
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '6px 0' }}>Issued by: <strong>{cert.issuer}</strong> ({cert.issue_date})</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
  )
}