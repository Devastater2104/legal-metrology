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

export async function getMyShops(token) {
  return request('/user/shops', token)
}

export async function getShop(shopId, token) {
  return request(`/user/shops/${shopId}`, token)
}

export async function createShop(shopData, token) {
  return request('/user/shops', token, {
    method: 'POST',
    body: JSON.stringify(shopData),
  })
}

export async function getShopInstruments(shopId, token) {
  return request(`/user/shops/${shopId}/instruments`, token)
}

export async function createShopInstrument(shopId, instrumentData, token) {
  return request(`/user/shops/${shopId}/instruments`, token, {
    method: 'POST',
    body: JSON.stringify(instrumentData),
  })
}

export async function applyForVerification(instrumentId, token, applicationType = 'VERIFICATION') {
  return request(`/user/instruments/${instrumentId}/application`, token, {
    method: 'POST',
    body: JSON.stringify({
      application_type: applicationType,
    }),
  })
}