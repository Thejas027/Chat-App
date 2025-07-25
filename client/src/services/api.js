const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ApiService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api`;
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('token');
  }

  // Make HTTP request with auth headers
  async makeRequest(endpoint, options = {}) {
    const token = this.getAuthToken();
    // Merge headers correctly
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers || {})
    };

    // Build fetch options
    const fetchOptions = {
      ...options,
      headers,
      credentials: 'include' // Include cookies for CORS
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, fetchOptions);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return { success: true, data };
    } catch (error) {
      console.error('API Request failed:', error);
      return { 
        success: false, 
        error: error.message || 'Network error occurred' 
      };
    }
  }

  // Auth endpoints
  async login(credentials) {
    return this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async register(userData) {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async logout() {
    return this.makeRequest('/auth/logout', {
      method: 'POST'
    });
  }

  async refreshToken() {
    return this.makeRequest('/auth/refresh', {
      method: 'POST'
    });
  }

  // User endpoints
  async getProfile() {
    return this.makeRequest('/users/profile');
  }

  async updateProfile(profileData) {
    return this.makeRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  async getUsers() {
    return this.makeRequest('/users');
  }

  // Conversation endpoints
  async getConversations() {
    return this.makeRequest('/conversations');
  }

  async createPrivateConversation(participantId) {
    return this.makeRequest('/conversations/private', {
      method: 'POST',
      body: JSON.stringify({ participantId })
    });
  }

  async createGroupConversation(participants, name) {
    return this.makeRequest('/conversations/group', {
      method: 'POST',
      body: JSON.stringify({ participants, name })
    });
  }

  // Message endpoints
  async getMessages(conversationId, page = 1, limit = 50) {
    return this.makeRequest(`/messages/${conversationId}?page=${page}&limit=${limit}`);
  }

  async sendMessage(messageData) {
    return this.makeRequest('/messages', {
      method: 'POST',
      body: JSON.stringify(messageData)
    });
  }

  async deleteMessage(messageId) {
    return this.makeRequest(`/messages/${messageId}`, {
      method: 'DELETE'
    });
  }

  async editMessage(messageId, content) {
    return this.makeRequest(`/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ content })
    });
  }

  async searchMessages(conversationId, query) {
    return this.makeRequest(`/messages/search/${conversationId}?q=${encodeURIComponent(query)}`);
  }

  // File upload
  async uploadFile(file, conversationId) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);

    const token = this.getAuthToken();
    
    try {
      const response = await fetch(`${this.baseURL}/files/upload`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: formData,
        credentials: 'include' // Include cookies for CORS
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      return { success: true, data };
    } catch (error) {
      console.error('File upload failed:', error);
      return { 
        success: false, 
        error: error.message || 'File upload failed' 
      };
    }
  }
}

const apiService = new ApiService();
export default apiService;
