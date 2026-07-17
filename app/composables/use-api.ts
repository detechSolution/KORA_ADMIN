import type { ApiError, ApiErrorData } from "~/types/api";

import { useStorage } from "~/composables/use-storage";
import { API_ENDPOINTS } from "~/config/constants";
import { useAuthStore } from "~/stores/auth";
import { isApiError } from "~/utils/error";

export type { ApiError } from "~/types/api";

function createApiError(
  message: string,
  status: number,
  statusText: string,
  data?: ApiErrorData,
): ApiError {
  const err = new Error(message) as ApiError;
  err.name = "ApiError";
  err.status = status;
  err.statusText = statusText;
  err.data = data;
  return err;
}

type HttpClientConfig = {
  baseURL: string;
  timeout?: number;
  storage: ReturnType<typeof useStorage>;
};

let isRefreshing = false;
let failedQueue: { resolve: (value?: unknown) => void; reject: (reason?: any) => void }[] = [];

function processQueue(error: Error | null, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    }
    else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

function createHttpClient(config: HttpClientConfig) {
  const { baseURL, storage } = config;
  const timeout = config.timeout ?? 10000;

  function getAccessToken(): string | null {
    return storage.getAccessToken();
  }

  async function request<T>(
    endpoint: string,
    options: RequestInit & { _retry?: boolean } = {},
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const accessToken = getAccessToken();
      const isFormData = options.body instanceof FormData;
      const headers: Record<string, string> = {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(options.headers as Record<string, string>),
      };

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${baseURL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData: ApiErrorData = {};
        try {
          errorData = await response.json();
        }
        catch {
          errorData = { message: response.statusText };
        }
        throw createApiError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response.statusText,
          errorData,
        );
      }

      return response.json();
    }
    catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Request timeout");
      }
      if (isApiError(error) && error.status === 401 && !options._retry && endpoint !== API_ENDPOINTS.AUTH.REFRESH) {
        const refreshToken = storage.getRefreshToken();
        if (!refreshToken) {
          useAuthStore().setUnAuthorizedError(true);
          useAuthStore().logout();
          throw error;
        }

        if (isRefreshing) {
          return new Promise<unknown>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => {
              return request<T>(endpoint, { ...options, _retry: true });
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        options._retry = true;
        isRefreshing = true;

        try {
          const refreshResponse = await fetch(`${baseURL}${API_ENDPOINTS.AUTH.REFRESH}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });

          if (!refreshResponse.ok) {
            throw new Error("Refresh token expired");
          }

          const refreshData = await refreshResponse.json() as { accessToken?: string; refreshToken?: string; data?: { accessToken?: string; refreshToken?: string } };
          const newAccessToken = refreshData.accessToken || refreshData.data?.accessToken;
          const newRefreshToken = refreshData.refreshToken || refreshData.data?.refreshToken;

          if (newAccessToken && newRefreshToken) {
            storage.setTokens(newAccessToken, newRefreshToken);
            processQueue(null, newAccessToken);
            return await request<T>(endpoint, options);
          }
          else {
            throw new Error("Invalid tokens from refresh calculation");
          }
        }
        catch (refreshError) {
          processQueue(refreshError as Error, null);
          useAuthStore().setUnAuthorizedError(true);
          useAuthStore().logout();
          throw error;
        }
        finally {
          isRefreshing = false;
        }
      }
      if (isApiError(error) && error.status === 401) {
        useAuthStore().setUnAuthorizedError(true);
      }
      throw error;
    }
  }

  return {
    get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
      return request<T>(endpoint, { method: "GET", headers });
    },
    post<T>(
      endpoint: string,
      data: any,
      headers?: Record<string, string>,
    ): Promise<T> {
      const body = data instanceof FormData ? data : JSON.stringify(data);
      return request<T>(endpoint, {
        method: "POST",
        body,
        headers,
      });
    },
    put<T>(
      endpoint: string,
      data: any,
      headers?: Record<string, string>,
    ): Promise<T> {
      const body = data instanceof FormData ? data : JSON.stringify(data);
      return request<T>(endpoint, {
        method: "PUT",
        body,
        headers,
      });
    },
    delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
      return request<T>(endpoint, { method: "DELETE", headers });
    },
    patch<T>(
      endpoint: string,
      data?: any,
      headers?: Record<string, string>,
    ): Promise<T> {
      const body = data instanceof FormData ? data : JSON.stringify(data);
      return request<T>(endpoint, {
        method: "PATCH",
        body,
        headers,
      });
    },
  };
}

export function useApi() {
  const config = useRuntimeConfig();
  const storage = useStorage();

  return createHttpClient({
    baseURL: config.public.apiBase,
    timeout: Number.parseInt(config.public.apiTimeout),
    storage,
  });
}

export const getHttp = () => useApi();
