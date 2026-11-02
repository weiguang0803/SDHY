const BASE_URL = '/api/knowledge'

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('knowledge_token')
  
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

  const data = await response.json().catch(() => ({}))
  
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('knowledge_token')
      localStorage.removeItem('knowledge_user')
      if (!window.location.pathname.includes('/login')) {
        window.location.reload()
      }
    }
    throw new Error(data.detail || data.message || 'API 请求失败')
  }
  
  return data
}

export const knowledgeApi = {
  // Auth
  login: (data) => request('/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => request('/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/me'),
  
  // Entries CRUD & Workflow
  getEntries: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/entries?${query}`)
  },
  getEntry: (id) => request(`/entries/${id}`),
  createEntry: (data) => request('/entries', { method: 'POST', body: JSON.stringify(data) }),
  updateEntry: (id, data) => request(`/entries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEntry: (id) => request(`/entries/${id}`, { method: 'DELETE' }),
  submitEntry: (id) => request(`/entries/${id}/submit`, { method: 'POST' }),
  reviewEntry: (id, data) => request(`/entries/${id}/review`, { method: 'POST', body: JSON.stringify(data) }),
  
  // AI Multimodal Generation
  aiGenerateText: (data) => request('/ai/generate-text', { method: 'POST', body: JSON.stringify(data) }),
  aiGenerateImage: (data) => request('/ai/generate-image', { method: 'POST', body: JSON.stringify(data) }),
  aiGenerateVideo: (data) => request('/ai/generate-video', { method: 'POST', body: JSON.stringify(data) }),
  aiVideoStatus: (taskId) => request(`/ai/video-status/${taskId}`),
  
  // File Upload
  uploadFile: async (file, fileType = 'image') => {
    const token = localStorage.getItem('knowledge_token')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('file_type', fileType)
    
    const res = await fetch(`${BASE_URL}/upload/file`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'ngrok-skip-browser-warning': 'true'
      },
      body: formData
    })
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || '文件上传失败')
    }
    return res.json()
  },
  
  // Dashboard & Audit Trail
  getDashboardStats: () => request('/dashboard/stats'),
  getAuditTrail: (limit = 50) => request(`/audit-trail?limit=${limit}`)
}
