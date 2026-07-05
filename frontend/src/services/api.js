// Helper to construct correct base API URLs dynamically from VITE_API_URL config
const getCleanApiBase = () => {
  const rawBase = import.meta.env.VITE_API_URL;
  if (rawBase) {
    let clean = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;
    if (clean.endsWith('/auth')) {
      clean = clean.slice(0, -5);
    }
    if (!clean.endsWith('/api')) {
      clean = `${clean}/api`;
    }
    return clean;
  }
  return '/api';
};

const API = axios.create({ 
  baseURL: getCleanApiBase() 
})

// Auto-attach JWT token to every request
API.interceptors.request.use(config => {
  const token = localStorage.getItem('prp_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Helper to construct absolute auth paths for production to prevent relative path fallbacks
const getAuthUrl = (path) => {
  const apiBase = getCleanApiBase();
  if (apiBase.endsWith('/auth')) {
    return `${apiBase}${path}`;
  }
  return `${apiBase}/auth${path}`;
};

// Helper for admin authentication paths
const getAdminUrl = (path) => {
  const apiBase = getCleanApiBase();
  if (apiBase.endsWith('/auth')) {
    const base = apiBase.slice(0, -5); // strip '/auth'
    return `${base}/admin${path}`;
  }
  return `${apiBase}/admin${path}`;
};

// Auth
export const registerAPI       = (data) => API.post(getAuthUrl('/register'), data)
export const loginAPI          = (data) => API.post(getAuthUrl('/login'), data)
export const socialLoginAPI    = (data) => API.post(getAuthUrl('/social-login'), data)
export const forgotPasswordAPI  = (data) => API.post(getAuthUrl('/forgot-password'), data)
export const verifyOtpAPI      = (data) => API.post(getAuthUrl('/verify-otp'), data)
export const resetPasswordAPI  = (data) => API.post(getAuthUrl('/reset-password'), data)

// Profile
export const getProfileAPI    = ()     => API.get('/profile/me')
export const updateProfileAPI = (data) => API.put('/profile/update', data)
export const uploadPhotoAPI   = (formData) => API.post('/profile/upload-photo', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const getPhotoAPI      = ()     => API.get('/profile/photo')
export const deletePhotoAPI   = ()     => API.delete('/profile/photo')

// Dashboard
export const getDashboardAPI   = ()  => API.get('/dashboard/')
export const getScoresOnlyAPI  = ()  => API.get('/dashboard/scores-only')
export const getDashHistoryAPI = ()  => API.get('/dashboard/history')

// Resume
export const uploadResumeAPI  = (formData) => API.post('/resume/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const getLatestResumeAPI = () => API.get('/resume/latest')
export const getResumeHistoryAPI = () => API.get('/resume/history')
export const improveResumeAPI = (data) => API.post('/resume/improve', data)

// Technical
export const getTechSubjectsAPI = ()        => API.get('/technical/subjects')
export const startTechTestAPI   = (subject) => API.get(`/technical/start/${subject}`)
export const submitTechTestAPI  = (data)    => API.post('/technical/submit', data)
export const getTechHistoryAPI  = ()        => API.get('/technical/history')

// Aptitude
export const getAptCategoriesAPI   = ()          => API.get('/aptitude/categories')
export const startAptTestAPI       = (category)  => API.get(`/aptitude/start/${category}`)
export const submitAptTestAPI      = (data)      => API.post('/aptitude/submit', data)
export const getAptHistoryAPI      = ()          => API.get('/aptitude/history')
export const getAptProgressAPI     = ()          => API.get('/aptitude/progress')
export const getAptitudeLeaderboardAPI = ()      => API.get('/aptitude/leaderboard')

// Prediction
export const predictAPI = (data) => API.post('/predict', data)

// Coding Editor
export const getCodingProblemsAPI = ()         => API.get('/coding/problems')
export const runCodingCodeAPI     = (data)     => API.post('/coding/run', data)
export const submitCodingCodeAPI  = (data)     => API.post('/coding/submit', data)
export const getActiveAssessmentAPI = ()       => API.get('/coding/assessment/active')
export const startAssessmentAPI      = ()       => API.post('/coding/assessment/start')
export const getAssessmentQuestionsAPI = ()    => API.get('/coding/assessment/questions')
export const submitAssessmentQuestionAPI = (data) => API.post('/coding/assessment/submit', data)
export const completeAssessmentAPI = ()        => API.post('/coding/assessment/complete')

// Mock Interview
export const startInterviewAPI  = (data)       => API.post('/interview/start', data)
export const submitInterviewAPI = (data)       => API.post('/interview/submit', data)
export const getInterviewHistoryAPI = ()       => API.get('/interview/history')
export const getInterviewReportAPI = (id)      => API.get(`/interview/report/${id}`)

// Notifications
export const getNotificationsAPI = ()          => API.get('/notifications/')
export const readNotificationAPI  = (id)        => API.put(`/notifications/read/${id}`)
export const clearNotificationsAPI = ()        => API.delete('/notifications/clear')

// Reports
export const getResumeReportAPI      = ()      => API.get('/reports/resume')
export const getPerformanceReportAPI = ()      => API.get('/reports/performance')
export const getInterviewReportPdfAPI = (id)   => API.get(`/reports/interview/${id}`)
export const getPredictionReportAPI  = ()      => API.get('/reports/prediction')
export const getCodingReportAPI      = ()      => API.get('/reports/coding')

// Admin Panel
export const adminLoginAPI     = (data)       => API.post(getAdminUrl('/login'), data)
export const getAdminAnalyticsAPI = ()         => API.get('/admin/analytics')
export const getAdminStudentsAPI  = ()         => API.get('/admin/students')
export const getAdminQuestionsAPI = ()         => API.get('/admin/questions-summary')

export default API