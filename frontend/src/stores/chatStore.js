import { create } from 'zustand';
import { api } from '../services/api';

const useChatStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  conversations: [],
  currentConversationId: null,
  messages: [],
  agentEvents: [],
  multimodalData: null,
  isStreaming: false,
  sidebarCollapsed: false,

  setUser: (user) => set({ user }),
  
  login: async (username, password) => {
    const data = await api.login(username, password);
    localStorage.setItem('token', data.access_token);
    set({ token: data.access_token, user: data.user });
    await get().loadConversations();
    return data;
  },

  register: async (userData) => {
    const data = await api.register(userData);
    localStorage.setItem('token', data.access_token);
    set({ token: data.access_token, user: data.user });
    await get().loadConversations();
    return data;
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, conversations: [], currentConversationId: null, messages: [] });
  },

  initAuth: async () => {
    const token = get().token;
    if (token) {
      try {
        const user = await api.getUserInfo();
        set({ user });
        await get().loadConversations();
      } catch (e) {
        get().logout();
      }
    }
  },

  loadConversations: async () => {
    try {
      const data = await api.getConversations();
      set({ conversations: data });
    } catch (e) {
      console.error(e);
    }
  },

  createConversation: async (title = '新对话') => {
    const conv = await api.createConversation(title);
    set(state => ({ 
      conversations: [conv, ...state.conversations],
      currentConversationId: conv.id,
      messages: [],
      agentEvents: []
    }));
    return conv;
  },

  selectConversation: async (id) => {
    set({ currentConversationId: id, agentEvents: [] });
    await get().loadMessages(id);
  },
  
  deleteConversation: async (id) => {
    await api.deleteConversation(id);
    set(state => {
      const newConvs = state.conversations.filter(c => c.id !== id);
      return { 
        conversations: newConvs,
        currentConversationId: state.currentConversationId === id ? null : state.currentConversationId,
        messages: state.currentConversationId === id ? [] : state.messages
      };
    });
  },

  loadMessages: async (conversationId) => {
    const messages = await api.getMessages(conversationId);
    set({ messages });
  },

  sidebarTab: 'all', // 'all' | 'favorites'
  setSidebarTab: (tab) => set({ sidebarTab: tab }),

  toggleConversationFavorite: async (id) => {
    try {
      set(state => ({
        conversations: state.conversations.map(c => 
          c.id === id ? { ...c, is_favorite: !c.is_favorite } : c
        )
      }));
      const res = await api.toggleConversationFavorite(id);
      set(state => ({
        conversations: state.conversations.map(c => 
          c.id === id ? { ...c, is_favorite: res.is_favorite } : c
        )
      }));
    } catch (e) {
      console.error('Toggle conversation favorite failed:', e);
      await get().loadConversations();
    }
  },

  toggleMessageFavorite: async (messageId) => {
    const convId = get().currentConversationId;
    if (!convId) return;

    try {
      // Optimistic update
      set(state => ({
        messages: state.messages.map(m => 
          m.id === messageId ? { ...m, is_favorite: !m.is_favorite } : m
        )
      }));
      const res = await api.toggleMessageFavorite(convId, messageId);
      set(state => ({
        messages: state.messages.map(m => 
          m.id === messageId ? { ...m, is_favorite: res.is_favorite } : m
        ),
        conversations: state.conversations.map(c => 
          c.id === convId ? { ...c, is_favorite: res.conversation_is_favorite } : c
        )
      }));
    } catch (e) {
      console.error('Toggle message favorite failed:', e);
      if (convId) await get().loadMessages(convId);
    }
  },

  deleteMessage: async (messageId) => {
    const convId = get().currentConversationId;
    if (!convId) return;

    try {
      // Optimistically remove from state
      set(state => ({
        messages: state.messages.filter(m => m.id !== messageId)
      }));
      await api.deleteMessage(convId, messageId);
    } catch (e) {
      console.error('Delete message failed:', e);
      if (convId) await get().loadMessages(convId);
    }
  },

  toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  
  // Streaming actions (Immutable state updates + robust multimodal retention)
  setStreaming: (isStreaming) => {
    if (!isStreaming) {
      set(state => {
        const mm = state.multimodalData;
        const newMessages = [...state.messages];
        const lastIdx = newMessages.length - 1;
        if (lastIdx >= 0 && newMessages[lastIdx].role === 'assistant') {
          const existingMM = newMessages[lastIdx].multimodal || mm;
          if (existingMM && existingMM.multimodal_items && existingMM.multimodal_items.length > 0) {
            newMessages[lastIdx] = {
              ...newMessages[lastIdx],
              multimodal: existingMM
            };
          }
        }
        return { isStreaming: false, messages: newMessages, multimodalData: null };
      });
    } else {
      set({ isStreaming: true });
    }
  },
  
  setMultimodalData: (data) => set({ multimodalData: data }),
  
  addMultimodalToLastMessage: (data) => {
    set(state => {
      const newMessages = [...state.messages];
      const lastIdx = newMessages.length - 1;
      if (lastIdx >= 0 && newMessages[lastIdx].role === 'assistant') {
        newMessages[lastIdx] = {
          ...newMessages[lastIdx],
          multimodal: data
        };
      }
      return { messages: newMessages, multimodalData: data };
    });
  },
  
  addAgentEvent: (event) => set(state => ({ agentEvents: [...state.agentEvents, event] })),
  clearAgentEvents: () => set({ agentEvents: [], multimodalData: null }),
  
  appendToken: (token) => {
    set(state => {
      const newMessages = [...state.messages];
      const lastIdx = newMessages.length - 1;
      if (lastIdx >= 0 && newMessages[lastIdx].role === 'assistant') {
        newMessages[lastIdx] = {
          ...newMessages[lastIdx],
          content: newMessages[lastIdx].content + token
        };
      } else {
        newMessages.push({ role: 'assistant', content: token });
      }
      return { messages: newMessages };
    });
  },
  
  addUserMessage: (content) => set(state => ({
    messages: [...state.messages, { role: 'user', content }]
  })),
  
  addAssistantMessage: (content = '') => set(state => ({
    messages: [...state.messages, { role: 'assistant', content }]
  })),
}));

export default useChatStore;
