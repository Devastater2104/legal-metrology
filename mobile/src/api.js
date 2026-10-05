import { API_BASE_URL, ENDPOINTS } from './config'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
  })

  const contentType = response.headers.get('content-type') || ''

  let data

  if (contentType.includes('application/json')) {
    data = await response.json()
  } else {
    data = await response.text()
  }

  if (!response.ok) {
    const message =
      typeof data === 'object' && data?.detail
        ? data.detail
        : typeof data === 'string' && data
          ? data
          : `Request failed with status ${response.status}`

    throw new Error(message)
  }

  return data
}

export async function loginRequest(email, password) {
  return request(ENDPOINTS.login, {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
    }),
  })
}

export async function getCurrentUser(token) {
  return request(ENDPOINTS.me, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function getAssignedApplications(token) {
  return request(ENDPOINTS.assignedApplications, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function getApplication(token, applicationId) {
  const applications = await getAssignedApplications(token)

  return applications.find(
    (application) => application.id === Number(applicationId),
  )
}

export async function submitInspection(applicationId, payload, token) {
  return request(ENDPOINTS.submitInspection(applicationId), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export async function extractInspectionInfo(applicationId, imageUri, token) {
  const formData = new FormData()

  const filename = imageUri.split('/').pop() || 'inspection.jpg'

  formData.append('photo', {
    uri: imageUri,
    name: filename,
    type: 'image/jpeg',
  })

  return request(ENDPOINTS.extractInspectionInfo(applicationId), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })
}