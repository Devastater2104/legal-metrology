import { getApiUrl, request } from './api'

export function getAdminInspections(token) {
  return request('/admin/inspections', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function getAdminCertificates(token) {
  return request('/admin/certificates', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function issueCertificate(applicationId, token) {
  return request(`/admin/applications/${applicationId}/certificate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function revokeCertificate(certificateId, reason, token) {
  return request(`/admin/certificates/${certificateId}/revoke`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reason }),
  })
}

export function getMyCertificates(token) {
  return request('/user/certificates', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function getCertificateQrUrl(certificateNumber) {
  return getApiUrl(`/public/certificates/${encodeURIComponent(certificateNumber)}/qr`)
}

export async function downloadCertificatePdf(certificateId, certificateNumber, token) {
  const response = await fetch(getApiUrl(`/certificates/${certificateId}/pdf`), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!response.ok) {
    throw new Error('Unable to download certificate PDF.')
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${certificateNumber}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}
