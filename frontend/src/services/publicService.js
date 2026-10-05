import { request } from './api'

export function verifyCertificate(certificateNumber) {
  return request(`/public/certificates/${encodeURIComponent(certificateNumber)}`)
}