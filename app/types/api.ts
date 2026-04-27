/**
 * Generic API list response shape used by most getList endpoints.
 * Use this type when typing store state or API responses instead of `any`.
 */
export type ApiListResponse<T = unknown> = {
  data: T[];
  total_count?: number;
};

/**
 * Error payload returned by the API (e.g. in 4xx/5xx response body).
 */
export type ApiErrorData = {
  message?: string;
  code?: string;
  details?: unknown;
  [key: string]: unknown;
};

/**
 * Error thrown by the API client (useApi/getHttp) on non-ok responses.
 */
export type ApiError = Error & {
  status: number;
  statusText: string;
  data?: ApiErrorData;
};

export type ApiResponse<T = unknown> = {
  data: T;
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};
