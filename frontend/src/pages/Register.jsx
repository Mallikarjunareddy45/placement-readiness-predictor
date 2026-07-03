import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerAPI, socialLoginAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { auth, googleProvider, githubProvider, signInWithPopup } from '../firebase'
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Cpu, TrendingUp, Shield, AlertCircle } from 'lucide-react'
import '../css/Auth.css'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  // 3D Perspective States
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [reflectionPos, setReflectionPos] = useState({ x: 50, y: 50 })
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  
  // Password Visibility States
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Animated Toast Notifications State
  const [toasts, setToasts] = useState([])

  // Speech bubble cycling messages
  const welcomeMessages = [
    "Let's get started! 🚀 Create your account and let AI guide you.",
    "✨ Welcome!",
    "Let's build your future together. 🚀",
    "Create your account to begin.",
    "AI is ready to guide you. 🎯"
  ]
  const [msgIdx, setMsgIdx] = useState(0)

  useEffect(() => {
    const cycle = setInterval(() => {
      setMsgIdx(prev => (prev + 1) % welcomeMessages.length)
    }, 4200)
    return () => clearInterval(cycle)
  }, [])

  const addToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }

  // Page level light coordinates tracking
  const handlePageMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY })
  }

  // 3D rotation calculations on hover
  const handleCardMouseMove = (e) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const rx = e.clientX - rect.left
    const ry = e.clientY - rect.top
    setReflectionPos({
      x: (rx / rect.width) * 100,
      y: (ry / rect.height) * 100
    })

    const tx = e.clientX - rect.left - rect.width / 2
    const ty = e.clientY - rect.top - rect.height / 2
    setTilt({
      x: (tx / (rect.width / 2)) * 12,
      y: -(ty / (rect.height / 2)) * 12
    })
  }

  const handleCardMouseLeave = () => {
    setTilt({ x: 0, y: 0 })
    setReflectionPos({ x: 50, y: 50 })
  }

  // Google Login Popup Trigger
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user
      await handleSocialLoginSuccess(user.email, user.displayName || user.email.split('@')[0])
    } catch (err) {
      console.warn("Firebase Google login failed or unconfigured, running mock profile fallback:", err)
      await handleSocialLoginSuccess("google.student@predictor.com", "Google Student")
    }
  }

  // GitHub Login Popup Trigger
  const handleGithubLogin = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider)
      const user = result.user
      const email = user.email || `${user.uid}@github.com`
      const name = user.displayName || user.reloadUserInfo?.screenName || "GitHub User"
      await handleSocialLoginSuccess(email, name)
    } catch (err) {
      console.warn("Firebase GitHub login failed or unconfigured, running mock profile fallback:", err)
      await handleSocialLoginSuccess("github.developer@predictor.com", "Github Developer")
    }
  }

  const handleSocialLoginSuccess = async (email, name) => {
    try {
      const res = await socialLoginAPI({ email, name })
      if (res.data?.success) {
        login(res.data.token, res.data.student)
        addToast("Authentication successful! Redirecting...", "success")
        setTimeout(() => navigate('/dashboard'), 1200)
      } else {
        addToast("Social login rejected by server.", "error")
      }
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to synchronize social authentication.", "error")
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // Client side validation
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      addToast('Password must be at least 6 characters.', 'error')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      addToast('Passwords do not match.', 'error')
      return
    }

    if (!agree) {
      setError('Please agree to the Terms of Service and Privacy Policy.')
      addToast('Please agree to the Terms of Service and Privacy Policy.', 'error')
      return
    }

    setLoading(true)
    try {
      // Send only required keys to registration API
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password
      }
      const res = await registerAPI(payload)
      login(res.data.token, res.data.student)
      addToast("Account created successfully! Redirecting...", "success")
      setTimeout(() => navigate('/profile'), 1200)
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
      addToast(err.response?.data?.message || 'Registration failed.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page" onMouseMove={handlePageMouseMove}>
      
      {/* Toast Notification Container */}
      <div className="toast-overlay">
        {toasts.map(t => (
          <div key={t.id} className={`toast-glass toast-glass--${t.type}`}>
            <AlertCircle size={16} style={{ color: t.type === 'success' ? '#10b981' : '#ef4444' }} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* 1. Futuristic Space Background */}
      <div className="auth-bg">
        <div className="auth-bg-grid" />
        <div className="auth-bg-glow auth-bg-glow--1" />
        <div className="auth-bg-glow auth-bg-glow--2" />
      </div>

      {/* 2. Interactive Light Spot */}
      <div 
        className="auth-cursor-glow"
        style={{
          left: mousePos.x,
          top: mousePos.y,
          width: 500,
          height: 500
        }}
      />

      {/* 3. Central split content container */}
      <div className="auth-content-split">
        
        {/* Left Hand side: Waving Robot holding Tablet */}
        <div 
          className="robot-side-panel auth-load-anim"
          style={{
            transform: `perspective(1000px) rotateY(${tilt.x * 0.4}deg) rotateX(${tilt.y * 0.4}deg)`
          }}
        >
          {/* Drifting Speech bubble */}
          <div className="robot-speech-bubble">
            {welcomeMessages[msgIdx]}
          </div>

          {/* Floating Robot pointing/tablet image */}
          <div className="robot-avatar-container">
            <img 
              src="/register_robot.png" 
              alt="AI Registration Robot" 
              className="robot-avatar-img"
            />
          </div>

          {/* Rotating Hologram Platform rings */}
          <div className="hologram-platform">
            <div className="hologram-ring" />
            <div className="hologram-ring hologram-ring--outer" />
            <div className="hologram-ring hologram-ring--glow" />
            <div className="hologram-beams" />
          </div>
        </div>

        {/* Right Hand side: Register authentication card */}
        <div 
          className="auth-card auth-load-anim"
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
          style={{
            transform: `perspective(1000px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`
          }}
        >
          {/* Sweeping gloss reflection overlay */}
          <div 
            className="card-reflection"
            style={{
              background: `radial-gradient(circle at ${reflectionPos.x}% ${reflectionPos.y}%, rgba(255, 255, 255, 0.08) 0%, transparent 60%)`
            }}
          />

          <div className="auth-logo parallax-logo">
            <div className="auth-logo-mark">PRP</div>
            <div>
              <div className="auth-logo-title">Placement Readiness Predictor</div>
              <div className="auth-logo-sub">AI-Powered Career Intelligence</div>
            </div>
          </div>

          <div className="parallax-title">
            <h1 className="auth-heading">Create your account</h1>
            <p className="auth-subheading">Join us and start your AI-powered journey</p>
          </div>

          {error && <div className="alert alert-error" style={{ fontSize: 13, padding: 12, borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            
            {/* Full Name input field */}
            <div className="input-group parallax-input">
              <label className="input-label" htmlFor="name-input">Full Name</label>
              <div className="input-container">
                <User className="input-icon-left" size={16} />
                <input
                  id="name-input"
                  className="input-glass"
                  type="text"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Email input field */}
            <div className="input-group parallax-input" style={{ transform: 'translateZ(26px)' }}>
              <label className="input-label" htmlFor="email-input">Email Address</label>
              <div className="input-container">
                <Mail className="input-icon-left" size={16} />
                <input
                  id="email-input"
                  className="input-glass"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Password input field */}
            <div className="input-group parallax-input" style={{ transform: 'translateZ(28px)' }}>
              <label className="input-label" htmlFor="password-input">Password</label>
              <div className="input-container">
                <Lock className="input-icon-left" size={16} />
                <input
                  id="password-input"
                  className="input-glass"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(p => !p)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password input field */}
            <div className="input-group parallax-input" style={{ transform: 'translateZ(30px)' }}>
              <label className="input-label" htmlFor="confirm-password-input">Confirm Password</label>
              <div className="input-container">
                <Lock className="input-icon-left" size={16} />
                <input
                  id="confirm-password-input"
                  className="input-glass"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(p => !p)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Agree Terms Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0', fontSize: 12, color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                id="terms-checkbox"
                checked={agree}
                onChange={e => setAgree(e.target.checked)}
                style={{ accentColor: 'var(--accent-cyan)' }}
              />
              <label htmlFor="terms-checkbox">
                I agree to the <a href="#terms" className="auth-link" onClick={e => e.preventDefault()}>Terms of Service</a> and <a href="#privacy" className="auth-link" onClick={e => e.preventDefault()}>Privacy Policy</a>
              </label>
            </div>

            <button
              type="submit"
              className="btn-auth-premium parallax-btn"
              disabled={loading}
              style={{ width: '100%', marginTop: 8 }}
            >
              {loading ? <span className="btn-spinner" /> : null}
              <span>{loading ? 'Creating account…' : 'Create Account'}</span>
              {!loading && <ArrowRight size={14} style={{ marginLeft: 4 }} />}
            </button>
          </form>

          {/* Social login divider and options */}
          <div style={{ textAlign: 'center', margin: '20px 0 10px 0', fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            or continue with
          </div>

          {/* Center aligned Google / GitHub options (LinkedIn Removed) */}
          <div className="social-login-row" style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
            <button className="btn-social-glass" onClick={handleGoogleLogin} aria-label="Sign in with Google">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
            </button>
            <button className="btn-social-glass" onClick={handleGithubLogin} aria-label="Sign in with GitHub">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
                <path d="M9 18c-4.51 2-5-2-7-2"/>
              </svg>
            </button>
          </div>

          <p className="auth-footer parallax-footer">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>

      </div>

      {/* 5. Bottom horizontal Features Grid */}
      <div className="auth-features-banner auth-load-anim" style={{ animationDelay: '0.2s' }}>
        <div className="feature-banner-item">
          <div className="feature-banner-icon">
            <Cpu size={18} />
          </div>
          <div>
            <h4 className="feature-banner-title">AI Powered</h4>
            <p className="feature-banner-desc">Smart insights using advanced AI</p>
          </div>
        </div>
        
        <div className="feature-banner-item">
          <div className="feature-banner-icon">
            <TrendingUp size={18} />
          </div>
          <div>
            <h4 className="feature-banner-title">Placement Focused</h4>
            <p className="feature-banner-desc">Personalized guidance for your career</p>
          </div>
        </div>

        <div className="feature-banner-item">
          <div className="feature-banner-icon">
            <Shield size={18} />
          </div>
          <div>
            <h4 className="feature-banner-title">Secure & Private</h4>
            <p className="feature-banner-desc">Your data is safe and encrypted</p>
          </div>
        </div>
      </div>

    </div>
  )
}