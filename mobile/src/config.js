export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export const ENDPOINTS = {
  login: '/auth/login',
  me: '/auth/me',

  // Existing officer API adapter.
  // Keep these centralized so the mobile client can match the existing
  // FastAPI service without changing the backend architecture.
  assignedApplications: '/officer/applications',
  submitInspection: (id) => `/officer/applications/${id}/inspection`,
  extractInspectionInfo: (id) => `/officer/applications/${id}/inspection/ocr`,
};
