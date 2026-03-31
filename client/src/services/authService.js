import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/auth';

// ─── Axios instance ───────────────────────────────────────────
const api = axios.create({ baseURL: API_BASE });

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        const { data } = await axios.post(`${API_BASE}/refresh/`, { refresh });
        localStorage.setItem('access_token', data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth helpers ─────────────────────────────────────────────
export const authService = {
  async login(email, password) {
    const { data } = await api.post('/login/', { email, password });
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  async logout() {
    const refresh = localStorage.getItem('refresh_token');
    try { await api.post('/logout/', { refresh }); } catch {}
    localStorage.clear();
  },

  async getProfile() {
    const { data } = await api.get('/me/');
    return data;
  },

  async register(payload) {
    const { data } = await api.post('/register/', payload);
    return data;
  },

  getUser() {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('access_token');
  },
};

export default api;
