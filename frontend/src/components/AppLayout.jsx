import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import CollapsibleSidebar from './CollapsibleSidebar'
import { getNotificationsAPI, readNotificationAPI, clearNotificationsAPI } from '../services/api'

export default function AppLayout() {
  const [showDrawer, setShowDrawer] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await getNotificationsAPI()
      setNotifications(res.data.notifications)
      setUnreadCount(res.data.notifications.filter(n => !n.is_read).length)
    } catch (err) {
      console.error('Failed to load notifications')
    }
  }

  const markRead = async (id) => {
    try {
      await readNotificationAPI(id)
      fetchNotifications()
    } catch (err) {
      console.error(err)
    }
  }

  const clearAllNotifications = async () => {
    try {
      await clearNotificationsAPI()
      fetchNotifications()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="dash-layout-topnav">
      {/* Top sticky Navbar */}
      <Navbar unreadCount={unreadCount} onToggleNotification={() => setShowDrawer(!showDrawer)} />
      
      <div className="dash-body-container">
        {/* Collapsible Left Sidebar */}
        <CollapsibleSidebar onToggleNotification={() => setShowDrawer(!showDrawer)} />

        {/* Scrollable feed wrapper */}
        <main className="dash-main-feed-scroll">
          <Outlet context={{ fetchNotifications }} />
        </main>
      </div>

      {/* Global Notifications Drawer Overlay */}
      {showDrawer && (
        <div className="notif-drawer-overlay" onClick={() => setShowDrawer(false)}>
          <div className="notif-drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Notification Center</h3>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-sm btn-ghost" onClick={clearAllNotifications}>Clear All</button>
                <button className="drawer-close" onClick={() => setShowDrawer(false)}>&times;</button>
              </div>
            </div>
            <div className="drawer-body">
              {notifications.length === 0 ? (
                <p className="no-notif-text">All caught up! No notifications.</p>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className={`notif-item ${n.is_read ? 'notif-read' : 'notif-unread'}`} onClick={() => markRead(n.id)}>
                    <div className="notif-item-header">
                      <strong>{n.title}</strong>
                      <span className="notif-time">{new Date(n.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="notif-msg">{n.message}</p>
                    {!n.is_read && <span className="unread-dot" />}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
