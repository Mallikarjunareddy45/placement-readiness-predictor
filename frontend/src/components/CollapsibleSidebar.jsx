import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  User,
  FileText,
  Laptop,
  Brain,
  Code,
  Mic,
  Sparkles,
  Award,
  Trophy,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import './CollapsibleSidebar.css'

export default function CollapsibleSidebar({ onToggleNotification }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const menuItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/profile',   label: 'Profile',   icon: User },
    { to: '/resume',    label: 'Resume Analyzer', icon: FileText },
    { to: '/technical', label: 'Technical Test', icon: Laptop },
    { to: '/aptitude',  label: 'Aptitude Test', icon: Brain },
    { to: '/coding',    label: 'Coding Test', icon: Code },
    { to: '/interview', label: 'AI Mock Interview', icon: Mic },
    { to: '/predict',   label: 'AI Prediction', icon: Sparkles },
    { to: '/profile?tab=certs', label: 'Certificates', icon: Award },
    { to: '/aptitude?tab=leaderboard', label: 'Leaderboard', icon: Trophy },
    { to: '#notifications', label: 'Notifications', icon: Bell, action: 'notifications' },
    { to: '/profile?tab=academics', label: 'Settings', icon: Settings },
  ]

  const handleItemClick = (item) => {
    if (item.action === 'notifications') {
      if (onToggleNotification) onToggleNotification()
    } else {
      navigate(item.to)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <motion.aside
      className={`collapsible-sidebar ${isCollapsed ? 'sidebar--collapsed' : ''}`}
      animate={{ width: isCollapsed ? 70 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Toggle button */}
      <button className="sidebar-toggle-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Menu scroll area */}
      <div className="sidebar-menu-list">
        {menuItems.map((item, idx) => {
          const isActive = location.pathname === item.to.split('?')[0]
          const Icon = item.icon

          return (
            <div
              key={idx}
              className={`sidebar-menu-row ${isActive ? 'sidebar-menu-row--active' : ''}`}
              onClick={() => handleItemClick(item)}
            >
              <span className="sidebar-row-icon">
                <Icon size={18} />
              </span>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="sidebar-row-label"
                >
                  {item.label}
                </motion.span>
              )}
            </div>
          )
        })}
      </div>

      <div className="sidebar-footer-divider" />

      {/* Logout */}
      <div className="sidebar-menu-row logout-row" onClick={handleLogout}>
        <span className="sidebar-row-icon">
          <LogOut size={18} />
        </span>
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="sidebar-row-label"
          >
            Logout
          </motion.span>
        )}
      </div>
    </motion.aside>
  )
}
