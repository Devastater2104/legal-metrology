import { request } from './api'

export function getAssignedApplications(token) {
  return request('/officer/applications', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}
