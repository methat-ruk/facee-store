import axios from 'axios';
import { API_TIMEOUT_MS, apiConfig } from '@/config/api';

export const AUTH_UNAUTHORIZED_EVENT = 'facee:auth-unauthorized';

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
  async (error) => {
    if (
      typeof window !== 'undefined' &&
      axios.isAxiosError(error) &&
      error.response?.data?.code === 'AUTH_UNAUTHORIZED'
    ) {
      const requestUrl =
        typeof error.config?.url === 'string' ? error.config.url : '';

      if (!requestUrl.endsWith(apiConfig.endpoints.auth.profile)) {
        window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
      }
    }

    return Promise.reject(error);
  },
);
