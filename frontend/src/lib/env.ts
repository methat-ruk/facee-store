const defaultAppUrl = 'http://localhost:3000';
const defaultApiUrl = 'http://localhost:4000/api';

export const appEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? defaultAppUrl,
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? defaultApiUrl,
} as const;
