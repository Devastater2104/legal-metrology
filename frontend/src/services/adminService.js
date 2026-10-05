import { request } from './api'

export function getOfficers(token) {
  return request('/admin/officers', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function getApplications(token) {
  return request('/admin/applications', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function assignApplication(applicationId, officerId, token) {
  return request(`/admin/applications/${applicationId}/assign`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ officer_id: Number(officerId) }),
  })
}
