import { create } from 'zustand'
import { knowledgeApi } from '../services/knowledgeApi'

const VALID_ROLES = ['admin', 'reviewer', 'collector']

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('knowledge_token'),
  currentPage: 'entries', // 'dashboard' (admin), 'entries' (collector/all), 'reviewer' (reviewer), 'audit' (admin)
  
  initAuth: async () => {
    const token = localStorage.getItem('knowledge_token')
    const userData = localStorage.getItem('knowledge_user')
    if (token && userData) {
      try {
        const user = JSON.parse(userData)
        if (!VALID_ROLES.includes(user.role)) {
          localStorage.removeItem('knowledge_token')
          localStorage.removeItem('knowledge_user')
          set({ user: null, token: null })
          return
        }
        
        const defaultPage = user.role === 'admin' ? 'dashboard' : (user.role === 'reviewer' ? 'reviewer' : 'entries')
        set({ user, token, currentPage: defaultPage })
        
        // 远程核验 Token 与真实身份
        try {
          const remoteUser = await knowledgeApi.getMe()
          if (!VALID_ROLES.includes(remoteUser.role)) {
            throw new Error('Not allowed')
          }
          set({ user: remoteUser })
          localStorage.setItem('knowledge_user', JSON.stringify(remoteUser))
        } catch (err) {
          localStorage.removeItem('knowledge_token')
          localStorage.removeItem('knowledge_user')
          set({ user: null, token: null })
        }
      } catch (e) {
        localStorage.removeItem('knowledge_token')
        localStorage.removeItem('knowledge_user')
        set({ user: null, token: null })
      }
    }
  },
  
  login: (userData, token) => {
    if (!VALID_ROLES.includes(userData.role)) {
      throw new Error('该账号不是知识管理平台工作人员账号')
    }
    localStorage.setItem('knowledge_token', token)
    localStorage.setItem('knowledge_user', JSON.stringify(userData))
    const defaultPage = userData.role === 'admin' ? 'dashboard' : (userData.role === 'reviewer' ? 'reviewer' : 'entries')
    set({ user: userData, token, currentPage: defaultPage })
  },
  
  logout: () => {
    localStorage.removeItem('knowledge_token')
    localStorage.removeItem('knowledge_user')
    set({ user: null, token: null, currentPage: 'entries' })
  },
  
  setCurrentPage: (page) => set({ currentPage: page })
}))

export default useAuthStore
