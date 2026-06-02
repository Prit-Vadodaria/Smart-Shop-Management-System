import axios from 'axios';
import { getToken, isTokenExpired } from '../utils/session.js';
import { notifySessionExpired } from './sessionEvents.js';

export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
});

const isPublicAuthRequest = (config) => {
  const url = config?.url || '';
  return /\/auth\/(login|register|forgot-password|password-rules|validate-password)(\/|$)/.test(url)
    || /\/auth\/reset-password\//.test(url);
};

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      if (isTokenExpired(token)) {
        notifySessionExpired('expired');
        return Promise.reject(new Error('Session expired'));
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const config = error.config;

    const isChangePassword = config?.url && /\/auth\/change-password(\/|$)/.test(config.url);

    if (status === 401 && config && !isPublicAuthRequest(config) && !isChangePassword) {
      notifySessionExpired('unauthorized');
    }

    return Promise.reject(error);
  }
);

export default api;
