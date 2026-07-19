import axios from 'axios';

// Smart resolution for backend API URL:
// 1. Respect explicit VITE_API_URL if defined
// 2. If running locally (localhost/127.0.0.1), use local backend port 5050
// 3. If running deployed on Vercel/cloud, fallback to public Render backend
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5050/api/v1';
    }
  }
  return 'https://scms-1-kplt.onrender.com/api/v1';
};

const API = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
});

// Automatically inject JWT Token from local storage
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Global Response Interceptor
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
