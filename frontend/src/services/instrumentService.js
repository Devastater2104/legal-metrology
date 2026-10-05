import { request } from './api'

export function createInstrument(data, token) {
  return request('/user/instruments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
}

export function getMyInstruments(token) {
  return request('/user/instruments', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}
