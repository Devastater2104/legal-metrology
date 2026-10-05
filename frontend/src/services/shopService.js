const API_BASE_URL = 'http://127.0.0.1:8000'

async function request(path, token, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      data?.detail ||
      data?.message ||
      'Unable to complete the request.',
    )
  }

  return data
}

export function getMyShops(token) {
  return request('/user/shops', token)
}

export function getShop(shopId, token) {
  return request(`/user/shops/${shopId}`, token)
}

export function createShop(shop, token) {
  return request('/user/shops', token, {
    method: 'POST',
    body: JSON.stringify(shop),
  })
}

export function createInstrument(instrument, token) {
  return request('/user/instruments', token, {
    method: 'POST',
    body: JSON.stringify(instrument),
  })
}

export function getApplications(token) {
  return request('/user/applications', token)
}

export function submitApplication(instrumentId, token, notes = '') {
  return request('/user/applications', token, {
    method: 'POST',
    body: JSON.stringify({
      instrument_id: instrumentId,
      notes: notes || null,
    }),
  })
}
