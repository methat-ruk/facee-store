import axios from 'axios';
import { API_TIMEOUT_MS, apiConfig } from '@/config/api';

export const api = axios.create({
  baseURL: apiConfig.baseUrl,
  withCredentials: true,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  async (error) => Promise.reject(error),
);
