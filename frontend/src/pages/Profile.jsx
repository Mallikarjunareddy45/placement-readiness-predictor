import { useState, useEffect, useRef } from 'react'
import { getProfileAPI, updateProfileAPI, uploadPhotoAPI, deletePhotoAPI } from '../services/api'
import { Camera, Eye, Trash2, X, Image as ImageIcon } from 'lucide-react'
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

  // Photo uploading states
  const [showMenu, setShowMenu] = useState(false)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  const autoSaveTimeout = useRef(null)
  const fileInputRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    getProfileAPI()
      .then(r => {
        setProfile(r.data)
        setForm(r.data.profile)
      })
      .catch(() => setSavingStatus('Error loading profile'))
      .finally(() => setLoading(false))
  }, [])

  // Close photo menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // Close preview modal on ESC key
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        setShowPreviewModal(false)
      }
    }
    window.addEventListener('keydown', handleEscKey)
    return () => window.removeEventListener('keydown', handleEscKey)
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

  // Photo Uploader actions
  const handlePhotoUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Enforce 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size exceeds 5 MB limit.")
      return
    }

    // Validate image format extensions
    const allowed = ['png', 'jpg', 'jpeg', 'webp']
    const ext = file.name.split('.').pop().toLowerCase()
    if (!allowed.includes(ext)) {
      alert("Only PNG, JPG, JPEG, and WEBP image files are allowed.")
      return
    }

    const formData = new FormData()
    formData.append('photo', file)

    setPhotoLoading(true)
    setShowMenu(false)
    try {
      const res = await uploadPhotoAPI(formData)
      if (res.data?.success) {
        setForm(p => ({ ...p, photo_url: res.data.photo_url }))
        setProfile(p => ({
          ...p,
          profile: { ...p.profile, photo_url: res.data.photo_url }
        }))
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to upload profile picture.")
    } finally {
      setPhotoLoading(false)
    }
  }

  const handleRemovePhoto = async () => {
    setShowMenu(false)
    setPhotoLoading(true)
    try {
      const res = await deletePhotoAPI()
      if (res.data?.success) {
        const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${form.name || 'default'}`
        setForm(p => ({ ...p, photo_url: defaultAvatar }))
        setProfile(p => ({
          ...p,
          profile: { ...p.profile, photo_url: defaultAvatar }
        }))
      }
    } catch (err) {
      alert("Failed to remove profile picture.")
    } finally {
      setPhotoLoading(false)
    }
  }

  if (loading) return <div className="page-loading"><div className="dash-loading-spinner" /></div>

  const pct = profile?.completion?.percentage || 0
  const missing = profile?.completion?.missing_fields || []

  // Fallback checks
  const isDefaultAvatar = !form.photo_url || form.photo_url.includes("dicebear.com")

  return (
    <div className="profile-page fade-in">
      
      {/* Hidden File Picker Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".png,.jpg,.jpeg,.webp" 
        style={{ display: 'none' }} 
      />

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
          <div className="card profile-card-main" style={{ position: 'relative' }}>
            
            <div className="avatar-section" ref={dropdownRef}>
              
              {/* Clickable Image wrapper with camera badge */}
              <div 
                className="avatar-wrapper"
                onClick={() => setShowMenu(p => !p)}
                title="Click to manage photo"
              >
                <img 
                  src={form.photo_url} 
                  alt="Profile" 
                  className="profile-avatar-img" 
                />
                
                {/* Camera / Edit bottom-right icon */}
                <div 
                  className="camera-icon-badge"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePhotoUploadClick()
                  }}
                  title="Upload profile picture directly"
                >
                  <Camera size={14} />
                </div>

                {/* Loading indicator */}
                {photoLoading && (
                  <div className="photo-loading-overlay">
                    <div className="photo-loading-spinner" />
                  </div>
                )}
              </div>

              {/* modern options dropdown menu */}
              {showMenu && (
                <div className="photo-dropdown-menu">
                  <button type="button" className="photo-dropdown-item" onClick={handlePhotoUploadClick}>
                    <Camera size={13} />
                    <span>Upload Photo</span>
                  </button>
                  <button 
                    type="button" 
                    className="photo-dropdown-item" 
                    onClick={() => {
                      setShowMenu(false)
                      setShowPreviewModal(true)
                    }}
                    disabled={isDefaultAvatar}
                  >
                    <Eye size={13} />
                    <span>View Photo</span>
                  </button>
                  <button 
                    type="button" 
                    className="photo-dropdown-item photo-dropdown-item--remove" 
                    onClick={handleRemovePhoto}
                    disabled={isDefaultAvatar}
                  >
                    <Trash2 size={13} />
                    <span>Remove Photo</span>
                  </button>
                </div>
              )}

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
              Academic Details
            </button>
            <button className={`tab-btn ${activeTab === 'skills' ? 'tab-btn--active' : ''}`} onClick={() => setActiveTab('skills')}>
              Skills ({form.skills?.length || 0})
            </button>
            <button className={`tab-btn ${activeTab === 'projects' ? 'tab-btn--active' : ''}`} onClick={() => setActiveTab('projects')}>
              Projects ({form.projects_list?.length || 0})
            </button>
            <button className={`tab-btn ${activeTab === 'certs' ? 'tab-btn--active' : ''}`} onClick={() => setActiveTab('certs')}>
              Certifications ({form.certs_list?.length || 0})
            </button>
          </div>

          <div className="profile-tab-content">
            
            {/* 1. Academic Details Tab */}
            {activeTab === 'academics' && (
              <div className="card tab-card fade-in">
                <h3 className="setup-card-title" style={{ marginBottom: 20 }}>Education Credentials</h3>
                <div className="grid-2">
                  <div className="input-group">
                    <label className="input-label">Full Name</label>
                    <input
                      type="text"
                      className="input"
                      value={form.name || ''}
                      onChange={e => handleFieldChange('name', e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Email Address</label>
                    <input
                      type="email"
                      className="input"
                      value={form.email || ''}
                      disabled
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ marginTop: 16 }}>
                  <div className="input-group">
                    <label className="input-label">University / College</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Stanford University"
                      value={form.college || ''}
                      onChange={e => handleFieldChange('college', e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Department / Branch</label>
                    <select
                      className="input select-glass"
                      value={form.branch || ''}
                      onChange={e => handleFieldChange('branch', e.target.value)}
                    >
                      <option value="">Select Branch</option>
                      {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid-2" style={{ marginTop: 16 }}>
                  <div className="input-group">
                    <label className="input-label">Current CGPA</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      className="input"
                      placeholder="Scale of 10.0"
                      value={form.cgpa || ''}
                      onChange={e => handleFieldChange('cgpa', e.target.value ? parseFloat(e.target.value) : '')}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Graduation Year</label>
                    <input
                      type="number"
                      min="1990"
                      max="2035"
                      className="input"
                      placeholder="e.g. 2026"
                      value={form.graduation_year || ''}
                      onChange={e => handleFieldChange('graduation_year', e.target.value ? parseInt(e.target.value) : '')}
                    />
                  </div>
                </div>

                <div className="grid-3" style={{ marginTop: 16 }}>
                  <div className="input-group">
                    <label className="input-label">Total Internships</label>
                    <input
                      type="number"
                      min="0"
                      className="input"
                      value={form.internships || 0}
                      onChange={e => handleFieldChange('internships', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Academic Projects</label>
                    <input
                      type="number"
                      min="0"
                      className="input"
                      value={form.projects_count || 0}
                      onChange={e => handleFieldChange('projects_count', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Professional Certifications</label>
                    <input
                      type="number"
                      min="0"
                      className="input"
                      value={form.certifications || 0}
                      onChange={e => handleFieldChange('certifications', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ marginTop: 16 }}>
                  <div className="input-group">
                    <label className="input-label">GitHub URL</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="https://github.com/username"
                      value={form.github_url || ''}
                      onChange={e => handleFieldChange('github_url', e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">LinkedIn Profile URL</label>
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

            {/* 2. Skills Tab */}
            {activeTab === 'skills' && (
              <div className="card tab-card fade-in">
                <h3 className="setup-card-title" style={{ marginBottom: 16 }}>Technical Skills Portfolio</h3>
                
                {/* Skill adder form */}
                <div className="tag-adder-row" style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Skill name e.g. React.js, Docker"
                    value={newSkill.name}
                    onChange={e => setNewSkill(p => ({ ...p, name: e.target.value }))}
                  />
                  <select
                    className="input select-glass"
                    style={{ width: 160 }}
                    value={newSkill.proficiency}
                    onChange={e => setNewSkill(p => ({ ...p, proficiency: e.target.value }))}
                  >
                    {PROFICIENCIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <button className="btn btn-primary" onClick={addSkill}>Add Skill</button>
                </div>

                <div className="skills-tags-container" style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {(!form.skills || form.skills.length === 0) ? (
                    <p className="no-data-text">No skills added to portfolio yet.</p>
                  ) : (
                    form.skills.map((s, idx) => (
                      <div key={idx} className="skill-tag">
                        <span className="skill-name">{s.name}</span>
                        <span className={`skill-level level-${s.proficiency.toLowerCase()}`}>{s.proficiency}</span>
                        <button className="skill-remove-btn" onClick={() => removeSkill(idx)}>&times;</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 3. Projects Tab */}
            {activeTab === 'projects' && (
              <div className="card tab-card fade-in">
                <h3 className="setup-card-title" style={{ marginBottom: 16 }}>Academic & Personal Projects</h3>
                
                {/* Project adder form */}
                <div className="adder-block card" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: 16, marginBottom: 20 }}>
                  <div className="grid-2">
                    <div className="input-group">
                      <label className="input-label">Project Title</label>
                      <input
                        type="text"
                        className="input input-sm"
                        placeholder="e.g. AI Face Detector"
                        value={newProject.title}
                        onChange={e => setNewProject(p => ({ ...p, title: e.target.value }))}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Tech Stack (comma separated)</label>
                      <input
                        type="text"
                        className="input input-sm"
                        placeholder="e.g. Python, OpenCV, Flask"
                        value={newProject.technologies}
                        onChange={e => setNewProject(p => ({ ...p, technologies: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="input-group" style={{ marginTop: 10 }}>
                    <label className="input-label">Brief Description</label>
                    <textarea
                      className="input"
                      rows="2"
                      placeholder="Brief details about what the project does..."
                      value={newProject.description}
                      onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))}
                    />
                  </div>
                  <div className="grid-2" style={{ marginTop: 10 }}>
                    <div className="input-group">
                      <label className="input-label">GitHub Link</label>
                      <input
                        type="text"
                        className="input input-sm"
                        placeholder="https://github.com/username/project"
                        value={newProject.github_url}
                        onChange={e => setNewProject(p => ({ ...p, github_url: e.target.value }))}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Live Deployment URL</label>
                      <input
                        type="text"
                        className="input input-sm"
                        placeholder="https://project.live"
                        value={newProject.live_url}
                        onChange={e => setNewProject(p => ({ ...p, live_url: e.target.value }))}
                      />
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={addProject}>Add Project</button>
                </div>

                <div className="projects-grid-list" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                  {(!form.projects_list || form.projects_list.length === 0) ? (
                    <p className="no-data-text">No project summaries submitted.</p>
                  ) : (
                    form.projects_list.map((proj, idx) => (
                      <div key={idx} className="card project-item-card" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: 16 }}>
                        <div className="project-card-header">
                          <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: 15 }}>{proj.title}</h4>
                          <button className="btn btn-ghost btn-sm" onClick={() => removeProject(idx)} style={{ color: 'var(--accent-red)' }}>Remove</button>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '6px 0 12px' }}>{proj.description}</p>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          <strong>Technologies:</strong> {proj.technologies}
                        </div>
                        <div className="project-card-footer">
                          {proj.github_url && <a href={proj.github_url} target="_blank" rel="noopener noreferrer" className="project-link">GitHub Repo →</a>}
                          {proj.live_url && <a href={proj.live_url} target="_blank" rel="noopener noreferrer" className="project-link">Live Demo →</a>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 4. Certifications Tab */}
            {activeTab === 'certs' && (
              <div className="card tab-card fade-in">
                <h3 className="setup-card-title" style={{ marginBottom: 16 }}>Professional Certifications</h3>
                
                {/* Certification adder form */}
                <div className="adder-block card" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: 16, marginBottom: 20 }}>
                  <div className="grid-2">
                    <div className="input-group">
                      <label className="input-label">Certification Name</label>
                      <input
                        type="text"
                        className="input input-sm"
                        placeholder="e.g. AWS Solutions Architect"
                        value={newCert.name}
                        onChange={e => setNewCert(p => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Issuing Authority</label>
                      <input
                        type="text"
                        className="input input-sm"
                        placeholder="e.g. Amazon Web Services (AWS)"
                        value={newCert.issuer}
                        onChange={e => setNewCert(p => ({ ...p, issuer: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid-2" style={{ marginTop: 10 }}>
                    <div className="input-group">
                      <label className="input-label">Date of Issue (MM/YYYY)</label>
                      <input
                        type="text"
                        className="input input-sm"
                        placeholder="e.g. 05/2026"
                        value={newCert.issue_date}
                        onChange={e => setNewCert(p => ({ ...p, issue_date: e.target.value }))}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Credential Verification URL</label>
                      <input
                        type="text"
                        className="input input-sm"
                        placeholder="https://verify.credentials.com"
                        value={newCert.url}
                        onChange={e => setNewCert(p => ({ ...p, url: e.target.value }))}
                      />
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={addCert}>Add Certificate</button>
                </div>

                <div className="certs-grid-list" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                  {(!form.certs_list || form.certs_list.length === 0) ? (
                    <p className="no-data-text">No certification achievements cataloged.</p>
                  ) : (
                    form.certs_list.map((c, idx) => (
                      <div key={idx} className="card cert-item-card" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: 16 }}>
                        <div className="project-card-header">
                          <div>
                            <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: 14 }}>{c.name}</h4>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Issued by {c.issuer} · {c.issue_date}</span>
                          </div>
                          <button className="btn btn-ghost btn-sm" onClick={() => removeCert(idx)} style={{ color: 'var(--accent-red)' }}>Remove</button>
                        </div>
                        {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="project-link" style={{ marginTop: 10, display: 'inline-block' }}>Verify Credential →</a>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 👁 View Photo Full-screen preview modal overlay */}
      {showPreviewModal && (
        <div className="photo-modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <button className="photo-modal-close" onClick={() => setShowPreviewModal(false)} aria-label="Close photo view">
            <X size={18} />
          </button>
          <div className="photo-modal-content" onClick={e => e.stopPropagation()}>
            <img 
              src={form.photo_url} 
              alt="Profile Full View" 
              className="photo-modal-img" 
            />
          </div>
        </div>
      )}

    </div>
  )
}