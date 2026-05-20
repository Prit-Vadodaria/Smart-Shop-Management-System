import axios from 'axios';

export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
});

// Add a request interceptor to add the auth token to headers
api.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const parsedUserInfo = JSON.parse(userInfo);
      config.headers.Authorization = `Bearer ${parsedUserInfo.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
