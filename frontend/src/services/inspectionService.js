import { getApiUrl, request } from './api'

export async function extractInspectionInfo(applicationId, file, token) {
  const formData = new FormData()
  formData.append('photo', file)
  const response = await fetch(getApiUrl(`/officer/applications/${applicationId}/ocr`), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.detail || 'Unable to analyze instrument image.')
  return data
}

export function submitInspection(applicationId, data, token) {
  return request(`/officer/applications/${applicationId}/inspection`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
}

export function getMyInspections(token) {
  return request('/officer/inspections', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function loadInspectionPhoto(photoPath, token) {
  const response = await fetch(getApiUrl(photoPath), {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error('Unable to load inspection photo.')
  return URL.createObjectURL(await response.blob())
}
