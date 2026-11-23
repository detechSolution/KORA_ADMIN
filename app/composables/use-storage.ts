/**
 * Auth tokens are kept in expiring cookies. Their lifetime follows the refresh
 * session lifetime returned by the API (12 hours by default, 7 days remembered).
 *
 * Note: Since ssr: false is configured, client checks are not needed.
 * Error handling is still included for localStorage quota errors and other edge cases.
 */

/**
 * Storage keys used throughout the application
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
} as const;

const STANDARD_SESSION_SECONDS = 12 * 60 * 60;
const REMEMBERED_SESSION_SECONDS = 7 * 24 * 60 * 60;

function readCookie(key: string): string | null {
  try {
    const prefix = `${encodeURIComponent(key)}=`;
    const value = document.cookie
      .split(";")
      .map(part => part.trim())
      .find(part => part.startsWith(prefix));
    return value ? decodeURIComponent(value.slice(prefix.length)) : null;
  }
  catch {
    return null;
  }
}

function writeCookie(key: string, value: string, maxAgeSeconds: number): boolean {
  try {
    const maxAge = Math.max(1, Math.floor(maxAgeSeconds));
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
    return readCookie(key) === value;
  }
  catch (error) {
    console.error(`Error setting auth cookie "${key}":`, error);
    return false;
  }
}

function deleteCookie(key: string): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${encodeURIComponent(key)}=; Max-Age=0; Path=/; SameSite=Lax${secure}`;
}

/**
 * Get a value from localStorage
 * @param key - The storage key
 * @returns The stored value or null if not found
 */
export function getStorageItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  }
  catch (error) {
    console.error(`Error getting storage item "${key}":`, error);
    return null;
  }
}

/**
 * Set a value in localStorage
 * @param key - The storage key
 * @param value - The value to store
 * @returns true if successful, false otherwise
 */
export function setStorageItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  }
  catch (error) {
    console.error(`Error setting storage item "${key}":`, error);
    return false;
  }
}

/**
 * Remove a value from localStorage
 * @param key - The storage key
 * @returns true if successful, false otherwise
 */
export function removeStorageItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  }
  catch (error) {
    console.error(`Error removing storage item "${key}":`, error);
    return false;
  }
}

/**
 * Clear all items from localStorage
 * @returns true if successful, false otherwise
 */
export function clearStorage(): boolean {
  try {
    localStorage.clear();
    return true;
  }
  catch (error) {
    console.error("Error clearing storage:", error);
    return false;
  }
}

/**
 * Composable for token management
 * Provides convenient methods for access and refresh tokens
 */
export function useStorage() {
  const getToken = (key: string): string | null => {
    const cookieToken = readCookie(key);
    if (cookieToken) return cookieToken;

    // Read tokens from the previous storage scheme once, so active staff can
    // continue through their next refresh and be migrated into expiring cookies.
    try {
      return sessionStorage.getItem(key) ?? localStorage.getItem(key);
    }
    catch (error) {
      console.error(`Error getting token "${key}":`, error);
      return null;
    }
  };

  const writeToken = (key: string, token: string, maxAgeSeconds: number): boolean => {
    const saved = writeCookie(key, token, maxAgeSeconds);
    try {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    }
    catch (error) {
      console.warn(`Unable to remove legacy token "${key}" from browser storage:`, error);
    }
    return saved;
  };

  const removeToken = (key: string): boolean => {
    try {
      deleteCookie(key);
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      return true;
    }
    catch (error) {
      console.error(`Error removing token "${key}":`, error);
      return false;
    }
  };
  /**
   * Get the access token
   */
  const getAccessToken = (): string | null => {
    return getToken(STORAGE_KEYS.ACCESS_TOKEN);
  };

  /**
   * Get the refresh token
   */
  const getRefreshToken = (): string | null => {
    return getToken(STORAGE_KEYS.REFRESH_TOKEN);
  };

  /**
   * Set the access token
   */
  const setAccessToken = (token: string, sessionLifetimeSeconds = STANDARD_SESSION_SECONDS): boolean => {
    return writeToken(STORAGE_KEYS.ACCESS_TOKEN, token, sessionLifetimeSeconds);
  };

  /**
   * Set the refresh token
   */
  const setRefreshToken = (token: string, sessionLifetimeSeconds = STANDARD_SESSION_SECONDS): boolean => {
    return writeToken(STORAGE_KEYS.REFRESH_TOKEN, token, sessionLifetimeSeconds);
  };

  /**
   * Set both access and refresh tokens
   */
  const setTokens = (
    accessToken: string,
    refreshToken: string,
    sessionLifetimeSeconds?: number,
    rememberMe = false,
  ): boolean => {
    const lifetime = sessionLifetimeSeconds
      ?? (rememberMe ? REMEMBERED_SESSION_SECONDS : STANDARD_SESSION_SECONDS);
    const accessSuccess = setAccessToken(accessToken, lifetime);
    const refreshSuccess = setRefreshToken(refreshToken, lifetime);
    return accessSuccess && refreshSuccess;
  };

  /**
   * Remove the access token
   */
  const removeAccessToken = (): boolean => {
    return removeToken(STORAGE_KEYS.ACCESS_TOKEN);
  };

  /**
   * Remove the refresh token
   */
  const removeRefreshToken = (): boolean => {
    return removeToken(STORAGE_KEYS.REFRESH_TOKEN);
  };

  /**
   * Remove both access and refresh tokens
   */
  const removeTokens = (): boolean => {
    const accessSuccess = removeAccessToken();
    const refreshSuccess = removeRefreshToken();
    return accessSuccess && refreshSuccess;
  };

  /**
   * Check if tokens exist
   */
  const hasTokens = (): boolean => {
    return getAccessToken() !== null && getRefreshToken() !== null;
  };

  return {
    // Generic storage methods
    getItem: getStorageItem,
    setItem: setStorageItem,
    removeItem: removeStorageItem,
    clear: clearStorage,
    // Token-specific methods
    getAccessToken,
    getRefreshToken,
    setAccessToken,
    setRefreshToken,
    setTokens,
    removeAccessToken,
    removeRefreshToken,
    removeTokens,
    hasTokens,
  };
}
