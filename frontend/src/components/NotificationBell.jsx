import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import { useAuth } from '../context/AuthContext'
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationService'

function NotificationBell() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)

  const refresh = useCallback(async () => {
    const [count, items] = await Promise.all([getUnreadCount(token), getNotifications(token)])
    setUnreadCount(count.unread_count)
    setNotifications(items)
  }, [token])

  useEffect(() => {
    refresh().catch(() => {})
  }, [refresh])

  async function readNotification(notification) {
    if (!notification.is_read) {
      const updated = await markNotificationRead(notification.id, token)
      setNotifications((current) => current.map((item) => item.id === updated.id ? updated : item))
      setUnreadCount((current) => Math.max(0, current - 1))
    }
    const target = notificationTarget(notification)
    if (target) {
      setOpen(false)
      navigate(target)
    }
  }

  async function readAll() {
    await markAllNotificationsRead(token)
    setNotifications((current) => current.map((item) => ({ ...item, is_read: true })))
    setUnreadCount(0)
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((current) => !current)} className="rounded-lg border border-slate-300 px-3 py-2 text-slate-700">
        Notifications {unreadCount > 0 && `(${unreadCount})`}
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <strong>Notifications</strong>
            <button type="button" onClick={readAll} className="text-xs text-blue-900 underline">Mark all read</button>
          </div>
          <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
            {notifications.length === 0 && <p className="text-sm text-slate-500">No notifications.</p>}
            {notifications.map((notification) => (
              <button
                type="button"
                key={notification.id}
                onClick={() => readNotification(notification)}
                className={`block w-full rounded p-2 text-left text-sm ${notification.is_read ? 'bg-white' : 'bg-blue-50'}`}
              >
                <strong>{notification.title}</strong>
                <span className="mt-1 block text-slate-600">{notification.message}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function notificationTarget(notification) {
  if (!notification.related_entity_type || !notification.related_entity_id) return null
  if (notification.related_entity_type === 'application') return '/user/applications'
  if (notification.related_entity_type === 'certificate') return '/user/certificates'
  if (notification.related_entity_type === 'instrument') return '/user/instruments'
  return null
}

export default NotificationBell
