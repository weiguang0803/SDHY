const API_BASE = '/api';

export const api = {
  async getPublicConfig() {
    return this.request('/users/public-config');
  },

  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...options.headers,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || '请求失败');
    }

    return response.json();
  },

  async login(username, password) {
    return this.request('/users/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  async register(userData) {
    return this.request('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async getUserInfo() {
    return this.request('/users/profile');
  },

  async getConversations(favorite = null) {
    const query = favorite !== null ? `?favorite=${favorite}` : '';
    return this.request(`/conversations${query}`);
  },

  async createConversation(title = '新对话') {
    return this.request('/conversations', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  },

  async deleteConversation(id) {
    return this.request(`/conversations/${id}`, {
      method: 'DELETE',
    });
  },

  async toggleConversationFavorite(id) {
    return this.request(`/conversations/${id}/favorite`, {
      method: 'PUT',
    });
  },

  async getMessages(conversationId) {
    return this.request(`/conversations/${conversationId}/messages`);
  },

  async toggleMessageFavorite(conversationId, messageId) {
    return this.request(`/conversations/${conversationId}/messages/${messageId}/favorite`, {
      method: 'PUT',
    });
  },

  async deleteMessage(conversationId, messageId) {
    return this.request(`/conversations/${conversationId}/messages/${messageId}`, {
      method: 'DELETE',
    });
  }
};

