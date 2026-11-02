// Keep analytics on the same API origin as the rest of the admin console.
// Vite proxies /api to the backend on port 8888 in development.
const analyticsBase = '/api/admin/analytics'

async function request(path, params, signal, download = false) {
  const response = await fetch(`${analyticsBase}/${path}?${new URLSearchParams(params)}`, {
    signal,
    headers: { Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}`, 'ngrok-skip-browser-warning': 'true' },
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(typeof data.detail === 'string' ? data.detail : `请求失败（${response.status}）`)
  }
  return download ? response.blob() : response.json()
}

export const analyticsApi = {
  overview: (params, signal) => request('overview', params, signal),
  questions: (params, signal) => request('questions', params, signal),
  export: (params) => request('export', params, undefined, true),
}
