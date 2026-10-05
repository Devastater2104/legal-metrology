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
    let message

    if (typeof data === 'object' && data?.detail) {
      if (typeof data.detail === 'string') {
        message = data.detail
      } else if (Array.isArray(data.detail)) {
        message = data.detail
          .map((item) => {
            if (typeof item === 'string') return item
            if (item?.msg) return item.msg
            return JSON.stringify(item)
          })
          .join('; ')
      } else {
        message = JSON.stringify(data.detail)
      }
    } else if (typeof data === 'string' && data) {
      message = data
    } else {
      message = `Request failed with status ${response.status}`
    }

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

  const filename =
    imageUri.split('/').pop()?.split('?')[0] || 'inspection.jpg'

  // React Native Web needs an actual Blob for multipart uploads.
  // Native React Native uses the { uri, name, type } format.
  if (typeof window !== 'undefined') {
    const imageResponse = await fetch(imageUri)
    const imageBlob = await imageResponse.blob()

    formData.append(
      'photo',
      imageBlob,
      filename.toLowerCase().endsWith('.jpg') ||
        filename.toLowerCase().endsWith('.jpeg')
        ? filename
        : 'inspection.jpg',
    )
  } else {
    formData.append('photo', {
      uri: imageUri,
      name: filename,
      type: 'image/jpeg',
    })
  }

  return request(ENDPOINTS.extractInspectionInfo(applicationId), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })
}