import type { ApiError } from "~/types/api";

/**
 * Type guard for API errors (from useApi/getHttp) with optional .data.code and .data.message.
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    error instanceof Error
    && "status" in error
    && typeof (error as ApiError).status === "number"
  );
}

/**
 * Extracts a user-facing error message from an unknown caught value.
 * Uses isApiError first for API errors, then standard Error, then fallback.
 * Use in catch blocks: showError({ message: getApiErrorMessage(error, "Something went wrong.") })
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isApiError(error) && error.data?.message) {
    return error.data.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
