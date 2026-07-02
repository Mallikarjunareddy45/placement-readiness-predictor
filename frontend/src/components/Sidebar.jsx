import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Sidebar.css'

export default function Sidebar() {
  const { student, logout } = useAuth()
  const navigate = useNavigate()

  const navItems = [
    { to: '/dashboard',  icon: '📊',  label: 'Dashboard'   },
    { to: '/profile',    icon: '👤',  label: 'Profile'      },
    { to: '/resume',     icon: '📄',  label: 'Resume'       },
    { to: '/technical',  icon: '💻',  label: 'Technical'    },
    { to: '/aptitude',   icon: '🧠',  label: 'Aptitude'     },
    { to: '/coding',     icon: '⌨️',  label: 'Coding Test'  },
    { to: '/interview',  icon: '🎙️',  label: 'AI Interview' },
    { to: '/predict',    icon: '🔮',  label: 'AI Predict'   },
  ]

  if (student?.email === 'admin@predictor.com' || student?.role === 'Admin') {
    navItems.push({ to: '/admin', icon: '⚙️', label: 'Admin Panel' })
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const initials = student?.name
    ? student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)
    : 'ST'

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-mark">
          <span>PRP</span>
        </div>
        <div className="logo-text">
          <span className="logo-title">Placement</span>
          <span className="logo-sub">Readiness Predictor</span>
        </div>
      </div>

      <div className="sidebar-divider" />

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`
            }
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-spacer" />

      {/* User */}
      <div className="sidebar-user">
        <div className="user-avatar">{initials}</div>
        <div className="user-info">
          <span className="user-name">{student?.name || 'Student'}</span>
          <span className="user-email">{student?.email || ''}</span>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          ⏻
        </button>
      </div>
    </aside>
  )
}