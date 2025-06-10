import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Authentication services
export const authService = {
  signUp: async (email: string, password: string) => {
    try {
      const response = await api.post('/signup', { email, password });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      const response = await api.post('/token', 
        new URLSearchParams({
          'username': email,
          'password': password,
        }), 
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      // Store token in localStorage
      const { access_token, token_type } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('token_type', token_type);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  signOut: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('token_type');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

// User profile services
export const profileService = {
  getUserProfile: async () => {
    try {
      const response = await api.get('/user-profile');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateUserFact: async (key: string, value: string) => {
    try {
      const response = await api.put('/user-profile', { key, value });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteUserFact: async (key: string) => {
    try {
      const response = await api.delete(`/user-profile/${key}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// WebSocket connection for voice communication
export const createWebSocketConnection = (token: string) => {
  return new WebSocket(`ws://localhost:8000/ws?token=${token}`);
};

export default api; 