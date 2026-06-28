import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/v1';

let accessToken: string | null = localStorage.getItem('accessToken');
let refreshToken: string | null = localStorage.getItem('refreshToken');
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken: refreshToken,
        }, { withCredentials: true });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
        setTokens(newAccessToken, newRefreshToken);
        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export function setTokens(access: string, refresh: string): void {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
}

export function clearTokens(): void {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function isAuthenticated(): boolean {
  return !!accessToken;
}
