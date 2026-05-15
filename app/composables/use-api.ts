import type { ApiError, ApiErrorData } from "~/types/api";

import { useStorage } from "~/composables/use-storage";
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

function createHttpClient(config: HttpClientConfig) {
  const { baseURL, storage } = config;
  const timeout = config.timeout ?? 10000;

  function getAccessToken(): string | null {
    return storage.getAccessToken();
  }

  async function request<T>(
    endpoint: string,
    options: RequestInit = {},
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
