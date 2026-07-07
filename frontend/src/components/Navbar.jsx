import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  User,
  FileText,
  Laptop,
  Brain,
  Code,
  Mic,
  Sparkles,
  Bell,
  Sun,
  Moon,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import './Navbar.css'

export default function Navbar({ unreadCount, onToggleNotification }) {
  const { student, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(true) // Default dark theme active

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/profile',   label: 'Profile',   icon: User },
    { to: '/resume',    label: 'Resume',    icon: FileText },
    { to: '/technical', label: 'Technical', icon: Laptop },
    { to: '/aptitude',  label: 'Aptitude',  icon: Brain },
    { to: '/coding',    label: 'Coding',    icon: Code },
    { to: '/interview', label: 'AI Interview', icon: Mic },
    { to: '/predict',   label: 'AI Prediction', icon: Sparkles },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = student?.name
    ? student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'ST'

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.body.classList.toggle('light-theme')
  }

  return (
    <header className="sticky-navbar">
      <div className="navbar-container">
        
        {/* Logo / Brand */}
        <Link to="/dashboard" className="navbar-brand">
          <div className="brand-logo-mark">
            <Sparkles className="logo-sparkle-icon" size={18} />
          </div>
          <div className="brand-logo-text">
            <span className="brand-title">PRP</span>
            <span className="brand-sub">Placement Readiness</span>
          </div>
        </Link>

        {/* Desktop Nav Items */}
        <nav className="navbar-links-desktop">
          {navItems.map(item => {
            const isActive = location.pathname === item.to
            const Icon = item.icon

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`nav-btn-link ${isActive ? 'nav-btn-link--active' : ''}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="nav-active-pill-bg"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="nav-btn-icon-wrapper">
                  <Icon size={15} />
                </span>
                <span className="nav-btn-label">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Right Operations */}
        <div className="navbar-ops">
          {/* Bell Icon */}
          <button className="navbar-op-btn notif-bell-btn" onClick={onToggleNotification} title="Notifications">
            <Bell size={18} />
            {unreadCount > 0 && <span className="badge-dot-indicator">{unreadCount}</span>}
          </button>

          {/* Theme Toggle */}
          <button className="navbar-op-btn theme-toggle-btn" onClick={toggleDarkMode} title="Toggle Theme">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* User Profile Avatar */}
          <div className="navbar-avatar-wrapper" onClick={() => navigate('/profile')}>
            <div className="navbar-avatar">{initials}</div>
          </div>

          {/* Logout */}
          <button className="navbar-op-btn logout-nav-btn" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
          </button>

          {/* Mobile Hamburger toggle */}
          <button className="navbar-op-btn mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer menu overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="mobile-nav-drawer"
          >
            <div className="mobile-nav-links-list">
              {navItems.map(item => {
                const isActive = location.pathname === item.to
                const Icon = item.icon

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`mobile-nav-row ${isActive ? 'mobile-nav-row--active' : ''}`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
              
              <div className="divider" style={{ margin: '12px 0' }} />
              
              <button className="mobile-nav-row logout-row-btn" onClick={handleLogout}>
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
