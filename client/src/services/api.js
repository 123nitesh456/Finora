import axios from 'axios';

export const TOKEN_KEY = 'finora_token';

// VITE_API_URL is set in client/.env locally and in the Vercel dashboard in production.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 60000, // Render's free tier can take ~50s to wake up
});

// Attach the JWT to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token expired or is invalid, clear it and send the user to the login page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      if (!window.location.pathname.startsWith('/login')) window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Turns any Axios error into a message that is safe to show to the user.
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  if (error.request && !error.response) return 'Cannot reach the server. Check your connection and try again.';
  return fallback;
};

export default api;
