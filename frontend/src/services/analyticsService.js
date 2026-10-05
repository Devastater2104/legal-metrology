import { request } from './api'

function auth(token) {
  return { headers: { Authorization: `Bearer ${token}` } }
}

export function getAdminOverview(token) { return request('/admin/analytics/overview', auth(token)) }
export function getAdminTimeSeries(period, token) { return request(`/admin/analytics/time-series?period=${period}`, auth(token)) }
export function getAdminOfficerWorkload(token) { return request('/admin/analytics/officer-workload', auth(token)) }
export function getAttentionItems(token) { return request('/admin/compliance/attention', auth(token)) }
export function getSchedulingRecommendations(applicationId, token) {
  return request(`/admin/scheduling/recommendations/${applicationId}`, auth(token))
}
export function scheduleInspection(applicationId, data, token) {
  return request(`/admin/applications/${applicationId}/schedule`, {
    method: 'PATCH',
    ...auth(token),
    body: JSON.stringify(data),
  })
}
export function getComplianceSummary(token) { return request('/user/compliance/summary', auth(token)) }
export function getOfficerWorkload(token) { return request('/officer/workload', auth(token)) }
