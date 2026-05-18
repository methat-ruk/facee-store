import axios from 'axios';
import { API_TIMEOUT_MS, apiConfig } from '@/config/api';
import { authResponseSchema } from '@/features/auth/auth-session-schema';
import {
  clearStoredAuthTokens,
  getStoredAccessToken,
  getStoredRefreshToken,
  persistAuthTokens,
} from '@/lib/auth-tokens';

export const AUTH_UNAUTHORIZED_EVENT = 'facee:auth-unauthorized';

type RetriableRequestConfig = {
  _retry?: boolean;
  headers?: Record<string, string>;
  url?: string;
};

const unauthenticatedClient = axios.create({
  baseURL: apiConfig.baseUrl,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getStoredRefreshToken();

  if (!refreshToken) {
    clearStoredAuthTokens();
    return null;
  }

  refreshPromise = unauthenticatedClient
    .post(apiConfig.endpoints.auth.refresh, {
      refreshToken,
    })
    .then((response) => {
      const parsedResponse = authResponseSchema.parse(response.data);
      persistAuthTokens({
        accessToken: parsedResponse.accessToken,
        refreshToken: parsedResponse.refreshToken,
        accessTokenExpiresAt: parsedResponse.accessTokenExpiresAt,
        refreshTokenExpiresAt: parsedResponse.refreshTokenExpiresAt,
      });

      return parsedResponse.accessToken;
    })
    .catch(() => {
      clearStoredAuthTokens();
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

function isAuthRoute(url: string) {
  return [
    apiConfig.endpoints.auth.login,
    apiConfig.endpoints.auth.register,
    apiConfig.endpoints.auth.refresh,
    apiConfig.endpoints.auth.logout,
  ].some((route) => url.endsWith(route));
}

export const api = axios.create({
  baseURL: apiConfig.baseUrl,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const accessToken = getStoredAccessToken();

  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requestConfig = (error.config ?? {}) as RetriableRequestConfig;
    const requestUrl =
      typeof requestConfig.url === 'string' ? requestConfig.url : '';

    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !requestConfig._retry &&
      !isAuthRoute(requestUrl)
    ) {
      requestConfig._retry = true;
      const nextAccessToken = await refreshAccessToken();

      if (nextAccessToken) {
        requestConfig.headers = requestConfig.headers ?? {};
        requestConfig.headers.Authorization = `Bearer ${nextAccessToken}`;
        return api(requestConfig);
      }
    }

    if (
      typeof window !== 'undefined' &&
      axios.isAxiosError(error) &&
      error.response?.status === 401
    ) {
      window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
    }

    return Promise.reject(error);
  },
);
