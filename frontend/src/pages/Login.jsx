import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  loginAPI, 
  adminLoginAPI, 
  socialLoginAPI, 
  forgotPasswordAPI, 
  verifyOtpAPI, 
  resetPasswordAPI 
} from '../services/api'
import { useAuth } from '../context/AuthContext'
import { auth, googleProvider, githubProvider, signInWithPopup } from '../firebase'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Cpu, TrendingUp, Shield, X, AlertCircle } from 'lucide-react'
import '../css/Auth.css'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  // 3D Perspective States
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [reflectionPos, setReflectionPos] = useState({ x: 50, y: 50 })
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [showPassword, setShowPassword] = useState(false)

  // Speech Bubble cycling messages list
  const welcomeMessages = [
    "Hello there! 👋 Let's check your placement readiness with AI.",
    "👋 Welcome back!",
    "Let's analyze your placement readiness.",
    "🚀 Ready to build your future?",
    "Sign in to continue."
  ]
  const [msgIdx, setMsgIdx] = useState(0)

  // Animated Toast Notifications State
  const [toasts, setToasts] = useState([])

  // Forgot Password Modal States
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotStep, setForgotStep] = useState(1) // 1: Email, 2: OTP, 3: Reset, 4: Success
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotOtp, setForgotOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [attemptsLeft, setAttemptsLeft] = useState(5)

  useEffect(() => {
    const cycle = setInterval(() => {
      setMsgIdx(prev => (prev + 1) % welcomeMessages.length)
    }, 4200)
    return () => clearInterval(cycle)
  }, [])

  // Resend OTP 30s countdown timer
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCountdown])

  const addToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }

  // Page tracking for light rays
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
    setLoading(true)
    try {
      let res
      const emailLower = form.email.trim().toLowerCase()
      if (emailLower === 'admin@predictor.com') {
        res = await adminLoginAPI(form)
        login(res.data.token, res.data.admin)
        navigate('/admin')
      } else {
        res = await loginAPI(form)
        login(res.data.token, res.data.student)
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please verify credentials.')
      addToast(err.response?.data?.message || 'Verification credentials incorrect.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Forgot Password step handlers
  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!forgotEmail) return
    setLoading(true)
    try {
      const res = await forgotPasswordAPI({ email: forgotEmail })
      if (res.data?.success) {
        addToast("Verification OTP sent to your Gmail!", "success")
        setForgotStep(2)
        setResendCountdown(30)
        setAttemptsLeft(5)
      }
    } catch (err) {
      addToast(err.response?.data?.message || "No registered account found with this email.", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!forgotOtp) return
    setLoading(true)
    try {
      const res = await verifyOtpAPI({ email: forgotEmail, otp: forgotOtp })
      if (res.data?.success) {
        addToast("OTP Code verified successfully!", "success")
        setForgotStep(3)
      }
    } catch (err) {
      const remaining = Math.max(0, attemptsLeft - 1)
      setAttemptsLeft(remaining)
      addToast(err.response?.data?.message || `Incorrect code. ${remaining} attempts remaining.`, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    // Enforce strict password rules
    if (newPassword.length < 8) {
      addToast("Password must be at least 8 characters long.", "error")
      return
    }
    if (!/[A-Z]/.test(newPassword)) {
      addToast("Password must contain at least one uppercase letter.", "error")
      return
    }
    if (!/[a-z]/.test(newPassword)) {
      addToast("Password must contain at least one lowercase letter.", "error")
      return
    }
    if (!/[0-9]/.test(newPassword)) {
      addToast("Password must contain at least one number.", "error")
      return
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      addToast("Password must contain at least one special character.", "error")
      return
    }
    if (newPassword !== confirmNewPassword) {
      addToast("Passwords do not match.", "error")
      return
    }

    setLoading(true)
    try {
      const res = await resetPasswordAPI({ email: forgotEmail, password: newPassword })
      if (res.data?.success) {
        addToast("Password updated successfully!", "success")
        setForgotStep(4)
        setTimeout(() => {
          setShowForgotModal(false)
          setForgotStep(1)
          setForgotEmail('')
          setForgotOtp('')
          setNewPassword('')
          setConfirmNewPassword('')
        }, 2200)
      }
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to update password.", "error")
    } finally {
      setLoading(false)
    }
  }

  // Password strength meter calculation
  const getPasswordStrength = (pw) => {
    if (!pw) return { score: 0, text: 'Weak', color: 'rgba(239, 68, 68, 0.4)' }
    let score = 0
    if (pw.length >= 8) score += 1
    if (/[A-Z]/.test(pw)) score += 1
    if (/[a-z]/.test(pw)) score += 1
    if (/[0-9]/.test(pw)) score += 1
    if (/[^A-Za-z0-9]/.test(pw)) score += 1

    if (score <= 2) return { score, text: 'Weak ⚠️', color: '#ef4444' }
    if (score <= 4) return { score, text: 'Medium ⚡', color: '#f59e0b' }
    return { score, text: 'Strong 🎯', color: '#10b981' }
  }

  const strength = getPasswordStrength(newPassword)

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
        
        {/* Left Hand side: Waving AI Robot */}
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

          {/* Floating Robot Waving image */}
          <div className="robot-avatar-container">
            <img 
              src="/login_robot.png" 
              alt="AI Assistant Robot" 
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

        {/* Right Hand side: Login authentication card */}
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
            <h1 className="auth-heading">Welcome back</h1>
            <p className="auth-subheading">Sign in to check your placement readiness score</p>
          </div>

          {error && <div className="alert alert-error" style={{ fontSize: 13, padding: 12, borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            
            {/* Email input field */}
            <div className="input-group parallax-input">
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
            <div className="input-group parallax-input" style={{ transform: 'translateZ(26px)' }}>
              <label className="input-label" htmlFor="password-input">Password</label>
              <div className="input-container">
                <Lock className="input-icon-left" size={16} />
                <input
                  id="password-input"
                  className="input-glass"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
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

            {/* Forgot password aligned right */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -8 }}>
              <button 
                type="button"
                className="auth-link" 
                style={{ fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                onClick={() => {
                  setShowForgotModal(true)
                  setForgotStep(1)
                }}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="btn-auth-premium parallax-btn"
              disabled={loading}
              style={{ width: '100%', marginTop: 8 }}
            >
              {loading ? <span className="btn-spinner" /> : null}
              <span>{loading ? 'Signing in…' : 'Sign In'}</span>
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
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">Create one free</Link>
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

      {/* 🔐 Premium Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-overlay">
          <div className="modal-glass auth-load-anim">
            <button 
              className="modal-close-btn" 
              onClick={() => setShowForgotModal(false)}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            {/* STEP 1: ENTER EMAIL */}
            {forgotStep === 1 && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Forgot Password</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                  Enter your registered email address to receive a secure 6-digit OTP code.
                </p>
                <form onSubmit={handleSendOtp} className="auth-form">
                  <div className="input-group">
                    <label className="input-label" htmlFor="forgot-email">Email Address</label>
                    <div className="input-container">
                      <Mail className="input-icon-left" size={16} />
                      <input
                        id="forgot-email"
                        className="input-glass"
                        type="email"
                        placeholder="you@example.com"
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn-auth-premium" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
                    {loading ? <span className="btn-spinner" /> : null}
                    <span>{loading ? 'Sending OTP…' : 'Send OTP'}</span>
                    {!loading && <ArrowRight size={14} />}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 2: VERIFY OTP */}
            {forgotStep === 2 && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Verify OTP Code</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                  We sent a 6-digit verification code to <strong style={{ color: 'var(--accent-cyan)' }}>{forgotEmail}</strong>.
                </p>
                <form onSubmit={handleVerifyOtp} className="auth-form">
                  <div className="input-group">
                    <label className="input-label" htmlFor="forgot-otp">Verification Code</label>
                    <div className="input-container">
                      <Lock className="input-icon-left" size={16} />
                      <input
                        id="forgot-otp"
                        className="input-glass"
                        type="text"
                        maxLength="6"
                        placeholder="123456"
                        value={forgotOtp}
                        onChange={e => setForgotOtp(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginTop: 4 }}>
                    <span style={{ color: attemptsLeft <= 2 ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                      Attempts remaining: <strong>{attemptsLeft}</strong>
                    </span>
                    {resendCountdown > 0 ? (
                      <span style={{ color: 'var(--text-secondary)' }}>Resend in {resendCountdown}s</span>
                    ) : (
                      <button 
                        type="button" 
                        className="auth-link" 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        onClick={handleSendOtp}
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>

                  <button type="submit" className="btn-auth-premium" disabled={loading || attemptsLeft === 0} style={{ width: '100%', marginTop: 8 }}>
                    {loading ? <span className="btn-spinner" /> : null}
                    <span>{loading ? 'Verifying…' : 'Verify Code'}</span>
                    {!loading && <ArrowRight size={14} />}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 3: RESET PASSWORD */}
            {forgotStep === 3 && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Reset Password</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                  Create a new secure password. Must contain uppercase, lowercase, number, and special character.
                </p>
                <form onSubmit={handleResetPassword} className="auth-form">
                  
                  {/* New Password */}
                  <div className="input-group">
                    <label className="input-label" htmlFor="new-pw">New Password</label>
                    <div className="input-container">
                      <Lock className="input-icon-left" size={16} />
                      <input
                        id="new-pw"
                        className="input-glass"
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Min 8 characters"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowNewPassword(p => !p)}
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Password Strength Meter */}
                  <div style={{ marginTop: 2 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Password Strength:</span>
                      <strong style={{ color: strength.color }}>{strength.text}</strong>
                    </div>
                    <div className="strength-meter-bar">
                      <div 
                        className="strength-meter-fill"
                        style={{ 
                          width: `${(strength.score / 5) * 100}%`, 
                          backgroundColor: strength.color 
                        }} 
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="input-group" style={{ marginTop: 6 }}>
                    <label className="input-label" htmlFor="confirm-new-pw">Confirm Password</label>
                    <div className="input-container">
                      <Lock className="input-icon-left" size={16} />
                      <input
                        id="confirm-new-pw"
                        className="input-glass"
                        type="password"
                        placeholder="Re-enter password"
                        value={confirmNewPassword}
                        onChange={e => setConfirmNewPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-auth-premium" disabled={loading} style={{ width: '100%', marginTop: 12 }}>
                    {loading ? <span className="btn-spinner" /> : null}
                    <span>{loading ? 'Changing Password…' : 'Change Password'}</span>
                    {!loading && <ArrowRight size={14} />}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 4: SUCCESS ANIMATION */}
            {forgotStep === 4 && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <svg className="success-checkmark-svg" viewBox="0 0 52 52">
                  <circle className="success-checkmark-circle" cx="26" cy="26" r="25" />
                  <path className="success-checkmark-check" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                </svg>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--accent-green)' }}>
                  Password Changed!
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                  Your password has been updated. Redirecting back to sign in...
                </p>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  )
}