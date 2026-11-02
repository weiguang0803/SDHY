const BASE_URL = '/api'

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('admin_token')
  
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const data = await response.json()
  
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_data')
      window.location.reload()
    }
    throw new Error(data.detail || data.message || 'API request failed')
  }
  
  return data
}

export const adminApi = {
  // Auth
  adminLogin: (data) => request('/admin/login', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  adminRegister: (data) => request('/admin/register', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  // Dashboard
  getDashboardStats: () => request('/admin/dashboard/stats'),
  getMessageTrend: () => request('/admin/dashboard/message-trend'),
  getLanguageDistribution: () => request('/admin/dashboard/language-distribution'),
  getIntentDistribution: () => request('/admin/dashboard/intent-distribution'),

  // Growth analytics
  getGrowthOverview: (days = 30, signal) => request(`/admin/growth/overview?days=${days}`, { signal }),
  getGrowthWeeklyHeatmap: (weekDate, signal) => request(`/admin/growth/weekly-heatmap${weekDate ? `?week_date=${encodeURIComponent(weekDate)}` : ''}`, { signal }),
  
  // Users
  getUsers: () => request('/admin/users'),
  getUserDetail: (userId) => request(`/admin/users/${userId}`),
  updateUserStatus: (userId, isActive) => request(`/admin/users/${userId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ is_active: isActive })
  }),
  deleteUser: (userId) => request(`/admin/users/${userId}`, { method: 'DELETE' }),
  
  // Conversations
  getConversations: (userId) => {
    const url = userId ? `/admin/conversations?user_id=${userId}` : '/admin/conversations'
    return request(url)
  },
  getConvMessages: (convId) => request(`/admin/conversations/${convId}/messages`),
  deleteConversation: (convId) => request(`/admin/conversations/${convId}`, { method: 'DELETE' }),
  
  // System
  getSystemInfo: () => request('/admin/system/info'),
  getSystemConfig: () => request('/admin/system/config'),
  updateSystemConfig: (data) => request('/admin/system/config', {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}
