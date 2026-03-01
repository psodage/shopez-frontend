import axios from 'axios';
import { TOKEN_KEY } from '../constants/auth';

const BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      // eslint-disable-next-line no-param-reassign
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Let the browser set the correct Content-Type for FormData.
    if (config.data instanceof FormData) {
      // eslint-disable-next-line no-param-reassign
      delete config.headers['Content-Type'];
    } else if (!config.headers['Content-Type']) {
      // Default JSON for non-FormData requests.
      // eslint-disable-next-line no-param-reassign
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Handles 401/403 responses: clears token and dispatches session-expired event
 * so the app can logout and redirect. Prevents circular dependency with Redux store.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new CustomEvent('auth:session-expired', { detail: { status } }));
    }
    return Promise.reject(error);
  }
);

export { BASE_URL };
export default api;
