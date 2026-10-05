import { request } from './api'

export function getNotifications(token) {
  return request('/notifications', { headers: { Authorization: `Bearer ${token}` } })
}

export function getUnreadCount(token) {
  return request('/notifications/unread-count', { headers: { Authorization: `Bearer ${token}` } })
}

export function markNotificationRead(id, token) {
  return request(`/notifications/${id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function markAllNotificationsRead(token) {
  return request('/notifications/read-all', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  })
}
