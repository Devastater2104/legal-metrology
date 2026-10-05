import { request } from './api'

export function createApplication(data, token) {
  return request('/user/applications', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
}

export function getMyApplications(token) {
  return request('/user/applications', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}