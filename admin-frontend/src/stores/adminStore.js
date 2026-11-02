import { create } from 'zustand'

const useAdminStore = create((set) => ({
  admin: null,
  token: localStorage.getItem('admin_token'),
  currentPage: 'dashboard',
  analyticsView: { tab: 0, preset: '30', dates: { start: '', end: '' }, window: { days: '30' } },
  analyticsConversation: null,
  setAnalyticsView: (view) => set({ analyticsView: view }),
  openAnalyticsConversation: (conversationId, messageId) => set({
    currentPage: 'conversations', analyticsConversation: { conversationId, messageId },
  }),
  clearAnalyticsConversation: () => set({ analyticsConversation: null }),
  
  initAuth: () => {
    const token = localStorage.getItem('admin_token')
    const adminData = localStorage.getItem('admin_data')
    if (token && adminData) {
      set({ admin: JSON.parse(adminData), token })
    }
  },
  
  login: (adminData, token) => {
    localStorage.setItem('admin_token', token)
    localStorage.setItem('admin_data', JSON.stringify(adminData))
    set({ admin: adminData, token, currentPage: 'dashboard' })
  },
  
  logout: () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_data')
    set({ admin: null, token: null, analyticsConversation: null, analyticsView: { tab: 0, preset: '30', dates: { start: '', end: '' }, window: { days: '30' } } })
  },
  
  setCurrentPage: (page) => set({ currentPage: page })
}))

export default useAdminStore
