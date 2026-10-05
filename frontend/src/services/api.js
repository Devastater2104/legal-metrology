const API_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export function getApiUrl(path) {
  return `${API_URL}${path}`
}

export async function request(path, options = {}) {
  let response

  try {
    response = await fetch(getApiUrl(path), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
  } catch {
    throw new Error('Unable to reach the backend API. Please try again later.')
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const detail = Array.isArray(data.detail)
      ? data.detail.map((item) => item.msg).join(', ')
      : data.detail
    throw new Error(detail || 'The request could not be completed.')
  }

  return data
}
